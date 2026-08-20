import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  evaluateOrderForAutoDispatch,
  autoDispatchOrder,
  isAutoDispatchEnabled,
  isLiveFulfillmentEnabled,
} from '../fulfillment-auto-dispatch.service';
import { db } from '@/db';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import * as fulfillmentChainService from '../fulfillment-chain.service';

vi.mock('@/db', () => ({
  db: {
    query: {
      orders: {
        findMany: vi.fn(),
      },
      offers: {
        findMany: vi.fn(),
      },
      fulfillmentChains: {
        findMany: vi.fn(() =>
          Promise.resolve([
            {
              id: 'chain_ig_followers',
              platform: 'instagram',
              service: 'followers',
              variant: 'standard',
              name: 'Instagram Followers (Standard)',
              autoFallback: true,
              active: true,
              services: [
                {
                  id: 'cs_1',
                  chainId: 'chain_ig_followers',
                  provider: 'peakerr',
                  providerServiceId: '31249',
                  priority: 1,
                  active: true,
                  minQuantity: 10,
                  maxQuantity: 100000,
                  rate: '0.001',
                },
              ],
            },
            {
              id: 'chain_ig_likes',
              platform: 'instagram',
              service: 'likes',
              variant: 'standard',
              name: 'Instagram Likes (Standard)',
              autoFallback: true,
              active: true,
              services: [
                {
                  id: 'cs_2',
                  chainId: 'chain_ig_likes',
                  provider: 'peakerr',
                  providerServiceId: '21054',
                  priority: 1,
                  active: true,
                  minQuantity: 10,
                  maxQuantity: 50000,
                  rate: '0.0005',
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
              providerServiceId: '31249',
              priority: 1,
              active: true,
              minQuantity: 10,
              maxQuantity: 100000,
              rate: '0.001',
            },
            {
              id: 'cs_2',
              chainId: 'chain_ig_likes',
              provider: 'peakerr',
              providerServiceId: '21054',
              priority: 1,
              active: true,
              minQuantity: 10,
              maxQuantity: 50000,
              rate: '0.0005',
            },
          ])
        ),
      },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => [{ rate: '0.001' }]),
          })),
          limit: vi.fn(() => [{ rate: '0.001' }]),
        })),
      })),
    })),
    transaction: vi.fn(),
  },
}));

vi.mock('@/providers/peakerr/peakerr.client', () => ({
  peakerrClient: {
    isConfigured: vi.fn(() => true),
    isLiveEnabled: vi.fn(() => false),
    getBalance: vi.fn(() => Promise.resolve({ balance: '50.00', currency: 'USD' })),
    createOrder: vi.fn(() => Promise.resolve({ success: true, order: 888888, rawResponse: { order: 888888 } })),
  },
}));

describe('Auto Dispatch Infrastructure (Phase 4.0)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  describe('Kill Switches and Flags', () => {
    it('31. Flags false: autoDispatchOrder is blocked with zero HTTP calls', async () => {
      process.env.PEAKERR_AUTO_DISPATCH_ENABLED = 'false';
      process.env.PEAKERR_LIVE_FULFILLMENT = 'false';

      const result = await autoDispatchOrder('ord_test_123');
      expect(result.success).toBe(false);
      expect(result.code).toBe('AUTO_DISPATCH_DISABLED');
      expect(peakerrClient.createOrder).not.toHaveBeenCalled();
    });

    it('32. Auto false, Live true: autoDispatchOrder is blocked', async () => {
      process.env.PEAKERR_AUTO_DISPATCH_ENABLED = 'false';
      process.env.PEAKERR_LIVE_FULFILLMENT = 'true';

      const result = await autoDispatchOrder('ord_test_123');
      expect(result.success).toBe(false);
      expect(result.code).toBe('AUTO_DISPATCH_DISABLED');
      expect(peakerrClient.createOrder).not.toHaveBeenCalled();
    });

    it('33. Auto true, Live false: autoDispatchOrder is blocked', async () => {
      process.env.PEAKERR_AUTO_DISPATCH_ENABLED = 'true';
      process.env.PEAKERR_LIVE_FULFILLMENT = 'false';

      const result = await autoDispatchOrder('ord_test_123');
      expect(result.success).toBe(false);
      expect(result.code).toBe('LIVE_FULFILLMENT_DISABLED');
      expect(peakerrClient.createOrder).not.toHaveBeenCalled();
    });
  });

  describe('Read-Only Order Evaluation (evaluateOrderForAutoDispatch)', () => {
    it('36. Followers canonical target resolution from social username', async () => {
      const mockOrder = {
        id: 'ord_foll_1',
        publicId: 'CF-1111',
        platform: 'instagram',
        service: 'followers',
        quantity: '500',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'NOT_DISPATCHED',
        socialUsername: 'guilhermeterraaa',
        profileUrl: null,
        targetUrl: null,
      };

      (db.query.orders.findMany as any).mockResolvedValueOnce([mockOrder]);

      const evalRes = await evaluateOrderForAutoDispatch('ord_foll_1');
      expect(evalRes.target).toBe('https://instagram.com/guilhermeterraaa');
      expect(evalRes.targetType).toBe('profile_fallback');
    });

    it('37. Content target resolution from targetUrl', async () => {
      const mockOrder = {
        id: 'ord_likes_1',
        publicId: 'CF-2222',
        platform: 'instagram',
        service: 'likes',
        quantity: '1000',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'NOT_DISPATCHED',
        targetUrl: 'https://instagram.com/p/DF123456789/',
      };

      (db.query.orders.findMany as any).mockResolvedValueOnce([mockOrder]);

      const evalRes = await evaluateOrderForAutoDispatch('ord_likes_1');
      expect(evalRes.target).toBe('https://instagram.com/p/DF123456789/');
      expect(evalRes.targetType).toBe('content_url');
    });

    it('38. Missing target blocks evaluation', async () => {
      const mockOrder = {
        id: 'ord_missing_target',
        publicId: 'CF-3333',
        platform: 'instagram',
        service: 'likes',
        quantity: '1000',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'NOT_DISPATCHED',
        targetUrl: '',
      };

      (db.query.orders.findMany as any).mockResolvedValueOnce([mockOrder]);

      const evalRes = await evaluateOrderForAutoDispatch('ord_missing_target');
      expect(evalRes.eligible).toBe(false);
      expect(evalRes.code).toBe('BLOCKED_MISSING_TARGET');
    });

    it('40. Inactive offer blocks evaluation', async () => {
      const mockOrder = {
        id: 'ord_inact_offer',
        publicId: 'CF-4444',
        platform: 'instagram',
        service: 'followers',
        quantity: '500',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'NOT_DISPATCHED',
        offerId: 'off_inactive',
        socialUsername: 'testuser',
      };

      (db.query.orders.findMany as any).mockResolvedValueOnce([mockOrder]);
      (db.query.offers.findMany as any).mockResolvedValueOnce([
        { id: 'off_inactive', name: 'Promo 500', active: false, platform: 'instagram', service: 'followers' },
      ]);

      const evalRes = await evaluateOrderForAutoDispatch('ord_inact_offer');
      expect(evalRes.eligible).toBe(false);
      expect(evalRes.code).toBe('BLOCKED_INACTIVE_OFFER');
    });

    it('42. Insufficient balance blocks evaluation', async () => {
      const mockOrder = {
        id: 'ord_low_bal',
        publicId: 'CF-5555',
        platform: 'instagram',
        service: 'followers',
        quantity: '50000',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'NOT_DISPATCHED',
        socialUsername: 'testuser',
      };

      (db.query.orders.findMany as any).mockResolvedValueOnce([mockOrder]);
      // Balance is $0.01 but cost is (1.00 * 50000) / 1000 = $50.00
      (peakerrClient.getBalance as any).mockResolvedValueOnce({ balance: '0.01', currency: 'USD' });
      (db.select as any).mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => [{ rate: '1.00' }],
          }),
        }),
      });

      const evalRes = await evaluateOrderForAutoDispatch('ord_low_bal');
      expect(evalRes.eligible).toBe(false);
      expect(evalRes.code).toBe('BLOCKED_INSUFFICIENT_PROVIDER_BALANCE');
    });

    it('43. Order already claimed / PROCESSING blocks evaluation', async () => {
      const mockOrder = {
        id: 'ord_already_proc',
        publicId: 'CF-6666',
        platform: 'instagram',
        service: 'followers',
        quantity: '500',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'PROCESSING',
        socialUsername: 'testuser',
      };

      (db.query.orders.findMany as any).mockResolvedValueOnce([mockOrder]);

      const evalRes = await evaluateOrderForAutoDispatch('ord_already_proc');
      expect(evalRes.eligible).toBe(false);
      expect(evalRes.code).toBe('BLOCKED_ALREADY_CLAIMED');
    });
  });

  describe('Auto Dispatch Execution (autoDispatchOrder)', () => {
    it('34 & 35. Both flags true executes Primary submit with exact order quantity and canonical target', async () => {
      process.env.PEAKERR_AUTO_DISPATCH_ENABLED = 'true';
      process.env.PEAKERR_LIVE_FULFILLMENT = 'true';

      const mockOrder = {
        id: 'ord_full_live_1',
        publicId: 'CF-7777',
        platform: 'instagram',
        service: 'followers',
        quantity: '2000',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'NOT_DISPATCHED',
        socialUsername: 'guilhermeterraaa',
      };

      (db.query.orders.findMany as any).mockResolvedValueOnce([mockOrder]);

      // Mock atomic claim transaction
      (db.transaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          update: () => ({
            set: () => ({
              where: () => ({
                returning: () => [mockOrder],
              }),
            }),
          }),
          insert: () => ({
            values: () => ({
              returning: () => [{ id: 'ful_entry_999' }],
            }),
          }),
        });
      });

      // Mock DB finalization transaction
      (db.transaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          update: () => ({
            set: () => ({
              where: () => [],
            }),
          }),
          insert: () => ({
            values: () => [],
          }),
        });
      });

      const result = await autoDispatchOrder('ord_full_live_1');

      expect(result.success).toBe(true);
      expect(result.code).toBe('AUTO_DISPATCH_SUCCESS');
      expect(result.providerOrderId).toBe(888888);

      // Verify Peakerr createOrder call parameters
      expect(peakerrClient.createOrder).toHaveBeenCalledWith({
        service: '31249',
        link: 'https://instagram.com/guilhermeterraaa',
        quantity: 2000,
      });
    });

    it('44. Concurrency protection: second caller fails on atomic claim', async () => {
      process.env.PEAKERR_AUTO_DISPATCH_ENABLED = 'true';
      process.env.PEAKERR_LIVE_FULFILLMENT = 'true';

      const mockOrder = {
        id: 'ord_concurrent_1',
        publicId: 'CF-8888',
        platform: 'instagram',
        service: 'followers',
        quantity: '500',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'NOT_DISPATCHED',
        socialUsername: 'guilhermeterraaa',
      };

      (db.query.orders.findMany as any).mockResolvedValue([mockOrder]);

      // First call succeeds claim
      (db.transaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          update: () => ({
            set: () => ({
              where: () => ({
                returning: () => [mockOrder],
              }),
            }),
          }),
          insert: () => ({
            values: () => ({
              returning: () => [{ id: 'ful_entry_1' }],
            }),
          }),
        });
      });

      (db.transaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          update: () => ({ set: () => ({ where: () => [] }) }),
          insert: () => ({ values: () => [] }),
        });
      });

      const call1Promise = autoDispatchOrder('ord_concurrent_1');
      const res1 = await call1Promise;

      expect(res1.success).toBe(true);

      // Second call fails atomic claim (0 rows returned)
      (db.transaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          update: () => ({
            set: () => ({
              where: () => ({
                returning: () => [], // Claim failed
              }),
            }),
          }),
        });
      });

      const res2 = await autoDispatchOrder('ord_concurrent_1');
      expect(res2.success).toBe(false);
      expect(res2.code).toBe('ATOMIC_CLAIM_FAILED');

      // createOrder was only called ONCE across both calls
      expect(peakerrClient.createOrder).toHaveBeenCalledTimes(1);
    });

    it('45. Ambiguous timeout handling keeps order from retrying or falling back', async () => {
      process.env.PEAKERR_AUTO_DISPATCH_ENABLED = 'true';
      process.env.PEAKERR_LIVE_FULFILLMENT = 'true';

      const mockOrder = {
        id: 'ord_timeout_1',
        publicId: 'CF-9999',
        platform: 'instagram',
        service: 'followers',
        quantity: '500',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'NOT_DISPATCHED',
        socialUsername: 'guilhermeterraaa',
      };

      (db.query.orders.findMany as any).mockResolvedValueOnce([mockOrder]);

      (db.transaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          update: () => ({ set: () => ({ where: () => ({ returning: () => [mockOrder] }) }) }),
          insert: () => ({ values: () => ({ returning: () => [{ id: 'ful_entry_timeout' }] }) }),
        });
      });

      (peakerrClient.createOrder as any).mockResolvedValueOnce({
        success: false,
        isAmbiguous: true,
        error: 'ETIMEDOUT: Peakerr request timed out after 25000ms',
      });

      (db.transaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          update: () => ({ set: () => ({ where: () => [] }) }),
          insert: () => ({ values: () => [] }),
        });
      });

      const result = await autoDispatchOrder('ord_timeout_1');
      expect(result.success).toBe(false);
      expect(result.code).toBe('AMBIGUOUS_SUBMISSION');
    });

    it('46. Active order conflict maps to WAITING_PROVIDER with NO provider order ID and NO automatic retry', async () => {
      process.env.PEAKERR_AUTO_DISPATCH_ENABLED = 'true';
      process.env.PEAKERR_LIVE_FULFILLMENT = 'true';

      const mockOrder = {
        id: 'ord_conflict_1',
        publicId: 'CF-7902HGF6VX',
        platform: 'instagram',
        service: 'followers',
        quantity: '2000',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'NOT_DISPATCHED',
        socialUsername: 'guilhermeterraaa',
      };

      (db.query.orders.findMany as any).mockResolvedValueOnce([mockOrder]);

      (db.transaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          update: () => ({ set: () => ({ where: () => ({ returning: () => [mockOrder] }) }) }),
          insert: () => ({ values: () => ({ returning: () => [{ id: 'ful_entry_conflict' }] }) }),
        });
      });

      (peakerrClient.createOrder as any).mockResolvedValueOnce({
        success: false,
        error: 'You have active order with this link. Please wait until order being completed.',
        errorKind: 'PROVIDER_ACTIVE_ORDER_CONFLICT',
      });

      let updatedFulfillmentStatus = '';
      (db.transaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          update: () => ({ 
            set: (data: any) => {
              if (data.fulfillmentStatus) updatedFulfillmentStatus = data.fulfillmentStatus;
              return { where: () => [] };
            } 
          }),
          insert: () => ({ values: () => [] }),
        });
      });

      const result = await autoDispatchOrder('ord_conflict_1');
      expect(result.success).toBe(false);
      expect(result.code).toBe('PROVIDER_ACTIVE_ORDER_CONFLICT');
      expect(result.providerOrderId).toBeUndefined();
      expect(updatedFulfillmentStatus).toBe('WAITING_PROVIDER');
    });
  });
});
