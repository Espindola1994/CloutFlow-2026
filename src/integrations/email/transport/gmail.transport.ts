import nodemailer from 'nodemailer';
import { EmailMessage, EmailSendResult, EmailTransport } from './types';

export class GmailSmtpEmailTransport implements EmailTransport {
  private transporter: nodemailer.Transporter | null = null;
  private user: string | undefined;

  constructor() {
    this.user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (this.user && pass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.user,
          pass,
        },
      });
    }
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    if (!this.transporter || !this.user) {
      console.warn(`[Gmail SMTP Transport] Cannot send email to ${message.to} because GMAIL_USER or GMAIL_APP_PASSWORD is missing.`);
      return { success: false, error: 'MISSING_GMAIL_CREDENTIALS' };
    }

    try {
      const fromAddress = message.from || `CloutFlow Support <${this.user}>`;
      const replyToAddress = message.replyTo || process.env.REPLY_TO_EMAIL || this.user;

      const headers: Record<string, string> = { ...(message.headers || {}) };
      if (message.inReplyTo) {
        headers['In-Reply-To'] = message.inReplyTo;
      }
      if (message.references) {
        headers['References'] = message.references;
      }
      if (message.idempotencyKey) {
        headers['X-Idempotency-Key'] = message.idempotencyKey;
      }

      const info = await this.transporter.sendMail({
        from: fromAddress,
        to: message.to,
        replyTo: replyToAddress,
        subject: message.subject,
        text: message.text,
        html: message.html || message.text,
        inReplyTo: message.inReplyTo,
        references: message.references,
        headers,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('[Gmail SMTP Transport] Failed to send email:', error);
      return { success: false, error };
    }
  }
}
