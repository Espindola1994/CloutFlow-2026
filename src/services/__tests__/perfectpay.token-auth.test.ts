import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processPerfectPayWebhook } from '@/services/perfectpay.service';

// Mock DB memory state
const mockDb = {
  webhookEvents: [] as any[],
  orders: [] as any[],
  orderItems: [] as any[],
  orderEvents: [] as any[],
  paymentLeads: [] as any[],
  offers: [] as any[],
};

vi.mock('@/db', () => ({
  db: {
    transaction: vi.fn().mockImplementation(async (callback) => {
      const tx = {
        query: {
          webhookEvents: {
            findMany: vi.fn().mockImplementation(() => {
              return Promise.resolve(mockDb.webhookEvents.filter(() => false));
            }),
          },
          orders: {
            findMany: vi.fn().mockImplementation(() => {
              return Promise.resolve(mockDb.orders);
            }),
          },
          offers: {
            findMany: vi.fn().mockResolvedValue([]),
          },
        },
        insert: vi.fn().mockImplementation((table: any) => ({
          values: vi.fn().mockImplementation((values: any) => ({
            returning: vi.fn().mockImplementation(() => {
              const item = { id: `id_${Date.now()}_${Math.random()}`, ...values };
              if (table._?.name === 'webhook_events' || values.provider) {
                const isDupEventId = values.externalEventId && mockDb.webhookEvents.some((e) => e.externalEventId === values.externalEventId);
                const isDupDedup = values.deduplicationKey && mockDb.webhookEvents.some((e) => e.deduplicationKey === values.deduplicationKey);
                if (isDupEventId || isDupDedup) {
                  const error: any = new Error('duplicate key value violates unique constraint');
                  error.code = '23505';
                  throw error;
                }
                mockDb.webhookEvents.push(item);
              }
              if (values.publicId) {
                mockDb.orders.push(item);
              }
              if (values.serviceName) {
                mockDb.orderItems.push(item);
              }
              if (values.orderId && values.description) {
                mockDb.orderEvents.push(item);
              }
              if (values.customerEmail && values.rawStatus && !values.publicId && !values.metadataSafe) {
                mockDb.paymentLeads.push(item);
              }
              return Promise.resolve([item]);
            }),
          })),
        })),
        update: vi.fn().mockImplementation(() => ({
          set: vi.fn().mockImplementation((setVals: any) => ({
            where: vi.fn().mockImplementation(() => {
              if (mockDb.orders.length > 0) {
                Object.assign(mockDb.orders[0], setVals);
              }
              return Promise.resolve();
            }),
          })),
        })),
      };

      return callback(tx);
    }),
  },
}));

describe('PerfectPay Webhook Service - Phase 2.2D Public Token Authentication & Gates', () => {
  const TEST_VALID_TOKEN = 'pp_pub_token_valid_12345';

  beforeEach(() => {
    mockDb.webhookEvents = [];
    mockDb.orders = [];
    mockDb.orderItems = [];
    mockDb.orderEvents = [];
    mockDb.paymentLeads = [];
    process.env.PERFECTPAY_WEBHOOK_TOKEN = TEST_VALID_TOKEN;
    delete process.env.PERFECTPAY_WEBHOOK_VERIFIED;
  });

  it('A) Token correto -> authenticated = true', async () => {
    const payload = {
      token: TEST_VALID_TOKEN,
      event_id: 'evt_auth_001',
      sale_status: 'approved',
      sale_code: 'PP-AUTH-001',
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.authenticated).toBe(true);
    expect(res.action).toBe('OBSERVED_AUTHENTICATED');
  });

  it('B) Token incorreto -> authenticated = false (UNAUTHENTICATED_IGNORED)', async () => {
    const payload = {
      token: 'wrong_invalid_token',
      event_id: 'evt_auth_002',
      sale_status: 'approved',
      sale_code: 'PP-AUTH-002',
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.authenticated).toBe(false);
    expect(res.action).toBe('UNAUTHENTICATED_IGNORED');
    expect(mockDb.webhookEvents[0].processingStatus).toBe('UNAUTHENTICATED');
  });

  it('C) Token ausente -> authenticated = false', async () => {
    const payload = {
      event_id: 'evt_auth_003',
      sale_status: 'approved',
      sale_code: 'PP-AUTH-003',
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.authenticated).toBe(false);
    expect(res.action).toBe('UNAUTHENTICATED_IGNORED');
  });

  it('D) ENV ausente -> authenticated = false', async () => {
    delete process.env.PERFECTPAY_WEBHOOK_TOKEN;

    const payload = {
      token: TEST_VALID_TOKEN,
      event_id: 'evt_auth_004',
      sale_status: 'approved',
      sale_code: 'PP-AUTH-004',
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.authenticated).toBe(false);
    expect(res.action).toBe('UNAUTHENTICATED_IGNORED');
  });

  it('E) Token correto + VERIFIED=false -> NÃO cria Order', async () => {
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'false';

    const payload = {
      token: TEST_VALID_TOKEN,
      event_id: 'evt_obs_001',
      sale_status: 'approved',
      sale_code: 'PP-OBS-001',
      amount_cents: 9900,
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.authenticated).toBe(true);
    expect(res.action).toBe('OBSERVED_AUTHENTICATED');
    expect(mockDb.orders.length).toBe(0);
    expect(mockDb.webhookEvents[0].processingStatus).toBe('OBSERVED_AUTHENTICATED');
  });

  it('F) Token correto + VERIFIED=false -> NÃO cria payment_lead', async () => {
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'false';

    const payload = {
      token: TEST_VALID_TOKEN,
      event_id: 'evt_obs_002',
      sale_status: 'pre_checkout',
      customer: { email: 'lead@test.com' },
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.authenticated).toBe(true);
    expect(res.action).toBe('OBSERVED_AUTHENTICATED');
    expect(mockDb.paymentLeads.length).toBe(0);
  });

  it('G) Aprovado + Token correto + Observation Mode -> Somente observado', async () => {
    const payload = {
      token: TEST_VALID_TOKEN,
      event_id: 'evt_obs_003',
      sale_status: 'aprovado',
      sale_code: 'PP-OBS-003',
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.action).toBe('OBSERVED_AUTHENTICATED');
    expect(mockDb.orders.length).toBe(0);
  });

  it('H) Abandono + Token correto + Observation Mode -> Somente observado', async () => {
    const payload = {
      token: TEST_VALID_TOKEN,
      event_id: 'evt_obs_004',
      sale_status: 'abandono',
      customer: { email: 'abandono@test.com' },
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.action).toBe('OBSERVED_AUTHENTICATED');
    expect(mockDb.paymentLeads.length).toBe(0);
  });

  it('I) Token NÃO aparece em metadata_safe', async () => {
    const payload = {
      token: TEST_VALID_TOKEN,
      public_token: 'secret_token_val',
      event_id: 'evt_safe_001',
      sale_code: 'PP-SAFE-001',
    };

    await processPerfectPayWebhook(payload);
    const event = mockDb.webhookEvents[0];
    expect(event.metadataSafe.token).toBeUndefined();
    expect(event.metadataSafe.public_token).toBeUndefined();
  });

  it('J) Duplicate webhook -> DUPLICATE_IGNORED', async () => {
    const payload = {
      token: TEST_VALID_TOKEN,
      event_id: 'evt_dup_001',
      sale_code: 'PP-DUP-001',
    };

    const first = await processPerfectPayWebhook(payload);
    expect(first.action).toBe('OBSERVED_AUTHENTICATED');

    const second = await processPerfectPayWebhook(payload);
    expect(second.action).toBe('DUPLICATE_IGNORED');
    expect(mockDb.webhookEvents.length).toBe(1);
  });

  it('K) Verified Mode Enabled -> Pipeline financeiro funciona SOMENTE com token válido', async () => {
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'true';

    // 1. Inválido -> Rejeitado
    const badRes = await processPerfectPayWebhook({
      token: 'bad_token',
      event_id: 'evt_vf_001',
      sale_status: 'approved',
      sale_code: 'PP-VF-001',
    });
    expect(badRes.authenticated).toBe(false);
    expect(mockDb.orders.length).toBe(0);

    // 2. Válido -> Processado
    const goodRes = await processPerfectPayWebhook({
      token: TEST_VALID_TOKEN,
      event_id: 'evt_vf_002',
      sale_status: 'approved',
      sale_code: 'PP-VF-002',
      amount_cents: 4900,
    });
    expect(goodRes.authenticated).toBe(true);
    expect(goodRes.action).toBe('ORDER_CREATED');
    expect(mockDb.orders.length).toBe(1);
  });
});
