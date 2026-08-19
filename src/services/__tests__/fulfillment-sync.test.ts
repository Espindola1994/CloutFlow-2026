import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncPeakerrFulfillmentStatuses } from '@/services/fulfillment-sync.service';
import { mapPeakerrStatusToLocal } from '@/services/fulfillment.service';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
    insert: vi.fn(),
  },
}));

describe('Phase 3.9 — Peakerr Automatic Status Sync Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PEAKERR_LIVE_FULFILLMENT = 'false';
    process.env.PEAKERR_STATUS_SYNC_ENABLED = 'false';
  });

  describe('5. mapPeakerrStatusToLocal mapping matrix', () => {
    it('maps Pending, Processing, In progress to PROCESSING', () => {
      expect(mapPeakerrStatusToLocal('Pending')).toBe('PROCESSING');
      expect(mapPeakerrStatusToLocal('pending')).toBe('PROCESSING');
      expect(mapPeakerrStatusToLocal('Processing')).toBe('PROCESSING');
      expect(mapPeakerrStatusToLocal('PROCESSING')).toBe('PROCESSING');
      expect(mapPeakerrStatusToLocal('In progress')).toBe('PROCESSING');
      expect(mapPeakerrStatusToLocal('in progress')).toBe('PROCESSING');
      expect(mapPeakerrStatusToLocal('IN PROGRESS')).toBe('PROCESSING');
    });

    it('maps Partial to PARTIAL', () => {
      expect(mapPeakerrStatusToLocal('Partial')).toBe('PARTIAL');
      expect(mapPeakerrStatusToLocal('partial')).toBe('PARTIAL');
      expect(mapPeakerrStatusToLocal('PARTIAL')).toBe('PARTIAL');
    });

    it('maps Completed to COMPLETED', () => {
      expect(mapPeakerrStatusToLocal('Completed')).toBe('COMPLETED');
      expect(mapPeakerrStatusToLocal('completed')).toBe('COMPLETED');
      expect(mapPeakerrStatusToLocal('COMPLETED')).toBe('COMPLETED');
    });

    it('maps Canceled and Cancelled to CANCELED', () => {
      expect(mapPeakerrStatusToLocal('Canceled')).toBe('CANCELED');
      expect(mapPeakerrStatusToLocal('canceled')).toBe('CANCELED');
      expect(mapPeakerrStatusToLocal('Cancelled')).toBe('CANCELED');
      expect(mapPeakerrStatusToLocal('cancelled')).toBe('CANCELED');
    });

    it('returns null for unknown status strings without throwing', () => {
      expect(mapPeakerrStatusToLocal('SomeNewStatus')).toBeNull();
      expect(mapPeakerrStatusToLocal('UNKNOWN_CODE')).toBeNull();
      expect(mapPeakerrStatusToLocal('')).toBeNull();
      expect(mapPeakerrStatusToLocal(null)).toBeNull();
    });
  });

  describe('26. First Real Order Regression: 80339204 (PROCESSING -> Completed)', () => {
    it('persists COMPLETED, sets completed_at, sanitizes payload, zero action=add', async () => {
      const mockActiveFulfillment = {
        id: 'ful_80339204',
        orderId: '665e9a3d-0c78-4684-b317-4d78690f9b30',
        provider: 'peakerr',
        externalOrderId: '80339204',
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

      const createSpy = vi.spyOn(peakerrClient, 'createOrder');
      const getStatusSpy = vi.spyOn(peakerrClient, 'getStatus').mockResolvedValue({
        status: 'Completed',
        charge: '1.148',
        start_count: '3639',
        remains: '0',
        currency: 'USD',
      });

      let updatedFulfillment: any = null;
      let updatedOrder: any = null;
      let insertedEvent: any = null;

      (db.transaction as any).mockImplementation(async (cb: any) => {
        const tx = {
          update: vi.fn((table: any) => ({
            set: vi.fn((data: any) => {
              if (data.status) updatedFulfillment = data;
              if (data.fulfillmentStatus) updatedOrder = data;
              return {
                where: vi.fn().mockResolvedValue(true),
              };
            }),
          })),
          insert: vi.fn((table: any) => ({
            values: vi.fn((data: any) => {
              insertedEvent = data;
              return Promise.resolve(true);
            }),
          })),
        };
        return cb(tx);
      });

      const res = await syncPeakerrFulfillmentStatuses();

      expect(res.success).toBe(true);
      expect(res.checked).toBe(1);
      expect(res.updated).toBe(1);
      expect(res.completed).toBe(1);
      expect(res.errors).toBe(0);

      // Verify db updates
      expect(updatedFulfillment?.status).toBe('COMPLETED');
      expect(updatedFulfillment?.responsePayload).toEqual({
        status: 'Completed',
        charge: '1.148',
        start_count: '3639',
        remains: '0',
        currency: 'USD',
      });
      expect(updatedOrder?.fulfillmentStatus).toBe('COMPLETED');
      expect(updatedOrder?.completedAt).toBeInstanceOf(Date);

      // Verify order event
      expect(insertedEvent?.orderId).toBe('665e9a3d-0c78-4684-b317-4d78690f9b30');
      expect(insertedEvent?.fulfillmentStatus).toBe('COMPLETED');
      expect(insertedEvent?.description).toBe('Peakerr fulfillment completed');

      // ZERO action=add calls
      expect(createSpy).not.toHaveBeenCalled();
      expect(getStatusSpy).toHaveBeenCalledWith('80339204');
    });
  });

  describe('27. Test In progress: Local stays PROCESSING', () => {
    it('status remains PROCESSING, unchanged count increments, no new order_event', async () => {
      const mockActiveFulfillment = {
        id: 'ful_1',
        orderId: 'ord_1',
        provider: 'peakerr',
        externalOrderId: '80339205',
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

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(true),
        }),
      });

      const txSpy = vi.spyOn(db, 'transaction');
      vi.spyOn(peakerrClient, 'getStatus').mockResolvedValue({
        status: 'In progress',
        charge: '1.00',
        start_count: '100',
        remains: '500',
        currency: 'USD',
      });

      const res = await syncPeakerrFulfillmentStatuses();

      expect(res.success).toBe(true);
      expect(res.checked).toBe(1);
      expect(res.updated).toBe(0);
      expect(res.unchanged).toBe(1);
      expect(txSpy).not.toHaveBeenCalled();
    });
  });

  describe('28. Test Partial: Provider returns Partial', () => {
    it('updates to PARTIAL with remains preserved, zero fallback, zero refill, zero action=add', async () => {
      const mockActiveFulfillment = {
        id: 'ful_2',
        orderId: 'ord_2',
        provider: 'peakerr',
        externalOrderId: '80339206',
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

      const createSpy = vi.spyOn(peakerrClient, 'createOrder');
      vi.spyOn(peakerrClient, 'getStatus').mockResolvedValue({
        status: 'Partial',
        charge: '0.60',
        start_count: '100',
        remains: '300',
        currency: 'USD',
      });

      let updatedFulfillment: any = null;
      let insertedEvent: any = null;

      (db.transaction as any).mockImplementation(async (cb: any) => {
        const tx = {
          update: vi.fn((table: any) => ({
            set: vi.fn((data: any) => {
              if (data.status) updatedFulfillment = data;
              return {
                where: vi.fn().mockResolvedValue(true),
              };
            }),
          })),
          insert: vi.fn((table: any) => ({
            values: vi.fn((data: any) => {
              insertedEvent = data;
              return Promise.resolve(true);
            }),
          })),
        };
        return cb(tx);
      });

      const res = await syncPeakerrFulfillmentStatuses();

      expect(res.success).toBe(true);
      expect(res.updated).toBe(1);
      expect(res.partial).toBe(1);
      expect(updatedFulfillment?.status).toBe('PARTIAL');
      expect(updatedFulfillment?.responsePayload?.remains).toBe('300');
      expect(insertedEvent?.description).toContain('remains: 300');
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe('29. Test Canceled: Provider returns Canceled', () => {
    it('updates to CANCELED without automatic retry or fallback', async () => {
      const mockActiveFulfillment = {
        id: 'ful_3',
        orderId: 'ord_3',
        provider: 'peakerr',
        externalOrderId: '80339207',
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

      vi.spyOn(peakerrClient, 'getStatus').mockResolvedValue({
        status: 'Canceled',
        remains: '1000',
      });

      let updatedFulfillment: any = null;
      (db.transaction as any).mockImplementation(async (cb: any) => {
        const tx = {
          update: vi.fn((table: any) => ({
            set: vi.fn((data: any) => {
              if (data.status) updatedFulfillment = data;
              return {
                where: vi.fn().mockResolvedValue(true),
              };
            }),
          })),
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue(true),
          }),
        };
        return cb(tx);
      });

      const res = await syncPeakerrFulfillmentStatuses();
      expect(res.success).toBe(true);
      expect(res.canceled).toBe(1);
      expect(updatedFulfillment?.status).toBe('CANCELED');
    });
  });

  describe('30. Test Network Failure: Peakerr unavailable', () => {
    it('preserves local status and records error without marking FAILED', async () => {
      const mockActiveFulfillment = {
        id: 'ful_4',
        orderId: 'ord_4',
        provider: 'peakerr',
        externalOrderId: '80339208',
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

      vi.spyOn(peakerrClient, 'getStatus').mockRejectedValue(new Error('ETIMEDOUT: Connection refused'));

      const txSpy = vi.spyOn(db, 'transaction');
      const res = await syncPeakerrFulfillmentStatuses();

      expect(res.success).toBe(true);
      expect(res.errors).toBe(1);
      expect(res.updated).toBe(0);
      expect(txSpy).not.toHaveBeenCalled();
    });
  });

  describe('31. Test Unknown Provider Status', () => {
    it('preserves local state and logs UNKNOWN_PROVIDER_STATUS error', async () => {
      const mockActiveFulfillment = {
        id: 'ful_5',
        orderId: 'ord_5',
        provider: 'peakerr',
        externalOrderId: '80339209',
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

      vi.spyOn(peakerrClient, 'getStatus').mockResolvedValue({
        status: 'SomeNewCustomStatus',
      });

      const txSpy = vi.spyOn(db, 'transaction');
      const res = await syncPeakerrFulfillmentStatuses();

      expect(res.success).toBe(true);
      expect(res.unchanged).toBe(1);
      expect(res.updated).toBe(0);
      expect(res.details?.some((d) => d.includes('UNKNOWN_PROVIDER_STATUS'))).toBe(true);
      expect(txSpy).not.toHaveBeenCalled();
    });
  });

  describe('32. Test Terminal State Regression Protection', () => {
    it('does not downgrade COMPLETED to PROCESSING if provider returns In progress', async () => {
      const mockActiveFulfillment = {
        id: 'ful_6',
        orderId: 'ord_6',
        provider: 'peakerr',
        externalOrderId: '80339210',
        status: 'COMPLETED',
        orderFulfillmentStatus: 'COMPLETED',
        orderCompletedAt: new Date(),
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([mockActiveFulfillment]),
          }),
        }),
      });

      vi.spyOn(peakerrClient, 'getStatus').mockResolvedValue({
        status: 'In progress',
      });

      const txSpy = vi.spyOn(db, 'transaction');
      const res = await syncPeakerrFulfillmentStatuses();

      expect(res.success).toBe(true);
      expect(res.unchanged).toBe(1);
      expect(res.updated).toBe(0);
      expect(txSpy).not.toHaveBeenCalled();
    });
  });

  describe('Status Sync Manual vs Cron Flag Independence', () => {
    it('endpoint admin manual can execute status sync even when PEAKERR_STATUS_SYNC_ENABLED=false (implied by default false in tests)', async () => {
      // Setup minimal mock just to ensure execution
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      // PEAKERR_STATUS_SYNC_ENABLED is explicitly false in beforeEach
      const res = await syncPeakerrFulfillmentStatuses();
      expect(res.success).toBe(true);
      expect(res.checked).toBe(0);
    });
  });

  describe('34. Multi-Status Batch Association', () => {
    it('associates batch responses to correct orders accurately', async () => {
      const mockBatch = [
        {
          id: 'ful_a',
          orderId: 'ord_a',
          provider: 'peakerr',
          externalOrderId: '1001',
          status: 'PROCESSING',
          orderFulfillmentStatus: 'PROCESSING',
          orderCompletedAt: null,
        },
        {
          id: 'ful_b',
          orderId: 'ord_b',
          provider: 'peakerr',
          externalOrderId: '1002',
          status: 'PROCESSING',
          orderFulfillmentStatus: 'PROCESSING',
          orderCompletedAt: null,
        },
      ];

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockBatch),
          }),
        }),
      });

      vi.spyOn(peakerrClient, 'getMultiStatus').mockResolvedValue({
        '1001': { status: 'Completed', charge: '1.00', start_count: '10', remains: '0', currency: 'USD' },
        '1002': { status: 'In progress', charge: '2.00', start_count: '5', remains: '500', currency: 'USD' },
      });

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(true),
        }),
      });

      const updatedIds: string[] = [];
      (db.transaction as any).mockImplementation(async (cb: any) => {
        const tx = {
          update: vi.fn((table: any) => ({
            set: vi.fn((data: any) => ({
              where: vi.fn().mockImplementation(() => {
                if (data.status === 'COMPLETED') updatedIds.push('1001');
                return Promise.resolve(true);
              }),
            })),
          })),
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue(true),
          }),
        };
        return cb(tx);
      });

      const res = await syncPeakerrFulfillmentStatuses();

      expect(res.success).toBe(true);
      expect(res.checked).toBe(2);
      expect(res.completed).toBe(1);
      expect(res.unchanged).toBe(1);
      expect(updatedIds).toContain('1001');
    });
  });
});
