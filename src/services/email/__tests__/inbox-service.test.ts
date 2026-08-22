import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ingestInboundEmail, isRecognizedSender, findOrCreateThread } from '@/services/email/inbox.service';
import { db } from '@/db';

vi.mock('@/db', () => {
  return {
    db: {
      query: {
        customers: {
          findMany: vi.fn(),
        },
        paymentLeads: {
          findMany: vi.fn(),
        },
        lifecycleEvents: {
          findMany: vi.fn(),
        },
        orders: {
          findMany: vi.fn(),
        },
        checkoutContexts: {
          findMany: vi.fn(),
        },
        emailThreads: {
          findMany: vi.fn(),
        },
        emailMessages: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: 'thread-123' }]),
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

describe('Smart Inbox Sender Recognition & Ingestion Engine (Requirements H, I, J, K, M)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Requirement H: Recognizes known lead or customer in CloutFlow', async () => {
    (db.query.customers.findMany as any).mockResolvedValueOnce([]);
    (db.query.paymentLeads.findMany as any).mockResolvedValueOnce([{ customerEmail: 'lead@example.com' }]);

    const recognized = await isRecognizedSender('lead@example.com');
    expect(recognized).toBe(true);
  });

  it('Requirement I: Ignores unknown/random Gmail sender from entering CloutFlow Inbox', async () => {
    (db.query.customers.findMany as any).mockResolvedValueOnce([]);
    (db.query.paymentLeads.findMany as any).mockResolvedValueOnce([]);
    (db.query.lifecycleEvents.findMany as any).mockResolvedValueOnce([]);
    (db.query.orders.findMany as any).mockResolvedValueOnce([]);
    (db.query.checkoutContexts.findMany as any).mockResolvedValueOnce([]);

    const result = await ingestInboundEmail({
      messageId: '<msg-101@gmail.com>',
      fromEmail: 'randomspammer@gmail.com',
      toEmail: 'support@cloutflow.com',
      subject: 'Special offer for you',
      receivedAt: new Date(),
    });

    expect(result.status).toBe('IGNORED_UNKNOWN_SENDER');
    expect(result.reason).toContain('not a recognized customer or lead');
  });

  it('Requirement J: Ignores duplicate Gmail message via Message-ID deduplication', async () => {
    // Known sender
    (db.query.customers.findMany as any).mockResolvedValueOnce([{ email: 'buyer@example.com' }]);
    // Existing message found in database
    (db.query.emailMessages.findFirst as any).mockResolvedValueOnce({
      id: 'existing-msg-id',
      threadId: 'thread-99',
    });

    const result = await ingestInboundEmail({
      messageId: '<duplicate-msg@gmail.com>',
      fromEmail: 'buyer@example.com',
      toEmail: 'support@cloutflow.com',
      subject: 'My order',
      receivedAt: new Date(),
    });

    expect(result.status).toBe('DUPLICATE');
    expect(result.threadId).toBe('thread-99');
  });

  it('Requirement H & K: Successfully imports recognized customer email and creates/attaches thread', async () => {
    // Known customer
    (db.query.customers.findMany as any).mockResolvedValueOnce([{ id: 'cust-1', email: 'buyer@example.com' }]);
    // No duplicate message
    (db.query.emailMessages.findFirst as any).mockResolvedValueOnce(null);
    // Thread search
    (db.query.emailThreads.findMany as any).mockResolvedValueOnce([]);
    (db.query.orders.findMany as any).mockResolvedValueOnce([{ id: 'order-123' }]);

    const result = await ingestInboundEmail({
      messageId: '<new-msg@gmail.com>',
      fromEmail: 'buyer@example.com',
      toEmail: 'support@cloutflow.com',
      subject: 'Where is my order?',
      textBody: 'Hi, please update me on order delivery.',
      receivedAt: new Date(),
    });

    expect(result.status).toBe('IMPORTED');
  });
});
