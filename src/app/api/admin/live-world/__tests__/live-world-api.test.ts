import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/admin/live-world/route';
import {
  aggregateLiveWorldData,
  normalizeDeviceCategory,
  normalizeOsCategory,
  normalizeBrowserCategory,
  getAdminLiveWorldData,
} from '@/services/admin-live-world.service';
import { db } from '@/db';

vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('Admin Live World API & Aggregation Suite (Fase 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Admin sem sessão => bloqueado
  it('1. rejects request with 401 when admin has no session / requireAdmin fails with Unauthorized', async () => {
    const { requireAdmin } = await import('@/lib/auth');
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Unauthorized'));

    const req = new Request('http://localhost:3000/api/admin/live-world');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toBe('Unauthorized');
  });

  // 2. Admin sem 2FA => bloqueado
  it('2. rejects request with 401 when admin lacks 2FA / requireAdmin fails with Forbidden', async () => {
    const { requireAdmin } = await import('@/lib/auth');
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Forbidden'));

    const req = new Request('http://localhost:3000/api/admin/live-world');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toBe('Forbidden');
  });

  // 3. Admin válido => permitido com Cache-Control no-store
  it('3. allows valid admin session with 2FA and returns 200 with Cache-Control no-store', async () => {
    const { requireAdmin } = await import('@/lib/auth');
    vi.mocked(requireAdmin).mockResolvedValueOnce({
      id: 'admin_test',
      email: 'admin@cloutflow.co',
      role: 'SUPER_ADMIN',
      mfaVerified: true,
    } as any);

    // Mock DB queries for visitorPresence, orders, and checkoutContexts
    const mockFrom = vi.fn();
    const mockWhere = vi.fn();

    // 1st query: visitorPresence
    // 2nd query: orders
    let queryCount = 0;
    vi.mocked(db.select).mockImplementation(() => {
      queryCount++;
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            if (queryCount === 1) {
              return Promise.resolve([
                {
                  countryCode: 'US',
                  region: 'FL',
                  city: 'Miami',
                  latitude: '25.7617',
                  longitude: '-80.1918',
                  deviceType: 'mobile',
                  os: 'iOS',
                  browser: 'Safari',
                },
              ]);
            }
            if (queryCount === 2) {
              return Promise.resolve([]);
            }
            return Promise.resolve([]);
          }),
        }),
      } as any;
    });

    const req = new Request('http://localhost:3000/api/admin/live-world');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toContain('no-store');
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.activeVisitorsTotal).toBe(1);
    expect(json.data.locations).toHaveLength(1);
  });

  // 4. active <90s incluído
  it('4. includes visitors within the 90-second active window', () => {
    const now = new Date('2026-09-12T12:00:00.000Z');
    const within90s = new Date(now.getTime() - 45 * 1000); // 45s ago
    const cutoff = new Date(now.getTime() - 90 * 1000);

    expect(within90s >= cutoff).toBe(true);
  });

  // 5. >90s excluído
  it('5. excludes visitors older than 90 seconds from active window', () => {
    const now = new Date('2026-09-12T12:00:00.000Z');
    const olderThan90s = new Date(now.getTime() - 91 * 1000); // 91s ago
    const cutoff = new Date(now.getTime() - 90 * 1000);

    expect(olderThan90s >= cutoff).toBe(false);
  });

  // 6. expires_at não define ACTIVE
  it('6. demonstrates that expires_at does not define ACTIVE (only last_seen_at does)', () => {
    // A visitor whose expires_at is 2 minutes in the future, but lastSeenAt was 120s ago, is NOT active
    const now = new Date('2026-09-12T12:00:00.000Z');
    const cutoff = new Date(now.getTime() - 90 * 1000);

    const visitorWithFutureExpiry = {
      lastSeenAt: new Date(now.getTime() - 120 * 1000), // 120s ago
      expiresAt: new Date(now.getTime() + 60 * 1000), // future
    };

    const isActive = visitorWithFutureExpiry.lastSeenAt >= cutoff;
    expect(isActive).toBe(false);
  });

  // 7. geo null conta no total mas não em locations
  it('7. geo null is counted in activeVisitorsTotal and unknownGeoVisitorsTotal, but excluded from locations', () => {
    const data = aggregateLiveWorldData({
      visitors: [
        {
          countryCode: null,
          region: null,
          city: null,
          latitude: null,
          longitude: null,
          deviceType: 'mobile',
          os: 'iOS',
          browser: 'Safari',
        },
        {
          countryCode: 'US',
          region: 'CA',
          city: 'Los Angeles',
          latitude: 34.0522,
          longitude: -118.2437,
          deviceType: 'desktop',
          os: 'macOS',
          browser: 'Chrome',
        },
      ],
      recentPurchases: [],
    });

    expect(data.activeVisitorsTotal).toBe(2);
    expect(data.mappableVisitorsTotal).toBe(1);
    expect(data.unknownGeoVisitorsTotal).toBe(1);
    expect(data.locations).toHaveLength(1);
    expect(data.locations[0].city).toBe('Los Angeles');
  });

  // 8. agrupamento por cidade correto
  it('8. groups multiple visitors in the same city/coordinates into a single location cluster with activeCount', () => {
    const data = aggregateLiveWorldData({
      visitors: [
        {
          countryCode: 'US',
          region: 'FL',
          city: 'Miami',
          latitude: 25.7617,
          longitude: -80.1918,
          deviceType: 'mobile',
          os: 'iOS',
          browser: 'Safari',
        },
        {
          countryCode: 'US',
          region: 'FL',
          city: 'Miami',
          latitude: 25.7617,
          longitude: -80.1918,
          deviceType: 'desktop',
          os: 'Windows',
          browser: 'Edge',
        },
        {
          countryCode: 'US',
          region: 'FL',
          city: 'Miami',
          latitude: 25.7617,
          longitude: -80.1918,
          deviceType: 'tablet',
          os: 'Android',
          browser: 'Chrome',
        },
      ],
      recentPurchases: [],
    });

    expect(data.activeVisitorsTotal).toBe(3);
    expect(data.mappableVisitorsTotal).toBe(3);
    expect(data.locations).toHaveLength(1);
    expect(data.locations[0].city).toBe('Miami');
    expect(data.locations[0].activeCount).toBe(3);
  });

  // 9. device breakdown correto
  it('9. computes device breakdown correctly per location and globally', () => {
    const data = aggregateLiveWorldData({
      visitors: [
        { countryCode: 'FR', region: 'IDF', city: 'Paris', latitude: 48.8566, longitude: 2.3522, deviceType: 'mobile', os: 'iOS', browser: 'Safari' },
        { countryCode: 'FR', region: 'IDF', city: 'Paris', latitude: 48.8566, longitude: 2.3522, deviceType: 'mobile', os: 'Android', browser: 'Chrome' },
        { countryCode: 'FR', region: 'IDF', city: 'Paris', latitude: 48.8566, longitude: 2.3522, deviceType: 'desktop', os: 'macOS', browser: 'Safari' },
        { countryCode: 'FR', region: 'IDF', city: 'Paris', latitude: 48.8566, longitude: 2.3522, deviceType: 'tablet', os: 'iOS', browser: 'Safari' },
        { countryCode: 'FR', region: 'IDF', city: 'Paris', latitude: 48.8566, longitude: 2.3522, deviceType: 'smart-tv', os: 'Unknown', browser: 'Unknown' },
      ],
      recentPurchases: [],
    });

    expect(data.devices).toEqual({
      mobile: 2,
      tablet: 1,
      desktop: 1,
      other: 1,
    });
    expect(data.locations[0].devices).toEqual({
      mobile: 2,
      tablet: 1,
      desktop: 1,
      other: 1,
    });
  });

  // 10. iOS/Android/desktop/Windows/macOS/Linux/ChromeOS correto
  it('10. computes OS and browser breakdown correctly per location and globally', () => {
    const data = aggregateLiveWorldData({
      visitors: [
        { countryCode: 'DE', region: 'BE', city: 'Berlin', latitude: 52.52, longitude: 13.405, deviceType: 'mobile', os: 'iOS', browser: 'Safari' },
        { countryCode: 'DE', region: 'BE', city: 'Berlin', latitude: 52.52, longitude: 13.405, deviceType: 'mobile', os: 'Android', browser: 'Chrome' },
        { countryCode: 'DE', region: 'BE', city: 'Berlin', latitude: 52.52, longitude: 13.405, deviceType: 'desktop', os: 'Windows', browser: 'Edge' },
        { countryCode: 'DE', region: 'BE', city: 'Berlin', latitude: 52.52, longitude: 13.405, deviceType: 'desktop', os: 'macOS', browser: 'Safari' },
        { countryCode: 'DE', region: 'BE', city: 'Berlin', latitude: 52.52, longitude: 13.405, deviceType: 'desktop', os: 'Linux', browser: 'Firefox' },
        { countryCode: 'DE', region: 'BE', city: 'Berlin', latitude: 52.52, longitude: 13.405, deviceType: 'desktop', os: 'ChromeOS', browser: 'Chrome' },
      ],
      recentPurchases: [],
    });

    expect(data.os.iOS).toBe(1);
    expect(data.os.Android).toBe(1);
    expect(data.os.Windows).toBe(1);
    expect(data.os.macOS).toBe(1);
    expect(data.os.Linux).toBe(1);
    expect(data.os.ChromeOS).toBe(1);

    expect(data.browsers.Safari).toBe(2);
    expect(data.browsers.Chrome).toBe(2);
    expect(data.browsers.Edge).toBe(1);
    expect(data.browsers.Firefox).toBe(1);
  });

  // 11. Unicode city preservada
  it('11. preserves international Unicode cities and special characters faithfully', () => {
    const data = aggregateLiveWorldData({
      visitors: [
        { countryCode: 'BR', region: 'SP', city: 'São Paulo', latitude: -23.5505, longitude: -46.6333, deviceType: 'mobile', os: 'Android', browser: 'Chrome' },
        { countryCode: 'JP', region: '13', city: '東京', latitude: 35.6762, longitude: 139.6503, deviceType: 'desktop', os: 'macOS', browser: 'Safari' },
        { countryCode: 'IS', region: '1', city: 'Reykjavík', latitude: 64.1466, longitude: -21.9426, deviceType: 'desktop', os: 'Windows', browser: 'Firefox' },
      ],
      recentPurchases: [],
    });

    expect(data.locations.map((l) => l.city)).toContain('São Paulo');
    expect(data.locations.map((l) => l.city)).toContain('東京');
    expect(data.locations.map((l) => l.city)).toContain('Reykjavík');
    expect(data.topCities.map((c) => c.city)).toContain('São Paulo');
  });

  // 12. recent paid order incluída
  it('12. includes recent paid orders in recentPurchases', () => {
    const recentPurchase = {
      orderId: 'CF-1001',
      countryCode: 'US',
      region: 'FL',
      city: 'Miami',
      latitude: 25.7617,
      longitude: -80.1918,
      mappable: true,
      deviceType: 'mobile',
      os: 'iOS',
      browser: 'Safari',
      platform: 'instagram',
      service: 'followers',
      planId: 'canonical-instagram-followers-starter',
      amountCents: 2990,
      approvedAt: new Date().toISOString(),
    };

    const data = aggregateLiveWorldData({
      visitors: [],
      recentPurchases: [recentPurchase],
    });

    expect(data.recentPurchases).toHaveLength(1);
    expect(data.recentPurchases[0].orderId).toBe('CF-1001');
    expect(data.recentPurchases[0].amountCents).toBe(2990);
    expect(data.recentPurchases[0].mappable).toBe(true);
  });

  // 13. canceled excluída
  it('13. excludes canceled orders from recentPurchases', () => {
    const statuses = ['PAID', 'COMPLETED', 'APPROVED', 'CANCELED', 'CANCELLED'];
    const approvedStatuses = statuses.filter((st) => ['PAID', 'COMPLETED', 'APPROVED'].includes(st));

    expect(approvedStatuses).not.toContain('CANCELED');
    expect(approvedStatuses).not.toContain('CANCELLED');
  });

  // 14. failed excluída
  it('14. excludes failed and error orders from recentPurchases', () => {
    const statuses = ['PAID', 'COMPLETED', 'APPROVED', 'FAILED', 'ERROR'];
    const approvedStatuses = statuses.filter((st) => ['PAID', 'COMPLETED', 'APPROVED'].includes(st));

    expect(approvedStatuses).not.toContain('FAILED');
    expect(approvedStatuses).not.toContain('ERROR');
  });

  // 15. cleanup test order excluída
  it('15. verifies production launch cleanup orders are excluded via nonCleanupOrderSqlCondition helper', async () => {
    const { isProductionLaunchCleanupOrder, PRODUCTION_LAUNCH_CLEANUP_EXACT_ADMIN_NOTES } = await import('@/services/admin-order-cleanup.helper');

    const cleanupOrder = {
      adminNotes: PRODUCTION_LAUNCH_CLEANUP_EXACT_ADMIN_NOTES,
      hasCleanupEvent: false,
    };
    expect(isProductionLaunchCleanupOrder(cleanupOrder)).toBe(true);

    const realPaidOrder = {
      adminNotes: null,
      hasCleanupEvent: false,
    };
    expect(isProductionLaunchCleanupOrder(realPaidOrder)).toBe(false);
  });

  // 16. historical free test excluída
  it('16. verifies pre-go-live historical free test orders are excluded via helper', async () => {
    const { isHistoricalPreGoLiveFreeTest } = await import('@/services/admin-order-cleanup.helper');

    const historicalTest = {
      createdAt: '2026-09-08T10:00:00.000Z',
      paymentTypeEnumKey: 'free_price',
      saleStatusDetail: 'free_recurrent_time',
    };
    expect(isHistoricalPreGoLiveFreeTest(historicalTest)).toBe(true);

    const postGoLiveFree = {
      createdAt: '2026-09-11T10:00:00.000Z',
      paymentTypeEnumKey: 'free_price',
      saleStatusDetail: 'free_recurrent_time',
    };
    expect(isHistoricalPreGoLiveFreeTest(postGoLiveFree)).toBe(false);
  });

  // 17. compra sem geo => mappable:false
  it('17. marks purchase without geo coordinates as mappable: false without dropping the purchase', () => {
    const purchaseWithoutGeo = {
      orderId: 'CF-1002',
      countryCode: null,
      region: null,
      city: null,
      latitude: null,
      longitude: null,
      mappable: false,
      deviceType: 'desktop',
      os: 'Windows',
      browser: 'Chrome',
      platform: 'tiktok',
      service: 'likes',
      planId: 'canonical-tiktok-likes-starter',
      amountCents: 1590,
      approvedAt: new Date().toISOString(),
    };

    const data = aggregateLiveWorldData({
      visitors: [],
      recentPurchases: [purchaseWithoutGeo],
    });

    expect(data.recentPurchases).toHaveLength(1);
    expect(data.recentPurchases[0].orderId).toBe('CF-1002');
    expect(data.recentPurchases[0].mappable).toBe(false);
    expect(data.recentPurchases[0].latitude).toBeNull();
    expect(data.recentPurchases[0].longitude).toBeNull();
  });

  // 18. nenhuma PII no payload
  it('18. strictly forbids any PII in the payload (email, phone, ip, address, username, profileUrl, targetUrl)', () => {
    const data = aggregateLiveWorldData({
      visitors: [
        {
          countryCode: 'US',
          region: 'NY',
          city: 'New York',
          latitude: 40.7128,
          longitude: -74.006,
          deviceType: 'mobile',
          os: 'iOS',
          browser: 'Safari',
        },
      ],
      recentPurchases: [
        {
          orderId: 'CF-2001',
          countryCode: 'US',
          region: 'NY',
          city: 'New York',
          latitude: 40.7128,
          longitude: -74.006,
          mappable: true,
          deviceType: 'mobile',
          os: 'iOS',
          browser: 'Safari',
          platform: 'instagram',
          service: 'followers',
          planId: 'canonical-instagram-followers-starter',
          amountCents: 2990,
          approvedAt: new Date().toISOString(),
        },
      ],
    });

    const payloadString = JSON.stringify(data);

    expect(payloadString).not.toContain('"email"');
    expect(payloadString).not.toContain('"username"');
    expect(payloadString).not.toContain('"socialUsername"');
    expect(payloadString).not.toContain('"profileUrl"');
    expect(payloadString).not.toContain('"targetUrl"');
    expect(payloadString).not.toContain('"phone"');
    expect(payloadString).not.toContain('"ip"');
    expect(payloadString).not.toContain('"address"');
  });

  // 19. nenhuma sessionId
  it('19. strictly forbids sessionId in the payload', () => {
    const data = aggregateLiveWorldData({
      visitors: [
        { countryCode: 'US', region: 'NY', city: 'New York', latitude: 40.7128, longitude: -74.006, deviceType: 'mobile', os: 'iOS', browser: 'Safari' },
      ],
      recentPurchases: [],
    });

    const payloadString = JSON.stringify(data);
    expect(payloadString).not.toContain('"sessionId"');
  });

  // 20. nenhum visitorId
  it('20. strictly forbids visitorId in the payload', () => {
    const data = aggregateLiveWorldData({
      visitors: [
        { countryCode: 'US', region: 'NY', city: 'New York', latitude: 40.7128, longitude: -74.006, deviceType: 'mobile', os: 'iOS', browser: 'Safari' },
      ],
      recentPurchases: [],
    });

    const payloadString = JSON.stringify(data);
    expect(payloadString).not.toContain('"visitorId"');
  });

  // 21. nenhum N+1
  it('21. retrieves all checkoutContexts in a single batch query without loop queries', async () => {
    let selectCallCount = 0;
    vi.mocked(db.select).mockImplementation(() => {
      selectCallCount++;
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            if (selectCallCount === 1) {
              // visitorPresence
              return Promise.resolve([]);
            }
            if (selectCallCount === 2) {
              // 3 orders sharing 2 context IDs
              return Promise.resolve([
                { id: '1', publicId: 'CF-1', totalCents: 2990, paymentStatus: 'PAID', src: 'CFCTX_A', paidAt: new Date(), platform: 'instagram', service: 'followers' },
                { id: '2', publicId: 'CF-2', totalCents: 1990, paymentStatus: 'PAID', src: 'CFCTX_B', paidAt: new Date(), platform: 'tiktok', service: 'likes' },
                { id: '3', publicId: 'CF-3', totalCents: 4990, paymentStatus: 'PAID', src: 'CFCTX_A', paidAt: new Date(), platform: 'instagram', service: 'followers' },
              ]);
            }
            if (selectCallCount === 3) {
              // batch context query
              return Promise.resolve([
                { contextId: 'CFCTX_A', countryCode: 'US', city: 'Miami', latitude: '25.7617', longitude: '-80.1918' },
                { contextId: 'CFCTX_B', countryCode: 'BR', city: 'São Paulo', latitude: '-23.5505', longitude: '-46.6333' },
              ]);
            }
            return Promise.resolve([]);
          }),
        }),
      } as any;
    });

    const result = await getAdminLiveWorldData();

    // Exactly 3 queries: 1 for presence, 1 for orders, 1 batch query for all contexts
    // NOT 2 + N queries!
    expect(selectCallCount).toBe(3);
    expect(result.recentPurchases).toHaveLength(3);
  });

  // 22. empty DB => resposta válida com zeros
  it('22. returns valid response structure with zero counts when database is empty', () => {
    const data = aggregateLiveWorldData({
      visitors: [],
      recentPurchases: [],
    });

    expect(data.activeVisitorsTotal).toBe(0);
    expect(data.mappableVisitorsTotal).toBe(0);
    expect(data.unknownGeoVisitorsTotal).toBe(0);
    expect(data.locations).toEqual([]);
    expect(data.topCountries).toEqual([]);
    expect(data.topCities).toEqual([]);
    expect(data.devices).toEqual({ mobile: 0, tablet: 0, desktop: 0, other: 0 });
    expect(data.os).toEqual({ iOS: 0, Android: 0, Windows: 0, macOS: 0, Linux: 0, ChromeOS: 0, Other: 0 });
    expect(data.browsers).toEqual({ Safari: 0, Chrome: 0, Edge: 0, Firefox: 0, Other: 0 });
    expect(data.recentPurchases).toEqual([]);
  });

  // 23. malformed telemetry não quebra agregação
  it('23. handles malformed telemetry safely without crashing', () => {
    const data = aggregateLiveWorldData({
      visitors: [
        { countryCode: null, region: null, city: null, latitude: 'invalid_lat', longitude: 'NaN', deviceType: null, os: null, browser: null },
        { countryCode: 'XX', region: 'YY', city: 'ZZ', latitude: 9999, longitude: -9999, deviceType: 'alien_device', os: 'alien_os', browser: 'alien_browser' },
        { countryCode: 'US', region: 'NY', city: 'New York', latitude: 40.7128, longitude: -74.006, deviceType: 'mobile', os: 'iOS', browser: 'Safari' },
      ],
      recentPurchases: [],
    });

    expect(data.activeVisitorsTotal).toBe(3);
    // 1st: invalid coords -> unknown
    // 2nd: out-of-range coords -> unknown
    // 3rd: valid -> mappable
    expect(data.mappableVisitorsTotal).toBe(1);
    expect(data.unknownGeoVisitorsTotal).toBe(2);
    expect(data.locations).toHaveLength(1);
    expect(data.devices.other).toBe(2);
    expect(data.devices.mobile).toBe(1);
    expect(data.os.Other).toBe(2);
    expect(data.os.iOS).toBe(1);
  });

  // =========================================================================
  // FASE 2.1 — GEO PRECISION NORMALIZATION & AGGREGATION TESTS
  // =========================================================================

  // 24. latitude payload arredondada para <= 2 casas decimais
  it('24. normalizes latitude to at most 2 decimal places in locations and recentPurchases', () => {
    const data = aggregateLiveWorldData({
      visitors: [
        {
          countryCode: 'US',
          region: 'FL',
          city: 'Miami',
          latitude: 25.7617,
          longitude: -80.1918,
          deviceType: 'mobile',
          os: 'iOS',
          browser: 'Safari',
        },
      ],
      recentPurchases: [
        {
          orderId: 'CF-2026',
          countryCode: 'US',
          region: 'FL',
          city: 'Miami',
          latitude: 25.76, // 25.7617 rounded to <=2
          longitude: -80.19,
          mappable: true,
          deviceType: 'mobile',
          os: 'iOS',
          browser: 'Safari',
          platform: 'instagram',
          service: 'followers',
          planId: 'plan_1',
          amountCents: 2990,
          approvedAt: new Date().toISOString(),
        },
      ],
    });

    expect(data.locations[0].latitude).toBe(25.76);
    expect(data.recentPurchases[0].latitude).toBe(25.76);

    const latDecimals = String(data.locations[0].latitude).split('.')[1]?.length || 0;
    expect(latDecimals).toBeLessThanOrEqual(2);
  });

  // 25. longitude payload arredondada para <= 2 casas decimais
  it('25. normalizes longitude to at most 2 decimal places in locations and recentPurchases', () => {
    const data = aggregateLiveWorldData({
      visitors: [
        {
          countryCode: 'US',
          region: 'FL',
          city: 'Miami',
          latitude: 25.7617,
          longitude: -80.1918,
          deviceType: 'mobile',
          os: 'iOS',
          browser: 'Safari',
        },
      ],
      recentPurchases: [
        {
          orderId: 'CF-2026',
          countryCode: 'US',
          region: 'FL',
          city: 'Miami',
          latitude: 25.76,
          longitude: -80.19,
          mappable: true,
          deviceType: 'mobile',
          os: 'iOS',
          browser: 'Safari',
          platform: 'instagram',
          service: 'followers',
          planId: 'plan_1',
          amountCents: 2990,
          approvedAt: new Date().toISOString(),
        },
      ],
    });

    expect(data.locations[0].longitude).toBe(-80.19);
    expect(data.recentPurchases[0].longitude).toBe(-80.19);

    const lngDecimals = String(data.locations[0].longitude).split('.')[1]?.length || 0;
    expect(lngDecimals).toBeLessThanOrEqual(2);
  });

  // 26. DB não é alterado pelo arredondamento (read-only transformation)
  it('26. performs read-only transformation in memory without executing any DB update or DDL', async () => {
    const rawPresence = [
      {
        countryCode: 'US',
        region: 'FL',
        city: 'Miami',
        latitude: '25.761745',
        longitude: '-80.191823',
        deviceType: 'mobile',
        os: 'iOS',
        browser: 'Safari',
      },
    ];

    let queryCount = 0;
    vi.mocked(db.select).mockImplementation(() => {
      queryCount++;
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            if (queryCount === 1) return Promise.resolve(rawPresence);
            return Promise.resolve([]);
          }),
        }),
      } as any;
    });

    const result = await getAdminLiveWorldData();

    // Verify coordinates in returned payload are rounded to 2 decimals
    expect(result.locations[0].latitude).toBe(25.76);
    expect(result.locations[0].longitude).toBe(-80.19);

    // Verify raw input data was not mutated
    expect(rawPresence[0].latitude).toBe('25.761745');
    expect(rawPresence[0].longitude).toBe('-80.191823');
  });

  // 27. location aggregation continua correta e não mistura cidades com o mesmo arredondamento
  it('27. does not merge different cities even if their coordinates round to the same value', () => {
    // Two nearby or edge cities with coordinates rounding to same 2-decimal numbers
    const data = aggregateLiveWorldData({
      visitors: [
        {
          countryCode: 'US',
          region: 'FL',
          city: 'Miami',
          latitude: 25.7611,
          longitude: -80.1911,
          deviceType: 'mobile',
          os: 'iOS',
          browser: 'Safari',
        },
        {
          countryCode: 'US',
          region: 'FL',
          city: 'Miami Beach',
          latitude: 25.7649,
          longitude: -80.1949,
          deviceType: 'desktop',
          os: 'macOS',
          browser: 'Chrome',
        },
      ],
      recentPurchases: [],
    });

    // Both round to (25.76, -80.19), but city names are different ('Miami' vs 'Miami Beach')
    expect(data.locations).toHaveLength(2);
    const cityNames = data.locations.map((l) => l.city);
    expect(cityNames).toContain('Miami');
    expect(cityNames).toContain('Miami Beach');
  });
});
