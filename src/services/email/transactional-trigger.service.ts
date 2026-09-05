import { db } from '@/db';
import { orders, emailLogs } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
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

  // 1. Idempotency check in email_logs: must match recipient, template, and exact orderId
  // Query all matching logs for this customer and template ordered by createdAt DESC
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

  // 2. Variable interpolation
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

  // 3. Send via Resend transactional transport (strictly automatic: forceManualAllowed=false)
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

    // 4. Log to email_logs
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

    return {
      success: isSent,
      messageId: result.messageId,
      error: result.error ? String(result.error) : undefined,
    };
  } catch (error) {
    console.error(`[AutomaticTransactionalEmail] Failed to send ${params.type} to ${normalizedEmail}:`, error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email send error',
    };
  }
}
