export interface EmailMessage {
  to: string;
  from?: string;
  subject: string;
  html: string;
  idempotencyKey?: string;
  headers?: Record<string, string>;
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
