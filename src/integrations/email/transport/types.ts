export interface EmailMessage {
  to: string;
  from?: string;
  replyTo?: string;
  subject: string;
  html?: string;
  text?: string;
  idempotencyKey?: string;
  headers?: Record<string, string>;
  inReplyTo?: string;
  references?: string;
  category?: 'transactional' | 'marketing' | 'recovery' | 'support';
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string | unknown;
  reason?: string;
  blocked?: boolean;
}

export interface EmailTransport {
  send(message: EmailMessage): Promise<EmailSendResult>;
}
