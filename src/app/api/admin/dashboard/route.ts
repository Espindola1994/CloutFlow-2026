import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { orders, platforms } from '@/db/schema';
import { sql, desc, gte, and, eq } from 'drizzle-orm';

export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Total Revenue (only paid orders)
    const revResult = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${orders.totalCents}), 0)` 
      })
      .from(orders)
      .where(eq(orders.paymentStatus, 'PAID'));

    const totalRevenueCents = Number(revResult[0]?.total || 0);
    const totalRevenue = totalRevenueCents / 100;

    // 2. Orders count
    const totalOrdersRes = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(orders);
    const totalOrders = Number(totalOrdersRes[0]?.count || 0);

    const paidOrdersRes = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(orders)
      .where(eq(orders.paymentStatus, 'PAID'));
    const paidOrders = Number(paidOrdersRes[0]?.count || 0);

    // 3. Average Order Value
    const aov = paidOrders > 0 ? (totalRevenue / paidOrders).toFixed(2) : '0.00';

    // 4. Platform Breakdown
    const platformBreakdownRes = (await db
      .select({
        platform: orders.platform,
        ordersCount: sql<number>`COUNT(*)`,
        revenueCents: sql<number>`COALESCE(SUM(CASE WHEN ${orders.paymentStatus} = 'PAID' THEN ${orders.totalCents} ELSE 0 END), 0)`
      })
      .from(orders)
      .groupBy(orders.platform)) || [];

    const breakdownMap: Record<string, { count: number; revenue: number; percentage: number }> = {
      instagram: { count: 0, revenue: 0, percentage: 0 },
      tiktok: { count: 0, revenue: 0, percentage: 0 },
      twitter: { count: 0, revenue: 0, percentage: 0 },
      youtube: { count: 0, revenue: 0, percentage: 0 },
    };

    platformBreakdownRes.forEach((row) => {
      const p = (row.platform || 'instagram').toLowerCase();
      if (breakdownMap[p]) {
        const rev = Number(row.revenueCents) / 100;
        breakdownMap[p].count += Number(row.ordersCount);
        breakdownMap[p].revenue += rev;
        breakdownMap[p].percentage = totalRevenue > 0 ? Math.round((rev / totalRevenue) * 100) : 0;
      }
    });

    // 5. PerfectPay Funnel Analytics from webhook_events
    const funnelRes = await db
      .select({
        eventType: sql<string>`${orders.paymentStatus}`,
        count: sql<number>`COUNT(*)`
      })
      .from(orders)
      .groupBy(orders.paymentStatus);

    const funnelStats: Record<string, number> = {
      preCheckout: 0,
      pending: 0,
      approved: paidOrders,
      rejected: 0,
      refunded: 0,
      errors: 0,
    };

    // 6. Recent Orders (latest 10)
    const recent = await db.query.orders.findMany({
      orderBy: [desc(orders.createdAt)],
      limit: 10,
    });

    const formattedRecentOrders = recent.map((o) => ({
      id: o.id,
      publicId: o.publicId,
      platform: (o.platform || 'instagram') as any,
      username: o.username || 'unknown',
      email: o.customerEmail || 'anonymous',
      service: o.service || 'Followers',
      plan: `${o.quantity.toLocaleString()} units`,
      amount: Number(o.totalCents) / 100,
      status: (o.paymentStatus === 'PAID' ? 'paid' : o.status?.toLowerCase() || 'pending') as any,
      date: new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      gateway: o.paymentGateway,
      providerStatus: o.fulfillmentStatus,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        paidOrders,
        conversionRate: 'N/A', // Denominator N/A until live traffic funnel tracker is hooked
        averageOrderValue: aov,
        platformBreakdown: breakdownMap,
        funnel: funnelStats,
        recentOrders: formattedRecentOrders,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }
    console.error('[AdminDashboardAPI] Error:', err);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
