import { Resend } from 'resend';
import { EmailMessage, EmailSendResult, EmailTransport } from './types';

export class ResendEmailTransport implements EmailTransport {
  private resend: Resend | null;
  private defaultFromEmail: string;
  private defaultReplyTo: string | undefined;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.defaultFromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@cloutflow.com';
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

      const data = await this.resend.emails.send({
        from: message.from || `CloutFlow <${this.defaultFromEmail}>`,
        to: message.to,
        replyTo: message.replyTo || this.defaultReplyTo,
        subject: message.subject,
        html: message.html || message.text || '',
        text: message.text,
        headers,
      });

      if (data.error) {
        return { success: false, error: data.error };
      }

      return { success: true, messageId: data.data?.id };
    } catch (error) {
      console.error('[Resend Transport] Failed to send email:', error);
      return { success: false, error };
    }
  }
}
