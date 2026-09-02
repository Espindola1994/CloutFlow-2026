import { db } from '@/db';
import { emailLogs, emailSuppressions, emailThreads, emailMessages } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import {
  getMarketingEmailTransport,
  getTransactionalEmailTransport,
  getSupportEmailTransport,
  isMarketingSendAllowedForRecipient,
} from '@/integrations/email/transport';
import { normalizeCrmEmail } from './crm.service';
import { interpolateTemplate, escapeHtml } from './templates';
import { sanitizeHtml } from '@/lib/email/sanitize';
import { isEmailSuppressed } from '@/services/lifecycle/unsubscribe.service';

export interface SendManualEmailParams {
  customerEmail: string;
  templateId?: string;
  category: 'transactional' | 'marketing' | 'support';
  subject: string;
  body: string;
  adminName?: string;
  orderId?: string;
  threadId?: string;
  variables?: Record<string, any>;
}

export interface SendManualEmailResult {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  emailLogId?: string;
  threadId?: string;
  messageId?: string;
  status: string;
  reason?: string;
  error?: string;
}

export async function sendManualEmail(params: SendManualEmailParams): Promise<SendManualEmailResult> {
  const normalizedEmail = normalizeCrmEmail(params.customerEmail);

  // 1. Validate email address
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return {
      success: false,
      provider: 'NONE',
      status: 'INVALID_RECIPIENT',
      error: 'Invalid recipient email address.',
    };
  }

  // 2. Check suppression if category is marketing
  if (params.category === 'marketing') {
    const foundSuppressions = await db.query.emailSuppressions.findMany({
      where: eq(emailSuppressions.customerEmail, normalizedEmail),
    });
    const suppressed = foundSuppressions && (foundSuppressions as any[]).length > 0 ? (foundSuppressions as any[])[0] : null;

    if (suppressed) {
      // Log blocked attempt
      const insertedLogs = await db.insert(emailLogs).values({
        customerEmail: normalizedEmail,
        sendOrigin: 'MANUAL',
        category: 'marketing',
        templateId: params.templateId || 'CUSTOM',
        provider: 'RESEND',
        status: 'SUPPRESSED',
        subject: params.subject,
        metadata: {
          suppressionReason: (suppressed as any)?.reason || 'USER_UNSUBSCRIBED',
          attemptedBy: params.adminName || 'Admin',
          orderId: params.orderId,
        },
      }).returning();

      return {
        success: false,
        provider: 'RESEND',
        emailLogId: (insertedLogs as any)?.[0]?.id || 'suppressed-log',
        status: 'BLOCKED_SUPPRESSED',
        reason: `Recipient is marketing-suppressed: ${(suppressed as any)?.reason || 'USER_UNSUBSCRIBED'}`,
      };
    }
  }

  // 3. Routing: SUPPORT -> Gmail SMTP; TRANSACTIONAL -> Resend; MARKETING -> Marketing (Resend/Controlled)
  let transport;
  let providerName = 'RESEND';

  if (params.category === 'support') {
    transport = getSupportEmailTransport();
    providerName = 'GMAIL';
  } else if (params.category === 'transactional') {
    transport = getTransactionalEmailTransport();
    providerName = 'RESEND';
  } else {
    // Marketing (Manual sends bypass the lifecycle kill switch, relying on auth + suppression instead)
    transport = getMarketingEmailTransport(normalizedEmail, true);
    providerName = 'RESEND';
  }

  // 4. Interpolate variables safely
  const vars = params.variables || {};
  const finalSubject = interpolateTemplate(params.subject, vars);
  const finalBody = interpolateTemplate(params.body, vars);

  // 5. Execute send via EmailTransport abstraction
  try {
    const result = await transport.send({
      to: normalizedEmail,
      subject: finalSubject,
      html: finalBody,
      text: finalBody.replace(/<[^>]+>/g, ' '),
      category: params.category,
    });

    const isSent = result.success && !result.blocked;
    const logStatus = result.blocked
      ? (result.reason || 'BLOCKED_SEND_DISABLED')
      : result.success
      ? 'SENT'
      : 'FAILED';

    // 6. Record audit in email_logs
    const [log] = await db.insert(emailLogs).values({
      customerEmail: normalizedEmail,
      sendOrigin: 'MANUAL',
      category: params.category,
      templateId: params.templateId || 'CUSTOM',
      provider: providerName,
      providerMessageId: result.messageId || null,
      status: logStatus,
      subject: finalSubject,
      sentAt: isSent ? new Date() : null,
      metadata: {
        adminName: params.adminName || 'Admin',
        orderId: params.orderId,
        error: result.error ? String(result.error) : null,
        reason: result.reason,
      },
    }).returning();

    // 7. If support or associated with a conversation thread, persist outbound email_message
    let threadId = params.threadId;
    let messageId: string | undefined;

    if (isSent && (params.category === 'support' || threadId)) {
      if (!threadId) {
        // Create or find support thread for customer
        const [existingThread] = await db.query.emailThreads.findMany({
          where: eq(emailThreads.customerEmail, normalizedEmail),
          orderBy: [desc(emailThreads.latestMessageAt)],
          limit: 1,
        });

        if (existingThread) {
          threadId = existingThread.id;
        } else {
          const [newThread] = await db.insert(emailThreads).values({
            customerEmail: normalizedEmail,
            status: 'WAITING_CUSTOMER',
            subject: finalSubject,
            relatedOrderId: params.orderId || null,
            latestMessageAt: new Date(),
            unreadCount: 0,
          }).returning({ id: emailThreads.id });
          threadId = newThread.id;
        }
      }

      if (threadId) {
        const fromEmail = process.env.GMAIL_USER || process.env.RESEND_FROM_EMAIL || 'support@cloutflow.com';
        const [outboundMsg] = await db.insert(emailMessages).values({
          threadId,
          direction: 'OUTBOUND',
          provider: providerName,
          providerMessageId: result.messageId || null,
          fromEmail,
          toEmail: normalizedEmail,
          subject: finalSubject,
          textBody: finalBody.replace(/<[^>]+>/g, ' '),
          sanitizedHtmlBody: sanitizeHtml(finalBody),
          sentAt: new Date(),
          metadata: {
            adminName: params.adminName || 'Admin',
            templateId: params.templateId,
          },
        }).returning({ id: emailMessages.id });

        messageId = outboundMsg.id;

        // Update thread status & timestamp
        await db.update(emailThreads).set({
          status: 'WAITING_CUSTOMER',
          latestMessageAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(emailThreads.id, threadId));
      }
    }

    return {
      success: isSent,
      provider: providerName,
      providerMessageId: result.messageId,
      emailLogId: log.id,
      threadId,
      messageId,
      status: logStatus,
      reason: result.reason,
      error: result.error ? String(result.error) : undefined,
    };
  } catch (err: any) {
    const [log] = await db.insert(emailLogs).values({
      customerEmail: normalizedEmail,
      sendOrigin: 'MANUAL',
      category: params.category,
      templateId: params.templateId || 'CUSTOM',
      provider: providerName,
      status: 'FAILED',
      subject: finalSubject,
      metadata: {
        adminName: params.adminName || 'Admin',
        error: err?.message || String(err),
      },
    }).returning();

    return {
      success: false,
      provider: providerName,
      emailLogId: log.id,
      status: 'FAILED',
      error: err?.message || 'Unexpected failure while dispatching manual email.',
    };
  }
}
