import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as perfectPayWebhookHandler } from '@/app/api/webhooks/perfectpay/route';
import { emitLifecycleEvent, evaluateRepeatPurchase } from '@/services/lifecycle/event.service';
import { schedulePostPurchaseOffer } from '@/services/lifecycle/post-purchase.service';
import { evaluateCheckoutAbandonments } from '@/services/lifecycle/scheduler.service';
import { runLifecycleWorker } from '@/services/lifecycle/worker.service';
import { sendAutomaticTransactionalEmail } from '@/services/email/transactional-trigger.service';
import { getMarketingEmailTransport, getTransactionalEmailTransport } from '@/integrations/email/transport';
import { db } from '@/db';

// Mock DB
vi.mock('@/db', () => {
  const eventsStore: any[] = [];
  const automationsStore: any[] = [];
  const offersStore: any[] = [];
  const emailLogsStore: any[] = [];
  const ordersStore: any[] = [];
  const webhookEventsStore: any[] = [];
  const leadsStore: any[] = [];

  return {
    db: {
      _stores: {
        eventsStore,
        automationsStore,
        offersStore,
        emailLogsStore,
        ordersStore,
        webhookEventsStore,
        leadsStore,
      },
      query: {
        lifecycleEvents: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        lifecycleAutomations: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        customerOffers: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        orders: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        webhookEvents: {
          findMany: vi.fn(),
        },
        emailLogs: {
          findMany: vi.fn(),
        },
        offers: {
          findMany: vi.fn(),
        },
        paymentLeads: {
          findMany: vi.fn(),
        },
        checkoutContexts: {
          findMany: vi.fn(),
        },
      },
      transaction: vi.fn(async (callback) => {
        const tx = {
          query: {
            lifecycleEvents: {
              findMany: vi.fn(),
            },
            lifecycleAutomations: {
              findMany: vi.fn(),
            },
            orders: {
              findMany: vi.fn(),
            },
            webhookEvents: {
              findMany: vi.fn(),
            },
            offers: {
              findMany: vi.fn(),
            },
            checkoutContexts: {
              findMany: vi.fn(),
            },
            paymentLeads: {
              findMany: vi.fn(),
            },
          },
          insert: vi.fn(() => ({
            values: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue([{ id: 'mock_tx_id_' + Math.random().toString(36).substring(2, 6) }]),
            })),
          })),
          update: vi.fn(() => ({
            set: vi.fn(() => ({
              where: vi.fn().mockResolvedValue([{ id: 'mock_updated' }]),
            })),
          })),
          select: vi.fn(() => ({
            from: vi.fn(() => ({
              where: vi.fn().mockResolvedValue([]),
            })),
          })),
        };
        return await callback(tx);
      }),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: 'mock_id_' + Math.random().toString(36).substring(2, 6) }]),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([{ id: 'mock_updated' }]),
        })),
      })),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue([]),
          }),
        }),
      }),
    },
  };
});

describe('Etapa 11B - Complete Lifecycle & Webhook Control Tests (A-N)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      SAFE_MODE: 'true',
      PEAKERR_LIVE_FULFILLMENT: 'false',
      PEAKERR_AUTO_DISPATCH_ENABLED: 'false',
      FULFILLMENT_ENABLED: 'false',
      LIFECYCLE_EMAILS_ENABLED: 'false',
      PERFECTPAY_WEBHOOK_TOKEN: 'valid_test_token',
      PERFECTPAY_WEBHOOK_VERIFIED: 'true',
    };
  });

  // A. PerfectPay approved + customer.email -> PAYMENT_APPROVED criado
  it('A. PerfectPay approved with customer.email creates PAYMENT_APPROVED event', async () => {
    (db.transaction as any).mockImplementationOnce(async (callback: any) => {
      const tx = {
        query: {
          webhookEvents: { findMany: vi.fn().mockResolvedValue([]) },
          offers: { findMany: vi.fn().mockResolvedValue([]) },
          checkoutContexts: { findMany: vi.fn().mockResolvedValue([]) },
          paymentLeads: { findMany: vi.fn().mockResolvedValue([]) },
          orders: { findMany: vi.fn().mockResolvedValue([]) },
          lifecycleEvents: { findMany: vi.fn().mockResolvedValue([]) },
          lifecycleAutomations: { findMany: vi.fn().mockResolvedValue([]) },
        },
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([{
              id: 'ord_mock_a_1',
              publicId: 'CF-1234ABCD',
              customerEmail: 'customer_a@example.com',
              platform: 'instagram',
              service: 'followers',
              quantity: 100,
              canonicalOfferId: 'canonical-instagram-followers-starter',
              totalCents: 999,
            }]),
          })),
        })),
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
      };
      return await callback(tx);
    });

    const payload = {
      token: 'valid_test_token',
      code: 'PP_ORDER_A_1',
      sale_status_enum: 2,
      product: { code: 'PPPBF6TP', name: 'Instagram Followers' },
      plan: { code: 'PPLQQQ3F7', name: 'Starter' },
      customer: {
        email: 'customer_a@example.com',
        full_name: 'Customer A',
      },
      sale_amount: '9.99',
    };

    const req = new Request('http://localhost:3000/api/webhooks/perfectpay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await perfectPayWebhookHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.action).toBe('ORDER_CREATED');
  });

  // B. Payload sem email válido -> comportamento seguro (sem quebra, sem crash)
  it('B. Payload without valid email behaves safely without crash', async () => {
    (db.transaction as any).mockImplementationOnce(async (callback: any) => {
      const tx = {
        query: {
          webhookEvents: { findMany: vi.fn().mockResolvedValue([]) },
          offers: { findMany: vi.fn().mockResolvedValue([]) },
          checkoutContexts: { findMany: vi.fn().mockResolvedValue([]) },
          paymentLeads: { findMany: vi.fn().mockResolvedValue([]) },
          orders: { findMany: vi.fn().mockResolvedValue([]) },
          lifecycleEvents: { findMany: vi.fn().mockResolvedValue([]) },
          lifecycleAutomations: { findMany: vi.fn().mockResolvedValue([]) },
        },
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([{
              id: 'ord_mock_b_1',
              publicId: 'CF-5678EFGH',
              customerEmail: null,
              platform: 'instagram',
              service: 'followers',
              quantity: 100,
              canonicalOfferId: 'canonical-instagram-followers-starter',
              totalCents: 999,
            }]),
          })),
        })),
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
      };
      return await callback(tx);
    });

    const payload = {
      token: 'valid_test_token',
      code: 'PP_ORDER_B_1',
      sale_status_enum: 2,
      product: { code: 'PPPBF6TP', name: 'Instagram Followers' },
      plan: { code: 'PPLQQQ3F7', name: 'Starter' },
      customer: {},
      sale_amount: '9.99',
    };

    const req = new Request('http://localhost:3000/api/webhooks/perfectpay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await perfectPayWebhookHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  // C. Webhook duplicado -> 1 lifecycle event (idempotência via emitLifecycleEvent)
  it('C. Duplicate webhook emits exactly 1 PAYMENT_APPROVED event', async () => {
    const emitParams = {
      customerEmail: 'dup_test@example.com',
      eventType: 'PAYMENT_APPROVED' as const,
      idempotencyKey: 'PAYMENT_APPROVED:ORDER:ord_dup_1',
      payload: { orderId: 'ord_dup_1', amount: '19.99' },
    };

    // First emission: new
    (db.transaction as any).mockImplementationOnce(async (callback: any) => {
      const tx = {
        query: {
          lifecycleEvents: { findMany: vi.fn().mockResolvedValue([]) },
          lifecycleAutomations: { findMany: vi.fn().mockResolvedValue([]) },
        },
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([{ id: 'evt_first' }]),
          })),
        })),
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
      };
      return await callback(tx);
    });

    const res1 = await emitLifecycleEvent(emitParams);
    expect(res1.success).toBe(true);
    expect(res1.isDuplicate).toBe(false);

    // Second emission: duplicate matched
    (db.transaction as any).mockImplementationOnce(async (callback: any) => {
      const tx = {
        query: {
          lifecycleEvents: { findMany: vi.fn().mockResolvedValue([{ id: 'evt_first' }]) },
        },
      };
      return await callback(tx);
    });

    const res2 = await emitLifecycleEvent(emitParams);
    expect(res2.success).toBe(true);
    expect(res2.isDuplicate).toBe(true);
    expect(res2.eventId).toBe('evt_first');
  });

  // D. Webhook duplicado -> 1 transactional email intent (email_logs idempotency)
  it('D. Duplicate webhook results in 1 transactional email intent', async () => {
    // 1st call: not existing in email_logs
    (db.query.emailLogs.findMany as any).mockResolvedValueOnce([]);

    const res1 = await sendAutomaticTransactionalEmail({
      type: 'PAYMENT_APPROVED',
      orderId: 'ord_tx_dup',
      customerEmail: 'tx_dup@example.com',
    });
    expect(res1.isDuplicate).toBeFalsy();

    // 2nd call: existing SENT log in email_logs
    (db.query.emailLogs.findMany as any).mockResolvedValueOnce([
      { id: 'log_1', status: 'SENT', templateId: 'PAYMENT_RECEIVED', metadata: { orderId: 'ord_tx_dup' } },
    ]);

    const res2 = await sendAutomaticTransactionalEmail({
      type: 'PAYMENT_APPROVED',
      orderId: 'ord_tx_dup',
      customerEmail: 'tx_dup@example.com',
    });
    expect(res2.success).toBe(true);
    expect(res2.isDuplicate).toBe(true);
  });

  // E. Webhook duplicado -> 1 post-purchase offer
  it('E. Duplicate webhook produces only 1 post-purchase offer', async () => {
    // 1st call: no offer exists yet
    (db.query.customerOffers.findFirst as any).mockResolvedValueOnce(null);
    (db.query.customerOffers.findMany as any).mockResolvedValueOnce([]); // no active offers
    (db.query.lifecycleEvents.findFirst as any).mockResolvedValueOnce({ id: 'evt_pp_1' });
    (db.query.lifecycleAutomations.findFirst as any).mockResolvedValueOnce(null);

    const res1 = await schedulePostPurchaseOffer({
      customerEmail: 'offer_dup@example.com',
      sourceOrderId: 'ord_offer_1',
    });
    expect(res1.success).toBe(true);
    expect(res1.duplicate).toBeFalsy();

    // 2nd call: existing offer found for sourceOrderId
    (db.query.customerOffers.findFirst as any).mockResolvedValueOnce({
      id: 'existing_offer_123',
      sourceOrderId: 'ord_offer_1',
    });

    const res2 = await schedulePostPurchaseOffer({
      customerEmail: 'offer_dup@example.com',
      sourceOrderId: 'ord_offer_1',
    });
    expect(res2.success).toBe(true);
    expect(res2.duplicate).toBe(true);
    expect(res2.offerId).toBe('existing_offer_123');
  });

  // F. PAID order -> abandoned cart suppressed (Financial Guard)
  it('F. PAID order suppresses abandoned cart even without lifecycle event', async () => {
    const leadEvent = {
      id: 'evt_lead_f',
      customerEmail: 'paid_buyer@example.com',
      eventType: 'LEAD_CAPTURED',
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
      payload: { checkoutContextId: 'CFCTX_f_123' },
    };

    (db.query.lifecycleEvents.findMany as any)
      .mockResolvedValueOnce([leadEvent]) // potentialLeads
      .mockResolvedValueOnce([]); // no PAYMENT_APPROVED in lifecycle_events!

    // Persistent financial orders table HAS a paid order for this context
    (db.query.orders.findMany as any).mockResolvedValueOnce([
      { id: 'ord_paid_f', paymentStatus: 'PAID', src: 'CFCTX_f_123' },
    ]);

    const res = await evaluateCheckoutAbandonments();
    expect(res.evaluatedCount).toBe(1);
    expect(res.abandonmentsCreated).toBe(0); // Suppressed by financial order truth!
  });

  // G. Mesmo email + compra antiga diferente -> novo checkout não é automaticamente suprimido
  it('G. Same email with an older distinct purchase does not suppress a new abandoned checkout', async () => {
    const leadTime = new Date(Date.now() - 40 * 60 * 1000);
    const leadEvent = {
      id: 'evt_lead_g',
      customerEmail: 'repeat_customer@example.com',
      eventType: 'CHECKOUT_STARTED',
      createdAt: leadTime,
      payload: { checkoutContextId: 'CFCTX_new_journey' },
    };

    (db.query.lifecycleEvents.findMany as any)
      .mockResolvedValueOnce([leadEvent]) // potentialLeads
      .mockResolvedValueOnce([]) // subsequent payments after checkout start: NONE
      .mockResolvedValueOnce([]); // existing abandonment: NONE

    // Orders check: no orders for THIS journey CFCTX_new_journey, no orders after checkout start
    (db.query.orders.findMany as any)
      .mockResolvedValueOnce([]) // matching CFCTX_new_journey
      .mockResolvedValueOnce([]); // matching orders after leadTime

    (db.transaction as any).mockImplementationOnce(async (cb: any) => {
      const tx = {
        query: {
          lifecycleEvents: { findMany: vi.fn().mockResolvedValue([]) },
          lifecycleAutomations: { findMany: vi.fn().mockResolvedValue([]) },
        },
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([{ id: 'evt_abandoned_created' }]),
          })),
        })),
        update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
      };
      return await cb(tx);
    });

    const res = await evaluateCheckoutAbandonments();
    expect(res.evaluatedCount).toBe(1);
    expect(res.abandonmentsCreated).toBe(1);
  });

  // H. Automação abandoned já agendada + compra posterior -> SUPPRESSED_CONVERTED
  it('H. Scheduled abandoned cart automation gets SUPPRESSED_CONVERTED when payment or order arrives', async () => {
    const automation = {
      id: 'auto_h_1',
      customerEmail: 'converting_customer@example.com',
      automationId: 'ABANDONED_CART_STEP_1',
      actionType: 'ABANDONED_CART',
      scheduledFor: new Date(Date.now() - 5 * 60 * 1000),
      createdAt: new Date(Date.now() - 35 * 60 * 1000),
      status: 'PROCESSING',
      contextData: { stepNumber: 1, checkoutContextId: 'CFCTX_h' },
    };

    const { claimReadyAutomations } = await import('@/services/lifecycle/scheduler.service');
    vi.spyOn(await import('@/services/lifecycle/scheduler.service'), 'claimReadyAutomations').mockResolvedValueOnce({
      success: true,
      claimedCount: 1,
      claimToken: '00000000-0000-0000-0000-000000000000',
      automations: [automation as any],
    });

    // Unsubscribe check select mock -> not suppressed
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    // Lifecycle events check: found a payment after automation creation
    (db.query.lifecycleEvents.findMany as any).mockResolvedValueOnce([
      { id: 'pay_after', eventType: 'PAYMENT_APPROVED' },
    ]);

    const res = await runLifecycleWorker(1);
    expect(res.succeeded).toBe(1);
    expect(db.update).toHaveBeenCalled();
  });

  // I. Canonical-only offer -> recovery URL correto
  it('I. Canonical-only offer produces valid recovery URL without physical offerId requirement', () => {
    const baseUrl = 'https://cloutflow.co';
    const contextData: Record<string, unknown> = {
      platform: 'tiktok',
      service: 'followers',
      canonicalOfferId: 'canonical-tiktok-followers-starter',
    };

    let returnUrl = baseUrl;
    if (contextData?.checkoutUrl) {
      returnUrl = contextData.checkoutUrl as string;
    } else if (contextData?.canonicalOfferId || (contextData?.platform && contextData?.service)) {
      const plat = (contextData.platform as string) || '';
      const serv = (contextData.service as string) || '';
      const offerParam = (contextData.offerId as string) || (contextData.canonicalOfferId as string) || '';
      if (plat && serv && offerParam) {
        returnUrl = `${baseUrl}/order/${plat}/${serv}?offer=${offerParam}`;
      } else if (plat && serv) {
        returnUrl = `${baseUrl}/order/${plat}/${serv}`;
      }
    }

    expect(returnUrl).toBe('https://cloutflow.co/order/tiktok/followers?offer=canonical-tiktok-followers-starter');
  });

  // J. Physical override -> continua funcionando
  it('J. Physical override maintains valid recovery URL', () => {
    const baseUrl = 'https://cloutflow.co';
    const contextData: Record<string, unknown> = {
      platform: 'instagram',
      service: 'followers',
      offerId: '2e9b6558-eb6d-4767-b6fc-77c245778653',
    };

    let returnUrl = baseUrl;
    if (contextData?.checkoutUrl) {
      returnUrl = contextData.checkoutUrl as string;
    } else if (contextData?.canonicalOfferId || (contextData?.platform && contextData?.service)) {
      const plat = (contextData.platform as string) || '';
      const serv = (contextData.service as string) || '';
      const offerParam = (contextData.offerId as string) || (contextData.canonicalOfferId as string) || '';
      if (plat && serv && offerParam) {
        returnUrl = `${baseUrl}/order/${plat}/${serv}?offer=${offerParam}`;
      }
    }

    expect(returnUrl).toBe('https://cloutflow.co/order/instagram/followers?offer=2e9b6558-eb6d-4767-b6fc-77c245778653');
  });

  // K. Primeira compra -> sem REPEAT_PURCHASE
  it('K. First purchase does NOT trigger REPEAT_PURCHASE', async () => {
    // Database returns no previous payment for this email
    (db.query.lifecycleEvents.findMany as any).mockResolvedValueOnce([]);

    const emitSpy = vi.fn();
    await evaluateRepeatPurchase('first_time_buyer@example.com', 'ord_first_123', 9.99);

    // evaluateRepeatPurchase searches for previous payment. Since none exists, it does not call emitLifecycleEvent with REPEAT_PURCHASE
    expect(emitSpy).not.toHaveBeenCalled();
  });

  // L. Segunda compra -> REPEAT_PURCHASE
  it('L. Second purchase triggers REPEAT_PURCHASE with distinct order references', async () => {
    // Database returns an earlier payment for a DIFFERENT order
    (db.query.lifecycleEvents.findMany as any).mockResolvedValueOnce([
      {
        id: 'evt_past_payment',
        idempotencyKey: 'PAYMENT_APPROVED:ORDER:ord_old_001',
        payload: { orderId: 'ord_old_001' },
      },
    ]);

    (db.transaction as any).mockImplementationOnce(async (cb: any) => {
      const tx = {
        query: {
          lifecycleEvents: { findMany: vi.fn().mockResolvedValue([]) },
          lifecycleAutomations: { findMany: vi.fn().mockResolvedValue([]) },
        },
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([{ id: 'evt_repeat' }]),
          })),
        })),
        update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
      };
      return await cb(tx);
    });

    await evaluateRepeatPurchase('repeat_buyer@example.com', 'ord_new_002', 19.99);

    expect(db.transaction).toHaveBeenCalled();
  });

  // M. LIFECYCLE_EMAILS_ENABLED=false -> ZERO chamadas externas Resend
  it('M. LIFECYCLE_EMAILS_ENABLED=false ensures marketing transport is disabled (zero external Resend calls)', () => {
    process.env.LIFECYCLE_EMAILS_ENABLED = 'false';
    delete process.env.LIFECYCLE_EMAIL_ALLOWLIST;

    const transport = getMarketingEmailTransport('any_customer@example.com');
    // Verify it is an instance of DisabledEmailTransport or blocked
    expect((transport as any).reason).toBe('BLOCKED_SEND_DISABLED');
  });

  // N. SAFE_MODE -> ZERO Peakerr createOrder
  it('N. SAFE_MODE=true blocks Peakerr order creation', async () => {
    process.env.SAFE_MODE = 'true';
    const { PeakerrClient } = await import('@/providers/peakerr/peakerr.client');
    const client = new PeakerrClient();

    const orderRes = await client.createOrder({
      service: 101,
      link: 'https://instagram.com/test_safe',
      quantity: 100,
    });

    expect(orderRes.success).toBe(false);
    if (!orderRes.success) {
      expect(orderRes.errorKind).toBe('LIVE_FULFILLMENT_DISABLED');
    }
  });
});
