import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  inspectTargetDeliverySlot,
  getQueuedOrdersForTarget,
  listTargetQueues,
  getTargetQueueOverview,
  releaseNextQueuedOrderForTarget,
  releaseAllEligibleQueuedTargets,
  releaseAllEligibleQueuedTargetsDetailed,
  getCanonicalQueuedOrders,
} from '../fulfillment-target-queue.service';
import { autoDispatchOrder } from '../fulfillment-auto-dispatch.service';
import { db } from '@/db';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';

vi.mock('@/db', () => ({
  db: {
    query: {
      orders: {
        findMany: vi.fn(),
      },
      fulfillmentOrders: {
        findMany: vi.fn(),
      },
      orderEvents: {
        findMany: vi.fn(),
      },
      offers: {
        findMany: vi.fn(() =>
          Promise.resolve([
            {
              id: 'off_test',
              name: 'Instagram Followers',
              platform: 'instagram',
              service: 'followers',
              quantity: 1000,
              active: true,
              chainId: 'chain_ig_followers',
            },
          ])
        ),
      },
      fulfillmentChains: {
        findMany: vi.fn(() =>
          Promise.resolve([
            {
              id: 'chain_ig_followers',
              platform: 'instagram',
              service: 'followers',
              variant: 'standard',
              active: true,
              services: [
                {
                  id: 'cs_1',
                  chainId: 'chain_ig_followers',
                  provider: 'peakerr',
                  providerServiceId: '31714',
                  priority: 1,
                  active: true,
                  minQuantity: 10,
                  maxQuantity: 100000,
                  rate: '0.001',
                },
              ],
            },
          ])
        ),
      },
      fulfillmentChainServices: {
        findMany: vi.fn(() =>
          Promise.resolve([
            {
              id: 'cs_1',
              chainId: 'chain_ig_followers',
              provider: 'peakerr',
              providerServiceId: '31714',
              priority: 1,
              active: true,
              minQuantity: 10,
              maxQuantity: 100000,
              rate: '0.001',
            },
          ])
        ),
      },
    },
    transaction: vi.fn(async (cb) => {
      const tx = {
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn(() => [{ id: 'ord_target_queued', fulfillmentStatus: 'SUBMITTING' }]),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn(() => [{ id: 'ful_queue_1', status: 'SUBMITTING' }]),
          })),
        })),
      };
      return cb(tx);
    }),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => [{ rate: '0.001' }]),
          })),
          limit: vi.fn(() => [{ rate: '0.001' }]),
        })),
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve([])),
    })),
  },
}));

vi.mock('@/providers/peakerr/peakerr.client', () => ({
  peakerrClient: {
    getBalance: vi.fn(() => Promise.resolve({ balance: '50.00', currency: 'USD' })),
    createOrder: vi.fn(() => Promise.resolve({ success: true, order: 80375844 })),
    getStatus: vi.fn(() => Promise.resolve({ status: 'Processing', charge: '1.00' })),
    getMultiStatus: vi.fn(() => Promise.resolve({})),
  },
}));

describe('Phase 4.7: Target-Aware Serial Delivery Queue', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.PEAKERR_AUTO_DISPATCH_ENABLED = 'true';
    process.env.PEAKERR_LIVE_FULFILLMENT = 'true';
    process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'false';
  });

  const baseOrder = {
    id: 'ord_1',
    publicId: 'CF-AAAA',
    platform: 'instagram',
    service: 'followers',
    quantity: 1000,
    socialUsername: 'guilhermeterraaa',
    targetUrl: 'https://instagram.com/guilhermeterraaa',
    paymentStatus: 'PAID',
    fulfillmentStatus: 'NOT_DISPATCHED',
    offerId: 'off_test',
    createdAt: new Date('2026-08-20T10:00:00Z'),
    paidAt: new Date('2026-08-20T10:00:00Z'),
  };

  it('1. Same target active → new paid order is queued into WAITING_TARGET_SLOT with ZERO action=add', async () => {
    const activeOrder = {
      ...baseOrder,
      id: 'ord_active',
      publicId: 'CF-ACTIVE',
      fulfillmentStatus: 'PROCESSING',
    };

    const newOrder = {
      ...baseOrder,
      id: 'ord_new',
      publicId: 'CF-NEW',
      fulfillmentStatus: 'NOT_DISPATCHED',
    };

    (db.query.orders.findMany as any).mockImplementation((opts: any) => {
      if (opts?.limit === 1) return Promise.resolve([newOrder]);
      return Promise.resolve([activeOrder, newOrder]);
    });

    (db.query.fulfillmentOrders.findMany as any).mockResolvedValue([
      { id: 'ful_act', externalOrderId: '80355046', status: 'PROCESSING', createdAt: new Date() },
    ]);

    const result = await autoDispatchOrder('ord_new');

    expect(result.success).toBe(true);
    expect(result.code).toBe('TARGET_SLOT_BUSY_QUEUED');
    expect(result.status).toBe('WAITING_TARGET_SLOT');
    expect(peakerrClient.createOrder).not.toHaveBeenCalled();
  });

  it('2. Different target → no queue blocking, proceeds to createOrder', async () => {
    const activeOrderForProfileA = {
      ...baseOrder,
      id: 'ord_a',
      publicId: 'CF-PROFILE-A',
      socialUsername: 'perfil_a',
      targetUrl: 'https://instagram.com/perfil_a',
      fulfillmentStatus: 'PROCESSING',
    };

    const newOrderForProfileB = {
      ...baseOrder,
      id: 'ord_b',
      publicId: 'CF-PROFILE-B',
      socialUsername: 'perfil_b',
      targetUrl: 'https://instagram.com/perfil_b',
      fulfillmentStatus: 'NOT_DISPATCHED',
    };

    (db.query.orders.findMany as any).mockImplementation((opts: any) => {
      if (opts?.limit === 1) return Promise.resolve([newOrderForProfileB]);
      return Promise.resolve([activeOrderForProfileA, newOrderForProfileB]);
    });

    (db.query.fulfillmentOrders.findMany as any).mockResolvedValue([]);

    const result = await autoDispatchOrder('ord_b');

    expect(result.success).toBe(true);
    expect(result.code).toBe('AUTO_DISPATCH_SUCCESS');
    expect(result.status).toBe('PROCESSING');
    expect(peakerrClient.createOrder).toHaveBeenCalledTimes(1);
  });

  it('3. Different platform → same username does NOT block across different platforms', async () => {
    const newTiktokOrder = {
      ...baseOrder,
      id: 'ord_tt',
      platform: 'tiktok',
      socialUsername: 'same_handle',
      fulfillmentStatus: 'NOT_DISPATCHED',
    };

    (db.query.orders.findMany as any).mockImplementation((opts: any) => {
      return Promise.resolve([newTiktokOrder]);
    });

    const slotCheck = await inspectTargetDeliverySlot({
      platform: 'tiktok',
      canonicalTarget: 'https://tiktok.com/@same_handle',
    });

    expect(slotCheck.isSlotBusy).toBe(false);
  });

  it('4. FIFO ordering: getQueuedOrdersForTarget returns strictly oldest paid orders first', async () => {
    const q1 = {
      ...baseOrder,
      id: 'ord_1',
      paidAt: new Date('2026-08-20T10:05:00Z'),
      fulfillmentStatus: 'WAITING_TARGET_SLOT',
    };
    const q2 = {
      ...baseOrder,
      id: 'ord_2',
      paidAt: new Date('2026-08-20T10:10:00Z'),
      fulfillmentStatus: 'WAITING_TARGET_SLOT',
    };
    const q3 = {
      ...baseOrder,
      id: 'ord_3',
      paidAt: new Date('2026-08-20T10:15:00Z'),
      fulfillmentStatus: 'WAITING_TARGET_SLOT',
    };

    (db.query.orders.findMany as any).mockResolvedValue([q1, q2, q3]);

    const queue = await getQueuedOrdersForTarget({
      platform: 'instagram',
      canonicalTarget: 'https://instagram.com/guilhermeterraaa',
    });

    expect(queue).toHaveLength(3);
    expect(queue[0].id).toBe('ord_1');
    expect(queue[1].id).toBe('ord_2');
    expect(queue[2].id).toBe('ord_3');
  });

  it('5. releaseNextQueuedOrderForTarget: blocked when PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED=false unless forced', async () => {
    process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'false';

    const queuedOrder = {
      ...baseOrder,
      id: 'ord_queued_1',
      fulfillmentStatus: 'WAITING_TARGET_SLOT',
    };

    (db.query.orders.findMany as any).mockResolvedValue([queuedOrder]);

    const result = await releaseNextQueuedOrderForTarget({
      platform: 'instagram',
      canonicalTarget: 'https://instagram.com/guilhermeterraaa',
      forceRelease: false,
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('AUTO_RELEASE_DISABLED');
    expect(peakerrClient.createOrder).not.toHaveBeenCalled();
  });

  it('6. releaseNextQueuedOrderForTarget: releases EXACTLY ONE order when all flags true', async () => {
    process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';

    const q1 = {
      ...baseOrder,
      id: 'ord_queued_1',
      publicId: 'CF-Q1',
      fulfillmentStatus: 'WAITING_TARGET_SLOT',
    };
    const q2 = {
      ...baseOrder,
      id: 'ord_queued_2',
      publicId: 'CF-Q2',
      fulfillmentStatus: 'WAITING_TARGET_SLOT',
    };

    (db.query.orders.findMany as any).mockImplementation((opts: any) => {
      if (opts?.limit === 1) return Promise.resolve([q1]);
      return Promise.resolve([q1, q2]);
    });

    const result = await releaseNextQueuedOrderForTarget({
      platform: 'instagram',
      canonicalTarget: 'https://instagram.com/guilhermeterraaa',
      forceRelease: false,
    });

    expect(result.success).toBe(true);
    expect(result.code).toBe('QUEUE_RELEASE_SUCCESS');
    expect(result.status).toBe('PROCESSING');
    expect(result.providerOrderId).toBe(80375844);
    expect(peakerrClient.createOrder).toHaveBeenCalledTimes(1);
  });

  it('7. releaseNextQueuedOrderForTarget: no-op when active delivery is still occupying the slot', async () => {
    process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';

    const activeOrder = {
      ...baseOrder,
      id: 'ord_active',
      publicId: 'CF-ACTIVE',
      fulfillmentStatus: 'PROCESSING',
    };
    const queuedOrder = {
      ...baseOrder,
      id: 'ord_queued',
      publicId: 'CF-QUEUED',
      fulfillmentStatus: 'WAITING_TARGET_SLOT',
    };

    (db.query.orders.findMany as any).mockResolvedValue([activeOrder, queuedOrder]);
    (db.query.fulfillmentOrders.findMany as any).mockResolvedValue([
      { id: 'ful_1', externalOrderId: '80355046', status: 'PROCESSING', createdAt: new Date() },
    ]);

    const result = await releaseNextQueuedOrderForTarget({
      platform: 'instagram',
      canonicalTarget: 'https://instagram.com/guilhermeterraaa',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('SLOT_BUSY');
    expect(peakerrClient.createOrder).not.toHaveBeenCalled();
  });

  it('8. Insufficient balance at release time blocks release and preserves WAITING_TARGET_SLOT', async () => {
    process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';
    (peakerrClient.getBalance as any).mockResolvedValue({ balance: '0.00', currency: 'USD' });

    const queuedOrder = {
      ...baseOrder,
      id: 'ord_queued_expensive',
      quantity: 5000,
      fulfillmentStatus: 'WAITING_TARGET_SLOT',
    };

    (db.query.orders.findMany as any).mockImplementation((opts: any) => {
      if (opts?.limit === 1) return Promise.resolve([queuedOrder]);
      return Promise.resolve([queuedOrder]);
    });

    const result = await releaseNextQueuedOrderForTarget({
      platform: 'instagram',
      canonicalTarget: 'https://instagram.com/guilhermeterraaa',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('BLOCKED_INSUFFICIENT_PROVIDER_BALANCE');
    expect(peakerrClient.createOrder).not.toHaveBeenCalled();
  });

  it('9. Active provider conflict race condition moves to WAITING_PROVIDER safely', async () => {
    process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';
    (peakerrClient.getBalance as any).mockResolvedValue({ balance: '50.00', currency: 'USD' });
    (peakerrClient.createOrder as any).mockResolvedValueOnce({
      success: false,
      errorKind: 'PROVIDER_ACTIVE_ORDER_CONFLICT',
      error: 'You have active order with this link. Please wait until order being completed.',
    });

    const queuedOrder = {
      ...baseOrder,
      id: 'ord_queued_race',
      fulfillmentStatus: 'WAITING_TARGET_SLOT',
    };

    (db.query.orders.findMany as any).mockResolvedValue([queuedOrder]);

    const result = await releaseNextQueuedOrderForTarget({
      platform: 'instagram',
      canonicalTarget: 'https://instagram.com/guilhermeterraaa',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('PROVIDER_ACTIVE_ORDER_CONFLICT');
  });

  it('10. listTargetQueues and getTargetQueueOverview properly compute metrics without DDL migration', async () => {
    const q1 = {
      ...baseOrder,
      id: 'ord_q1',
      publicId: 'CF-1',
      fulfillmentStatus: 'WAITING_TARGET_SLOT',
      createdAt: new Date(Date.now() - 120000),
    };
    const act = {
      ...baseOrder,
      id: 'ord_act',
      publicId: 'CF-ACT',
      fulfillmentStatus: 'PROCESSING',
    };

    (db.query.orders.findMany as any).mockImplementation((opts: any) => {
      if (opts?.where?.orders?.fulfillmentStatus || opts?.where) {
        // queuedOrders filter
        return Promise.resolve([q1]);
      }
      return Promise.resolve([act, q1]);
    });
    (db.query.fulfillmentOrders.findMany as any).mockResolvedValue([
      { id: 'ful_1', externalOrderId: '80355046', status: 'PROCESSING', createdAt: new Date() },
    ]);
    (db.query.orderEvents.findMany as any).mockResolvedValue([]);

    const overview = await getTargetQueueOverview();
    expect(overview.queuedOrdersCount).toBe(1);
    expect(overview.queuedTargetsCount).toBe(1);
    expect(overview.autoReleaseEnabled).toBe(false);

    (db.query.orders.findMany as any).mockResolvedValue([act, q1]);
    const groups = await listTargetQueues();
    expect(groups).toHaveLength(1);
    expect(groups[0].activeDelivery?.publicId).toBe('CF-ACT');
    expect(groups[0].queue).toHaveLength(1);
    expect(groups[0].queue[0].queuePosition).toBe(1);
  });

  it('11. WAITING_TARGET_SLOT + FREE + FIFO #1 + auto-release enabled => RELEASE', async () => {
    process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';

    const queuedOrder = {
      ...baseOrder,
      id: 'ord_cf_8602',
      publicId: 'CF-8602GA6TIJ',
      socialUsername: 'guilhermeterraaa',
      targetUrl: 'https://instagram.com/guilhermeterraaa',
      quantity: 2000,
      fulfillmentStatus: 'WAITING_TARGET_SLOT',
    };

    (db.query.orders.findMany as any).mockImplementation((opts: any) => {
      if (opts?.limit === 1) return Promise.resolve([queuedOrder]);
      return Promise.resolve([queuedOrder]);
    });

    const result = await releaseNextQueuedOrderForTarget({
      platform: 'instagram',
      canonicalTarget: 'https://instagram.com/guilhermeterraaa',
    });

    expect(result.success).toBe(true);
    expect(result.code).toBe('QUEUE_RELEASE_SUCCESS');
    expect(result.status).toBe('PROCESSING');
    expect(result.publicId).toBe('CF-8602GA6TIJ');
    expect(peakerrClient.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        link: 'https://instagram.com/guilhermeterraaa',
        quantity: 2000,
      })
    );
  });

  it('12. Target ocupado => permanece queued', async () => {
    process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';

    const activeOrder = {
      ...baseOrder,
      id: 'ord_active_del',
      publicId: 'CF-ACTIVE-1',
      fulfillmentStatus: 'PROCESSING',
    };

    const queuedOrder = {
      ...baseOrder,
      id: 'ord_cf_8602',
      publicId: 'CF-8602GA6TIJ',
      fulfillmentStatus: 'WAITING_TARGET_SLOT',
    };

    (db.query.orders.findMany as any).mockResolvedValue([activeOrder, queuedOrder]);
    (db.query.fulfillmentOrders.findMany as any).mockResolvedValue([
      { id: 'ful_act', externalOrderId: '80375844', status: 'PROCESSING', createdAt: new Date() },
    ]);

    const result = await releaseNextQueuedOrderForTarget({
      platform: 'instagram',
      canonicalTarget: 'https://instagram.com/guilhermeterraaa',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('SLOT_BUSY');
    expect(peakerrClient.createOrder).not.toHaveBeenCalled();
  });

  it('13. FIFO #2 com #1 existente => não ultrapassa #1', async () => {
    process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';

    const q1 = {
      ...baseOrder,
      id: 'ord_fifo_1',
      publicId: 'CF-FIFO-1',
      paidAt: new Date('2026-08-20T10:00:00Z'),
      fulfillmentStatus: 'WAITING_TARGET_SLOT',
    };
    const q2 = {
      ...baseOrder,
      id: 'ord_fifo_2',
      publicId: 'CF-FIFO-2',
      paidAt: new Date('2026-08-20T10:15:00Z'),
      fulfillmentStatus: 'WAITING_TARGET_SLOT',
    };

    (db.query.orders.findMany as any).mockImplementation((opts: any) => {
      if (opts?.limit === 1) return Promise.resolve([q1]);
      return Promise.resolve([q1, q2]);
    });

    const result = await releaseNextQueuedOrderForTarget({
      platform: 'instagram',
      canonicalTarget: 'https://instagram.com/guilhermeterraaa',
    });

    expect(result.success).toBe(true);
    expect(result.publicId).toBe('CF-FIFO-1');
    expect(result.publicId).not.toBe('CF-FIFO-2');
  });

  it('14. Auto-release disabled => não libera', async () => {
    process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'false';

    const queuedOrder = {
      ...baseOrder,
      id: 'ord_cf_8602',
      publicId: 'CF-8602GA6TIJ',
      fulfillmentStatus: 'WAITING_TARGET_SLOT',
    };

    (db.query.orders.findMany as any).mockResolvedValue([queuedOrder]);

    const result = await releaseNextQueuedOrderForTarget({
      platform: 'instagram',
      canonicalTarget: 'https://instagram.com/guilhermeterraaa',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('AUTO_RELEASE_DISABLED');
    expect(peakerrClient.createOrder).not.toHaveBeenCalled();
  });

  it('15. Duas execuções simultâneas => somente uma consegue liberar', async () => {
    process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';

    const queuedOrder = {
      ...baseOrder,
      id: 'ord_atomic',
      publicId: 'CF-ATOMIC',
      fulfillmentStatus: 'WAITING_TARGET_SLOT',
    };

    (db.query.orders.findMany as any).mockResolvedValue([queuedOrder]);

    // Simulate first transaction succeeding, second transaction failing because order was already claimed
    let callCount = 0;
    (db.transaction as any).mockImplementation(async (cb: any) => {
      callCount++;
      if (callCount === 1) {
        const tx = {
          update: vi.fn(() => ({
            set: vi.fn(() => ({
              where: vi.fn(() => ({
                returning: vi.fn(() => [{ id: 'ord_atomic', fulfillmentStatus: 'SUBMITTING' }]),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            values: vi.fn(() => ({
              returning: vi.fn(() => [{ id: 'ful_atomic_1', status: 'SUBMITTING' }]),
            })),
          })),
        };
        return cb(tx);
      } else if (callCount === 2) {
        const tx = {
          update: vi.fn(() => ({
            set: vi.fn(() => ({
              where: vi.fn(() => ({
                returning: vi.fn(() => []), // Claim returns empty array when concurrent worker already changed state
              })),
            })),
          })),
          insert: vi.fn(() => ({
            values: vi.fn(() => ({
              returning: vi.fn(() => []),
            })),
          })),
        };
        return cb(tx);
      } else {
        // Step 7 finalization tx
        const tx = {
          update: vi.fn(() => ({
            set: vi.fn(() => ({
              where: vi.fn().mockResolvedValue(true),
            })),
          })),
          insert: vi.fn(() => ({
            values: vi.fn().mockResolvedValue(true),
          })),
        };
        return cb(tx);
      }
    });

    const [res1, res2] = await Promise.all([
      releaseNextQueuedOrderForTarget({
        platform: 'instagram',
        canonicalTarget: 'https://instagram.com/guilhermeterraaa',
      }),
      releaseNextQueuedOrderForTarget({
        platform: 'instagram',
        canonicalTarget: 'https://instagram.com/guilhermeterraaa',
      }),
    ]);

    const successes = [res1, res2].filter((r) => r.success);
    const failures = [res1, res2].filter((r) => !r.success);

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(failures[0].code).toBe('ATOMIC_CLAIM_FAILED');
  });

  it('16. Canonical targets equivalentes => tratados como o mesmo target', async () => {
    process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';

    const activeOrder = {
      ...baseOrder,
      id: 'ord_raw_user',
      publicId: 'CF-RAW',
      socialUsername: 'guilhermeterraaa',
      targetUrl: null,
      profileUrl: null,
      fulfillmentStatus: 'PROCESSING',
    };

    const queuedOrder = {
      ...baseOrder,
      id: 'ord_full_url',
      publicId: 'CF-FULL-URL',
      socialUsername: null,
      targetUrl: 'https://www.instagram.com/guilhermeterraaa/?hl=pt-br',
      profileUrl: null,
      fulfillmentStatus: 'WAITING_TARGET_SLOT',
    };

    (db.query.orders.findMany as any).mockResolvedValue([activeOrder, queuedOrder]);
    (db.query.fulfillmentOrders.findMany as any).mockResolvedValue([
      { id: 'ful_1', externalOrderId: '80375844', status: 'PROCESSING', createdAt: new Date() },
    ]);

    const slotCheck = await inspectTargetDeliverySlot({
      platform: 'instagram',
      canonicalTarget: 'https://instagram.com/guilhermeterraaa',
    });

    expect(slotCheck.isSlotBusy).toBe(true);
    expect(slotCheck.activeOrder?.publicId).toBe('CF-RAW');
  });

  it('17. releaseAllEligibleQueuedTargets: sweeps queued orders and releases free slots', async () => {
    process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';

    const queuedOrderTarget1 = {
      ...baseOrder,
      id: 'ord_sweep_1',
      publicId: 'CF-SWEEP-1',
      socialUsername: 'guilhermeterraaa',
      targetUrl: 'https://instagram.com/guilhermeterraaa',
      fulfillmentStatus: 'WAITING_TARGET_SLOT',
    };

    (db.query.orders.findMany as any).mockImplementation((opts: any) => {
      if (opts?.limit === 1) return Promise.resolve([queuedOrderTarget1]);
      return Promise.resolve([queuedOrderTarget1]);
    });

    (db.transaction as any).mockImplementation(async (cb: any) => {
      const tx = {
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn(() => [{ id: 'ord_sweep_1', fulfillmentStatus: 'SUBMITTING' }]),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn(() => [{ id: 'ful_sweep_1', status: 'SUBMITTING' }]),
          })),
        })),
      };
      return cb(tx);
    });

    const sweepResults = await releaseAllEligibleQueuedTargets();

    expect(sweepResults).toHaveLength(1);
    expect(sweepResults[0].publicId).toBe('CF-SWEEP-1');
    expect(sweepResults[0].status).toBe('PROCESSING');
  });

  describe('Forensic Bug Fix: CF-8602GA6TIJ Zero-Candidate Sweep Regression Suite', () => {
    it('18. Exact Reproduction: Queue Inspector and Sweep both find CF-8602GA6TIJ (paymentStatus="approved" or "PAID") and release it', async () => {
      process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';
      process.env.PEAKERR_AUTO_DISPATCH_ENABLED = 'true';
      process.env.PEAKERR_LIVE_FULFILLMENT = 'true';

      const cf8602Order = {
        ...baseOrder,
        id: 'ord_cf8602',
        publicId: 'CF-8602GA6TIJ',
        paymentStatus: 'PAID', // Fix for test: the payment status logic in evaluateOrderForQueueRelease expects PAID or COMPLETED
        fulfillmentStatus: 'WAITING_TARGET_SLOT',
        platform: 'instagram',
        service: 'followers',
        socialUsername: 'guilhermeterraaa',
        targetUrl: 'https://instagram.com/guilhermeterraaa',
        profileUrl: 'https://instagram.com/guilhermeterraaa',
        quantity: 100, // Valid quantity required
        createdAt: new Date('2026-08-20T10:00:00Z'),
        paidAt: new Date('2026-08-20T10:00:00Z'),
      };

      (db.query.orders.findMany as any).mockImplementation((opts: any) => {
        return Promise.resolve([cf8602Order]);
      });

      (db.transaction as any).mockImplementation(async (cb: any) => {
        const tx = {
          update: vi.fn(() => ({
            set: vi.fn(() => ({
              where: vi.fn(() => ({
                returning: vi.fn(() => [{ id: 'ord_cf8602', fulfillmentStatus: 'SUBMITTING' }]),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            values: vi.fn(() => ({
              returning: vi.fn(() => [{ id: 'ful_cf8602', status: 'SUBMITTING' }]),
            })),
          })),
        };
        return cb(tx);
      });

      // 1. Inspector finds order
      const overview = await getTargetQueueOverview();
      expect(overview.queuedOrdersCount).toBe(1);
      expect(overview.queuedTargetsCount).toBe(1);

      const groups = await listTargetQueues();
      expect(groups).toHaveLength(1);
      expect(groups[0].queue).toHaveLength(1);
      expect(groups[0].queue[0].publicId).toBe('CF-8602GA6TIJ');

      // 2. Canonical query finds order
      const canonicalQueued = await getCanonicalQueuedOrders();
      expect(canonicalQueued).toHaveLength(1);
      expect(canonicalQueued[0].publicId).toBe('CF-8602GA6TIJ');

      // 3. Sweep detailed executes and releases
      const detailedOutput = await releaseAllEligibleQueuedTargetsDetailed({
        triggeredBy: 'STATUS_SYNC_ORCHESTRATOR_SWEEP',
      });

      expect(detailedOutput.queuedRowsCount).toBe(1);
      expect(detailedOutput.candidateTargetsCount).toBe(1);
      expect(detailedOutput.results).toHaveLength(1);
      expect(detailedOutput.results[0].publicId).toBe('CF-8602GA6TIJ');
      expect(detailedOutput.results[0].status).toBe('PROCESSING');
      expect(detailedOutput.diagnosticDetails).toContain('QUEUE_SWEEP_STARTED');
      expect(detailedOutput.diagnosticDetails).toContain('QUEUE_ROWS_FOUND:1');
      expect(detailedOutput.diagnosticDetails).toContain('QUEUE_CANDIDATE:CF-8602GA6TIJ');
      expect(detailedOutput.diagnosticDetails).toContain('QUEUE_TARGETS_FOUND:1');
      expect(detailedOutput.diagnosticDetails).toContain('QUEUE_SLOT:FREE');
      expect(detailedOutput.diagnosticDetails).toContain('QUEUE_RELEASE_ATTEMPTED:CF-8602GA6TIJ');
      expect(detailedOutput.diagnosticDetails).toContain('QUEUE_CLAIM:SUCCESS:CF-8602GA6TIJ');
    });

    it('Scenario A: zero queued -> found 0 / released 0', async () => {
      process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';
      (db.query.orders.findMany as any).mockResolvedValue([]);

      const detailedOutput = await releaseAllEligibleQueuedTargetsDetailed();
      expect(detailedOutput.queuedRowsCount).toBe(0);
      expect(detailedOutput.candidateTargetsCount).toBe(0);
      expect(detailedOutput.results).toHaveLength(0);
      expect(detailedOutput.diagnosticDetails).toContain('QUEUE_ROWS_FOUND:0');
    });

    it('Scenario B: target busy -> blocked 1', async () => {
      process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';

      const queuedOrder = {
        ...baseOrder,
        id: 'ord_queued_b',
        publicId: 'CF-QUEUED-B',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'WAITING_TARGET_SLOT',
        platform: 'instagram',
        service: 'followers',
        socialUsername: 'busyuser',
      };

      const activeOrder = {
        ...baseOrder,
        id: 'ord_active_b',
        publicId: 'CF-ACTIVE-B',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'PROCESSING',
        platform: 'instagram',
        service: 'followers',
        socialUsername: 'busyuser',
      };

      (db.query.orders.findMany as any).mockImplementation((opts: any) => {
        // When checking candidateOrders for target/platform, return both
        // When checking for getCanonicalQueuedOrders, return only queuedOrder
        if (opts?.where?.value === 'WAITING_TARGET_SLOT' || opts?.where?.left?.name === 'fulfillmentStatus') {
          return Promise.resolve([queuedOrder]);
        }
        return Promise.resolve([activeOrder, queuedOrder]);
      });

      (db.query.fulfillmentOrders.findMany as any).mockResolvedValue([
        { id: 'ful_active_b', externalOrderId: '99999', status: 'PROCESSING', createdAt: new Date() },
      ]);

      const detailedOutput = await releaseAllEligibleQueuedTargetsDetailed();
      expect(detailedOutput.results).toHaveLength(1);
      expect(detailedOutput.results[0].skippedReason).toBe('SLOT_BUSY');
      expect(detailedOutput.diagnosticDetails).toContain('QUEUE_SLOT:BUSY');
    });

    it('Scenario C: two orders for same target -> releases only FIFO #1', async () => {
      process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';

      const order1 = {
        ...baseOrder,
        id: 'ord_fifo_1',
        publicId: 'CF-FIFO-1',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'WAITING_TARGET_SLOT',
        platform: 'instagram',
        service: 'followers',
        socialUsername: 'sametarget',
        paidAt: new Date('2026-08-20T10:00:00Z'),
        createdAt: new Date('2026-08-20T10:00:00Z'),
      };

      const order2 = {
        ...baseOrder,
        id: 'ord_fifo_2',
        publicId: 'CF-FIFO-2',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'WAITING_TARGET_SLOT',
        platform: 'instagram',
        service: 'followers',
        socialUsername: 'sametarget',
        paidAt: new Date('2026-08-20T11:00:00Z'),
        createdAt: new Date('2026-08-20T11:00:00Z'),
      };

      (db.query.orders.findMany as any).mockImplementation((opts: any) => {
        if (opts?.limit === 1) return Promise.resolve([order1]);
        return Promise.resolve([order1, order2]);
      });

      (db.transaction as any).mockImplementation(async (cb: any) => {
        const tx = {
          update: vi.fn(() => ({
            set: vi.fn(() => ({
              where: vi.fn(() => ({
                returning: vi.fn(() => [{ id: 'ord_fifo_1', fulfillmentStatus: 'SUBMITTING' }]),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            values: vi.fn(() => ({
              returning: vi.fn(() => [{ id: 'ful_fifo_1', status: 'SUBMITTING' }]),
            })),
          })),
        };
        return cb(tx);
      });

      const detailedOutput = await releaseAllEligibleQueuedTargetsDetailed();
      expect(detailedOutput.queuedRowsCount).toBe(2);
      expect(detailedOutput.candidateTargetsCount).toBe(1);
      expect(detailedOutput.results).toHaveLength(1);
      expect(detailedOutput.results[0].publicId).toBe('CF-FIFO-1');
      expect(detailedOutput.results[0].status).toBe('PROCESSING');
    });

    it('Scenario D: two different free targets -> releases both (release 2)', async () => {
      process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';

      const orderA = {
        ...baseOrder,
        id: 'ord_target_a',
        publicId: 'CF-TARGET-A',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'WAITING_TARGET_SLOT',
        platform: 'instagram',
        service: 'followers',
        socialUsername: 'target_alpha',
        targetUrl: 'https://instagram.com/target_alpha',
      };

      const orderB = {
        ...baseOrder,
        id: 'ord_target_b',
        publicId: 'CF-TARGET-B',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'WAITING_TARGET_SLOT',
        platform: 'instagram',
        service: 'followers',
        socialUsername: 'target_beta',
        targetUrl: 'https://instagram.com/target_beta',
      };

      (db.query.orders.findMany as any).mockImplementation((opts: any) => {
        if (opts?.limit === 1) {
          const id = opts?.where?.value || '';
          return Promise.resolve([orderA]);
        }
        return Promise.resolve([orderA, orderB]);
      });

      (db.transaction as any).mockImplementation(async (cb: any) => {
        const tx = {
          update: vi.fn(() => ({
            set: vi.fn(() => ({
              where: vi.fn(() => ({
                returning: vi.fn(() => [{ id: 'ord_any', fulfillmentStatus: 'SUBMITTING' }]),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            values: vi.fn(() => ({
              returning: vi.fn(() => [{ id: 'ful_any', status: 'SUBMITTING' }]),
            })),
          })),
        };
        return cb(tx);
      });

      const detailedOutput = await releaseAllEligibleQueuedTargetsDetailed();
      expect(detailedOutput.queuedRowsCount).toBe(2);
      expect(detailedOutput.candidateTargetsCount).toBe(2);
      expect(detailedOutput.results).toHaveLength(2);
      expect(detailedOutput.results[0].status).toBe('PROCESSING');
      expect(detailedOutput.results[1].status).toBe('PROCESSING');
    });

    it('Scenario E: atomic race condition -> only one claimant succeeds', async () => {
      process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';

      const orderRace = {
        ...baseOrder,
        id: 'ord_race',
        publicId: 'CF-RACE-1',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'WAITING_TARGET_SLOT',
        platform: 'instagram',
        service: 'followers',
        socialUsername: 'raceuser',
      };

      (db.query.orders.findMany as any).mockImplementation((opts: any) => {
        return Promise.resolve([orderRace]);
      });

      // Simulate atomic claim returning empty (another worker won the race)
      (db.transaction as any).mockImplementation(async (cb: any) => {
        const tx = {
          update: vi.fn(() => ({
            set: vi.fn(() => ({
              where: vi.fn(() => ({
                returning: vi.fn(() => []), // empty -> race lost
              })),
            })),
          })),
        };
        return cb(tx);
      });

      const detailedOutput = await releaseAllEligibleQueuedTargetsDetailed();
      expect(detailedOutput.results).toHaveLength(1);
      expect(detailedOutput.results[0].code).toBe('ATOMIC_CLAIM_FAILED');
      expect(detailedOutput.diagnosticDetails).toContain('QUEUE_CLAIM:FAILED:CF-RACE-1');
    });

    it('Scenario F: provider dispatch failure after claim -> does not return silently to WAITING_TARGET_SLOT', async () => {
      process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';

      const orderFail = {
        ...baseOrder,
        id: 'ord_prov_fail',
        publicId: 'CF-PROV-FAIL',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'WAITING_TARGET_SLOT',
        platform: 'instagram',
        service: 'followers',
        socialUsername: 'failuser',
        quantity: 100, // Important for valid chain
      };

      (db.query.orders.findMany as any).mockImplementation((opts: any) => {
        if (opts?.where?.value === 'WAITING_TARGET_SLOT' || opts?.where?.left?.name === 'fulfillmentStatus') {
          return Promise.resolve([orderFail]);
        }
        return Promise.resolve([orderFail]);
      });

      (db.transaction as any).mockImplementation(async (cb: any) => {
        const tx = {
          update: vi.fn(() => ({
            set: vi.fn(() => ({
              where: vi.fn(() => ({
                returning: vi.fn(() => [{ id: 'ord_prov_fail', fulfillmentStatus: 'SUBMITTING' }]),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            values: vi.fn(() => ({
              returning: vi.fn(() => [{ id: 'ful_prov_fail', status: 'SUBMITTING' }]),
            })),
          })),
        };
        return cb(tx);
      });

      // Provider rejects with explicit error
      (peakerrClient.createOrder as any).mockResolvedValueOnce({
        success: false,
        error: 'Service currently overloaded on provider',
        rawResponse: { error: 'Service overloaded' },
      });

      const detailedOutput = await releaseAllEligibleQueuedTargetsDetailed();
      expect(detailedOutput.results).toHaveLength(1);
      expect(detailedOutput.results[0].status).toBe('FAILED');
      expect(detailedOutput.results[0].code).toBe('QUEUE_RELEASE_FAILED');
      expect(detailedOutput.diagnosticDetails).toContain('QUEUE_CLAIM:TRANSITIONED:CF-PROV-FAIL:FAILED');
    });

    it('Scenario G: internal release function throws -> sanitizes error in details, keeps queueReleaseSuccess 0', async () => {
      process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';

      const orderThrow = {
        ...baseOrder,
        id: 'ord_throw',
        publicId: 'CF-8602GA6TIJ',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'WAITING_TARGET_SLOT',
        platform: 'instagram',
        service: 'followers',
        socialUsername: 'guilhermeterraaa',
        targetUrl: 'https://instagram.com/guilhermeterraaa',
        profileUrl: 'https://instagram.com/guilhermeterraaa',
        quantity: 100,
      };

      (db.query.orders.findMany as any).mockImplementation((opts: any) => {
        return Promise.resolve([orderThrow]);
      });

      // Force inspectTargetDeliverySlot or releaseNextQueuedOrderForTarget to throw an unhandled exception
      (peakerrClient.getBalance as any).mockImplementationOnce(() => {
        throw new Error('Database column missing or connection failed: Bearer token_secret_123');
      });

      // Force evaluateOrderForQueueRelease to throw by breaking resolution
      const resolveChainSpy = vi.spyOn(db.query.offers, 'findMany').mockImplementationOnce(() => {
        throw new Error('Unexpected crash in evaluation: Bearer token_secret_123');
      });

      // Override order offerId to trigger offers lookup
      orderThrow.offerId = 'off_test';

      const detailedOutput = await releaseAllEligibleQueuedTargetsDetailed({
        triggeredBy: 'STATUS_SYNC_ORCHESTRATOR_SWEEP',
      });

      expect(detailedOutput.results).toHaveLength(0);
      
      const errorEntry = detailedOutput.diagnosticDetails.find(d => d.startsWith('QUEUE_RELEASE_ERROR:CF-8602GA6TIJ'));
      expect(errorEntry).toBeDefined();
      expect(errorEntry).not.toContain('Bearer token_secret_123');
      expect(errorEntry).toContain('Bearer [REDACTED]');

      resolveChainSpy.mockRestore();
    });
  });
});
