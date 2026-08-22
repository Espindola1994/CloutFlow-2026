import { EmailMessage, EmailSendResult, EmailTransport } from './types';

export class DisabledEmailTransport implements EmailTransport {
  private reason: string;

  constructor(reason: string = 'EMAIL_TRANSPORT_DISABLED') {
    this.reason = reason;
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    console.log(`[DisabledEmailTransport] Email to ${message.to} suppressed because transport is disabled: ${this.reason}`);
    return {
      success: false,
      reason: this.reason,
      blocked: true,
    };
  }
}

export class MockEmailTransport implements EmailTransport {
  public sentMessages: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<EmailSendResult> {
    this.sentMessages.push(message);
    const mockId = `mock_msg_${Math.random().toString(36).substring(2, 9)}`;
    return {
      success: true,
      messageId: mockId,
    };
  }
}
