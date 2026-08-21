import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { orders, adminCostSettings } from '@/db/schema';
import { sql, desc, and, eq, ilike, or } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '25', 10)));
    const offset = (page - 1) * limit;

    const platform = searchParams.get('platform');
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();

    const conditions = [];

    if (platform && platform !== 'all') {
      conditions.push(eq(orders.platform, platform));
    }

    if (status && status !== 'all') {
      const sUpper = status.toUpperCase();
      if (sUpper === 'PAID') {
        conditions.push(or(eq(orders.paymentStatus, 'PAID'), eq(orders.paymentStatus, 'COMPLETED'), eq(orders.paymentStatus, 'APPROVED')));
      } else if (sUpper === 'REFUNDED') {
        conditions.push(eq(orders.paymentStatus, 'REFUNDED'));
      } else if (sUpper === 'CHARGEBACK' || sUpper === 'CHARGED_BACK') {
        conditions.push(or(eq(orders.paymentStatus, 'CHARGEBACK'), eq(orders.paymentStatus, 'CHARGED_BACK')));
      } else {
        conditions.push(or(eq(orders.status, sUpper), eq(orders.paymentStatus, sUpper)));
      }
    }

    if (search) {
      conditions.push(
        or(
          ilike(orders.publicId, `%${search}%`),
          ilike(orders.username, `%${search}%`),
          ilike(orders.socialUsername, `%${search}%`),
          ilike(orders.targetUrl, `%${search}%`),
          ilike(orders.customerEmail, `%${search}%`),
          ilike(orders.externalOrderId, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch active cost configs for margin computations
    const costConfigs = await db.query.adminCostSettings.findMany({
      where: eq(adminCostSettings.active, true),
    });

    // Count query
    const [countResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(orders)
      .where(whereClause);

    const total = Number(countResult?.count || 0);
    const totalPages = Math.ceil(total / limit);

    // Items query
    const items = await db.query.orders.findMany({
      where: whereClause,
      orderBy: [desc(orders.createdAt)],
      limit,
      offset,
    });

    const formattedOrders = items.map((o) => {
      // Resolve username / target display prioritizing social_username -> username -> derived from profile/target url
      let displayTarget = o.socialUsername || o.username || null;
      if (!displayTarget && o.profileUrl) {
        try {
          const url = new URL(o.profileUrl);
          const pathParts = url.pathname.split('/').filter(Boolean);
          if (pathParts.length > 0) {
            displayTarget = pathParts[0].replace(/^@+/, '');
          }
        } catch {
          // ignore
        }
      }
      if (!displayTarget && o.targetUrl) {
        try {
          const url = new URL(o.targetUrl);
          const pathParts = url.pathname.split('/').filter(Boolean);
          if (pathParts.length > 0) {
            displayTarget = pathParts[pathParts.length - 1];
          }
        } catch {
          // ignore
        }
      }

      const cleanHandle = displayTarget ? displayTarget.replace(/^@+/, '') : 'target';

      // Safe financial calculation per order in USD
      const orderCents = Number(o.totalCents) || 0;
      const paymentStatusUpper = (o.paymentStatus || '').toUpperCase();
      const isPaid = paymentStatusUpper === 'PAID' || paymentStatusUpper === 'COMPLETED' || paymentStatusUpper === 'APPROVED';
      const isRefunded = paymentStatusUpper === 'REFUNDED';
      const isChargeback = paymentStatusUpper === 'CHARGEBACK' || paymentStatusUpper === 'CHARGED_BACK';

      const config = costConfigs.find(
        (c) => c.platform.toLowerCase() === (o.platform || '').toLowerCase() &&
               c.service.toLowerCase() === (o.service || '').toLowerCase()
      );

      const percentFee = config?.gatewayPercentFee ? Number(config.gatewayPercentFee) / 100 : 0.089;
      const fixedFeeCents = config?.gatewayFixedFeeCents ? Number(config.gatewayFixedFeeCents) : 100;
      const feeCents = Math.round(orderCents * percentFee + fixedFeeCents);

      let providerCostCents = 0;
      if (config) {
        if (config.pricingModel === 'per_1000') {
          providerCostCents = Math.round((o.quantity / 1000) * Number(config.costValueCents));
        } else if (config.pricingModel === 'per_unit') {
          providerCostCents = Math.round(o.quantity * Number(config.costValueCents));
        } else {
          providerCostCents = Number(config.costValueCents);
        }
      }

      let netProfitDollars = 0;
      if (isPaid) {
        netProfitDollars = (orderCents - feeCents - providerCostCents) / 100;
      } else if (isRefunded || isChargeback) {
        const wasDispatched = o.fulfillmentStatus && o.fulfillmentStatus !== 'NOT_DISPATCHED' && o.fulfillmentStatus !== 'CANCELED';
        const incurredProvider = wasDispatched ? providerCostCents : 0;
        netProfitDollars = -(feeCents + incurredProvider) / 100;
      }

      return {
        id: o.id,
        publicId: o.publicId,
        platform: (o.platform || 'instagram') as 'instagram' | 'tiktok' | 'twitter' | 'youtube',
        target: cleanHandle,
        username: cleanHandle,
        product: `${o.service || 'Followers'} (${o.quantity.toLocaleString()} units)`,
        email: o.customerEmail || 'anonymous',
        service: o.service || 'Followers',
        plan: `${o.quantity.toLocaleString()} units`,
        grossAmount: orderCents / 100,
        amount: orderCents / 100,
        perfectPayFee: feeCents / 100,
        providerCost: providerCostCents / 100,
        netProfit: netProfitDollars,
        status: isPaid ? 'paid' : isRefunded ? 'refunded' : isChargeback ? 'chargeback' : ((o.status?.toLowerCase() || 'pending') as 'delivered' | 'paid' | 'pending' | 'failed' | 'refunded' | 'chargeback'),
        paymentStatus: o.paymentStatus,
        fulfillmentStatus: o.fulfillmentStatus || 'NOT_DISPATCHED',
        date: new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        gateway: o.paymentGateway,
        providerStatus: o.fulfillmentStatus,
        utmSource: o.utmSource || undefined,
        utmCampaign: o.utmCampaign || undefined,
        utmMedium: o.utmMedium || undefined,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items: formattedOrders,
        orders: formattedOrders,
        total: total,
        totalCount: total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }
    console.error('[AdminOrdersAPI] Error:', err);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
