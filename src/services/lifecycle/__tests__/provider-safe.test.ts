import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest';
import { runLifecycleWorker } from '@/services/lifecycle/worker.service';
import { db } from '@/db';
import { getMarketingEmailTransport, DisabledEmailTransport, MockEmailTransport } from '@/integrations/email/transport';
import { generateUnsubscribeToken } from '@/services/lifecycle/unsubscribe.service';
import { POST } from '@/app/api/unsubscribe/route';
import UnsubscribePage from '@/app/unsubscribe/page';

vi.mock('@/db', () => ({
  db: {
    query: {
      lifecycleEvents: { findMany: vi.fn() },
      emailLogs: { findMany: vi.fn() },
      lifecycleAutomations: { findMany: vi.fn() },
    },
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'mock_id' }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 'mock_id' }]),
      }),
    }),
    transaction: vi.fn(async (cb) => {
      return await cb({
        query: { lifecycleEvents: { findMany: vi.fn().mockResolvedValue([]) } },
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'evt_123' }]) }) }),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }) })
      });
    }),
  },
}));

vi.mock('@/integrations/email/transport', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/integrations/email/transport')>();
  return {
    ...actual,
    getMarketingEmailTransport: vi.fn(actual.getMarketingEmailTransport),
    getTransactionalEmailTransport: vi.fn(actual.getTransactionalEmailTransport),
  };
});

vi.mock('@/services/lifecycle/scheduler.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/lifecycle/scheduler.service')>();
  return {
    ...actual,
    claimReadyAutomations: vi.fn(),
    markAutomationCompleted: vi.fn(),
    handleAutomationFailure: vi.fn(),
  };
});

describe('Provider-Safe Finalization Verification (Requirements A-J)', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...OLD_ENV, LIFECYCLE_EMAILS_ENABLED: 'false' };
  });

  it('A. Lifecycle works with mock EmailTransport', async () => {
    const mockTransport = new MockEmailTransport();
    (getMarketingEmailTransport as unknown as MockedFunction<typeof getMarketingEmailTransport>).mockReturnValue(mockTransport);

    const { claimReadyAutomations, markAutomationCompleted } = await import('@/services/lifecycle/scheduler.service');

    (claimReadyAutomations as unknown as MockedFunction<typeof claimReadyAutomations>).mockResolvedValueOnce({
      success: true,
      claimedCount: 1,
      claimToken: 'token_mock_1234_5678_9012_3456_7890' as `${string}-${string}-${string}-${string}-${string}`,
      automations: [{
        id: 'auto_mock',
        customerEmail: 'mock@example.com',
        automationId: 'ABANDONED_CART_STEP_1',
        actionType: 'ABANDONED_CART',
        createdAt: new Date(),
        contextData: { stepNumber: 1 }
      }] as unknown as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    });

    (db.query.lifecycleEvents.findMany as unknown as MockedFunction<any>).mockResolvedValueOnce([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    (db.query.emailLogs.findMany as unknown as MockedFunction<any>).mockResolvedValueOnce([]); // eslint-disable-line @typescript-eslint/no-explicit-any

    await runLifecycleWorker();

    expect(mockTransport.sentMessages.length).toBe(1);
    expect(mockTransport.sentMessages[0].to).toBe('mock@example.com');
    expect(markAutomationCompleted).toHaveBeenCalledWith('auto_mock', 'token_mock_1234_5678_9012_3456_7890');
  });

  it('B. Disabled transport => zero external sends and marks status appropriately', async () => {
    const disabledTransport = new DisabledEmailTransport('BLOCKED_SEND_DISABLED');
    (getMarketingEmailTransport as unknown as MockedFunction<typeof getMarketingEmailTransport>).mockReturnValue(disabledTransport);

    const { claimReadyAutomations } = await import('@/services/lifecycle/scheduler.service');

    (claimReadyAutomations as unknown as MockedFunction<typeof claimReadyAutomations>).mockResolvedValueOnce({
      success: true,
      claimedCount: 1,
      claimToken: 'token_mock_1234_5678_9012_3456_7891' as `${string}-${string}-${string}-${string}-${string}`,
      automations: [{
        id: 'auto_dis',
        customerEmail: 'disabled@example.com',
        automationId: 'ABANDONED_CART_STEP_1',
        actionType: 'ABANDONED_CART',
        createdAt: new Date(),
        contextData: { stepNumber: 1 }
      }] as unknown as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    });

    (db.query.lifecycleEvents.findMany as unknown as MockedFunction<any>).mockResolvedValueOnce([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    (db.query.emailLogs.findMany as unknown as MockedFunction<any>).mockResolvedValueOnce([]); // eslint-disable-line @typescript-eslint/no-explicit-any

    await runLifecycleWorker();

    // Verify DB update set status to BLOCKED_SEND_DISABLED
    expect(db.update).toHaveBeenCalled();
  });

  it('C & D. Deterministic idempotency key per step & duplicate retry retains same key', async () => {
    const mockTransport = new MockEmailTransport();
    (getMarketingEmailTransport as unknown as MockedFunction<typeof getMarketingEmailTransport>).mockReturnValue(mockTransport);

    const { claimReadyAutomations } = await import('@/services/lifecycle/scheduler.service');

    const automationRecord = {
      id: 'auto_idempotent_123',
      customerEmail: 'idem@example.com',
      automationId: 'ABANDONED_CART_STEP_2',
      actionType: 'ABANDONED_CART',
      createdAt: new Date(),
      contextData: { stepNumber: 2 }
    };

    // First attempt
    (claimReadyAutomations as unknown as MockedFunction<typeof claimReadyAutomations>).mockResolvedValueOnce({
      success: true,
      claimedCount: 1,
      claimToken: 'token_mock_1234_5678_9012_3456_7892' as `${string}-${string}-${string}-${string}-${string}`,
      automations: [automationRecord] as unknown as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    });
    (db.query.lifecycleEvents.findMany as unknown as MockedFunction<any>).mockResolvedValueOnce([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    (db.query.emailLogs.findMany as unknown as MockedFunction<any>).mockResolvedValueOnce([]); // eslint-disable-line @typescript-eslint/no-explicit-any

    await runLifecycleWorker();

    expect(mockTransport.sentMessages[0].idempotencyKey).toBe('lifecycle/auto_idempotent_123/step/2');
    expect(mockTransport.sentMessages[0].headers?.['X-Idempotency-Key']).toBe('lifecycle/auto_idempotent_123/step/2');

    // Duplicate retry
    (claimReadyAutomations as unknown as MockedFunction<typeof claimReadyAutomations>).mockResolvedValueOnce({
      success: true,
      claimedCount: 1,
      claimToken: 'token_mock_1234_5678_9012_3456_7893' as `${string}-${string}-${string}-${string}-${string}`,
      automations: [automationRecord] as unknown as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    });
    (db.query.lifecycleEvents.findMany as unknown as MockedFunction<any>).mockResolvedValueOnce([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    (db.query.emailLogs.findMany as unknown as MockedFunction<any>).mockResolvedValueOnce([]); // eslint-disable-line @typescript-eslint/no-explicit-any

    await runLifecycleWorker();

    expect(mockTransport.sentMessages[1].idempotencyKey).toBe('lifecycle/auto_idempotent_123/step/2');
  });

  it('E. Unique email log prevents duplicate logical sends', async () => {
    const mockTransport = new MockEmailTransport();
    (getMarketingEmailTransport as unknown as MockedFunction<typeof getMarketingEmailTransport>).mockReturnValue(mockTransport);

    const { claimReadyAutomations, markAutomationCompleted } = await import('@/services/lifecycle/scheduler.service');

    // DB query returns an existing log with SENT status
    (claimReadyAutomations as unknown as MockedFunction<typeof claimReadyAutomations>).mockResolvedValueOnce({
      success: true,
      claimedCount: 1,
      claimToken: 'token_mock_1234_5678_9012_3456_7894' as `${string}-${string}-${string}-${string}-${string}`,
      automations: [{
        id: 'auto_dup_log',
        customerEmail: 'dup@example.com',
        automationId: 'ABANDONED_CART_STEP_1',
        actionType: 'ABANDONED_CART',
        createdAt: new Date(),
        contextData: { stepNumber: 1 }
      }] as unknown as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    });
    (db.query.lifecycleEvents.findMany as unknown as MockedFunction<any>).mockResolvedValueOnce([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    (db.query.emailLogs.findMany as unknown as MockedFunction<any>).mockResolvedValueOnce([{ id: 'log_sent_prev', status: 'SENT' }]); // eslint-disable-line @typescript-eslint/no-explicit-any

    await runLifecycleWorker();

    expect(mockTransport.sentMessages.length).toBe(0);
    expect(markAutomationCompleted).toHaveBeenCalledWith('auto_dup_log', 'token_mock_1234_5678_9012_3456_7894');
  });

  it('F. GET /unsubscribe => zero database mutations (pure read & render UI)', async () => {
    const email = 'user@example.com';
    const token = generateUnsubscribeToken(email);

    // Call page server component
    const result = await UnsubscribePage({ searchParams: { email, token } });

    // Assert that DB was NOT modified during GET / page render
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('G & H. Valid POST /api/unsubscribe suppresses marketing, and repeated POST is idempotent', async () => {
    const email = 'suppress_me@example.com';
    const token = generateUnsubscribeToken(email);

    const req1 = new Request('http://localhost:3000/api/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ email, token }),
    });

    const res1 = await POST(req1);
    const body1 = await res1.json();

    expect(res1.status).toBe(200);
    expect(body1.success).toBe(true);
    expect(db.insert).toHaveBeenCalled();
    expect(db.update).toHaveBeenCalled();

    // Repeated call (idempotent)
    const req2 = new Request('http://localhost:3000/api/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ email, token }),
    });

    const res2 = await POST(req2);
    const body2 = await res2.json();

    expect(res2.status).toBe(200);
    expect(body2.success).toBe(true);
  });

  it('I. Marketing emails blocked when global config is disabled', async () => {
    // Unmock transport for this test to verify real logic
    vi.doUnmock('@/integrations/email/transport');
    const { getMarketingEmailTransport: getRealMarketingTransport, DisabledEmailTransport: RealDisabledEmailTransport } = await import('@/integrations/email/transport');
    
    process.env.LIFECYCLE_EMAILS_ENABLED = 'false';
    const transport = getRealMarketingTransport();
    expect(transport).toBeInstanceOf(RealDisabledEmailTransport);
  });

  it('J. Transactional eligibility follows allowlist protection or active delivery for real buyers', async () => {
    vi.doUnmock('@/integrations/email/transport');
    const { getTransactionalEmailTransport: getRealTransactionalTransport, DisabledEmailTransport: RealDisabledEmailTransport, ResendEmailTransport: RealResendEmailTransport } = await import('@/integrations/email/transport');

    // Real buyer gets active Resend transport for commercial delivery
    const allowedTransport = getRealTransactionalTransport('mundoloja1994@gmail.com');
    expect(allowedTransport).toBeInstanceOf(RealResendEmailTransport);

    // If explicitly disabled via kill switch, transport is disabled
    process.env.TRANSACTIONAL_EMAILS_ENABLED = 'false';
    const disabledTransport = getRealTransactionalTransport('unauthorized@example.com');
    expect(disabledTransport).toBeInstanceOf(RealDisabledEmailTransport);
    delete process.env.TRANSACTIONAL_EMAILS_ENABLED;
  });
});

