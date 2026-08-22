import { Resend } from 'resend';
import { EmailMessage, EmailSendResult, EmailTransport } from './types';

export class ResendEmailTransport implements EmailTransport {
  private resend: Resend | null;
  private defaultFromEmail: string;
  private defaultReplyTo: string | undefined;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.defaultFromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@cloutflow.co';
    this.defaultReplyTo = process.env.REPLY_TO_EMAIL || process.env.GMAIL_USER;
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    if (!this.resend) {
      console.warn(`[Resend Transport] Cannot send email to ${message.to} because RESEND_API_KEY is missing.`);
      return { success: false, error: 'MISSING_API_KEY' };
    }

    try {
      const headers: Record<string, string> = { ...(message.headers || {}) };
      if (message.idempotencyKey) {
        headers['X-Idempotency-Key'] = message.idempotencyKey;
      }
      if (message.inReplyTo) {
        headers['In-Reply-To'] = message.inReplyTo;
      }
      if (message.references) {
        headers['References'] = message.references;
      }

      // Check for Resend verified domain issue - it requires the domain to be verified
      // Using exactly what's configured in RESEND_FROM_EMAIL if it's already a full format like "Name <email>"
      let fromValue = message.from || this.defaultFromEmail;
      
      // If the email is just an address, wrap it with a name to improve deliverability
      if (!fromValue.includes('<') && fromValue.includes('@')) {
         fromValue = `CloutFlow <${fromValue}>`;
      }

      const data = await this.resend.emails.send({
        from: fromValue,
        to: message.to,
        replyTo: message.replyTo || this.defaultReplyTo,
        subject: message.subject,
        html: message.html || message.text || '',
        text: message.text,
        headers,
      });

      if (data.error) {
        console.error('[Resend Transport] API Error response:', JSON.stringify(data.error));
        // Return structured error message that UI can parse
        let errorCode = 'RESEND_PROVIDER_ERROR';
        if (data.error.message?.includes('verified') || data.error.name === 'validation_error') {
           errorCode = 'RESEND_DOMAIN_NOT_VERIFIED';
        } else if ((data.error.name as string) === 'unauthorized') {
           errorCode = 'RESEND_UNAUTHORIZED';
        } else if (data.error.message?.includes('rate limit')) {
           errorCode = 'RESEND_RATE_LIMIT';
        } else if (data.error.message?.includes('from')) {
           errorCode = 'RESEND_INVALID_FROM';
        }

        return { 
          success: false, 
          error: `${errorCode}: ${data.error.message || 'Unknown provider error'}` 
        };
      }

      return { success: true, messageId: data.data?.id };
    } catch (error: unknown) {
      console.error('[Resend Transport] Failed to send email:', error);
      
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { success: false, error: `RESEND_PROVIDER_ERROR: ${errorMsg}` };
    }
  }
}
