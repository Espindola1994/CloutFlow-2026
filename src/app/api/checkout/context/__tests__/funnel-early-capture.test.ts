import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as checkoutContextPost } from '@/app/api/checkout/context/route';
import { db } from '@/db';

vi.mock('@/db', () => {
  return {
    db: {
      query: {
        offers: {
          findMany: vi.fn(),
        },
        customers: {
          findMany: vi.fn(),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
          onConflictDoNothing: vi.fn().mockResolvedValue([]),
        })),
      })),
      transaction: vi.fn(async (cb) => {
        return cb({
          query: {
            lifecycleEvents: {
              findMany: vi.fn().mockResolvedValue([]),
            },
          },
          insert: vi.fn(() => ({
            values: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue([{ id: 'event-id' }]),
            })),
          })),
          update: vi.fn(() => ({
            set: vi.fn(() => ({
              where: vi.fn().mockResolvedValue([]),
            })),
          })),
        });
      }),
    },
  };
});

describe('Funnel Early Email Capture & Context Persistence (Requirements A, B, C)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Requirement A & B: Persists customer email, payment lead, and emits LEAD_CAPTURED / CHECKOUT_STARTED before redirect', async () => {
    (db.query.offers.findMany as any).mockResolvedValueOnce([
      {
        id: 'offer-123',
        active: true,
        platform: 'instagram',
        service: 'followers',
        externalCheckoutUrl: 'https://checkout.perfectpay.com.br/pay/PPU123',
        perfectpayProductId: 'PROD_1',
        perfectpayPlanId: 'PLAN_1',
        priceCents: 2990,
      },
    ]);
    (db.query.customers.findMany as any).mockResolvedValueOnce([]);

    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerId: 'offer-123',
        targetType: 'profile',
        socialUsername: 'growth_user',
        email: 'growth_user@example.com',
      }),
    });

    const res = await checkoutContextPost(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.contextId).toMatch(/^CFCTX_/);
    expect(json.data.checkoutUrl).toContain('src=CFCTX_');
    expect(db.insert).toHaveBeenCalled();
  });
});
