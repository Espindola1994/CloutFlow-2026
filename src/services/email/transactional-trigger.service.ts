import { db } from '@/db';
import { orders, emailLogs, lifecycleEvents } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getTransactionalEmailTransport } from '@/integrations/email/transport';
import { CANONICAL_EMAIL_TEMPLATES, interpolateTemplate } from '@/services/crm/templates';

export type TransactionalTriggerType = 'PAYMENT_APPROVED' | 'ORDER_PROCESSING' | 'ORDER_COMPLETED';

interface SendTransactionalEmailParams {
  type: TransactionalTriggerType;
  orderId: string;
  customerEmail: string;
  customerName?: string;
  target?: string;
  platform?: string;
  service?: string;
  quantity?: number;
}

/**
 * Dispatches automatic transactional emails triggered by lifecycle events / fulfillment updates.
 * Guarantees strict idempotency by:
 * 1. Filtering email_logs specifically by recipient, templateId, and exact orderId in metadata
 * 2. Evaluating SENT status to block duplicates, while allowing retries if previously FAILED
 * 3. Enforcing concurrency protection via transactional lifecycle_events lock record
 */
export async function sendAutomaticTransactionalEmail(params: SendTransactionalEmailParams): Promise<{
  success: boolean;
  isDuplicate?: boolean;
  messageId?: string;
  error?: string;
}> {
  const normalizedEmail = params.customerEmail.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, error: 'Invalid recipient email' };
  }

  let templateId: string;
  if (params.type === 'PAYMENT_APPROVED') {
    templateId = 'PAYMENT_RECEIVED';
  } else if (params.type === 'ORDER_PROCESSING') {
    templateId = 'ORDER_PROCESSING';
  } else if (params.type === 'ORDER_COMPLETED') {
    templateId = 'ORDER_DELIVERED';
  } else {
    return { success: false, error: 'Unsupported trigger type' };
  }

  const templateDef = CANONICAL_EMAIL_TEMPLATES.find((t) => t.id === templateId);
  if (!templateDef) {
    return { success: false, error: `Template definition not found for ${templateId}` };
  }

  const idempotencyKey = `AUTO_TX:${params.type}:${params.orderId}`;
  const lockEventKey = `LOCK_TX_EMAIL:${templateId}:${params.orderId}`;

  // 1. Idempotency check in email_logs: must match recipient, template, and exact orderId
  // We query all matching logs ordered by createdAt DESC to find if ANY previous attempt was SENT
  const candidateLogs = await db.query.emailLogs.findMany({
    where: and(
      eq(emailLogs.customerEmail, normalizedEmail),
      eq(emailLogs.templateId, templateId)
    ),
    orderBy: [desc(emailLogs.createdAt)],
    limit: 50,
  });

  const matchingSentLog = candidateLogs.find((log) => {
    // Exact template check
    if (log.templateId && log.templateId !== templateId) {
      return false;
    }
    const meta = log.metadata as Record<string, unknown> | null;
    const matchesOrder = meta?.orderId === params.orderId;
    const matchesIdempotency = meta?.idempotencyKey === idempotencyKey;
    return (matchesOrder || matchesIdempotency) && log.status === 'SENT';
  });

  if (matchingSentLog) {
    return {
      success: true,
      isDuplicate: true,
      messageId: matchingSentLog.providerMessageId || undefined,
    };
  }

  // 2. Concurrency protection: atomically claim execution lock via lifecycle_events unique constraint
  // If a concurrent call is running or already completed, insert will fail or encounter existing record
  let lockAcquired = false;
  try {
    await db.insert(lifecycleEvents).values({
      customerEmail: normalizedEmail,
      eventType: `TX_EMAIL_${params.type}`,
      idempotencyKey: lockEventKey,
      payload: {
        orderId: params.orderId,
        templateId,
        lockedAt: new Date().toISOString(),
      },
    });
    lockAcquired = true;
  } catch (err: unknown) {
    // Unique violation or already exists: another process is handling or has handled this exact send
    // Double check email_logs to return existing SENT result if available
    const postCheckLogs = await db.query.emailLogs.findMany({
      where: and(
        eq(emailLogs.customerEmail, normalizedEmail),
        eq(emailLogs.templateId, templateId)
      ),
      orderBy: [desc(emailLogs.createdAt)],
      limit: 20,
    });

    const alreadySent = postCheckLogs.find((log) => {
      if (log.templateId && log.templateId !== templateId) {
        return false;
      }
      const meta = log.metadata as Record<string, unknown> | null;
      return (meta?.orderId === params.orderId || meta?.idempotencyKey === idempotencyKey) && log.status === 'SENT';
    });

    if (alreadySent) {
      return {
        success: true,
        isDuplicate: true,
        messageId: alreadySent.providerMessageId || undefined,
      };
    }

    // If lock exists but no SENT log yet, concurrent request is in-flight: block duplicate send
    return {
      success: true,
      isDuplicate: true,
      error: 'Concurrent email send in progress',
    };
  }

  // 3. Variable interpolation
  const vars = {
    customer_name: params.customerName || 'Valued Customer',
    order_id: params.orderId,
    target: params.target || '',
    platform: params.platform || '',
    service: params.service || '',
    quantity: params.quantity || 1,
  };

  const subject = interpolateTemplate(templateDef.defaultSubject, vars);
  const body = interpolateTemplate(templateDef.defaultBody, vars);

  // 4. Send via Resend transactional transport (strictly automatic: forceManualAllowed=false)
  const transport = getTransactionalEmailTransport(normalizedEmail, false);
  try {
    const result = await transport.send({
      to: normalizedEmail,
      subject,
      html: body,
      idempotencyKey,
      category: 'transactional',
    });

    const isSent = result.success && !result.blocked;
    const logStatus = isSent ? 'SENT' : (result.reason || 'FAILED');

    // 5. Log to email_logs
    await db.insert(emailLogs).values({
      customerEmail: normalizedEmail,
      sendOrigin: 'AUTOMATION',
      category: 'transactional',
      templateId,
      provider: 'RESEND',
      providerMessageId: result.messageId || null,
      status: logStatus,
      subject,
      sentAt: isSent ? new Date() : null,
      metadata: {
        orderId: params.orderId,
        triggerType: params.type,
        idempotencyKey,
        error: result.error ? String(result.error) : null,
      },
    });

    // 6. If send failed, release the lock record so subsequent retry is permitted
    if (!isSent && lockAcquired) {
      try {
        await db.delete(lifecycleEvents).where(eq(lifecycleEvents.idempotencyKey, lockEventKey));
      } catch (delErr) {
        console.warn(`[AutomaticTransactionalEmail] Failed to release lock on failure:`, delErr);
      }
    }

    return {
      success: isSent,
      messageId: result.messageId,
      error: result.error ? String(result.error) : undefined,
    };
  } catch (error) {
    console.error(`[AutomaticTransactionalEmail] Failed to send ${params.type} to ${normalizedEmail}:`, error);

    // Release the lock record on error so a retry can occur
    if (lockAcquired) {
      try {
        await db.delete(lifecycleEvents).where(eq(lifecycleEvents.idempotencyKey, lockEventKey));
      } catch (delErr) {
        console.warn(`[AutomaticTransactionalEmail] Failed to release lock on catch:`, delErr);
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email send error',
    };
  }
}
