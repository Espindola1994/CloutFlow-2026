import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSupportEmailTransport,
  getTransactionalEmailTransport,
  getMarketingEmailTransport,
  ResendEmailTransport,
} from '@/integrations/email/transport';
import { sendManualEmail } from '@/services/crm/manual-email.service';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    query: {
      emailSuppressions: { findMany: vi.fn() },
      emailThreads: { findMany: vi.fn() },
      emailLogs: { findMany: vi.fn() },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 'mock-id-123' }]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    })),
  },
}));

describe('Support Email Transport & Outbound Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Support uses ResendEmailTransport', () => {
    const transport = getSupportEmailTransport();
    expect(transport).toBeInstanceOf(ResendEmailTransport);
  });

  it('2. Transactional continues using ResendEmailTransport as before', () => {
    const transport = getTransactionalEmailTransport();
    expect(transport).toBeInstanceOf(ResendEmailTransport);
  });

  it('3. Marketing continues using ResendEmailTransport as before', () => {
    const transport = getMarketingEmailTransport('test@example.com', true);
    expect(transport).toBeInstanceOf(ResendEmailTransport);
  });

  it('4. Support manual email uses FROM CloutFlow Support <support@cloutflow.co> and Reply-To REPLY_TO_EMAIL', async () => {
    (db.query.emailSuppressions.findMany as any).mockResolvedValue([]);
    (db.query.emailThreads.findMany as any).mockResolvedValue([{ id: 'thread-support-abc' }]);

    const resendSendSpy = vi.spyOn(ResendEmailTransport.prototype, 'send').mockResolvedValue({
      success: true,
      messageId: 'resend-test-support-1',
    });

    const originalReplyTo = process.env.REPLY_TO_EMAIL;
    process.env.REPLY_TO_EMAIL = 'cloutflow00@gmail.com';

    try {
      const result = await sendManualEmail({
        customerEmail: 'customer@example.com',
        category: 'support',
        subject: 'Support Help Request',
        body: '<p>How can we help?</p>',
        adminName: 'Support Agent',
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('RESEND');
      expect(resendSendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'customer@example.com',
          from: 'CloutFlow Support <support@cloutflow.co>',
          replyTo: 'cloutflow00@gmail.com',
          category: 'support',
        })
      );
    } finally {
      process.env.REPLY_TO_EMAIL = originalReplyTo;
      resendSendSpy.mockRestore();
    }
  });

  it('5. Inbox service file remains untouched and Gmail IMAP references are intact', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const inboxServicePath = path.resolve(process.cwd(), 'src/services/email/inbox.service.ts');
    const content = fs.readFileSync(inboxServicePath, 'utf8');

    expect(content).toContain('GMAIL_USER');
    expect(content).toContain('GMAIL_APP_PASSWORD');
    expect(content).toContain('syncGmailInbox');
    expect(content).toContain('imap.gmail.com');
  });
});
