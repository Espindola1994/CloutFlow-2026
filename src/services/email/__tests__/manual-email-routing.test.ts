import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendManualEmail } from '@/services/crm/manual-email.service';
import { db } from '@/db';
import * as transportModule from '@/integrations/email/transport';

vi.mock('@/db', () => {
  return {
    db: {
      query: {
        emailSuppressions: {
          findMany: vi.fn(),
        },
        emailThreads: {
          findMany: vi.fn(),
        },
        emailLogs: {
          findMany: vi.fn(),
        },
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
  };
});

describe('Requirement O, P, T, L, M: Manual Email Dispatch & Routing', () => {
  const mockGmailSend = vi.fn().mockResolvedValue({ success: true, messageId: 'gmail-msg-1' });
  const mockResendSend = vi.fn().mockResolvedValue({ success: true, messageId: 'resend-msg-1' });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(transportModule, 'getSupportEmailTransport').mockReturnValue({
      send: mockGmailSend,
    });
    vi.spyOn(transportModule, 'getTransactionalEmailTransport').mockReturnValue({
      send: mockResendSend,
    });
  });

  it('Requirement O: manual SUPPORT email routes to Gmail support transport', async () => {
    (db.query.emailSuppressions.findMany as any).mockResolvedValue([]);
    (db.query.emailThreads.findMany as any).mockResolvedValue([{ id: 'thread-support-1' }]);

    const result = await sendManualEmail({
      customerEmail: 'customer@example.com',
      category: 'support',
      subject: 'Support inquiry update',
      body: '<p>Here is your update.</p>',
      adminName: 'Agent Alice',
    });

    expect(result.success).toBe(true);
    expect(result.provider).toBe('GMAIL');
    expect(mockGmailSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'customer@example.com',
        category: 'support',
      })
    );
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it('Requirement P: manual TRANSACTIONAL email routes to Resend transport', async () => {
    (db.query.emailSuppressions.findMany as any).mockResolvedValue([]);

    const result = await sendManualEmail({
      customerEmail: 'customer@example.com',
      category: 'transactional',
      subject: 'Receipt for order CF-999',
      body: '<p>Payment confirmed.</p>',
      adminName: 'Admin',
    });

    expect(result.success).toBe(true);
    expect(result.provider).toBe('RESEND');
    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'customer@example.com',
        category: 'transactional',
      })
    );
    expect(mockGmailSend).not.toHaveBeenCalled();
  });

  it('Requirement T: blocks manual MARKETING email when customer is suppressed', async () => {
    (db.query.emailSuppressions.findMany as any).mockResolvedValue([
      { customerEmail: 'unsubscribed@example.com', reason: 'USER_UNSUBSCRIBED' },
    ]);

    const result = await sendManualEmail({
      customerEmail: 'unsubscribed@example.com',
      category: 'marketing',
      subject: 'Special 50% discount',
      body: '<p>Promo code inside!</p>',
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe('BLOCKED_SUPPRESSED');
    expect(mockResendSend).not.toHaveBeenCalled();
    expect(mockGmailSend).not.toHaveBeenCalled();
  });
});
