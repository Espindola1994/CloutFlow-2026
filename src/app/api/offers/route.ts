import { NextResponse } from 'next/server';
import { db } from '@/db';
import { offers } from '@/db/schema';
import { and, eq, asc } from 'drizzle-orm';
import { resolveCommercialCardsForService } from '@/services/commercial-offer.resolver';

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

    // Fetch existing active offers from database
    const items = await db.query.offers
      .findMany({
        where: and(
          eq(offers.active, true),
          eq(offers.platform, platform),
          eq(offers.service, service)
        ),
        orderBy: [asc(offers.sortOrder), asc(offers.priceCents)],
      })
      .catch(() => []);

    // Resolve via unified resolver for Home surface
    const resolvedCards = resolveCommercialCardsForService(platform, service, items, 'home');

    // Strip internal/sensitive identifiers: NO productCode, NO planCode, NO checkoutUrl in public response
    const publicOffers = resolvedCards.map((rc, idx) => ({
      id: rc.id || `canonical-${rc.platform}-${rc.service}-${rc.plan}`,
      name: rc.planDisplayName,
      slug: `${rc.platform}-${rc.service}-${rc.plan}`,
      description: rc.subtitle || null,
      quantity: rc.quantity,
      bonusQuantity: rc.bonusQuantity,
      priceCents: rc.priceCents,
      oldPriceCents: rc.compareAtPriceCents,
      currency: 'USD',
      badge: rc.badge,
      isPopular: idx === 3 || idx === 5,
      sortOrder: idx + 1,
      benefits: rc.features,
      ctaText: 'Get Started Now',
    }));

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
