import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import { processPerfectPayWebhook } from '@/services/perfectpay.service';
import { autoDispatchOrder } from '@/services/fulfillment-auto-dispatch.service';
import { executeSupplierRouting } from '@/services/supplier-routing.service';
import { SplitFulfillmentService } from '@/services/split-fulfillment.service';
import { submitOrderToPeakerrManual } from '@/services/fulfillment.service';

const mockDb = {
  webhookEvents: [] as any[],
  orders: [] as any[],
  orderItems: [] as any[],
  orderEvents: [] as any[],
  offers: [] as any[],
  fulfillmentOrders: [] as any[],
  supplierAttempts: [] as any[],
  fulfillmentOrderSplits: [] as any[],
};

vi.mock('@/db', () => ({
  db: {
    transaction: vi.fn().mockImplementation(async (callback) => {
      const tx = {
        query: {
          webhookEvents: {
            findMany: vi.fn().mockImplementation(({ where }: any = {}) => {
              return Promise.resolve(mockDb.webhookEvents);
            }),
          },
          orders: {
            findMany: vi.fn().mockImplementation(({ where }: any = {}) => {
              return Promise.resolve(mockDb.orders);
            }),
          },
          offers: {
            findMany: vi.fn().mockImplementation(({ where }: any = {}) => {
              return Promise.resolve(mockDb.offers);
            }),
          },
          checkoutContexts: {
            findMany: vi.fn().mockImplementation(() => Promise.resolve([])),
          },
          paymentLeads: {
            findMany: vi.fn().mockImplementation(() => Promise.resolve([])),
          },
          fulfillmentOrders: {
            findMany: vi.fn().mockImplementation(() => Promise.resolve(mockDb.fulfillmentOrders)),
          },
        },
        insert: vi.fn().mockImplementation((table: any) => ({
          values: vi.fn().mockImplementation((values: any) => {
            const items = Array.isArray(values) ? values : [values];
            const inserted = items.map((val) => ({
              id: `id_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              ...val,
            }));

            items.forEach((val, idx) => {
              const item = inserted[idx];
              if (val.publicId) {
                mockDb.orders.push(item);
              } else if (val.planName) {
                mockDb.orderItems.push(item);
              } else if (val.description) {
                mockDb.orderEvents.push(item);
              } else if (val.provider === 'perfectpay' && !val.publicId) {
                mockDb.webhookEvents.push(item);
              } else if (val.provider === 'peakerr') {
                mockDb.fulfillmentOrders.push(item);
              } else if (val.supplierServiceId && val.decision) {
                mockDb.supplierAttempts.push(item);
              } else if (val.supplierServiceId && val.chunkIndex !== undefined) {
                mockDb.fulfillmentOrderSplits.push(item);
              }
            });

            return {
              returning: vi.fn().mockResolvedValue(inserted),
            };
          }),
        })),
        update: vi.fn().mockImplementation((table: any) => ({
          set: vi.fn().mockImplementation((setVals: any) => ({
            where: vi.fn().mockImplementation(() => {
              if (mockDb.orders.length > 0) {
                mockDb.orders.forEach((o) => Object.assign(o, setVals));
              }
              if (mockDb.webhookEvents.length > 0 && setVals.processingStatus) {
                mockDb.webhookEvents.forEach((w) => Object.assign(w, setVals));
              }
              return {
                returning: vi.fn().mockResolvedValue(mockDb.orders),
              };
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
      fulfillmentOrders: {
        findMany: vi.fn().mockImplementation(() => Promise.resolve(mockDb.fulfillmentOrders)),
      },
      webhookEvents: {
        findMany: vi.fn().mockImplementation(() => Promise.resolve(mockDb.webhookEvents)),
      },
      supplierRateSnapshots: {
        findMany: vi.fn().mockImplementation(() =>
          Promise.resolve([
            { serviceId: '1001', serviceName: 'Instagram Followers High Quality', rate: '1.20', minQuantity: 100, maxQuantity: 50000, provider: 'peakerr' },
          ])
        ),
      },
      fulfillmentChains: {
        findMany: vi.fn().mockImplementation(() =>
          Promise.resolve([
            { id: 'chain_1', platform: 'instagram', service: 'followers', variant: 'starter', fallbackPolicy: 'CASCADE' },
          ])
        ),
      },
      fulfillmentChainServices: {
        findMany: vi.fn().mockImplementation(() =>
          Promise.resolve([
            { id: 'cs_1', chainId: 'chain_1', position: 1, serviceId: '1001', serviceName: 'Instagram Followers HQ', isEnabled: true },
          ])
        ),
      },
    },
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockResolvedValue([]),
          orderBy: vi.fn().mockResolvedValue([]),
        })),
        orderBy: vi.fn().mockResolvedValue([]),
      })),
    })),
    insert: vi.fn().mockImplementation((table: any) => ({
      values: vi.fn().mockImplementation((values: any) => {
        const item = { id: `id_${Date.now()}_${Math.random().toString(36).slice(2)}`, ...values };
        if (values.orderId && values.supplierServiceId && values.decision) {
          mockDb.supplierAttempts.push(item);
        } else if (values.orderId && values.description) {
          mockDb.orderEvents.push(item);
        }
        return {
          returning: vi.fn().mockResolvedValue([item]),
        };
      }),
    })),
    update: vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation((setVals: any) => ({
        where: vi.fn().mockImplementation(() => {
          if (mockDb.orders.length > 0) {
            mockDb.orders.forEach((o) => Object.assign(o, setVals));
          }
          return {
            returning: vi.fn().mockResolvedValue(mockDb.orders),
          };
        }),
      })),
    })),
  },
}));

describe('CRITICAL ADENDO: Real Payment Test with Guaranteed Zero Peakerr Orders (SAFE MODE)', () => {
  const TEST_TOKEN = 'secure_perfectpay_token_safe_test';
  let createOrderSpy: any;

  beforeEach(() => {
    mockDb.webhookEvents = [];
    mockDb.orders = [];
    mockDb.orderItems = [];
    mockDb.orderEvents = [];
    mockDb.offers = [];
    mockDb.fulfillmentOrders = [];
    mockDb.supplierAttempts = [];
    mockDb.fulfillmentOrderSplits = [];

    process.env.PERFECTPAY_WEBHOOK_TOKEN = TEST_TOKEN;
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'true';
    process.env.PEAKERR_API_KEY = 'pk_test_api_key_valid';
    delete process.env.PEAKERR_LIVE_FULFILLMENT; // Defaults to false / undefined
    delete process.env.FULFILLMENT_ENABLED;
    delete process.env.SAFE_MODE;

    createOrderSpy = vi.spyOn(peakerrClient, 'createOrder');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Webhook Realist: PAYMENT APPROVED + FULFILLMENT_ENABLED=false -> 0 Peakerr createOrder calls and order ready/blocked', async () => {
    process.env.FULFILLMENT_ENABLED = 'false';
    process.env.PEAKERR_LIVE_FULFILLMENT = 'false';

    mockDb.offers = [
      {
        id: 'off_insta_starter',
        platform: 'instagram',
        service: 'followers',
        name: 'Instagram Followers Starter',
        quantity: 1000,
        priceCents: 1990,
        perfectpayProductId: 'PPP_INSTA_01',
        perfectpayPlanId: 'PPL_STARTER_01',
        active: true,
      },
    ];

    const realisticWebhookPayload = {
      token: TEST_TOKEN,
      code: 'PP_TX_REAL_98765',
      payment_id: 'PAY_REAL_98765',
      sale_status_enum: 2, // Approved
      sale_status: 'approved',
      product: {
        code: 'PPP_INSTA_01',
        name: 'Instagram Growth',
      },
      plan: {
        code: 'PPL_STARTER_01',
        name: 'Instagram Followers Starter',
        quantity: 1,
      },
      customer: {
        email: 'testowner@cloutflow.io',
        full_name: 'Test Owner Real Store',
        phone_number: '+5511999999999',
      },
      sale_amount: '19.90',
      currency: 'USD',
      checkout_reference: 'instagram_influencer_profile',
    };

    // 1. Process Webhook
    const webhookResult = await processPerfectPayWebhook(realisticWebhookPayload);

    expect(webhookResult.success).toBe(true);
    expect(webhookResult.authenticated).toBe(true);
    expect(webhookResult.action).toBe('ORDER_CREATED');
    expect(webhookResult.orderId).toBeDefined();

    // Verify order was created in DB
    expect(mockDb.orders).toHaveLength(1);
    const createdOrder = mockDb.orders[0];
    expect(createdOrder.paymentStatus).toBe('PAID');
    expect(createdOrder.platform).toBe('instagram');
    expect(createdOrder.service).toBe('followers');
    expect(createdOrder.quantity).toBe(1000);
    expect(createdOrder.totalCents).toBe(1990);
    expect(createdOrder.fulfillmentStatus).toBe('NOT_DISPATCHED');

    // 2. Simulate Auto-Dispatch Execution (e.g. background job triggered after webhook)
    const dispatchResult = await autoDispatchOrder(createdOrder.id);
    expect(dispatchResult.success).toBe(false);
    expect(dispatchResult.code).toBe('AUTO_DISPATCH_DISABLED');

    // 3. Simulate Supplier Routing Execution (Dry Run & Live attempt)
    const routingResult = await executeSupplierRouting(createdOrder.id, { dryRun: true });
    expect(routingResult.success).toBe(true);
    expect(routingResult.isDryRun).toBe(true);
    expect(routingResult.selectedSupplierPosition).toBeDefined();

    // 4. Verify ZERO calls were made to Peakerr createOrder
    expect(createOrderSpy).not.toHaveBeenCalled();
    expect(createOrderSpy).toHaveBeenCalledTimes(0);
    expect(mockDb.fulfillmentOrders.filter((f) => f.externalOrderId)).toHaveLength(0);
  });

  it('2. Webhook Retried 5 Times -> Exactly 1 internal logical order and 0 Peakerr createOrder calls', async () => {
    process.env.FULFILLMENT_ENABLED = 'false';
    process.env.PEAKERR_LIVE_FULFILLMENT = 'false';

    mockDb.offers = [
      {
        id: 'off_insta_starter',
        platform: 'instagram',
        service: 'followers',
        name: 'Instagram Followers Starter',
        quantity: 1000,
        priceCents: 1990,
        perfectpayProductId: 'PPP_INSTA_01',
        perfectpayPlanId: 'PPL_STARTER_01',
        active: true,
      },
    ];

    const payload = {
      token: TEST_TOKEN,
      code: 'PP_TX_RETRY_555',
      payment_id: 'PAY_RETRY_555',
      sale_status_enum: 2,
      sale_status: 'approved',
      product: { code: 'PPP_INSTA_01', name: 'Instagram Growth' },
      plan: { code: 'PPL_STARTER_01', name: 'Instagram Followers Starter' },
      customer: { email: 'owner_retry@cloutflow.io', full_name: 'Store Owner' },
      sale_amount: '19.90',
      currency: 'USD',
      checkout_reference: 'instagram_owner',
    };

    // First Webhook Call
    const res1 = await processPerfectPayWebhook(payload);
    expect(res1.success).toBe(true);
    expect(res1.action).toBe('ORDER_CREATED');

    // Subsequent 4 Retries with identical payload / external order
    for (let i = 0; i < 4; i++) {
      const retryRes = await processPerfectPayWebhook(payload);
      expect(retryRes.success).toBe(true);
      // Dual-layer dedup / existing order update logic prevents duplicate order creations
      expect(['DUPLICATE_IGNORED', 'ORDER_UPDATED']).toContain(retryRes.action);
    }

    // Only 1 order created in DB
    expect(mockDb.orders).toHaveLength(1);
    expect(createOrderSpy).toHaveBeenCalledTimes(0);
  });

  it('3. Manual Admin Fulfillment Attempt while SAFE_MODE is active -> Blocked before Peakerr execution', async () => {
    process.env.SAFE_MODE = 'true';
    process.env.PEAKERR_LIVE_FULFILLMENT = 'true'; // Even if someone mistakenly toggled PEAKERR_LIVE_FULFILLMENT, SAFE_MODE blocks it

    mockDb.orders = [
      {
        id: 'ord_manual_test_1',
        publicId: 'CF-TESTMANUAL',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'NOT_DISPATCHED',
        platform: 'instagram',
        service: 'followers',
        quantity: 1000,
        targetUrl: 'https://instagram.com/myprofile',
        socialUsername: 'myprofile',
      },
    ];

    const manualResult = await submitOrderToPeakerrManual('ord_manual_test_1');
    expect(manualResult.success).toBe(false);
    expect(manualResult.code).toBe('LIVE_FULFILLMENT_DISABLED');
    expect(createOrderSpy).toHaveBeenCalledTimes(0);
  });

  it('4. Split Routing Execution in SAFE MODE -> Calculates chunk plan but creates 0 real Peakerr orders', async () => {
    process.env.FULFILLMENT_ENABLED = 'false';

    const order = {
      id: 'ord_split_test_1',
      publicId: 'CF-SPLITSAFE',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NOT_DISPATCHED',
      platform: 'twitter',
      service: 'likes',
      quantity: 10000,
      targetUrl: 'https://twitter.com/myprofile/status/123',
      socialUsername: 'myprofile',
      totalCents: 15000,
    };

    const splitCandidate = {
      serviceId: '1001',
      position: 'priority' as const,
      rate: 1.2,
      minQuantity: 100,
      maxQuantity: 2000,
    };

    const financialConfig = {
      sellingPrice: 150.0,
      minimumGrossMarginPercent: 40,
      minimumGrossProfit: 10,
      costCeilingEnabled: true,
      manualReviewEnabled: false,
      packageName: 'Twitter Likes Pro',
    };

    const splitResult = await SplitFulfillmentService.planAndExecuteSplit(
      order as any,
      splitCandidate,
      financialConfig,
      'https://twitter.com/myprofile/status/123',
      { dryRun: false } // Requesting live execution
    );

    // In SAFE MODE (FULFILLMENT_ENABLED=false), split routing returns SAFE_MODE_SPLIT_BLOCKED with zero Peakerr calls
    expect(splitResult.success).toBe(true);
    expect(splitResult.code).toBe('SAFE_MODE_SPLIT_BLOCKED');
    expect(splitResult.chunks.length).toBeGreaterThan(0);
    expect(createOrderSpy).toHaveBeenCalledTimes(0);
  });

  it('5. PeakerrClient directly invoked with FULFILLMENT_ENABLED=false -> Immediate safe rejection without HTTP fetch', async () => {
    process.env.FULFILLMENT_ENABLED = 'false';
    process.env.PEAKERR_LIVE_FULFILLMENT = 'true';

    const directResult = await peakerrClient.createOrder({
      service: '1001',
      link: 'https://instagram.com/testprofile',
      quantity: 500,
    });

    expect(directResult.success).toBe(false);
    if (!directResult.success) {
      expect(directResult.errorKind).toBe('LIVE_FULFILLMENT_DISABLED');
    }
  });
});
