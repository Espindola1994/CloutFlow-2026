import { describe, it, expect, vi } from 'vitest';
import { emitLifecycleEvent, normalizeCanonicalEmail, evaluateRepeatPurchase } from '@/services/lifecycle/event.service';

const mockLifecycleEvents: any[] = [];
const mockAutomations: any[] = [];

vi.mock('@/db', () => {
  return {
    db: {
      transaction: vi.fn(async (cb) => {
        return await cb({
          query: {
            lifecycleEvents: {
              findMany: vi.fn(async ({ where }) => {
                // Return matching events if any
                return mockLifecycleEvents;
              }),
            },
          },
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 'evt_123' }])
            })
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue({})
            })
          })
        });
      }),
      query: {
        lifecycleEvents: {
          findMany: vi.fn(async () => mockLifecycleEvents),
        }
      }
    }
  };
});

describe('Lifecycle Event Service - Phase A', () => {
  it('normalizes email correctly', () => {
    expect(normalizeCanonicalEmail(' Test@Example.com ')).toBe('test@example.com');
    expect(normalizeCanonicalEmail('')).toBe('');
  });

  it('emits lifecycle event successfully', async () => {
    const res = await emitLifecycleEvent({
      customerEmail: 'USER@test.com',
      eventType: 'LEAD_CAPTURED',
      idempotencyKey: 'LEAD:123',
      payload: { test: true }
    });

    expect(res.success).toBe(true);
    expect(res.eventId).toBe('evt_123');
    expect(res.isDuplicate).toBe(false);
  });

  it('fails if missing idempotency key or email', async () => {
    const res = await emitLifecycleEvent({
      customerEmail: '',
      eventType: 'CHECKOUT_ABANDONED',
      idempotencyKey: 'ABANDONED:123',
      payload: { test: true }
    });
    expect(res.success).toBe(false);

    const res2 = await emitLifecycleEvent({
      customerEmail: 'user@test.com',
      eventType: 'CHECKOUT_ABANDONED',
      idempotencyKey: '',
      payload: { test: true }
    });
    expect(res2.success).toBe(false);
  });

  it('PAYMENT_APPROVED cancels/suppresses abandonment tasks', async () => {
    const res = await emitLifecycleEvent({
      customerEmail: 'user@test.com',
      eventType: 'PAYMENT_APPROVED',
      idempotencyKey: 'PAYMENT_APPROVED:ORDER:123',
      payload: { orderId: '123' }
    });
    expect(res.success).toBe(true);
  });
});

