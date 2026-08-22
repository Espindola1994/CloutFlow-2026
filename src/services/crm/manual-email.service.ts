import { db } from '@/db';
import { emailLogs, emailSuppressions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getMarketingEmailTransport, getTransactionalEmailTransport } from '@/integrations/email/transport';
import { normalizeCrmEmail } from './crm.service';
import { interpolateTemplate, escapeHtml } from './templates';

export interface SendManualEmailParams {
  customerEmail: string;
  templateId?: string;
  category: 'transactional' | 'marketing' | 'support';
  subject: string;
  body: string;
  adminName?: string;
  orderId?: string;
  variables?: Record<string, any>;
}

export interface SendManualEmailResult {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  emailLogId?: string;
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
      error: 'Invalid recipient email address.'
    };
  }

  // 2. Check suppression if category is marketing
  if (params.category === 'marketing') {
    const [suppressed] = await db.query.emailSuppressions.findMany({
      where: eq(emailSuppressions.customerEmail, normalizedEmail)
    });

    if (suppressed) {
      // Log blocked attempt
      const [log] = await db.insert(emailLogs).values({
        customerEmail: normalizedEmail,
        sendOrigin: 'MANUAL',
        category: 'marketing',
        templateId: params.templateId || 'CUSTOM',
        provider: 'RESEND',
        status: 'SUPPRESSED',
        subject: params.subject,
        metadata: {
          suppressionReason: suppressed.reason,
          attemptedBy: params.adminName || 'Admin',
          orderId: params.orderId
        }
      }).returning();

      return {
        success: false,
        provider: 'RESEND',
        emailLogId: log.id,
        status: 'BLOCKED_SUPPRESSED',
        reason: `Recipient is marketing-suppressed: ${suppressed.reason}`
      };
    }
  }

  // 3. Select correct transport based on category
  const transport = params.category === 'marketing'
    ? getMarketingEmailTransport()
    : getTransactionalEmailTransport();

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
      category: params.category
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
      provider: 'RESEND',
      providerMessageId: result.messageId || null,
      status: logStatus,
      subject: finalSubject,
      sentAt: isSent ? new Date() : null,
      metadata: {
        adminName: params.adminName || 'Admin',
        orderId: params.orderId,
        error: result.error ? String(result.error) : null,
        reason: result.reason
      }
    }).returning();

    return {
      success: isSent,
      provider: 'RESEND',
      providerMessageId: result.messageId,
      emailLogId: log.id,
      status: logStatus,
      reason: result.reason,
      error: result.error ? String(result.error) : undefined
    };
  } catch (err: any) {
    const [log] = await db.insert(emailLogs).values({
      customerEmail: normalizedEmail,
      sendOrigin: 'MANUAL',
      category: params.category,
      templateId: params.templateId || 'CUSTOM',
      provider: 'RESEND',
      status: 'FAILED',
      subject: finalSubject,
      metadata: {
        adminName: params.adminName || 'Admin',
        error: err?.message || String(err)
      }
    }).returning();

    return {
      success: false,
      provider: 'RESEND',
      emailLogId: log.id,
      status: 'FAILED',
      error: err?.message || 'Unexpected failure while dispatching manual email.'
    };
  }
}
