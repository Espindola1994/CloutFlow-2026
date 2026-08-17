import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { orders, adminCostSettings } from '@/db/schema';
import { sql, eq } from 'drizzle-orm';

export async function GET() {
  try {
    await requireAdmin();

    // 1. Get gross revenue from paid orders
    const [grossRes] = await db
      .select({ 
        totalCents: sql<number>`COALESCE(SUM(${orders.totalCents}), 0)`,
        count: sql<number>`COUNT(*)`
      })
      .from(orders)
      .where(eq(orders.paymentStatus, 'PAID'));

    const grossRevenueCents = Number(grossRes?.totalCents || 0);
    const grossRevenue = grossRevenueCents / 100;
    const paidOrdersCount = Number(grossRes?.count || 0);

    // 2. Fetch admin cost settings
    const costConfigs = await db.query.adminCostSettings.findMany({
      where: eq(adminCostSettings.active, true),
    });

    // 3. Compute provider costs based on actual orders & pricing models
    let totalProviderCostCents = 0;
    let totalGatewayFeesCents = 0;

    const paidOrders = await db.query.orders.findMany({
      where: eq(orders.paymentStatus, 'PAID'),
    });

    for (const order of paidOrders) {
      const platform = (order.platform || 'instagram').toLowerCase();
      const service = (order.service || 'followers').toLowerCase();

      const config = costConfigs.find(
        (c) => c.platform.toLowerCase() === platform && c.service.toLowerCase() === service
      );

      if (config) {
        if (config.pricingModel === 'per_1000') {
          totalProviderCostCents += Math.round((order.quantity / 1000) * Number(config.costValueCents));
        } else if (config.pricingModel === 'per_unit') {
          totalProviderCostCents += Math.round(order.quantity * Number(config.costValueCents));
        } else {
          totalProviderCostCents += Number(config.costValueCents);
        }

        const percentFee = Number(config.gatewayPercentFee) / 100;
        const fixedFee = Number(config.gatewayFixedFeeCents);
        totalGatewayFeesCents += Math.round(Number(order.totalCents) * percentFee + fixedFee);
      } else {
        // Fallback standard rate: 4.99% + $0.30
        totalGatewayFeesCents += Math.round(Number(order.totalCents) * 0.0499 + 30);
      }
    }

    const providerCost = totalProviderCostCents / 100;
    const gatewayFees = totalGatewayFeesCents / 100;
    const netProfit = grossRevenue - providerCost - gatewayFees;
    const marginPercent = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : '0.0';

    return NextResponse.json({
      success: true,
      data: {
        grossRevenue,
        providerCost,
        gatewayFees,
        netProfit,
        marginPercent,
        paidOrdersCount,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }
    console.error('[AdminMarginsAPI] Error:', err);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
