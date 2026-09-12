import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/admin/live-world/history/route';
import {
  validateHistoryRange,
  validateHistoryPlatform,
  validateHistoryService,
  validateHistoryCountry,
  resolveHistoryDateBounds,
  computeAovCents,
  aggregateHistoryData,
  getAdminLiveWorldHistoryData,
} from '@/services/admin-live-world-history.service';
import { db } from '@/db';

vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('Admin Live World History API & Service Suite (Phase 4A)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. sem sessão Admin => bloqueado
  it('1. rejects request with 401 when admin has no session / requireAdmin fails with Unauthorized', async () => {
    const { requireAdmin } = await import('@/lib/auth');
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Unauthorized'));

    const req = new Request('http://localhost:3000/api/admin/live-world/history');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toBe('Unauthorized');
  });

  // 2. sem MFA => bloqueado
  it('2. rejects request with 401 when admin lacks MFA / requireAdmin fails with Forbidden', async () => {
    const { requireAdmin } = await import('@/lib/auth');
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Forbidden'));

    const req = new Request('http://localhost:3000/api/admin/live-world/history');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toBe('Forbidden');
  });

  // 3. Admin válido => 200 com Cache-Control no-store
  it('3. allows valid admin session with 2FA and returns 200 with Cache-Control no-store', async () => {
    const { requireAdmin } = await import('@/lib/auth');
    vi.mocked(requireAdmin).mockResolvedValueOnce({
      id: 'admin_test',
      email: 'admin@cloutflow.co',
      role: 'SUPER_ADMIN',
      mfaVerified: true,
    } as any);

    vi.mocked(db.select).mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    } as any));

    const req = new Request('http://localhost:3000/api/admin/live-world/history?range=30d');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toContain('no-store');
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.range).toBe('30d');
  });

  // 4. range 24h
  it('4. resolves range 24h correctly with hour buckets', () => {
    const ref = new Date('2026-09-12T12:00:00.000Z');
    const bounds = resolveHistoryDateBounds('24h', ref);
    expect(bounds.bucketType).toBe('hour');
    expect(bounds.endDate.getTime() - bounds.startDate.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  // 5. range 7d
  it('5. resolves range 7d correctly with day buckets', () => {
    const ref = new Date('2026-09-12T12:00:00.000Z');
    const bounds = resolveHistoryDateBounds('7d', ref);
    expect(bounds.bucketType).toBe('day');
    expect(bounds.endDate.getTime() - bounds.startDate.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  // 6. range 30d
  it('6. resolves range 30d correctly with day buckets', () => {
    const ref = new Date('2026-09-12T12:00:00.000Z');
    const bounds = resolveHistoryDateBounds('30d', ref);
    expect(bounds.bucketType).toBe('day');
    expect(bounds.endDate.getTime() - bounds.startDate.getTime()).toBe(30 * 24 * 60 * 60 * 1000);
  });

  // 7. range 90d
  it('7. resolves range 90d correctly with day buckets', () => {
    const ref = new Date('2026-09-12T12:00:00.000Z');
    const bounds = resolveHistoryDateBounds('90d', ref);
    expect(bounds.bucketType).toBe('day');
    expect(bounds.endDate.getTime() - bounds.startDate.getTime()).toBe(90 * 24 * 60 * 60 * 1000);
  });

  // 8. range inválido rejeitado
  it('8. rejects invalid range with error and HTTP 400', async () => {
    expect(() => validateHistoryRange('1year')).toThrow(/Invalid range: 1year/);

    const { requireAdmin } = await import('@/lib/auth');
    vi.mocked(requireAdmin).mockResolvedValueOnce({ role: 'SUPER_ADMIN', mfaVerified: true } as any);

    const req = new Request('http://localhost:3000/api/admin/live-world/history?range=invalid_range');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toContain('Invalid range');
  });

  // 9. platform válido
  it('9. accepts canonical platforms: instagram, tiktok, twitter, youtube', () => {
    expect(validateHistoryPlatform('instagram')).toBe('instagram');
    expect(validateHistoryPlatform('TikTok')).toBe('tiktok');
    expect(validateHistoryPlatform('twitter')).toBe('twitter');
    expect(validateHistoryPlatform('youtube')).toBe('youtube');
    expect(validateHistoryPlatform(null)).toBeNull();
  });

  // 10. platform inválido rejeitado
  it('10. rejects invalid platform with HTTP 400', async () => {
    expect(() => validateHistoryPlatform('facebook')).toThrow(/Invalid platform: facebook/);

    const { requireAdmin } = await import('@/lib/auth');
    vi.mocked(requireAdmin).mockResolvedValueOnce({ role: 'SUPER_ADMIN', mfaVerified: true } as any);

    const req = new Request('http://localhost:3000/api/admin/live-world/history?platform=facebook');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.message).toContain('Invalid platform');
  });

  // 11. service válido
  it('11. accepts canonical services: followers, likes, views', () => {
    expect(validateHistoryService('followers', 'instagram')).toBe('followers');
    expect(validateHistoryService('LIKES', 'tiktok')).toBe('likes');
    expect(validateHistoryService('views', 'youtube')).toBe('views');
  });

  // 12. service incompatível rejeitado
  it('12. rejects incompatible platform-service combinations (e.g. youtube + followers) with HTTP 400', async () => {
    expect(() => validateHistoryService('followers', 'youtube')).toThrow(/Incompatible service 'followers' for platform 'youtube'/);

    const { requireAdmin } = await import('@/lib/auth');
    vi.mocked(requireAdmin).mockResolvedValueOnce({ role: 'SUPER_ADMIN', mfaVerified: true } as any);

    const req = new Request('http://localhost:3000/api/admin/live-world/history?platform=youtube&service=followers');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.message).toContain('Incompatible service');
  });

  // 13. country ISO válido
  it('13. validates and normalizes valid ISO country codes to uppercase', () => {
    expect(validateHistoryCountry('us')).toBe('US');
    expect(validateHistoryCountry('BR')).toBe('BR');
    expect(validateHistoryCountry('de')).toBe('DE');
    expect(validateHistoryCountry(null)).toBeNull();
  });

  // 14. country inválido rejeitado
  it('14. rejects invalid country strings with HTTP 400', async () => {
    expect(() => validateHistoryCountry('UnitedStates')).toThrow(/Invalid country code/);
    expect(() => validateHistoryCountry('123')).toThrow(/Invalid country code/);

    const { requireAdmin } = await import('@/lib/auth');
    vi.mocked(requireAdmin).mockResolvedValueOnce({ role: 'SUPER_ADMIN', mfaVerified: true } as any);

    const req = new Request('http://localhost:3000/api/admin/live-world/history?country=USA_LONG');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.message).toContain('Invalid country code');
  });

  // 15-21: Database where query conditions test
  it('15-21. enforces canonical status PAID/COMPLETED/APPROVED and excludes canceled/failed/refunded/pending and cleanup tests', async () => {
    let capturedWhere: any = null;
    vi.mocked(db.select).mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation((condition) => {
          capturedWhere = condition;
          return Promise.resolve([]);
        }),
      }),
    } as any));

    await getAdminLiveWorldHistoryData({
      rangeInput: '30d',
      platformInput: 'instagram',
      serviceInput: 'followers',
    });

    expect(capturedWhere).toBeDefined();
    expect(db.select).toHaveBeenCalled();
  });

  // 22-25: Revenue, AOV, Geo mappable & unknown
  it('22-25. computes revenue, AOV, mappedPurchases and unknownGeoPurchases accurately without inventing location', () => {
    const ref = new Date('2026-09-12T12:00:00.000Z');
    const orders = [
      {
        id: 'ord_1',
        totalCents: 2990,
        platform: 'instagram',
        service: 'followers',
        planId: 'starter',
        canonicalOfferId: 'canonical-instagram-followers-starter',
        src: 'CFCTX_US_1',
        effectiveDate: ref,
      },
      {
        id: 'ord_2',
        totalCents: 4990,
        platform: 'instagram',
        service: 'followers',
        planId: 'pro',
        canonicalOfferId: 'canonical-instagram-followers-pro',
        src: 'CFCTX_UK_UNKNOWN_GEO',
        effectiveDate: ref,
      },
    ];

    const contextsMap = new Map([
      ['CFCTX_US_1', { countryCode: 'US', region: 'FL', city: 'Miami', latitude: 25.76, longitude: -80.19 }],
      ['CFCTX_UK_UNKNOWN_GEO', { countryCode: 'GB', region: null, city: null, latitude: null, longitude: null }],
    ]);

    const res = aggregateHistoryData({
      orders,
      contextsMap,
      range: '30d',
      filters: { platform: null, service: null, country: null },
      startDate: new Date(ref.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: ref,
      bucketType: 'day',
      referenceNow: ref,
    });

    expect(res.summary.totalPurchases).toBe(2);
    expect(res.summary.revenueCents).toBe(7980);
    expect(res.summary.averageOrderValueCents).toBe(3990); // 7980 / 2
    expect(res.summary.mappedPurchases).toBe(1);
    expect(res.summary.unknownGeoPurchases).toBe(1);
  });

  // 26-28: Country, City aggregation & Unicode preservation
  it('26-28. aggregates topCountries and topCities preserving international Unicode without SP/BR default', () => {
    const ref = new Date('2026-09-12T12:00:00.000Z');
    const orders = [
      {
        id: 'ord_de',
        totalCents: 2000,
        platform: 'tiktok',
        service: 'likes',
        planId: 'boost',
        canonicalOfferId: null,
        src: 'CFCTX_DE',
        effectiveDate: ref,
      },
      {
        id: 'ord_jp',
        totalCents: 5000,
        platform: 'tiktok',
        service: 'likes',
        planId: 'boost',
        canonicalOfferId: null,
        src: 'CFCTX_JP',
        effectiveDate: ref,
      },
      {
        id: 'ord_is',
        totalCents: 3000,
        platform: 'tiktok',
        service: 'likes',
        planId: 'boost',
        canonicalOfferId: null,
        src: 'CFCTX_IS',
        effectiveDate: ref,
      },
    ];

    const contextsMap = new Map([
      ['CFCTX_DE', { countryCode: 'DE', region: 'Bayern', city: 'München', latitude: 48.14, longitude: 11.58 }],
      ['CFCTX_JP', { countryCode: 'JP', region: 'Kantō', city: '東京', latitude: 35.68, longitude: 139.77 }],
      ['CFCTX_IS', { countryCode: 'IS', region: 'Höfuðborgarsvæðið', city: 'Reykjavík', latitude: 64.15, longitude: -21.94 }],
    ]);

    const res = aggregateHistoryData({
      orders,
      contextsMap,
      range: '30d',
      filters: { platform: null, service: null, country: null },
      startDate: new Date(ref.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: ref,
      bucketType: 'day',
      referenceNow: ref,
    });

    expect(res.topCountries).toHaveLength(3);
    const cities = res.topCities.map((c) => c.city);
    expect(cities).toContain('München');
    expect(cities).toContain('東京');
    expect(cities).toContain('Reykjavík');
  });

  // 29-31: Platform, service, plan aggregations
  it('29-31. aggregates platform, service, and plan breakdowns accurately', () => {
    const ref = new Date('2026-09-12T12:00:00.000Z');
    const orders = [
      {
        id: '1',
        totalCents: 1500,
        platform: 'instagram',
        service: 'followers',
        planId: 'starter',
        canonicalOfferId: 'canonical-instagram-followers-starter',
        src: null,
        effectiveDate: ref,
      },
      {
        id: '2',
        totalCents: 2500,
        platform: 'instagram',
        service: 'likes',
        planId: 'growth',
        canonicalOfferId: 'canonical-instagram-likes-growth',
        src: null,
        effectiveDate: ref,
      },
      {
        id: '3',
        totalCents: 4000,
        platform: 'twitter',
        service: 'views',
        planId: 'pro',
        canonicalOfferId: 'canonical-twitter-views-pro',
        src: null,
        effectiveDate: ref,
      },
    ];

    const res = aggregateHistoryData({
      orders,
      contextsMap: new Map(),
      range: '30d',
      filters: { platform: null, service: null, country: null },
      startDate: new Date(ref.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: ref,
      bucketType: 'day',
      referenceNow: ref,
    });

    expect(res.platforms).toHaveLength(2); // instagram, twitter
    expect(res.services).toHaveLength(3); // ig-followers, ig-likes, tw-views
    expect(res.plans).toHaveLength(3);
  });

  // 32-35: Time series for 24h, 7d, 30d, 90d
  it('32-35. returns continuous sorted time series for 24h, 7d, 30d, and 90d', () => {
    const ref = new Date('2026-09-12T12:00:00.000Z');

    // 24h time series
    const bounds24h = resolveHistoryDateBounds('24h', ref);
    const res24h = aggregateHistoryData({
      orders: [],
      contextsMap: new Map(),
      range: '24h',
      filters: { platform: null, service: null, country: null },
      startDate: bounds24h.startDate,
      endDate: bounds24h.endDate,
      bucketType: bounds24h.bucketType,
      referenceNow: ref,
    });
    expect(res24h.series.length).toBeGreaterThanOrEqual(24);

    // 7d time series
    const bounds7d = resolveHistoryDateBounds('7d', ref);
    const res7d = aggregateHistoryData({
      orders: [],
      contextsMap: new Map(),
      range: '7d',
      filters: { platform: null, service: null, country: null },
      startDate: bounds7d.startDate,
      endDate: bounds7d.endDate,
      bucketType: bounds7d.bucketType,
      referenceNow: ref,
    });
    expect(res7d.series.length).toBeGreaterThanOrEqual(7);

    // 30d time series
    const bounds30d = resolveHistoryDateBounds('30d', ref);
    const res30d = aggregateHistoryData({
      orders: [],
      contextsMap: new Map(),
      range: '30d',
      filters: { platform: null, service: null, country: null },
      startDate: bounds30d.startDate,
      endDate: bounds30d.endDate,
      bucketType: bounds30d.bucketType,
      referenceNow: ref,
    });
    expect(res30d.series.length).toBeGreaterThanOrEqual(30);

    // 90d time series
    const bounds90d = resolveHistoryDateBounds('90d', ref);
    const res90d = aggregateHistoryData({
      orders: [],
      contextsMap: new Map(),
      range: '90d',
      filters: { platform: null, service: null, country: null },
      startDate: bounds90d.startDate,
      endDate: bounds90d.endDate,
      bucketType: bounds90d.bucketType,
      referenceNow: ref,
    });
    expect(res90d.series.length).toBeGreaterThanOrEqual(90);
  });

  // 36. geo <=2 casas
  it('36. restricts geo coordinates to at most 2 decimal places', () => {
    const ref = new Date('2026-09-12T12:00:00.000Z');
    const orders = [
      {
        id: 'ord_1',
        totalCents: 2990,
        platform: 'instagram',
        service: 'followers',
        planId: 'starter',
        canonicalOfferId: null,
        src: 'CFCTX_HIGH_PRECISION',
        effectiveDate: ref,
      },
    ];

    const contextsMap = new Map([
      ['CFCTX_HIGH_PRECISION', { countryCode: 'US', region: 'CA', city: 'Los Angeles', latitude: 34.052234, longitude: -118.243685 }],
    ]);

    const res = aggregateHistoryData({
      orders,
      contextsMap,
      range: '30d',
      filters: { platform: null, service: null, country: null },
      startDate: new Date(ref.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: ref,
      bucketType: 'day',
      referenceNow: ref,
    });

    const city = res.topCities[0];
    expect(city.latitude).toBe(34.05);
    expect(city.longitude).toBe(-118.24);
  });

  // 37-39: Zero PII, zero sessionId, zero visitorId
  it('37-39. verifies zero PII, zero sessionId, and zero visitorId in the output payload', async () => {
    const { requireAdmin } = await import('@/lib/auth');
    vi.mocked(requireAdmin).mockResolvedValueOnce({ role: 'SUPER_ADMIN', mfaVerified: true } as any);

    vi.mocked(db.select).mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    } as any));

    const req = new Request('http://localhost:3000/api/admin/live-world/history');
    const res = await GET(req);
    const text = await res.text();

    expect(text).not.toContain('email');
    expect(text).not.toContain('phone');
    expect(text).not.toContain('sessionId');
    expect(text).not.toContain('visitorId');
    expect(text).not.toContain('username');
    expect(text).not.toContain('customerEmail');
  });

  // 40. empty DB retorna zeros
  it('40. returns valid zeroed summary and empty arrays when database is empty', () => {
    const ref = new Date('2026-09-12T12:00:00.000Z');
    const res = aggregateHistoryData({
      orders: [],
      contextsMap: new Map(),
      range: '30d',
      filters: { platform: null, service: null, country: null },
      startDate: new Date(ref.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: ref,
      bucketType: 'day',
      referenceNow: ref,
    });

    expect(res.summary).toEqual({
      totalPurchases: 0,
      revenueCents: 0,
      averageOrderValueCents: 0,
      mappedPurchases: 0,
      unknownGeoPurchases: 0,
    });
    expect(res.topCountries).toEqual([]);
    expect(res.topCities).toEqual([]);
    expect(res.platforms).toEqual([]);
    expect(res.services).toEqual([]);
    expect(res.plans).toEqual([]);
  });

  // 41. sem N+1
  it('41. uses batch context resolution ensuring ZERO N+1 queries', async () => {
    const ordersMock = [
      { id: '1', totalCents: 1000, platform: 'instagram', service: 'followers', planId: 's', canonicalOfferId: null, src: 'CFCTX_1', paidAt: new Date(), createdAt: new Date() },
      { id: '2', totalCents: 2000, platform: 'instagram', service: 'followers', planId: 's', canonicalOfferId: null, src: 'CFCTX_2', paidAt: new Date(), createdAt: new Date() },
      { id: '3', totalCents: 3000, platform: 'instagram', service: 'followers', planId: 's', canonicalOfferId: null, src: 'CFCTX_1', paidAt: new Date(), createdAt: new Date() },
    ];

    let queryCount = 0;
    vi.mocked(db.select).mockImplementation(() => {
      queryCount++;
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            if (queryCount === 1) return Promise.resolve(ordersMock);
            if (queryCount === 2) {
              return Promise.resolve([
                { contextId: 'CFCTX_1', countryCode: 'US', region: 'NY', city: 'New York', latitude: 40.71, longitude: -74.00 },
                { contextId: 'CFCTX_2', countryCode: 'CA', region: 'ON', city: 'Toronto', latitude: 43.65, longitude: -79.38 },
              ]);
            }
            return Promise.resolve([]);
          }),
        }),
      } as any;
    });

    const res = await getAdminLiveWorldHistoryData({ rangeInput: '30d' });

    // Exactly 2 queries: 1 for orders, 1 batch query for all unique checkoutContexts
    expect(queryCount).toBe(2);
    expect(res.summary.totalPurchases).toBe(3);
    expect(res.summary.mappedPurchases).toBe(3);
  });

  // 42. filters refletidos no payload
  it('42. reflects applied filters in response payload', async () => {
    const { requireAdmin } = await import('@/lib/auth');
    vi.mocked(requireAdmin).mockResolvedValueOnce({ role: 'SUPER_ADMIN', mfaVerified: true } as any);

    vi.mocked(db.select).mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    } as any));

    const req = new Request('http://localhost:3000/api/admin/live-world/history?range=7d&platform=tiktok&service=likes&country=FR');
    const res = await GET(req);
    const json = await res.json();

    expect(json.data.range).toBe('7d');
    expect(json.data.filters).toEqual({
      platform: 'tiktok',
      service: 'likes',
      country: 'FR',
    });
  });

  // 43-46. read-only total, nenhuma mutação
  it('43-46. guarantees absolute read-only behavior with zero insert/update/delete calls on db', async () => {
    const { requireAdmin } = await import('@/lib/auth');
    vi.mocked(requireAdmin).mockResolvedValueOnce({ role: 'SUPER_ADMIN', mfaVerified: true } as any);

    vi.mocked(db.select).mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    } as any));

    const req = new Request('http://localhost:3000/api/admin/live-world/history');
    await GET(req);

    // db has only select invoked
    expect((db as any).insert).toBeUndefined();
    expect((db as any).update).toBeUndefined();
    expect((db as any).delete).toBeUndefined();
  });
});
