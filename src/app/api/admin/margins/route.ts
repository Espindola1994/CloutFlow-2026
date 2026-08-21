import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { adminCostSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateFinancialTotals } from '@/lib/financials';

export async function GET() {
  try {
    await requireAdmin();

    // 1. Fetch admin cost settings
    const costConfigs = await db.query.adminCostSettings.findMany({
      where: eq(adminCostSettings.active, true),
    });

    // 2. Fetch all orders with financial relevance
    const allOrders = await db.query.orders.findMany();

    const orderFinancialRecords = allOrders.map((o) => ({
      id: o.id,
      totalCents: Number(o.totalCents) || 0,
      currency: o.currency || 'USD',
      paymentStatus: o.paymentStatus,
      fulfillmentStatus: o.fulfillmentStatus,
      platform: o.platform,
      service: o.service,
      quantity: o.quantity,
    }));

    const costConfigItems = costConfigs.map((c) => ({
      platform: c.platform,
      service: c.service,
      pricingModel: c.pricingModel,
      costValueCents: Number(c.costValueCents),
      gatewayPercentFee: c.gatewayPercentFee,
      gatewayFixedFeeCents: Number(c.gatewayFixedFeeCents),
    }));

    const financials = calculateFinancialTotals(orderFinancialRecords, costConfigItems);

    return NextResponse.json({
      success: true,
      data: {
        grossSales: financials.grossSalesCents / 100,
        grossRevenue: financials.netRevenueCents / 100,
        netRevenue: financials.netRevenueCents / 100,
        refunds: financials.refundsCents / 100,
        chargebacks: financials.chargebacksCents / 100,
        providerCost: financials.providerCostsCents / 100,
        gatewayFees: financials.perfectPayFeesCents / 100,
        perfectPayFees: financials.perfectPayFeesCents / 100,
        netProfit: financials.netProfitCents / 100,
        marginPercent: financials.netMarginPercent,
        netMarginPercent: financials.netMarginPercent,
        aov: (financials.aovCents / 100).toFixed(2),
        refundRate: financials.refundRatePercent,
        chargebackRate: financials.chargebackRatePercent,
        paidOrdersCount: financials.paidOrdersCount,
        refundedOrdersCount: financials.refundedOrdersCount,
        chargebackOrdersCount: financials.chargebackOrdersCount,
        totalOrdersCount: financials.totalOrdersCount,
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
