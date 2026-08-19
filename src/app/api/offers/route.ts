import { NextResponse } from 'next/server';
import { db } from '@/db';
import { offers } from '@/db/schema';
import { and, eq, asc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform')?.toLowerCase().trim();
    const service = searchParams.get('service')?.toLowerCase().trim();

    if (!platform || !service) {
      return NextResponse.json(
        { success: false, error: { message: 'Platform and service are required parameters' } },
        { status: 400 }
      );
    }

    const items = await db.query.offers.findMany({
      where: and(
        eq(offers.active, true),
        eq(offers.platform, platform),
        eq(offers.service, service)
      ),
      orderBy: [asc(offers.sortOrder), asc(offers.priceCents)],
      limit: 6,
    });

    // Strip sensitive internal fields: NO externalCheckoutUrl, NO productCode, NO planCode
    const publicOffers = items.map((o) => {
      const meta = (o.metadata as Record<string, any>) || {};
      return {
        id: o.id,
        name: o.name,
        slug: o.slug,
        description: o.description || null,
        quantity: o.quantity,
        bonusQuantity: o.bonusQuantity || 0,
        priceCents: Number(o.priceCents),
        oldPriceCents: o.oldPriceCents ? Number(o.oldPriceCents) : null,
        currency: o.currency,
        badge: o.badge || meta.badge || null,
        isPopular: o.isPopular || Boolean(meta.isPopular || meta.featured),
        sortOrder: o.sortOrder,
        benefits: Array.isArray(meta.benefits) ? meta.benefits : null,
        ctaText: typeof meta.ctaText === 'string' ? meta.ctaText : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items: publicOffers,
      },
    });
  } catch (error: unknown) {
    console.error('[PublicOffersAPI] Error loading offers:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch public offers' } },
      { status: 500 }
    );
  }
}
