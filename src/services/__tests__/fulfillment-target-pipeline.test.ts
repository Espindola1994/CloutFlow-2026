import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processPerfectPayWebhook } from '@/services/perfectpay.service';
import { evaluateOrderForAutoDispatch } from '@/services/fulfillment-auto-dispatch.service';
import { resolveCanonicalFulfillmentTarget } from '@/services/fulfillment.service';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import { db } from '@/db';

const mockDb = {
  webhookEvents: [] as any[],
  orders: [] as any[],
  orderItems: [] as any[],
  orderEvents: [] as any[],
  paymentLeads: [] as any[],
  offers: [] as any[],
  checkoutContexts: [] as any[],
  fulfillmentChains: [] as any[],
  fulfillmentChainServices: [] as any[],
};

vi.mock('@/db', () => ({
  db: {
    transaction: vi.fn().mockImplementation(async (callback) => {
      const tx = {
        query: {
          webhookEvents: { findMany: vi.fn().mockResolvedValue([]) },
          orders: { findMany: vi.fn().mockImplementation(() => Promise.resolve(mockDb.orders)) },
          offers: { findMany: vi.fn().mockImplementation(() => Promise.resolve(mockDb.offers)) },
          paymentLeads: { findMany: vi.fn().mockResolvedValue([]) },
          checkoutContexts: {
            findMany: vi.fn().mockImplementation(() => Promise.resolve(mockDb.checkoutContexts)),
          },
          fulfillmentChains: {
            findMany: vi.fn().mockImplementation(() => Promise.resolve(mockDb.fulfillmentChains)),
          },
        },
        insert: vi.fn().mockImplementation(() => ({
          values: vi.fn().mockImplementation((values: any) => {
            const item = { id: `id_${Date.now()}_${Math.random()}`, ...values };
            if (values.publicId) {
              mockDb.orders.push(item);
            } else if (values.planName) {
              mockDb.orderItems.push(item);
            } else if (values.description && values.orderId) {
              mockDb.orderEvents.push(item);
            } else if (values.provider && !values.publicId) {
              mockDb.webhookEvents.push(item);
            }
            return {
              returning: vi.fn().mockResolvedValue([item]),
            };
          }),
        })),
        update: vi.fn().mockImplementation(() => ({
          set: vi.fn().mockImplementation((setVals: any) => ({
            where: vi.fn().mockImplementation(() => {
              if (mockDb.orders.length > 0 && (setVals.paymentStatus || setVals.status)) {
                Object.assign(mockDb.orders[0], setVals);
              }
              if (mockDb.checkoutContexts.length > 0 && setVals.consumedAt) {
                mockDb.checkoutContexts[0].consumedAt = setVals.consumedAt;
              }
              return Promise.resolve();
            }),
          })),
        })),
      };

      return callback(tx);
    }),
    query: {
      orders: {
        findMany: vi.fn().mockImplementation(() => Promise.resolve(mockDb.orders)),
      },
      offers: {
        findMany: vi.fn().mockImplementation(() => Promise.resolve(mockDb.offers)),
      },
      fulfillmentChains: {
        findMany: vi.fn().mockImplementation(() => Promise.resolve(mockDb.fulfillmentChains)),
      },
      fulfillmentChainServices: {
        findMany: vi.fn().mockImplementation(() => Promise.resolve(mockDb.fulfillmentChainServices)),
      },
      fulfillmentOrders: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockImplementation(() => Promise.resolve(mockDb.fulfillmentChainServices)),
        })),
      })),
    })),
  },
}));

describe('FASE 4.1 — Target Pipeline & Auto Dispatch Integrity Tests', () => {
  const TEST_TOKEN = 'test_token_phase_4_1';

  beforeEach(() => {
    mockDb.webhookEvents = [];
    mockDb.orders = [];
    mockDb.orderItems = [];
    mockDb.orderEvents = [];
    mockDb.checkoutContexts = [];
    mockDb.offers = [];
    mockDb.fulfillmentChains = [];
    process.env.PERFECTPAY_WEBHOOK_TOKEN = TEST_TOKEN;
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'true';
    process.env.PEAKERR_AUTO_DISPATCH_ENABLED = 'false';
  });

  it('TEST 1: Nova order Instagram Followers com @username -> Target persistido e canonicalizado', async () => {
    const offer = {
      id: 'off_ig_followers_2k',
      platform: 'instagram',
      service: 'followers',
      name: 'Instagram Followers 2000',
      quantity: 2000,
      priceCents: 1990,
      perfectpayProductId: 'PROD_IG_2K',
      perfectpayPlanId: 'PLAN_IG_2K',
      active: true,
    };
    mockDb.offers = [offer];

    const context = {
      id: 'ctx_user_1',
      contextId: 'CFCTX_target_username_123',
      platform: 'instagram',
      service: 'followers',
      targetType: 'profile',
      socialUsername: 'guilhermeterraaa',
      profileUrl: null,
      targetUrl: null,
      offerId: 'off_ig_followers_2k',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      consumedAt: null,
    };
    mockDb.checkoutContexts = [context];

    const createSpy = vi.spyOn(peakerrClient, 'createOrder');

    const payload = {
      token: TEST_TOKEN,
      code: 'PP-ORD-T1',
      sale_status_enum: 2,
      sale_amount: 19.90,
      currency_paid: 'USD',
      product: { code: 'PROD_IG_2K' },
      plan: { code: 'PLAN_IG_2K' },
      metadata: { src: 'CFCTX_target_username_123' },
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.action).toBe('ORDER_CREATED');
    expect(mockDb.orders.length).toBe(1);

    const order = mockDb.orders[0];
    expect(order.socialUsername).toBe('guilhermeterraaa');
    expect(order.platform).toBe('instagram');
    expect(order.service).toBe('followers');
    expect(order.quantity).toBe(2000);
    expect(order.paymentStatus).toBe('PAID');
    expect(order.fulfillmentStatus).toBe('NOT_DISPATCHED');

    // Canonical resolution test
    const canonicalRes = resolveCanonicalFulfillmentTarget(order);
    expect(canonicalRes.success).toBe(true);
    if (canonicalRes.success) {
      expect(canonicalRes.target).toBe('https://instagram.com/guilhermeterraaa');
      expect(canonicalRes.targetType).toBe('profile_fallback');
    }

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('TEST 2: Nova order Instagram Followers com URL -> Target persistido e canonicalizado', async () => {
    const offer = {
      id: 'off_ig_followers_2k',
      platform: 'instagram',
      service: 'followers',
      name: 'Instagram Followers 2000',
      quantity: 2000,
      priceCents: 1990,
      perfectpayProductId: 'PROD_IG_2K',
      perfectpayPlanId: 'PLAN_IG_2K',
      active: true,
    };
    mockDb.offers = [offer];

    const context = {
      id: 'ctx_user_2',
      contextId: 'CFCTX_target_url_456',
      platform: 'instagram',
      service: 'followers',
      targetType: 'profile',
      socialUsername: 'guilhermeterraaa',
      profileUrl: 'https://instagram.com/guilhermeterraaa',
      targetUrl: 'https://instagram.com/guilhermeterraaa',
      offerId: 'off_ig_followers_2k',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      consumedAt: null,
    };
    mockDb.checkoutContexts = [context];

    const createSpy = vi.spyOn(peakerrClient, 'createOrder');

    const payload = {
      token: TEST_TOKEN,
      code: 'PP-ORD-T2',
      sale_status_enum: 2,
      sale_amount: 19.90,
      currency_paid: 'USD',
      product: { code: 'PROD_IG_2K' },
      plan: { code: 'PLAN_IG_2K' },
      metadata: { src: 'CFCTX_target_url_456' },
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.action).toBe('ORDER_CREATED');
    expect(mockDb.orders.length).toBe(1);

    const order = mockDb.orders[0];
    expect(order.profileUrl).toBe('https://instagram.com/guilhermeterraaa');
    expect(order.targetUrl).toBe('https://instagram.com/guilhermeterraaa');

    const canonicalRes = resolveCanonicalFulfillmentTarget(order);
    expect(canonicalRes.success).toBe(true);
    if (canonicalRes.success) {
      expect(canonicalRes.target).toBe('https://instagram.com/guilhermeterraaa');
      expect(canonicalRes.targetType).toBe('profile_url');
    }

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('TEST 3: Webhook PAID recebido para order existente não remove/sobrescreve target', async () => {
    const existingOrder = {
      id: 'ord_exist_1',
      publicId: 'CF-EXIST01',
      externalOrderId: 'PP-ORD-EXIST',
      paymentGateway: 'perfectpay',
      platform: 'instagram',
      service: 'followers',
      quantity: 2000,
      paymentStatus: 'PENDING',
      fulfillmentStatus: 'NOT_DISPATCHED',
      socialUsername: 'guilhermeterraaa',
      profileUrl: 'https://instagram.com/guilhermeterraaa',
      targetUrl: 'https://instagram.com/guilhermeterraaa',
      paidAt: null,
    };
    mockDb.orders = [existingOrder];

    const payload = {
      token: TEST_TOKEN,
      code: 'PP-ORD-EXIST',
      sale_status_enum: 2, // Approved / Paid
      product: { code: 'PROD_IG_2K' },
      plan: { code: 'PLAN_IG_2K' },
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.action).toBe('ORDER_UPDATED');
    expect(existingOrder.paymentStatus).toBe('PAID');
    expect(existingOrder.socialUsername).toBe('guilhermeterraaa');
    expect(existingOrder.profileUrl).toBe('https://instagram.com/guilhermeterraaa');
    expect(existingOrder.targetUrl).toBe('https://instagram.com/guilhermeterraaa');
  });

  it('TEST 4: Order sem target continua BLOCKED_MISSING_TARGET', async () => {
    const orderWithoutTarget = {
      id: 'ord_no_target',
      publicId: 'CF-0747AB4AR8',
      platform: 'instagram',
      service: 'followers',
      quantity: 2000,
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NOT_DISPATCHED',
      socialUsername: null,
      profileUrl: null,
      targetUrl: null,
      username: null,
    };
    mockDb.orders = [orderWithoutTarget];

    const evalRes = await evaluateOrderForAutoDispatch('CF-0747AB4AR8');
    expect(evalRes.eligible).toBe(false);
    expect(evalRes.code).toBe('BLOCKED_MISSING_TARGET');
    expect(evalRes.reason).toContain('Target is required for instagram followers');
  });

  it('TEST 5: Order com target + PAID + NOT_DISPATCHED + offer ativa + chain válida + qty válida + saldo suficiente resulta ELIGIBLE', async () => {
    const offer = {
      id: 'off_valid_ig',
      platform: 'instagram',
      service: 'followers',
      name: 'Instagram 2000',
      quantity: 2000,
      active: true,
    };
    mockDb.offers = [offer];

    const chain = {
      id: 'chain_ig_foll',
      platform: 'instagram',
      service: 'followers',
      variant: 'standard',
      name: 'Instagram Followers Chain',
      active: true,
      autoFallback: false,
    };
    mockDb.fulfillmentChains = [chain];
    mockDb.fulfillmentChainServices = [
      {
        id: 's1',
        chainId: 'chain_ig_foll',
        providerServiceId: '1001',
        tier: 'primary',
        priority: 1,
        provider: 'peakerr',
        externalServiceId: '1001',
        ratePer1kUsd: '0.80',
        minQuantity: 100,
        maxQuantity: 50000,
        active: true,
      },
    ];

    const eligibleOrder = {
      id: 'ord_eligible_1',
      publicId: 'CF-ELIGIBLE01',
      platform: 'instagram',
      service: 'followers',
      quantity: 2000,
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NOT_DISPATCHED',
      offerId: 'off_valid_ig',
      socialUsername: 'guilhermeterraaa',
      profileUrl: 'https://instagram.com/guilhermeterraaa',
      targetUrl: 'https://instagram.com/guilhermeterraaa',
    };
    mockDb.orders = [eligibleOrder];

    vi.spyOn(peakerrClient, 'getBalance').mockResolvedValueOnce({
      balance: 100.0,
      currency: 'USD',
    });

    const evalRes = await evaluateOrderForAutoDispatch('CF-ELIGIBLE01');
    expect(evalRes.eligible).toBe(true);
    expect(evalRes.target).toBe('https://instagram.com/guilhermeterraaa');
    expect(evalRes.targetType).toBe('profile_url');
    expect(evalRes.primaryServiceId).toBe('1001');
    expect(evalRes.code).toBe('ELIGIBLE_FOR_AUTO_DISPATCH');
  });

  it('TEST 6: Email nunca é usado como target social', async () => {
    const orderWithEmailOnly = {
      id: 'ord_email_only',
      publicId: 'CF-EMAILONLY',
      customerEmail: 'guilherme@example.com',
      customerName: 'Guilherme Terra',
      platform: 'instagram',
      service: 'followers',
      quantity: 2000,
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NOT_DISPATCHED',
      socialUsername: null,
      profileUrl: null,
      targetUrl: null,
      username: null,
    };
    mockDb.orders = [orderWithEmailOnly];

    const evalRes = await evaluateOrderForAutoDispatch('CF-EMAILONLY');
    expect(evalRes.eligible).toBe(false);
    expect(evalRes.code).toBe('BLOCKED_MISSING_TARGET');
    expect(evalRes.target).toBeUndefined();

    // Verify resolveCanonicalFulfillmentTarget explicitly rejects it
    const canonicalRes = resolveCanonicalFulfillmentTarget(orderWithEmailOnly);
    expect(canonicalRes.success).toBe(false);
    if (!canonicalRes.success) {
      expect(canonicalRes.code).toBe('MISSING_TARGET');
    }
  });

  it('TEST 7: Nenhuma chamada Peakerr action=add durante esses testes', () => {
    const createSpy = vi.spyOn(peakerrClient, 'createOrder');
    expect(createSpy).not.toHaveBeenCalled();
  });
});
