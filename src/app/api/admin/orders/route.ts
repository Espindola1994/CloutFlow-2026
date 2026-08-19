import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { orders } from '@/db/schema';
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
      if (status.toUpperCase() === 'PAID') {
        conditions.push(eq(orders.paymentStatus, 'PAID'));
      } else {
        conditions.push(eq(orders.status, status.toUpperCase()));
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

      return {
        id: o.id,
        publicId: o.publicId,
        platform: (o.platform || 'instagram') as any,
        username: cleanHandle,
        email: o.customerEmail || 'anonymous',
        service: o.service || 'Followers',
        plan: `${o.quantity.toLocaleString()} units`,
        amount: Number(o.totalCents) / 100,
        status: (o.paymentStatus === 'PAID' ? 'paid' : o.status?.toLowerCase() || 'pending') as any,
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
        total,
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
