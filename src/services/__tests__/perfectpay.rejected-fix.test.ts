import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processPerfectPayWebhook } from '@/services/perfectpay.service';
import { normalizePerfectPayPayload } from '@/lib/perfectpay/normalize';

const mockDb = {
  webhookEvents: [] as any[],
  orders: [] as any[],
  paymentLeads: [] as any[],
};

vi.mock('@/db', () => ({
  db: {
    transaction: vi.fn().mockImplementation(async (callback) => {
      const tx = {
        query: {
          webhookEvents: { findMany: vi.fn().mockResolvedValue([]) },
          orders: { findMany: vi.fn().mockResolvedValue([]) },
          offers: { findMany: vi.fn().mockResolvedValue([]) },
        },
        insert: vi.fn().mockImplementation((table: any) => ({
          values: vi.fn().mockImplementation((values: any) => {
            const item = { id: `id_${Date.now()}_${Math.random()}`, ...values };
            if (values.publicId) {
              mockDb.orders.push(item);
            } else if (values.provider && values.payload) {
              mockDb.webhookEvents.push(item);
            } else if (values.provider && !values.payload) {
              mockDb.paymentLeads.push(item);
            }
            return {
              returning: vi.fn().mockResolvedValue([item]),
            };
          }),
        })),
        update: vi.fn().mockImplementation(() => ({
          set: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
      };

      return callback(tx);
    }),
  },
}));

describe('PerfectPay Rejected & Raw Status Fix Tests', () => {
  const TEST_TOKEN = 'test_token_rejected_fix';

  beforeEach(() => {
    mockDb.webhookEvents = [];
    mockDb.orders = [];
    mockDb.paymentLeads = [];
    process.env.PERFECTPAY_WEBHOOK_TOKEN = TEST_TOKEN;
    delete process.env.PERFECTPAY_WEBHOOK_VERIFIED;
  });

  it('A) Rejected with bank error detail > 100 chars -> normalizedStatus=rejected, rawStatus="5", errorMessage stored, HTTP 200, LEAD_RECORDED in Observation Mode', async () => {
    const longBankMessage = "Transaction not authorized. Please check the entered data. If the error persists, contact the card's customer service center. ECOM 57";
    expect(longBankMessage.length).toBeGreaterThan(100);

    const payload = {
      token: TEST_TOKEN,
      code: 'PP-REJ-001',
      sale_status_enum: 5,
      sale_status_detail: longBankMessage,
      sale_amount: 14.90,
    };

    const parsed = normalizePerfectPayPayload(payload);
    expect(parsed.normalizedStatus).toBe('rejected');
    expect(parsed.rawStatus).toBe('5');
    expect(parsed.rawStatus?.length).toBeLessThan(100);
    expect(parsed.rawStatusDetail).toBe(longBankMessage);

    const res = await processPerfectPayWebhook(payload);
    expect(res.success).toBe(true);
    expect(res.authenticated).toBe(true);
    expect(res.action).toBe('LEAD_RECORDED');
    expect(res.mode).toBe('OBSERVATION');
    expect(mockDb.webhookEvents.length).toBe(1);
    expect(mockDb.webhookEvents[0].rawStatus).toBe('5');
    expect(mockDb.webhookEvents[0].errorMessage).toBe(longBankMessage);
    expect(mockDb.orders.length).toBe(0);
  });

  it('B) Refund event with sale_status_enum=7 and status="approved" -> rawStatus="7", normalizedStatus="refunded"', () => {
    const payload = {
      token: TEST_TOKEN,
      code: 'PP-REF-002',
      sale_status_enum: 7,
      status: 'approved', // Legacy textual status in payload
      sale_amount: 14.90,
    };

    const parsed = normalizePerfectPayPayload(payload);
    expect(parsed.normalizedStatus).toBe('refunded');
    expect(parsed.rawStatus).toBe('7'); // Does NOT fall back to approved
  });

  it('C) Approved event with sale_status_enum=2 -> rawStatus="2", normalizedStatus="approved"', () => {
    const payload = {
      token: TEST_TOKEN,
      code: 'PP-APP-003',
      sale_status_enum: 2,
      sale_amount: 14.90,
    };

    const parsed = normalizePerfectPayPayload(payload);
    expect(parsed.normalizedStatus).toBe('approved');
    expect(parsed.rawStatus).toBe('2');
  });

  it('D) Pre_checkout with sale_status_enum=12 -> rawStatus="12", normalizedStatus="pre_checkout"', () => {
    const payload = {
      token: TEST_TOKEN,
      code: 'PP-PRE-004',
      sale_status_enum: 12,
      sale_amount: 14.90,
    };

    const parsed = normalizePerfectPayPayload(payload);
    expect(parsed.normalizedStatus).toBe('pre_checkout');
    expect(parsed.rawStatus).toBe('12');
  });

  it('E) Unknown status with long string -> safely truncated to <= 50 chars, normalizedStatus="unknown"', () => {
    const veryLongUnknown = "unknown_status_extremely_long_string_that_exceeds_normal_lengths_and_should_be_truncated_safely";
    const payload = {
      token: TEST_TOKEN,
      status: veryLongUnknown,
    };

    const parsed = normalizePerfectPayPayload(payload);
    expect(parsed.normalizedStatus).toBe('unknown');
    expect(parsed.rawStatus?.length).toBeLessThanOrEqual(50);
  });
});
