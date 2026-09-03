import { describe, it, expect, vi } from 'vitest';
import { GET as getDashboard } from '@/app/api/admin/dashboard/route';
import { GET as getOrders } from '@/app/api/admin/orders/route';
import { GET as getMargins } from '@/app/api/admin/margins/route';
import { GET as getAttribution } from '@/app/api/admin/attribution/route';
import { GET as getOffers } from '@/app/api/admin/offers/route';

// Mock auth requireAdmin to simulate authorized admin session
vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ id: 'admin_test', role: 'SUPER_ADMIN' }),
  getSession: vi.fn().mockResolvedValue({ user: { id: 'admin_test', role: 'SUPER_ADMIN' } }),
}));

// Mock empty DB state
vi.mock('@/db', () => {
  const queryBuilder = {
    where: vi.fn().mockImplementation(() => Promise.resolve([{ total: 0, count: 0, totalCents: 0 }])),
    groupBy: vi.fn().mockImplementation(() => {
      return Object.assign(Promise.resolve([]), {
        orderBy: vi.fn().mockResolvedValue([]),
      });
    }),
  };

  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue(queryBuilder),
      }),
      query: {
        orders: {
          findMany: vi.fn().mockResolvedValue([]),
        },
        offers: {
          findMany: vi.fn().mockResolvedValue([]),
        },
        adminCostSettings: {
          findMany: vi.fn().mockResolvedValue([]),
        },
        fulfillmentOrders: {
          findMany: vi.fn().mockResolvedValue([]),
        },
        webhookEvents: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
    },
  };
});

describe('Admin APIs - Empty Database State Validation', () => {
  it('Dashboard API responds cleanly with 0 records', async () => {
    const res = await getDashboard();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.totalRevenue).toBe(0);
    expect(json.data.totalOrders).toBe(0);
    expect(json.data.paidOrders).toBe(0);
    expect(json.data.averageOrderValue).toBe('0.00');
    expect(json.data.conversionRate).toBe('N/A');
    expect(json.data.recentOrders).toEqual([]);
  });

  it('Orders API responds cleanly with 0 records', async () => {
    const req = new Request('http://localhost:3000/api/admin/orders');
    const res = await getOrders(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.items).toEqual([]);
    expect(json.data.total).toBe(0);
  });

  it('Margins API responds cleanly with 0 records', async () => {
    const res = await getMargins();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.grossRevenue).toBe(0);
    expect(json.data.netProfit).toBe(0);
    expect(json.data.marginPercent).toBe('0.0');
  });

  it('Attribution API responds cleanly with 0 records', async () => {
    const res = await getAttribution();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.campaigns).toEqual([]);
  });

  it('Offers API responds cleanly with 66 canonical cards materialized when database is empty', async () => {
    const res = await getOffers();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.items).toHaveLength(66);
  });
});
