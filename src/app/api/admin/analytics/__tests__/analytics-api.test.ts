import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/admin/analytics/route';

vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/services/admin-analytics.service', () => ({
  getAdminAnalyticsData: vi.fn().mockResolvedValue({
    range: '7d',
    rangeStart: '2026-09-03T00:00:00.000Z',
    rangeEnd: '2026-09-10T23:59:59.000Z',
    kpis: {
      checkoutsStarted: 100,
      checkoutsAbandoned: 40,
      paidOrders: 60,
      checkoutConversionRate: 60,
      abandonmentRate: 40,
      revenue: 1200,
      averageOrderValue: 20,
    },
    funnel: {
      started: 100,
      converted: { count: 60, rate: 60 },
      abandoned: { count: 40, rate: 40 },
    },
    performanceOverTime: [],
    networkPerformance: [],
    servicePerformance: [],
    topPlans: [],
    rankings: {
      bestSellingPlan: null,
      topNetwork: null,
      topService: null,
    },
    abandonment: {
      started: 100,
      abandoned: 40,
      paid: 60,
      abandonmentRate: 40,
      conversionRate: 60,
      abandonedCartValueEstimated: 500,
      recoveredOrders: 5,
      recoveredRevenue: 100,
    },
    attributionCompact: {
      topSource: 'Direct',
      topCampaign: 'None',
      attributedPaidOrders: 0,
      attributedRevenue: 0,
    },
  }),
}));

describe('GET /api/admin/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthorized requests with 401 when requireAdmin fails', async () => {
    const { requireAdmin } = await import('@/lib/auth');
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Unauthorized'));

    const req = new Request('http://localhost:3000/api/admin/analytics');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toBe('Unauthorized');
  });

  it('returns analytics data when admin authentication succeeds', async () => {
    const { requireAdmin } = await import('@/lib/auth');
    vi.mocked(requireAdmin).mockResolvedValueOnce({
      id: 'admin_test',
      email: 'admin@cloutflow.co',
      role: 'SUPER_ADMIN',
    } as any);

    const req = new Request('http://localhost:3000/api/admin/analytics?range=30d');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.kpis.checkoutsStarted).toBe(100);
    expect(json.data.kpis.paidOrders).toBe(60);
    expect(json.data.kpis.revenue).toBe(1200);
  });
});
