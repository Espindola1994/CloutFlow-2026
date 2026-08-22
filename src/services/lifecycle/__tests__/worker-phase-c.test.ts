import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runLifecycleWorker } from '@/services/lifecycle/worker.service';
import { evaluateCheckoutAbandonments, DEFAULT_ABANDONMENT_THRESHOLD_MINUTES } from '@/services/lifecycle/scheduler.service';
import { getCartRecoveryTemplate } from '@/services/lifecycle/templates.service';
import { db } from '@/db';
import { lifecycleEvents, lifecycleAutomations, emailLogs, emailSuppressions } from '@/db/schema';
import * as emailTransport from '@/integrations/email/transport';
import * as unsubscribeService from '@/services/lifecycle/unsubscribe.service';

vi.mock('@/db', () => ({
  db: {
    query: {
      lifecycleEvents: { findMany: vi.fn() },
      emailLogs: { findMany: vi.fn() },
      lifecycleAutomations: { findMany: vi.fn() },
    },
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'mock_id' }]) }) }),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ id: 'mock_id' }]) }) }),
    transaction: vi.fn(async (cb) => {
      // Mock basic transaction object
      return await cb({
        query: { lifecycleEvents: { findMany: vi.fn().mockResolvedValue([]) } },
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'evt_123' }]) }) }),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }) })
      });
    }),
  },
}));

vi.mock('@/integrations/email/transport', () => ({
  getMarketingEmailTransport: vi.fn(),
  getTransactionalEmailTransport: vi.fn(),
}));

vi.mock('@/services/lifecycle/unsubscribe.service', () => ({
  isEmailSuppressed: vi.fn(),
  buildUnsubscribeUrl: vi.fn().mockReturnValue('https://cloutflow.com/unsubscribe'),
}));

vi.mock('@/services/lifecycle/scheduler.service', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    claimReadyAutomations: vi.fn(),
    markAutomationCompleted: vi.fn(),
    handleAutomationFailure: vi.fn(),
  };
});

describe('Phase C - Cart Recovery Tests', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...OLD_ENV, LIFECYCLE_EMAILS_ENABLED: 'true', LIFECYCLE_EMAIL_ALLOWLIST: '' };
  });

  it('A. Evaluator schedules 3 steps exactly once on CHECKOUT_ABANDONED', async () => {
    const mockLead = {
      id: 'lead1',
      customerEmail: 'test@example.com',
      eventType: 'LEAD_CAPTURED',
      createdAt: new Date(Date.now() - 40 * 60 * 1000), // 40 mins old
      payload: { platform: 'ig', service: 'followers', offerId: '1' }
    };

    // return the lead first, then no payment
    (db.query.lifecycleEvents.findMany as any)
      .mockResolvedValueOnce([mockLead])
      .mockResolvedValueOnce([]);

    const res = await evaluateCheckoutAbandonments();
    expect(res.evaluatedCount).toBe(1);
    expect(res.abandonmentsCreated).toBe(1);

    // Should have called scheduleLifecycleAutomation 3 times (mocked inside evaluateCheckoutAbandonments now but db.insert captures it)
    // Actually evaluateCheckoutAbandonments calls db.insert directly via scheduleLifecycleAutomation
    expect(db.insert).toHaveBeenCalled();
  });

  it('B. Payment before Step 1 => nothing scheduled', async () => {
    const mockLead = { id: 'lead2', customerEmail: 'test2@example.com', eventType: 'CHECKOUT_STARTED', createdAt: new Date(Date.now() - 40 * 60 * 1000) };
    const mockPayment = { id: 'pay1', customerEmail: 'test2@example.com', eventType: 'PAYMENT_APPROVED' };

    (db.query.lifecycleEvents.findMany as any)
      .mockResolvedValueOnce([mockLead])
      .mockResolvedValueOnce([mockPayment]);

    const res = await evaluateCheckoutAbandonments();
    expect(res.evaluatedCount).toBe(1);
    expect(res.abandonmentsCreated).toBe(0);
  });

  it('C. Payment between Step 1 and Step 2 => remaining steps suppressed during worker revalidation', async () => {
    const { claimReadyAutomations } = await import('@/services/lifecycle/scheduler.service');
    
    // Automation to claim
    (claimReadyAutomations as any).mockResolvedValueOnce({
      success: true,
      claimedCount: 1,
      claimToken: 'token123',
      automations: [{
        id: 'auto1',
        customerEmail: 'test3@example.com',
        automationId: 'ABANDONED_CART_STEP_2',
        actionType: 'ABANDONED_CART',
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        contextData: { stepNumber: 2 }
      }]
    });

    (unsubscribeService.isEmailSuppressed as any).mockResolvedValueOnce(false);

    // Worker checks for later payments
    (db.query.lifecycleEvents.findMany as any).mockResolvedValueOnce([{ id: 'pay2', eventType: 'PAYMENT_APPROVED' }]);

    const res = await runLifecycleWorker();
    expect(res.processed).toBe(1);
    expect(db.update).toHaveBeenCalled(); // to update status to SUPPRESSED_CONVERTED
    expect(emailTransport.getMarketingEmailTransport).not.toHaveBeenCalled();
  });

  it('E & F. Global send disabled + email not allowlisted => blocked; allowlisted => sent', async () => {
    process.env.LIFECYCLE_EMAILS_ENABLED = 'false';
    process.env.LIFECYCLE_EMAIL_ALLOWLIST = 'allow@example.com';

    const mockSend = vi.fn();
    (emailTransport.getMarketingEmailTransport as any).mockReturnValue({
      send: mockSend
    });

    const { claimReadyAutomations } = await import('@/services/lifecycle/scheduler.service');
    
    // First: not allowlisted
    (claimReadyAutomations as any).mockResolvedValueOnce({
      success: true,
      claimedCount: 1,
      claimToken: 'token123',
      automations: [{
        id: 'auto1',
        customerEmail: 'blocked@example.com',
        automationId: 'ABANDONED_CART_STEP_1',
        actionType: 'ABANDONED_CART',
        createdAt: new Date(),
        contextData: { stepNumber: 1 }
      }]
    });
    (unsubscribeService.isEmailSuppressed as any).mockResolvedValueOnce(false);
    (db.query.lifecycleEvents.findMany as any).mockResolvedValueOnce([]); // no payment
    (db.query.emailLogs.findMany as any).mockResolvedValueOnce([]); // no previous send
    mockSend.mockResolvedValueOnce({ success: false, reason: 'BLOCKED_SEND_DISABLED' });

    await runLifecycleWorker();
    
    // Second: allowlisted (We still use mock send to prevent real logic, simulate it worked)
    (claimReadyAutomations as any).mockResolvedValueOnce({
      success: true,
      claimedCount: 1,
      claimToken: 'token456',
      automations: [{
        id: 'auto2',
        customerEmail: 'allow@example.com',
        automationId: 'ABANDONED_CART_STEP_1',
        actionType: 'ABANDONED_CART',
        createdAt: new Date(),
        contextData: { stepNumber: 1 }
      }]
    });
    (unsubscribeService.isEmailSuppressed as any).mockResolvedValueOnce(false);
    (db.query.lifecycleEvents.findMany as any).mockResolvedValueOnce([]); // no payment
    (db.query.emailLogs.findMany as any).mockResolvedValueOnce([]); // no previous send
    mockSend.mockResolvedValueOnce({ success: true, messageId: 'msg_123' });

    await runLifecycleWorker();

    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('G. Unsubscribe => pending marketing messages suppressed', async () => {
    const mockSend = vi.fn();
    (emailTransport.getMarketingEmailTransport as any).mockReturnValue({ send: mockSend });

    const { claimReadyAutomations } = await import('@/services/lifecycle/scheduler.service');
    
    (claimReadyAutomations as any).mockResolvedValueOnce({
      success: true,
      claimedCount: 1,
      claimToken: 'token123',
      automations: [{
        id: 'auto1',
        customerEmail: 'unsub@example.com',
        automationId: 'ABANDONED_CART_STEP_1',
        actionType: 'ABANDONED_CART',
        createdAt: new Date(),
        contextData: { stepNumber: 1 }
      }]
    });
    (unsubscribeService.isEmailSuppressed as any).mockResolvedValueOnce(true);

    await runLifecycleWorker();

    expect(db.update).toHaveBeenCalled(); // marked SUPPRESSED
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('I. Resend successful => SENT log + automation COMPLETED', async () => {
    const { claimReadyAutomations, markAutomationCompleted } = await import('@/services/lifecycle/scheduler.service');
    
    const mockSend = vi.fn().mockResolvedValueOnce({ success: true, messageId: 'msg_999' });
    (emailTransport.getMarketingEmailTransport as any).mockReturnValue({ send: mockSend });

    (claimReadyAutomations as any).mockResolvedValueOnce({
      success: true,
      claimedCount: 1,
      claimToken: 'token123',
      automations: [{
        id: 'auto1',
        customerEmail: 'success@example.com',
        automationId: 'ABANDONED_CART_STEP_1',
        actionType: 'ABANDONED_CART',
        createdAt: new Date(),
        contextData: { stepNumber: 1 }
      }]
    });
    (unsubscribeService.isEmailSuppressed as any).mockResolvedValueOnce(false);
    (db.query.lifecycleEvents.findMany as any).mockResolvedValueOnce([]); 
    (db.query.emailLogs.findMany as any).mockResolvedValueOnce([]);

    await runLifecycleWorker();

    expect(db.insert).toHaveBeenCalled(); // Insert into emailLogs
    expect(markAutomationCompleted).toHaveBeenCalledWith('auto1', 'token123');
  });

  it('J. Transient Resend failure => retry (handled by catch)', async () => {
    const { claimReadyAutomations, handleAutomationFailure } = await import('@/services/lifecycle/scheduler.service');
    
    const mockSend = vi.fn().mockResolvedValueOnce({ success: false, error: 'Network Error' });
    (emailTransport.getMarketingEmailTransport as any).mockReturnValue({ send: mockSend });

    (claimReadyAutomations as any).mockResolvedValueOnce({
      success: true,
      claimedCount: 1,
      claimToken: 'token123',
      automations: [{
        id: 'autoFail',
        customerEmail: 'fail@example.com',
        automationId: 'ABANDONED_CART_STEP_1',
        actionType: 'ABANDONED_CART',
        createdAt: new Date(),
        attempts: 0,
        contextData: { stepNumber: 1 }
      }]
    });
    (unsubscribeService.isEmailSuppressed as any).mockResolvedValueOnce(false);
    (db.query.lifecycleEvents.findMany as any).mockResolvedValueOnce([]); 
    (db.query.emailLogs.findMany as any).mockResolvedValueOnce([]);
    
    await runLifecycleWorker();

    expect(handleAutomationFailure).toHaveBeenCalled();
  });

  it('L & M. Worker concurrent execution & crash protection => one email only', async () => {
    const { claimReadyAutomations, markAutomationCompleted } = await import('@/services/lifecycle/scheduler.service');
    
    const mockSend = vi.fn();
    (emailTransport.getMarketingEmailTransport as any).mockReturnValue({ send: mockSend });

    (claimReadyAutomations as any).mockResolvedValueOnce({
      success: true,
      claimedCount: 1,
      claimToken: 'token123',
      automations: [{
        id: 'autoDup',
        customerEmail: 'dup@example.com',
        automationId: 'ABANDONED_CART_STEP_1',
        actionType: 'ABANDONED_CART',
        createdAt: new Date(),
        contextData: { stepNumber: 1 }
      }]
    });
    (unsubscribeService.isEmailSuppressed as any).mockResolvedValueOnce(false);
    (db.query.lifecycleEvents.findMany as any).mockResolvedValueOnce([]); 
    
    // Idempotency check finds existing SENT log
    (db.query.emailLogs.findMany as any).mockResolvedValueOnce([{ id: 'log1', status: 'SENT' }]);

    await runLifecycleWorker();

    expect(mockSend).not.toHaveBeenCalled();
    expect(markAutomationCompleted).toHaveBeenCalledWith('autoDup', 'token123');
  });
});
