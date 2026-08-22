import { Resend } from 'resend';
import { EmailMessage, EmailSendResult, EmailTransport } from './types';

export class ResendEmailTransport implements EmailTransport {
  private resend: Resend | null;
  private defaultFromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.defaultFromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@cloutflow.com';
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    if (!this.resend) {
      console.warn(`[Resend Transport] Cannot send email to ${message.to} because RESEND_API_KEY is missing.`);
      return { success: false, error: 'MISSING_API_KEY' };
    }

    try {
      // Note: Marketing emails should be disabled by default through configuration at a higher level, 
      // but the transport itself handles the specific provider calls.
      const data = await this.resend.emails.send({
        from: message.from || `CloutFlow <${this.defaultFromEmail}>`,
        to: message.to,
        subject: message.subject,
        html: message.html,
        headers: message.headers,
        // The Resend SDK supports headers. If we needed to pass the idempotency key, 
        // Resend docs say we can pass headers. Specifically, `Idempotency-Key` can be used 
        // as a header if the API supports it, though for Resend the SDK allows passing headers.
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
