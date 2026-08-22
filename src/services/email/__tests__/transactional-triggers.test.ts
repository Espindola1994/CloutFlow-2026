import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendAutomaticTransactionalEmail } from '@/services/email/transactional-trigger.service';
import { db } from '@/db';
import * as transportModule from '@/integrations/email/transport';

vi.mock('@/db', () => {
  return {
    db: {
      query: {
        emailLogs: {
          findMany: vi.fn(),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn().mockResolvedValue([{ id: 'log-123' }]),
      })),
    },
  };
});

describe('Requirement Q, R, S: Automatic Transactional Email Triggers & Idempotency', () => {
  const mockSend = vi.fn().mockResolvedValue({ success: true, messageId: 'resend-msg-1' });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(transportModule, 'getTransactionalEmailTransport').mockReturnValue({
      send: mockSend,
    });
  });

  it('Requirement Q: sends PAYMENT_APPROVED transactional email idempotently', async () => {
    (db.query.emailLogs.findMany as any).mockResolvedValueOnce([]); // No previous send

    const result = await sendAutomaticTransactionalEmail({
      type: 'PAYMENT_APPROVED',
      orderId: 'CF-ORD-101',
      customerEmail: 'customer@example.com',
      customerName: 'Alice',
      target: 'alice_growth',
      platform: 'instagram',
      service: 'followers',
      quantity: 500,
    });

    expect(result.success).toBe(true);
    expect(result.isDuplicate).toBeUndefined();
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'customer@example.com',
        subject: expect.stringContaining('CF-ORD-101'),
        category: 'transactional',
      })
    );
  });

  it('Requirement Q (idempotency): prevents duplicate PAYMENT_APPROVED email when already sent', async () => {
    (db.query.emailLogs.findMany as any).mockResolvedValueOnce([
      {
        id: 'log-prev',
        customerEmail: 'customer@example.com',
        templateId: 'PAYMENT_RECEIVED',
        status: 'SENT',
        providerMessageId: 'resend-msg-prev',
        metadata: { orderId: 'CF-ORD-101' },
      },
    ]);

    const result = await sendAutomaticTransactionalEmail({
      type: 'PAYMENT_APPROVED',
      orderId: 'CF-ORD-101',
      customerEmail: 'customer@example.com',
    });

    expect(result.success).toBe(true);
    expect(result.isDuplicate).toBe(true);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('Requirement R: sends ORDER_PROCESSING transactional email', async () => {
    (db.query.emailLogs.findMany as any).mockResolvedValueOnce([]);

    const result = await sendAutomaticTransactionalEmail({
      type: 'ORDER_PROCESSING',
      orderId: 'CF-ORD-102',
      customerEmail: 'customer2@example.com',
      target: 'brand_reel',
      platform: 'tiktok',
      service: 'views',
      quantity: 1000,
    });

    expect(result.success).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'customer2@example.com',
        subject: expect.stringContaining('CF-ORD-102'),
      })
    );
  });

  it('Requirement S: sends ORDER_COMPLETED transactional email', async () => {
    (db.query.emailLogs.findMany as any).mockResolvedValueOnce([]);

    const result = await sendAutomaticTransactionalEmail({
      type: 'ORDER_COMPLETED',
      orderId: 'CF-ORD-103',
      customerEmail: 'customer3@example.com',
      target: 'youtube_ch',
      platform: 'youtube',
      service: 'subscribers',
      quantity: 250,
    });

    expect(result.success).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'customer3@example.com',
        subject: expect.stringContaining('CF-ORD-103'),
      })
    );
  });
});
