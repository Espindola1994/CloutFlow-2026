import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processPerfectPayWebhook } from '@/services/perfectpay.service';
import { OFFICIAL_PERFECTPAY_66_DATASET } from '@/config/official-perfectpay-dataset';
import { resolveSafeHistoricalBackfill } from '@/config/safe-backfill.resolver';

const mockInsertedOrders: any[] = [];
const mockUpdatedOrders: any[] = [];
const mockInsertedEvents: any[] = [];
const mockUpdatedContexts: any[] = [];

// Pre-seeded checkout context in mock
let activeCheckoutContext: any = null;

vi.mock('@/db', () => ({
  db: {
    transaction: vi.fn().mockImplementation(async (cb: any) => cb({
      insert: vi.fn((table: any) => ({
        values: vi.fn((val: any) => {
          if (val.publicId) {
            mockInsertedOrders.push(val);
            return {
              returning: vi.fn().mockResolvedValue([{ id: 'ord_webhook_1', ...val }]),
            };
          }
          if (val.provider === 'perfectpay') {
            mockInsertedEvents.push(val);
            return {
              returning: vi.fn().mockResolvedValue([{ id: 'wh_evt_1', ...val }]),
            };
          }
          return {
            returning: vi.fn().mockResolvedValue([{ id: 'gen_1', ...val }]),
          };
        }),
      })),
      update: vi.fn((table: any) => ({
        set: vi.fn((setVal: any) => ({
          where: vi.fn().mockImplementation((condition: any) => {
            if (setVal.consumedAt) {
              mockUpdatedContexts.push(setVal);
            } else {
              mockUpdatedOrders.push(setVal);
            }
            return Promise.resolve();
          }),
        })),
      })),
      query: {
        webhookEvents: {
          findMany: vi.fn().mockResolvedValue([]),
        },
        orders: {
          findMany: vi.fn().mockResolvedValue([]),
        },
        offers: {
          findMany: vi.fn().mockImplementation(async (opts?: any) => {
            // Instagram Followers Starter physical override exists
            // Return only if query matches product PPPBF6TP and plan PPLQQQ3F7 (or no where condition)
            return [
              {
                id: '2e9b6558-eb6d-4767-b6fc-77c245778653',
                platform: 'instagram',
                service: 'followers',
                name: 'Starter',
                slug: 'instagram-followers-starter',
                quantity: 100,
                priceCents: 490,
                perfectpayProductId: 'PPPBF6TP',
                perfectpayPlanId: 'PPLQQQ3F7',
                active: true,
              },
            ];
          }),
        },
        checkoutContexts: {
          findMany: vi.fn().mockImplementation(async (opts?: any) => {
            return activeCheckoutContext ? [activeCheckoutContext] : [];
          }),
        },
      },
    })),
  },
}));

describe('ETAPA 8C - Webhook CFCTX & Canonical Resolution Suite', () => {
  beforeEach(() => {
    mockInsertedOrders.length = 0;
    mockUpdatedOrders.length = 0;
    mockInsertedEvents.length = 0;
    mockUpdatedContexts.length = 0;
    activeCheckoutContext = null;
    process.env.PERFECTPAY_WEBHOOK_TOKEN = 'test_token_8c';
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'true';
  });

  it('1. Webhook resolves canonical offer without physical override (TikTok Followers Starter) preserving CFCTX target', async () => {
    // Setup Context
    activeCheckoutContext = {
      id: 'ctx_row_1',
      contextId: 'CFCTX_tiktok_followers_123',
      platform: 'tiktok',
      service: 'followers',
      targetType: 'profile',
      socialUsername: 'tiktok_real_target',
      profileUrl: 'https://www.tiktok.com/@tiktok_real_target',
      targetUrl: null,
      canonicalOfferId: 'canonical-tiktok-followers-starter',
      offerId: null, // Pure canonical, no physical override
      perfectpayProductId: 'PPPBF6TP',
      perfectpayPlanId: 'PPLQQQD0I',
      customerEmail: 'customer@test.com',
      expiresAt: new Date(Date.now() + 3600000), // +1 hour
    };

    const webhookPayload = {
      token: 'test_token_8c',
      sale_status_enum: 2, // 2 = approved in PerfectPay contract
      product_id: 'PPPBF6TP',
      plan_id: 'PPLQQQD0I',
      sale_amount: 4.90,
      src: 'CFCTX_tiktok_followers_123',
      sale_id: 'PP_TEST_ORD_001',
      transaction_id: 'PP_TEST_TX_001',
      customer: {
        email: 'customer@test.com',
        full_name: 'TikTok Buyer',
      },
    };

    const result = await processPerfectPayWebhook(webhookPayload);
    expect(result.success).toBe(true);
    expect(result.action).toBe('ORDER_CREATED');

    expect(mockInsertedOrders).toHaveLength(1);
    const createdOrder = mockInsertedOrders[0];

    // Verify canonical resolution without physical override
    expect(createdOrder.canonicalOfferId).toBe('canonical-tiktok-followers-starter');
    expect(createdOrder.offerId).toBeNull();
    expect(createdOrder.platform).toBe('tiktok');
    expect(createdOrder.service).toBe('followers');
    expect(createdOrder.quantity).toBe(2000); // 2000 in CLOUTFLOW_CATALOG_PACKAGES for TikTok Followers Starter

    // Verify Target Preserved from CFCTX
    expect(createdOrder.socialUsername).toBe('tiktok_real_target');
    expect(createdOrder.profileUrl).toBe('https://www.tiktok.com/@tiktok_real_target');
    expect(createdOrder.fulfillmentStatus).toBe('NOT_DISPATCHED');
    expect(createdOrder.paymentStatus).toBe('PAID');

    // Verify Context marked consumed
    expect(mockUpdatedContexts).toHaveLength(1);
  });

  it('2. Webhook resolves canonical offer WITH physical override (Instagram Followers Starter)', async () => {
    activeCheckoutContext = {
      id: 'ctx_row_ig',
      contextId: 'CFCTX_ig_followers_456',
      platform: 'instagram',
      service: 'followers',
      targetType: 'profile',
      socialUsername: 'ig_real_target',
      profileUrl: 'https://www.instagram.com/ig_real_target',
      targetUrl: null,
      canonicalOfferId: 'canonical-instagram-followers-starter',
      offerId: '2e9b6558-eb6d-4767-b6fc-77c245778653',
      perfectpayProductId: 'PPPBF6TP',
      perfectpayPlanId: 'PPLQQQ3F7',
      customerEmail: 'ig_buyer@test.com',
      expiresAt: new Date(Date.now() + 3600000),
    };

    const webhookPayload = {
      token: 'test_token_8c',
      sale_status_enum: 2, // 2 = approved
      product_id: 'PPPBF6TP',
      plan_id: 'PPLQQQ3F7',
      sale_amount: 4.90,
      src: 'CFCTX_ig_followers_456',
      sale_id: 'PP_TEST_ORD_002',
      transaction_id: 'PP_TEST_TX_002',
      customer: {
        email: 'ig_buyer@test.com',
        full_name: 'IG Buyer',
      },
    };

    const result = await processPerfectPayWebhook(webhookPayload);
    expect(result.success).toBe(true);
    expect(result.action).toBe('ORDER_CREATED');

    expect(mockInsertedOrders).toHaveLength(1);
    const createdOrder = mockInsertedOrders[0];

    expect(createdOrder.canonicalOfferId).toBe('canonical-instagram-followers-starter');
    expect(createdOrder.offerId).toBe('2e9b6558-eb6d-4767-b6fc-77c245778653');
    expect(createdOrder.socialUsername).toBe('ig_real_target');
  });

  it('3. Anti-Mismatch Protection: CFCTX with mismatching plan code rejects association without silent corruption', async () => {
    // Context is for TikTok Views
    activeCheckoutContext = {
      id: 'ctx_row_mismatch',
      contextId: 'CFCTX_tiktok_views_789',
      platform: 'tiktok',
      service: 'views',
      targetType: 'video',
      socialUsername: null,
      profileUrl: null,
      targetUrl: 'https://www.tiktok.com/@user/video/1111',
      canonicalOfferId: 'canonical-tiktok-views-starter',
      offerId: null,
      perfectpayProductId: 'PPPBF6TP',
      perfectpayPlanId: 'PPLQQQD0U', // Views starter plan code
      expiresAt: new Date(Date.now() + 3600000),
    };

    // Webhook arrives with TikTok Followers plan code
    const webhookPayload = {
      token: 'test_token_8c',
      sale_status_enum: 2, // 2 = approved
      product_id: 'PPPBF6TP',
      plan_id: 'PPLQQQD0I', // Followers starter plan code != PPLQQQD0U
      sale_amount: 4.90,
      src: 'CFCTX_tiktok_views_789',
      sale_id: 'PP_TEST_ORD_003',
      transaction_id: 'PP_TEST_TX_003',
      customer: { email: 'buyer@test.com' },
    };

    const result = await processPerfectPayWebhook(webhookPayload);
    expect(result.success).toBe(true);

    // Mismatched context target must NOT be silently associated
    const createdOrder = mockInsertedOrders[0];
    expect(createdOrder.socialUsername).toBeNull();
    expect(createdOrder.targetUrl).toBeNull();
    // Context was NOT consumed
    expect(mockUpdatedContexts).toHaveLength(0);
  });

  it('4. Safe Historical Backfill Resolver protects old evidence order', () => {
    const evidenceOrder = {
      id: '219a37e9-83de-4a0c-b8cc-9c4ef1453311',
      platform: 'instagram',
      service: 'followers',
      perfectpayProductId: 'PPPBF6TP',
      perfectpayPlanId: 'PPLQQQ3F7',
    };

    const backfillResult = resolveSafeHistoricalBackfill(evidenceOrder);
    expect(backfillResult.canBackfill).toBe(false);
    expect(backfillResult.canonicalOfferId).toBeNull();
    expect(backfillResult.reason).toContain('Protected evidence order');
  });

  it('5. Safe Historical Backfill Resolver resolves unequivocal non-evidence record', () => {
    const regularOrder = {
      id: 'regular_order_1',
      perfectpayProductId: 'PPPBF6TP',
      perfectpayPlanId: 'PPLQQQD0I', // TikTok Followers Starter
    };

    const backfillResult = resolveSafeHistoricalBackfill(regularOrder);
    expect(backfillResult.canBackfill).toBe(true);
    expect(backfillResult.canonicalOfferId).toBe('canonical-tiktok-followers-starter');
  });
});
