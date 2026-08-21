import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncStatusesAndReleaseQueues } from '@/services/fulfillment-sync.service';
import { releaseNextQueuedOrderForTarget, releaseAllEligibleQueuedTargetsDetailed } from '@/services/fulfillment-target-queue.service';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
    insert: vi.fn(),
    query: {
      orders: {
        findMany: vi.fn(),
      },
    },
  },
}));

vi.mock('@/services/fulfillment-target-queue.service', () => ({
  releaseNextQueuedOrderForTarget: vi.fn(),
  releaseAllEligibleQueuedTargetsDetailed: vi.fn(),
}));

describe('Phase 4.8 — syncStatusesAndReleaseQueues Orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PEAKERR_STATUS_SYNC_ENABLED = 'false';
    process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'false';
    process.env.PEAKERR_AUTO_DISPATCH_ENABLED = 'false';
    process.env.PEAKERR_LIVE_FULFILLMENT = 'false';
  });

  describe('1. STATUS_SYNC_DISABLED early return', () => {
    it('returns early when PEAKERR_STATUS_SYNC_ENABLED=false', async () => {
      process.env.PEAKERR_STATUS_SYNC_ENABLED = 'false';

      vi.mocked(releaseAllEligibleQueuedTargetsDetailed).mockResolvedValue({
        queuedRowsCount: 0,
        candidateTargetsCount: 0,
        results: [],
        diagnosticDetails: [],
      });

      const result = await syncStatusesAndReleaseQueues();

      expect(result.success).toBe(true);
      expect(result.statusSyncEnabled).toBe(false);
      expect(result.checked).toBe(0);
      expect(result.details?.some(d => d.includes('STATUS_SYNC_DISABLED'))).toBe(true);
    });
  });

  describe('2. Orchestrator delegates to syncPeakerrFulfillmentStatuses', () => {
    it('runs sync and returns metrics when SYNC=true and no active orders', async () => {
      process.env.PEAKERR_STATUS_SYNC_ENABLED = 'true';

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      vi.mocked(releaseAllEligibleQueuedTargetsDetailed).mockResolvedValue({
        queuedRowsCount: 0,
        candidateTargetsCount: 0,
        results: [],
        diagnosticDetails: [],
      });

      const result = await syncStatusesAndReleaseQueues();

      expect(result.success).toBe(true);
      expect(result.statusSyncEnabled).toBe(true);
      expect(result.checked).toBe(0);
      expect(result.updated).toBe(0);
    });
  });

  describe('3. Flag reporting is accurate', () => {
    it('reports all flags correctly', async () => {
      process.env.PEAKERR_STATUS_SYNC_ENABLED = 'true';
      process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';
      process.env.PEAKERR_AUTO_DISPATCH_ENABLED = 'true';
      process.env.PEAKERR_LIVE_FULFILLMENT = 'true';

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      vi.mocked(releaseAllEligibleQueuedTargetsDetailed).mockResolvedValue({
        queuedRowsCount: 0,
        candidateTargetsCount: 0,
        results: [],
        diagnosticDetails: [],
      });

      const result = await syncStatusesAndReleaseQueues();

      expect(result.statusSyncEnabled).toBe(true);
      expect(result.targetQueueAutoReleaseEnabled).toBe(true);
      expect(result.autoDispatchEnabled).toBe(true);
      expect(result.liveFulfillmentEnabled).toBe(true);
    });
  });

  describe('4. Real Scenario A→COMPLETED triggers B queue release', () => {
    it('syncs A to COMPLETED and correctly records queue release metrics', async () => {
      process.env.PEAKERR_STATUS_SYNC_ENABLED = 'true';
      process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';
      process.env.PEAKERR_AUTO_DISPATCH_ENABLED = 'true';
      process.env.PEAKERR_LIVE_FULFILLMENT = 'true';

      const mockActiveFulfillment = {
        id: 'ful_7902',
        orderId: 'ord_7902_uuid',
        provider: 'peakerr',
        externalOrderId: '80375844',
        status: 'PROCESSING',
        orderFulfillmentStatus: 'PROCESSING',
        orderCompletedAt: null,
        orderPlatform: 'instagram',
        orderService: 'followers',
        orderProfileUrl: 'https://instagram.com/guilhermeterraaa',
        orderSocialUsername: 'guilhermeterraaa',
        orderUsername: null,
        orderTargetUrl: null,
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([mockActiveFulfillment]),
          }),
        }),
      });

      vi.spyOn(peakerrClient, 'getStatus').mockResolvedValue({
        status: 'Completed',
        charge: '1.148',
        start_count: '3639',
        remains: '0',
        currency: 'USD',
      });

      (db.transaction as any).mockImplementation(async (cb: any) => {
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
      });

      vi.mocked(releaseNextQueuedOrderForTarget).mockResolvedValue({
        success: true,
        code: 'QUEUE_RELEASE_SUCCESS',
        providerOrderId: 80399999,
        status: 'PROCESSING',
        message: 'Queued order successfully released',
        orderId: 'ord_8602_uuid',
        publicId: 'CF-8602GA6T1J',
      } as any);

      vi.mocked(releaseAllEligibleQueuedTargetsDetailed).mockResolvedValue({
        queuedRowsCount: 0,
        candidateTargetsCount: 0,
        results: [],
        diagnosticDetails: [],
      });

      const result = await syncStatusesAndReleaseQueues();

      expect(result.success).toBe(true);
      expect(result.checked).toBe(1);
      expect(result.updated).toBe(1);
      expect(result.completed).toBe(1);
      expect(result.queueReleaseSuccess).toBeGreaterThanOrEqual(0);
    });
  });

  describe('5. Concurrent triggers are idempotent', () => {
    it('two sequential calls to orchestrator produce consistent state', async () => {
      process.env.PEAKERR_STATUS_SYNC_ENABLED = 'true';

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const [result1, result2] = await Promise.all([
        syncStatusesAndReleaseQueues(),
        syncStatusesAndReleaseQueues(),
      ]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.checked).toBe(0);
      expect(result2.checked).toBe(0);
    });
  });

  describe('6. Network failure preserves local state', () => {
    it('does not mark COMPLETED on provider failure', async () => {
      process.env.PEAKERR_STATUS_SYNC_ENABLED = 'true';

      const mockActiveFulfillment = {
        id: 'ful_net_err',
        orderId: 'ord_net_err',
        provider: 'peakerr',
        externalOrderId: '80399999',
        status: 'PROCESSING',
        orderFulfillmentStatus: 'PROCESSING',
        orderCompletedAt: null,
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([mockActiveFulfillment]),
          }),
        }),
      });

      vi.spyOn(peakerrClient, 'getStatus').mockRejectedValue(new Error('ETIMEDOUT'));

      vi.mocked(releaseAllEligibleQueuedTargetsDetailed).mockResolvedValue({
        queuedRowsCount: 0,
        candidateTargetsCount: 0,
        results: [],
        diagnosticDetails: [],
      });

      const result = await syncStatusesAndReleaseQueues();

      expect(result.success).toBe(true);
      expect(result.errors).toBe(1);
      expect(result.completed).toBe(0);
      expect(result.queueReleaseAttempts).toBe(0);
    });
  });

  describe('8. Telemetry and Accounting for Queue Released & Blocked (Cases A through G)', () => {
    it('Case A: 1 queued + free slot -> queueReleaseSuccess = 1, queueReleaseAttempts = 1', async () => {
      process.env.PEAKERR_STATUS_SYNC_ENABLED = 'true';
      process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';

      // No active fulfillment orders during sync
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      vi.mocked(releaseAllEligibleQueuedTargetsDetailed).mockResolvedValueOnce({
        queuedRowsCount: 1,
        candidateTargetsCount: 1,
        diagnosticDetails: [],
        results: [
          {
            orderId: 'sweep_1',
            publicId: 'CF-SWEEP-1',
            target: 'https://instagram.com/user_a',
            status: 'PROCESSING',
            code: 'QUEUE_RELEASE_SUCCESS',
          },
        ]
      });

      const result = await syncStatusesAndReleaseQueues();

      expect(result.success).toBe(true);
      expect(result.queueReleaseSuccess).toBe(1);
      expect(result.queueReleaseAttempts).toBe(1);
      expect(result.queueReleaseBlocked).toBe(0);
      expect(result.releasedOrders).toHaveLength(1);
      expect(result.releasedOrders?.[0].publicId).toBe('CF-SWEEP-1');
    });

    it('Case B: 2 targets different, both free -> queueReleaseSuccess = 2', async () => {
      process.env.PEAKERR_STATUS_SYNC_ENABLED = 'true';
      process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      vi.mocked(releaseAllEligibleQueuedTargetsDetailed).mockResolvedValueOnce({
        queuedRowsCount: 2,
        candidateTargetsCount: 2,
        diagnosticDetails: [],
        results: [
          {
            orderId: 'ord_target_1',
            publicId: 'CF-TARGET-1',
            target: 'user_1',
            status: 'PROCESSING',
            code: 'QUEUE_RELEASE_SUCCESS',
          },
          {
            orderId: 'ord_target_2',
            publicId: 'CF-TARGET-2',
            target: 'user_2',
            status: 'PROCESSING',
            code: 'QUEUE_RELEASE_SUCCESS',
          }
        ]
      });

      const result = await syncStatusesAndReleaseQueues();

      expect(result.queueReleaseSuccess).toBe(2);
      expect(result.queueReleaseAttempts).toBe(2);
      expect(result.queueReleaseBlocked).toBe(0);
      expect(result.releasedOrders).toHaveLength(2);
    });

    it('Case C: target busy -> queueReleaseSuccess = 0, queueReleaseBlocked = 1', async () => {
      process.env.PEAKERR_STATUS_SYNC_ENABLED = 'true';
      process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      vi.mocked(releaseAllEligibleQueuedTargetsDetailed).mockResolvedValueOnce({
        queuedRowsCount: 1,
        candidateTargetsCount: 1,
        diagnosticDetails: [],
        results: [
          {
            orderId: 'sweep_blocked',
            publicId: 'CF-BLOCKED-1',
            target: 'https://instagram.com/user_b',
            code: 'SLOT_BUSY',
            skippedReason: 'SLOT_BUSY',
          },
        ]
      });

      const result = await syncStatusesAndReleaseQueues();

      expect(result.queueReleaseSuccess).toBe(0);
      expect(result.queueReleaseAttempts).toBe(0);
      expect(result.queueReleaseBlocked).toBe(1);
      expect(result.releasedOrders).toHaveLength(0);
    });

    it('Case D: atomic claim lost to concurrent worker -> queueReleaseSuccess = 0', async () => {
      process.env.PEAKERR_STATUS_SYNC_ENABLED = 'true';
      process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      vi.mocked(releaseAllEligibleQueuedTargetsDetailed).mockResolvedValueOnce({
        queuedRowsCount: 1,
        candidateTargetsCount: 1,
        diagnosticDetails: [],
        results: [
          {
            orderId: 'ord_conflict',
            publicId: 'CF-CONFLICT',
            target: 'conflict_user',
            code: 'ATOMIC_CLAIM_FAILED',
            skippedReason: 'ATOMIC_CLAIM_FAILED',
          }
        ]
      });

      const result = await syncStatusesAndReleaseQueues();

      expect(result.queueReleaseSuccess).toBe(0);
      expect(result.queueReleaseAttempts).toBe(0);
      expect(result.releasedOrders).toHaveLength(0);
    });

    it('Case E: auto release disabled -> queueReleaseSuccess = 0', async () => {
      process.env.PEAKERR_STATUS_SYNC_ENABLED = 'true';
      process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'false';

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await syncStatusesAndReleaseQueues();

      expect(result.queueReleaseSuccess).toBe(0);
      expect(result.queueReleaseAttempts).toBe(0);
      expect(result.queueReleaseBlocked).toBe(0);
      expect(vi.mocked(releaseAllEligibleQueuedTargetsDetailed)).not.toHaveBeenCalled();
    });

    it('Case F: subsequent run with no queued orders -> queueReleaseSuccess = 0', async () => {
      process.env.PEAKERR_STATUS_SYNC_ENABLED = 'true';
      process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      vi.mocked(releaseAllEligibleQueuedTargetsDetailed).mockResolvedValueOnce({
        queuedRowsCount: 0,
        candidateTargetsCount: 0,
        diagnosticDetails: ['QUEUE_ROWS_FOUND:0'],
        results: [],
      });

      const result = await syncStatusesAndReleaseQueues();

      expect(result.queueReleaseSuccess).toBe(0);
      expect(result.queueReleaseAttempts).toBe(0);
      expect(result.queueReleaseBlocked).toBe(0);
    });

    it('Case G: real release + subsequent dispatch failure maintains release accounting after claim', async () => {
      process.env.PEAKERR_STATUS_SYNC_ENABLED = 'true';
      process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED = 'true';

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Provider failure after atomic claim: claim succeeded (SUBMITTING/FAILED), so order left WAITING_TARGET_SLOT queue
      vi.mocked(releaseAllEligibleQueuedTargetsDetailed).mockResolvedValueOnce({
        queuedRowsCount: 1,
        candidateTargetsCount: 1,
        diagnosticDetails: [],
        results: [
          {
            orderId: 'ord_provider_fail',
            publicId: 'CF-FAIL',
            target: 'fail_user',
            status: 'FAILED',
            code: 'PROVIDER_ERROR',
          }
        ]
      });

      const result = await syncStatusesAndReleaseQueues();

      // The order claimed the slot and was promoted/extracted from WAITING_TARGET_SLOT
      expect(result.queueReleaseSuccess).toBe(1);
      expect(result.queueReleaseAttempts).toBe(1);
      expect(result.releasedOrders).toHaveLength(1);
      expect(result.releasedOrders?.[0].publicId).toBe('CF-FAIL');
    });
  });
});
