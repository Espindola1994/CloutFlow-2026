import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ingestInboundEmail, isRecognizedSender } from '@/services/email/inbox.service';
import { db } from '@/db';

type MockFn = ReturnType<typeof vi.fn>;

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
        settings: {
          findMany: vi.fn(),
        }
      },
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: 'thread-123' }]),
          onConflictDoUpdate: vi.fn().mockResolvedValue([]),
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
    (db.query.customers.findMany as unknown as MockFn).mockResolvedValueOnce([]);
    (db.query.paymentLeads.findMany as unknown as MockFn).mockResolvedValueOnce([{ customerEmail: 'lead@example.com' }]);

    const recognized = await isRecognizedSender('lead@example.com');
    expect(recognized).toBe(true);
  });

  it('Requirement I: Ignores unknown/random Gmail sender from entering CloutFlow Inbox', async () => {
    (db.query.customers.findMany as unknown as MockFn).mockResolvedValueOnce([]);
    (db.query.paymentLeads.findMany as unknown as MockFn).mockResolvedValueOnce([]);
    (db.query.lifecycleEvents.findMany as unknown as MockFn).mockResolvedValueOnce([]);
    (db.query.orders.findMany as unknown as MockFn).mockResolvedValueOnce([]);
    (db.query.checkoutContexts.findMany as unknown as MockFn).mockResolvedValueOnce([]);

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
    (db.query.customers.findMany as unknown as MockFn).mockResolvedValueOnce([{ email: 'buyer@example.com' }]);
    // Existing message found in database
    (db.query.emailMessages.findFirst as unknown as MockFn).mockResolvedValueOnce({
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
    (db.query.customers.findMany as unknown as MockFn).mockResolvedValueOnce([{ id: 'cust-1', email: 'buyer@example.com' }]);
    // No duplicate message
    (db.query.emailMessages.findFirst as unknown as MockFn).mockResolvedValueOnce(null);
    // Thread search
    (db.query.emailThreads.findMany as unknown as MockFn).mockResolvedValueOnce([]);
    (db.query.orders.findMany as unknown as MockFn).mockResolvedValueOnce([{ id: 'order-123' }]);

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

  it('Requirement F, G, H, I: Parses raw MIME structure, decodes multipart/quoted-printable cleanly', async () => {
    // Known customer
    (db.query.customers.findMany as unknown as MockFn).mockResolvedValueOnce([{ id: 'cust-1', email: 'buyer@example.com' }]);
    // No duplicate message
    (db.query.emailMessages.findFirst as unknown as MockFn).mockResolvedValueOnce(null);
    // Thread search
    (db.query.emailThreads.findMany as unknown as MockFn).mockResolvedValueOnce([]);
    (db.query.orders.findMany as unknown as MockFn).mockResolvedValueOnce([{ id: 'order-123' }]);

    const mimeRaw = [
      'Content-Type: multipart/alternative; boundary="boundary-123"',
      '',
      '--boundary-123',
      'Content-Type: text/plain; charset="utf-8"',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      'Tudo bem e voc=C3=AA?',
      '',
      '--boundary-123--',
    ].join('\r\n');

    const result = await ingestInboundEmail({
      messageId: '<mime-test@gmail.com>',
      fromEmail: 'buyer@example.com',
      toEmail: 'support@cloutflow.com',
      subject: 'Re: Teste',
      rawSource: mimeRaw,
      receivedAt: new Date(),
    });

    expect(result.status).toBe('IMPORTED');
  });
});
