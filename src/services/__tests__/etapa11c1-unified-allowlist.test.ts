import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getTransactionalEmailTransport,
  getMarketingEmailTransport,
  isEmailInAllowlist,
  isMarketingSendAllowedForRecipient,
  DisabledEmailTransport,
  ResendEmailTransport,
} from '@/integrations/email/transport';
import { sendAutomaticTransactionalEmail } from '@/services/email/transactional-trigger.service';
import { sendManualEmail } from '@/services/crm/manual-email.service';
import { emitLifecycleEvent } from '@/services/lifecycle/event.service';
import { db } from '@/db';

// Mock DB
vi.mock('@/db', () => {
  const emailLogsStore: any[] = [];
  const eventsStore: any[] = [];
  const ordersStore: any[] = [];

  return {
    db: {
      _stores: {
        emailLogsStore,
        eventsStore,
        ordersStore,
      },
      query: {
        emailLogs: {
          findMany: vi.fn(async () => []),
        },
        emailSuppressions: {
          findMany: vi.fn(async () => []),
        },
        emailThreads: {
          findMany: vi.fn(async () => []),
        },
        lifecycleEvents: {
          findMany: vi.fn(async () => []),
          findFirst: vi.fn(async () => null),
        },
        lifecycleAutomations: {
          findMany: vi.fn(async () => []),
          findFirst: vi.fn(async () => null),
        },
        orders: {
          findFirst: vi.fn(async () => null),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn((vals) => {
          emailLogsStore.push(vals);
          return {
            returning: vi.fn().mockResolvedValue([{ id: 'log_mock_' + Math.random().toString(36).substring(2, 7), ...vals }]),
          };
        }),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([]),
        })),
      })),
      transaction: vi.fn(async (cb) => {
        const tx = {
          query: {
            lifecycleEvents: {
              findMany: vi.fn(async () => []),
            },
            lifecycleAutomations: {
              findMany: vi.fn(async () => []),
            },
            orders: {
              findMany: vi.fn(async () => []),
            },
          },
          insert: vi.fn(() => ({
            values: vi.fn((vals) => {
              eventsStore.push(vals);
              return {
                returning: vi.fn().mockResolvedValue([{ id: 'evt_mock_' + Math.random().toString(36).substring(2, 7) }]),
              };
            }),
          })),
          update: vi.fn(() => ({
            set: vi.fn(() => ({
              where: vi.fn().mockResolvedValue([]),
            })),
          })),
        };
        return await cb(tx);
      }),
    },
  };
});

describe('ETAPA 11C-1: Proteção Unificada de Allowlist (Transactional + Lifecycle)', () => {
  const ALLOWLISTED_EMAIL = 'instaplussoftware@gmail.com';
  const NON_ALLOWLISTED_EMAIL = 'regular_customer@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.LIFECYCLE_EMAILS_ENABLED = 'false';
    process.env.LIFECYCLE_EMAIL_ALLOWLIST = ALLOWLISTED_EMAIL;
    (db as any)._stores.emailLogsStore.length = 0;
    (db as any)._stores.eventsStore.length = 0;
  });

  // Test A: global=false, recipient allowlisted, transactional -> active Resend transport
  it('A) global=false, recipient allowlisted, transactional -> active Resend transport', () => {
    process.env.LIFECYCLE_EMAILS_ENABLED = 'false';
    process.env.LIFECYCLE_EMAIL_ALLOWLIST = ALLOWLISTED_EMAIL;

    const transport = getTransactionalEmailTransport(ALLOWLISTED_EMAIL, false);
    expect(transport).toBeInstanceOf(ResendEmailTransport);
  });

  // Test B: global=false, recipient NOT allowlisted, transactional -> DisabledEmailTransport -> provider call 0
  it('B) global=false, recipient NOT allowlisted, transactional -> DisabledEmailTransport (provider call 0)', async () => {
    process.env.LIFECYCLE_EMAILS_ENABLED = 'false';
    process.env.LIFECYCLE_EMAIL_ALLOWLIST = ALLOWLISTED_EMAIL;

    const transport = getTransactionalEmailTransport(NON_ALLOWLISTED_EMAIL, false);
    expect(transport).toBeInstanceOf(DisabledEmailTransport);

    const result = await transport.send({
      to: NON_ALLOWLISTED_EMAIL,
      subject: 'Order Confirmation',
      html: '<p>Test</p>',
      category: 'transactional',
    });

    expect(result.success).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('BLOCKED_NOT_ALLOWLISTED');
    expect(result.messageId).toBeUndefined();
  });

  // Test C: global=true, recipient qualquer válido, transactional -> active transport
  it('C) global=true, recipient qualquer válido, transactional -> active Resend transport', () => {
    process.env.LIFECYCLE_EMAILS_ENABLED = 'true';
    delete process.env.LIFECYCLE_EMAIL_ALLOWLIST;

    const transport = getTransactionalEmailTransport(NON_ALLOWLISTED_EMAIL, false);
    expect(transport).toBeInstanceOf(ResendEmailTransport);
  });

  // Test D: marketing continua com mesmo comportamento
  it('D) marketing continua com mesmo comportamento (allowlist respeitada quando global=false)', () => {
    process.env.LIFECYCLE_EMAILS_ENABLED = 'false';
    process.env.LIFECYCLE_EMAIL_ALLOWLIST = ALLOWLISTED_EMAIL;

    // Allowlisted gets active Resend transport
    const allowedTransport = getMarketingEmailTransport(ALLOWLISTED_EMAIL, false);
    expect(allowedTransport).toBeInstanceOf(ResendEmailTransport);

    // Non-allowlisted gets DisabledEmailTransport
    const disabledTransport = getMarketingEmailTransport(NON_ALLOWLISTED_EMAIL, false);
    expect(disabledTransport).toBeInstanceOf(DisabledEmailTransport);

    expect(isMarketingSendAllowedForRecipient(ALLOWLISTED_EMAIL)).toBe(true);
    expect(isMarketingSendAllowedForRecipient(NON_ALLOWLISTED_EMAIL)).toBe(false);
  });

  // Test E: manual admin permitido quando explicitamente autorizado
  it('E) manual admin send é permitido quando explicitamente autorizado via forceManualAllowed=true', async () => {
    process.env.LIFECYCLE_EMAILS_ENABLED = 'false';
    process.env.LIFECYCLE_EMAIL_ALLOWLIST = ALLOWLISTED_EMAIL;

    // Even if non-allowlisted, explicit manual transactional send by admin produces active transport
    const transport = getTransactionalEmailTransport(NON_ALLOWLISTED_EMAIL, true);
    expect(transport).toBeInstanceOf(ResendEmailTransport);

    // Test sendManualEmail function routing with category=transactional
    (db.query.emailSuppressions.findMany as any).mockResolvedValue([]);
    const resendMockSend = vi.fn().mockResolvedValue({ success: true, messageId: 'resend_manual_tx_123' });
    vi.spyOn(ResendEmailTransport.prototype, 'send').mockImplementation(resendMockSend);

    const manualResult = await sendManualEmail({
      customerEmail: NON_ALLOWLISTED_EMAIL,
      category: 'transactional',
      subject: 'Manual Receipt',
      body: '<p>Manual receipt content</p>',
      adminName: 'Admin_Master',
    });

    expect(manualResult.success).toBe(true);
    expect(manualResult.provider).toBe('RESEND');
    expect(resendMockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: NON_ALLOWLISTED_EMAIL,
        category: 'transactional',
      })
    );
  });

  // Test F: automated code path não consegue bypassar allowlist via forceManualAllowed
  it('F) automated code path (sendAutomaticTransactionalEmail) não passa forceManualAllowed e bloqueia non-allowlisted', async () => {
    process.env.LIFECYCLE_EMAILS_ENABLED = 'false';
    process.env.LIFECYCLE_EMAIL_ALLOWLIST = ALLOWLISTED_EMAIL;

    (db.query.emailLogs.findMany as any).mockResolvedValueOnce([]); // No previous send

    const resendSpy = vi.spyOn(ResendEmailTransport.prototype, 'send');

    const result = await sendAutomaticTransactionalEmail({
      type: 'PAYMENT_APPROVED',
      orderId: 'ord_auto_blocked_01',
      customerEmail: NON_ALLOWLISTED_EMAIL,
      customerName: 'Bob Non-Allowlisted',
    });

    expect(result.success).toBe(false);
    expect(resendSpy).not.toHaveBeenCalled();

    // Verify logged status in emailLogs is BLOCKED_NOT_ALLOWLISTED
    const logged = (db as any)._stores.emailLogsStore.find(
      (l: any) => l.customerEmail === NON_ALLOWLISTED_EMAIL && l.templateId === 'PAYMENT_RECEIVED'
    );
    expect(logged).toBeDefined();
    expect(logged.status).toBe('BLOCKED_NOT_ALLOWLISTED');
    expect(logged.sendOrigin).toBe('AUTOMATION');
    expect(logged.sentAt).toBeNull();
  });

  // Requirement 6: Teste Integrado PAYMENT_RECEIVED com LIFECYCLE_EMAILS_ENABLED=false
  describe('6. Teste Integrado PAYMENT_RECEIVED com LIFECYCLE_EMAILS_ENABLED=false', () => {
    it('simula PAYMENT_APPROVED -> PAYMENT_RECEIVED: allowlisted allows send intent, non-allowlisted blocks with provider calls = 0', async () => {
      process.env.LIFECYCLE_EMAILS_ENABLED = 'false';
      process.env.LIFECYCLE_EMAIL_ALLOWLIST = ALLOWLISTED_EMAIL;

      const resendSendSpy = vi.spyOn(ResendEmailTransport.prototype, 'send').mockResolvedValue({
        success: true,
        messageId: 'resend_allowlisted_tx_999',
      });

      // 1. Simular para allowlisted: expected send intent allowed
      (db.query.emailLogs.findMany as any).mockResolvedValueOnce([]); // No previous send for allowlisted
      const allowlistedResult = await sendAutomaticTransactionalEmail({
        type: 'PAYMENT_APPROVED',
        orderId: 'ord_allowlisted_001',
        customerEmail: ALLOWLISTED_EMAIL,
        customerName: 'InstaPlus Software Allowlisted',
        target: 'instaplus_official',
        platform: 'instagram',
        service: 'followers',
        quantity: 1000,
      });

      expect(allowlistedResult.success).toBe(true);
      expect(allowlistedResult.messageId).toBe('resend_allowlisted_tx_999');
      expect(resendSendSpy).toHaveBeenCalledTimes(1);

      // Verify log for allowlisted
      const allowlistedLog = (db as any)._stores.emailLogsStore.find(
        (l: any) => l.customerEmail === ALLOWLISTED_EMAIL && l.templateId === 'PAYMENT_RECEIVED'
      );
      expect(allowlistedLog).toBeDefined();
      expect(allowlistedLog.status).toBe('SENT');
      expect(allowlistedLog.sentAt).not.toBeNull();

      // Clear spy call history
      resendSendSpy.mockClear();

      // 2. Simular para non-allowlisted: expected blocked, provider call 0
      (db.query.emailLogs.findMany as any).mockResolvedValueOnce([]); // No previous send for non-allowlisted
      const nonAllowlistedResult = await sendAutomaticTransactionalEmail({
        type: 'PAYMENT_APPROVED',
        orderId: 'ord_non_allowlisted_002',
        customerEmail: NON_ALLOWLISTED_EMAIL,
        customerName: 'Random Customer',
        target: 'random_target',
        platform: 'instagram',
        service: 'followers',
        quantity: 500,
      });

      expect(nonAllowlistedResult.success).toBe(false);
      // Resend provider call must be strictly 0
      expect(resendSendSpy).toHaveBeenCalledTimes(0);

      // Verify log for non-allowlisted
      const nonAllowlistedLog = (db as any)._stores.emailLogsStore.find(
        (l: any) => l.customerEmail === NON_ALLOWLISTED_EMAIL && l.templateId === 'PAYMENT_RECEIVED'
      );
      expect(nonAllowlistedLog).toBeDefined();
      expect(nonAllowlistedLog.status).toBe('BLOCKED_NOT_ALLOWLISTED');
      expect(nonAllowlistedLog.sentAt).toBeNull();
    });
  });
});
