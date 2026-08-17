import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { sql, desc } from 'drizzle-orm';

export async function GET() {
  try {
    await requireAdmin();

    const attributionRes = await db
      .select({
        utmSource: sql<string>`COALESCE(${orders.utmSource}, 'Direct / Organic')`,
        utmCampaign: sql<string>`COALESCE(${orders.utmCampaign}, 'None')`,
        utmMedium: sql<string>`COALESCE(${orders.utmMedium}, 'None')`,
        ordersCount: sql<number>`COUNT(*)`,
        paidOrdersCount: sql<number>`COALESCE(SUM(CASE WHEN ${orders.paymentStatus} = 'PAID' THEN 1 ELSE 0 END), 0)`,
        revenueCents: sql<number>`COALESCE(SUM(CASE WHEN ${orders.paymentStatus} = 'PAID' THEN ${orders.totalCents} ELSE 0 END), 0)`,
      })
      .from(orders)
      .groupBy(
        sql`COALESCE(${orders.utmSource}, 'Direct / Organic')`,
        sql`COALESCE(${orders.utmCampaign}, 'None')`,
        sql`COALESCE(${orders.utmMedium}, 'None')`
      )
      .orderBy(desc(sql`COALESCE(SUM(CASE WHEN ${orders.paymentStatus} = 'PAID' THEN ${orders.totalCents} ELSE 0 END), 0)`));

    const campaigns = attributionRes.map((row) => {
      const revenue = Number(row.revenueCents) / 100;
      const paidOrders = Number(row.paidOrdersCount);
      const aov = paidOrders > 0 ? (revenue / paidOrders).toFixed(2) : '0.00';

      return {
        source: row.utmSource,
        campaign: row.utmCampaign,
        medium: row.utmMedium,
        orders: Number(row.ordersCount),
        paidOrders,
        revenue,
        aov: `$${aov}`,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        campaigns,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }
    console.error('[AdminAttributionAPI] Error:', err);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
