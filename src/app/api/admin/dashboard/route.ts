import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { orders, adminCostSettings } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { calculateFinancialTotals, resolveOrderFulfillmentCost, calculateGatewayFeeCents } from '@/lib/financials';

export async function GET() {
  try {
    await requireAdmin();

    // 1. Fetch cost settings, all orders & fulfillment records
    const costConfigs = await db.query.adminCostSettings.findMany({
      where: eq(adminCostSettings.active, true),
    });

    const allOrders = await db.query.orders.findMany({
      orderBy: [desc(orders.createdAt)],
    });

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

    // 2. Platform Breakdown (Net Revenue in USD)
    const breakdownMap: Record<string, { count: number; revenue: number; percentage: number }> = {
      instagram: { count: 0, revenue: 0, percentage: 0 },
      tiktok: { count: 0, revenue: 0, percentage: 0 },
      twitter: { count: 0, revenue: 0, percentage: 0 },
      youtube: { count: 0, revenue: 0, percentage: 0 },
    };

    const netRevenueDollars = financials.netRevenueCents / 100;

    for (const o of allOrders) {
      const p = (o.platform || 'instagram').toLowerCase();
      const status = (o.paymentStatus || '').toUpperCase();
      const isPaid = status === 'PAID' || status === 'COMPLETED' || status === 'APPROVED';
      const orderAmountDollars = Number(o.totalCents || 0) / 100;

      if (breakdownMap[p]) {
        breakdownMap[p].count += 1;
        if (isPaid) {
          breakdownMap[p].revenue += orderAmountDollars;
        }
      }
    }

    Object.keys(breakdownMap).forEach((p) => {
      if (netRevenueDollars > 0) {
        breakdownMap[p].percentage = Math.round((breakdownMap[p].revenue / netRevenueDollars) * 100);
      } else {
        breakdownMap[p].percentage = 0;
      }
    });

    // 3. PerfectPay Funnel Analytics
    const funnelStats = {
      preCheckout: 0,
      pending: 0,
      approved: financials.paidOrdersCount,
      rejected: 0,
      refunded: financials.refundedOrdersCount,
      chargeback: financials.chargebackOrdersCount,
      errors: 0,
    };

    // 4. Recent Orders (latest 10) with financial breakdown per row
    const recent = allOrders.slice(0, 10);

    const formattedRecentOrders = recent.map((o) => {
      const orderCents = Number(o.totalCents) || 0;
      const statusUpper = (o.paymentStatus || '').toUpperCase();
      const isPaid = statusUpper === 'PAID' || statusUpper === 'COMPLETED' || statusUpper === 'APPROVED';
      const isRefunded = statusUpper === 'REFUNDED';
      const isChargeback = statusUpper === 'CHARGEBACK' || statusUpper === 'CHARGED_BACK';

      const config = costConfigs.find(
        (c) => c.platform.toLowerCase() === (o.platform || '').toLowerCase() &&
               c.service.toLowerCase() === (o.service || '').toLowerCase()
      );

      const { feeCents } = calculateGatewayFeeCents(orderCents, config ? {
        platform: config.platform,
        service: config.service,
        pricingModel: config.pricingModel,
        costValueCents: Number(config.costValueCents),
        gatewayPercentFee: config.gatewayPercentFee,
        gatewayFixedFeeCents: Number(config.gatewayFixedFeeCents),
      } : null);

      const costRes = resolveOrderFulfillmentCost(
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

      const providerCostCents = costRes.providerCostCents ?? 0;

      let netProfitDollars = 0;
      if (isPaid) {
        netProfitDollars = (orderCents - feeCents - providerCostCents) / 100;
      } else if (isRefunded || isChargeback) {
        const wasDispatched = o.fulfillmentStatus && o.fulfillmentStatus !== 'NOT_DISPATCHED' && o.fulfillmentStatus !== 'CANCELED';
        const incurredProvider = wasDispatched ? providerCostCents : 0;
        netProfitDollars = -(feeCents + incurredProvider) / 100;
      } else {
        // Zero-dollar or unpaid order
        const wasDispatched = o.fulfillmentStatus && o.fulfillmentStatus !== 'NOT_DISPATCHED' && o.fulfillmentStatus !== 'CANCELED';
        if (wasDispatched && costRes.providerCostCents !== null) {
          netProfitDollars = -(feeCents + providerCostCents) / 100;
        }
      }

      return {
        id: o.id,
        publicId: o.publicId,
        platform: (o.platform || 'instagram') as 'instagram' | 'tiktok' | 'twitter' | 'youtube',
        username: o.socialUsername || o.username || 'unknown',
        email: o.customerEmail || 'anonymous',
        service: o.service || 'Followers',
        plan: `${o.quantity.toLocaleString()} units`,
        grossAmount: orderCents / 100,
        amount: orderCents / 100,
        perfectPayFee: feeCents / 100,
        providerCost: costRes.providerCostCents !== null ? costRes.providerCostCents / 100 : null,
        providerCostSource: costRes.providerCostSource,
        providerTier: costRes.providerTier,
        providerRateSnapshot: costRes.providerRateSnapshot,
        netProfit: netProfitDollars,
        status: isPaid ? 'paid' : isRefunded ? 'refunded' : isChargeback ? 'chargeback' : ((o.status?.toLowerCase() || 'pending') as 'delivered' | 'paid' | 'pending' | 'failed' | 'refunded' | 'chargeback'),
        paymentStatus: o.paymentStatus,
        fulfillmentStatus: o.fulfillmentStatus,
        date: new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        gateway: o.paymentGateway,
        providerStatus: o.fulfillmentStatus,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        grossSales: financials.grossSalesCents / 100,
        netRevenue: financials.netRevenueCents / 100,
        refunds: financials.refundsCents / 100,
        chargebacks: financials.chargebacksCents / 100,
        perfectPayFees: financials.perfectPayFeesCents / 100,
        providerCosts: financials.providerCostsCents / 100,
        netProfit: financials.netProfitCents / 100,
        netMarginPercent: financials.netMarginPercent,
        totalRevenue: financials.netRevenueCents / 100,
        totalOrders: financials.totalOrdersCount,
        paidOrders: financials.paidOrdersCount,
        refundedOrders: financials.refundedOrdersCount,
        chargebackOrders: financials.chargebackOrdersCount,
        conversionRate: 'N/A',
        averageOrderValue: (financials.aovCents / 100).toFixed(2),
        refundRate: financials.refundRatePercent,
        chargebackRate: financials.chargebackRatePercent,
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
