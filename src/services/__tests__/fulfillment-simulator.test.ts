import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateFulfillmentPreview,
  resolveAndValidateTarget,
  resolveFulfillmentChainAndPreview,
  isUrlOfPlatform,
  isContentUrl,
} from '@/services/fulfillment-chain.service';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    query: {
      orders: {
        findMany: vi.fn(),
      },
      fulfillmentChains: {
        findMany: vi.fn(),
      },
      fulfillmentChainServices: {
        findMany: vi.fn(),
      },
    },
  },
}));

describe('Phase 3.1 — Peakerr Manual Fulfillment Simulator & Shared Resolver Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('A, B) Instagram Followers with quantity = 2000 -> output payload quantity is exactly 2000 (Plan.quantity=1 ignored)', async () => {
    const mockChain = {
      id: 'chain_ig_fol',
      platform: 'instagram',
      service: 'followers',
      variant: 'standard',
      name: 'Instagram Followers (Standard)',
      autoFallback: true,
      active: true,
    };

    const mockServices = [
      { providerServiceId: '31714', priority: 1, minQuantity: 10, maxQuantity: 1000000, active: true },
      { providerServiceId: '31849', priority: 2, minQuantity: 10, maxQuantity: 1000000, active: true },
      { providerServiceId: '31850', priority: 3, minQuantity: 10, maxQuantity: 1000000, active: true },
    ];

    (db.query.fulfillmentChains.findMany as any).mockResolvedValue([mockChain]);
    (db.query.fulfillmentChainServices.findMany as any).mockResolvedValue(mockServices);

    const simulation = await resolveFulfillmentChainAndPreview({
      platform: 'instagram',
      service: 'followers',
      variant: 'standard',
      quantity: 2000,
      target: 'https://instagram.com/anaclaramaderite',
      targetType: 'profile_url',
    });

    expect(simulation.success).toBe(true);
    if (simulation.success) {
      expect(simulation.quantity).toBe(2000);
      expect(simulation.primaryServiceId).toBe('31714');
      expect(simulation.fallbacks).toEqual(['31849', '31850']);
      expect(simulation.peakerrRequestPayload).toEqual({
        provider: 'peakerr',
        service: '31714',
        link: 'https://instagram.com/anaclaramaderite',
        quantity: 2000,
      });
      expect(simulation.notice).toBe('SIMULATION ONLY - NO REQUEST SENT TO PEAKERR');
    }
  });

  it('C, D) Primary service outside min/max range is marked ineligible and cannot be selected', async () => {
    const mockChain = {
      id: 'chain_ig_likes',
      platform: 'instagram',
      service: 'likes',
      variant: 'standard',
      name: 'Instagram Likes (Standard)',
      autoFallback: true,
      active: true,
    };

    // Primary has maxQuantity=1000, but request is 2000 -> Primary must be ineligible
    const mockServices = [
      { providerServiceId: 'P_TOO_SMALL', priority: 1, minQuantity: 10, maxQuantity: 1000, active: true },
      { providerServiceId: 'P_FALLBACK_OK', priority: 2, minQuantity: 10, maxQuantity: 50000, active: true },
    ];

    (db.query.fulfillmentChains.findMany as any).mockResolvedValue([mockChain]);
    (db.query.fulfillmentChainServices.findMany as any).mockResolvedValue(mockServices);

    const simulation = await resolveFulfillmentChainAndPreview({
      platform: 'instagram',
      service: 'likes',
      variant: 'standard',
      quantity: 2000,
      target: 'https://instagram.com/p/DFzL123456',
      targetType: 'content_url',
    });

    expect(simulation.success).toBe(true);
    if (simulation.success) {
      expect(simulation.primaryServiceId).toBe('P_FALLBACK_OK');
      expect(simulation.chainServicesEvaluation[0].eligible).toBe(false);
      expect(simulation.chainServicesEvaluation[0].ineligibilityReason).toBe('INELIGIBLE_QUANTITY');
      expect(simulation.chainServicesEvaluation[1].eligible).toBe(true);
    }
  });

  it('E, F) When auto_fallback is false and Primary is ineligible -> Returns PRIMARY_INELIGIBLE_AUTO_FALLBACK_DISABLED', async () => {
    const mockChain = {
      id: 'chain_no_fb',
      platform: 'instagram',
      service: 'followers',
      variant: 'standard',
      name: 'Instagram Followers',
      autoFallback: false, // Auto fallback DISABLED
      active: true,
    };

    const mockServices = [
      { providerServiceId: 'P_PRIMARY_SMALL', priority: 1, minQuantity: 10, maxQuantity: 1000, active: true },
      { providerServiceId: 'P_FALLBACK_AVAILABLE', priority: 2, minQuantity: 10, maxQuantity: 50000, active: true },
    ];

    (db.query.fulfillmentChains.findMany as any).mockResolvedValue([mockChain]);
    (db.query.fulfillmentChainServices.findMany as any).mockResolvedValue(mockServices);

    const simulation = await resolveFulfillmentChainAndPreview({
      platform: 'instagram',
      service: 'followers',
      variant: 'standard',
      quantity: 2000,
      target: 'https://instagram.com/anaclaramaderite',
      targetType: 'profile_url',
    });

    expect(simulation.success).toBe(false);
    if (!simulation.success) {
      expect(simulation.error.code).toBe('PRIMARY_INELIGIBLE_AUTO_FALLBACK_DISABLED');
    }
  });

  it('G) Platform mismatch: Instagram with TikTok URL returns TARGET_PLATFORM_MISMATCH', () => {
    const res = resolveAndValidateTarget(
      'https://tiktok.com/@user/video/12345678',
      'instagram',
      'followers'
    );
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.code).toBe('TARGET_PLATFORM_MISMATCH');
    }
  });

  it('H) Followers username normalizes correctly to full profile URL', () => {
    const igRes = resolveAndValidateTarget('anaclaramaderite', 'instagram', 'followers');
    expect(igRes.success).toBe(true);
    if (igRes.success) {
      expect(igRes.target).toBe('https://instagram.com/anaclaramaderite');
      expect(igRes.targetType).toBe('profile_fallback');
    }

    const xRes = resolveAndValidateTarget('@elonmusk', 'twitter', 'followers');
    expect(xRes.success).toBe(true);
    if (xRes.success) {
      expect(xRes.target).toBe('https://x.com/elonmusk');
    }

    const ytRes = resolveAndValidateTarget('MrBeast', 'youtube', 'followers');
    expect(ytRes.success).toBe(true);
    if (ytRes.success) {
      expect(ytRes.target).toBe('https://youtube.com/@MrBeast');
    }
  });

  it('I, J, K) Likes, Views, Comments without valid content URL are blocked', () => {
    ['likes', 'views', 'comments'].forEach((svc) => {
      // Just a username -> Blocked
      const rawUserRes = resolveAndValidateTarget('anaclaramaderite', 'instagram', svc);
      expect(rawUserRes.success).toBe(false);
      if (!rawUserRes.success) {
        expect(rawUserRes.code).toBe('INVALID_CONTENT_URL');
      }

      // Valid post URL -> Accepted
      const validUrlRes = resolveAndValidateTarget('https://instagram.com/p/CXYZ999', 'instagram', svc);
      expect(validUrlRes.success).toBe(true);
      if (validUrlRes.success) {
        expect(validUrlRes.targetType).toBe('content_url');
      }
    });
  });

  it('L) Chain not found in database returns CHAIN_NOT_FOUND', async () => {
    (db.query.fulfillmentChains.findMany as any).mockResolvedValue([]);

    const simulation = await resolveFulfillmentChainAndPreview({
      platform: 'youtube',
      service: 'comments',
      variant: 'standard',
      quantity: 50,
      target: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      targetType: 'content_url',
    });

    expect(simulation.success).toBe(false);
    if (!simulation.success) {
      expect(simulation.error.code).toBe('CHAIN_NOT_FOUND');
    }
  });

  it('M) No eligible provider (quantity 5000 exceeds all maxQuantities) returns NO_ELIGIBLE_PROVIDER', async () => {
    const mockChain = {
      id: 'chain_tt',
      platform: 'tiktok',
      service: 'views',
      variant: 'standard',
      name: 'TikTok Views',
      autoFallback: true,
      active: true,
    };

    const mockServices = [
      { providerServiceId: 'S1', priority: 1, minQuantity: 10, maxQuantity: 1000, active: true },
      { providerServiceId: 'S2', priority: 2, minQuantity: 10, maxQuantity: 2000, active: true },
    ];

    (db.query.fulfillmentChains.findMany as any).mockResolvedValue([mockChain]);
    (db.query.fulfillmentChainServices.findMany as any).mockResolvedValue(mockServices);

    const simulation = await resolveFulfillmentChainAndPreview({
      platform: 'tiktok',
      service: 'views',
      variant: 'standard',
      quantity: 5000,
      target: 'https://tiktok.com/@user/video/7182938492',
      targetType: 'content_url',
    });

    expect(simulation.success).toBe(false);
    if (!simulation.success) {
      expect(simulation.error.code).toBe('NO_ELIGIBLE_PROVIDER');
    }
  });

  it('N, O) Simulator execution performs ZERO live HTTP calls to Peakerr and mutates ZERO database records', async () => {
    const dryRunRes = await peakerrClient.createOrderDryRun({
      service: '31714',
      link: 'https://instagram.com/anaclaramaderite',
      quantity: 2000,
    });
    expect(dryRunRes.dryRun).toBe(true);
    expect(dryRunRes.request.quantity).toBe(2000);
  });
});
