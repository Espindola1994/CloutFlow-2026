import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { adminCostSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateFinancialTotals, resolveOrderFulfillmentCost } from '@/lib/financials';

export async function GET() {
  try {
    await requireAdmin();

    // 1. Fetch admin cost settings
    const costConfigs = await db.query.adminCostSettings.findMany({
      where: eq(adminCostSettings.active, true),
    });

    // 2. Fetch all orders and fulfillments with financial relevance
    const allOrders = await db.query.orders.findMany();
    const allFulfillments = db.query.fulfillmentOrders?.findMany
      ? await db.query.fulfillmentOrders.findMany()
      : [];

    const costConfigItems = costConfigs.map((c) => ({
      platform: c.platform,
      service: c.service,
      pricingModel: c.pricingModel,
      costValueCents: Number(c.costValueCents),
      gatewayPercentFee: c.gatewayPercentFee,
      gatewayFixedFeeCents: Number(c.gatewayFixedFeeCents),
    }));

    const orderFinancialRecords = allOrders.map((o) => {
      const costResolution = resolveOrderFulfillmentCost(
        {
          id: o.id,
          quantity: Number(o.quantity) || 0,
          platform: o.platform,
          service: o.service,
          fulfillmentStatus: o.fulfillmentStatus,
        },
        allFulfillments,
        costConfigItems
      );

      return {
        id: o.id,
        totalCents: Number(o.totalCents) || 0,
        currency: o.currency || 'USD',
        paymentStatus: o.paymentStatus,
        fulfillmentStatus: o.fulfillmentStatus,
        platform: o.platform,
        service: o.service,
        quantity: o.quantity,
        immutableProviderCostCents: costResolution.providerCostCents,
        providerCostSource: costResolution.providerCostSource,
      };
    });

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
