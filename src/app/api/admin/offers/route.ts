import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { offers, adminActivityLogs } from '@/db/schema';
import { z } from 'zod';
import { desc, eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { 
  VALID_PLATFORMS, 
  PLATFORM_SERVICES, 
  CANONICAL_PLANS, 
  normalizePlatform, 
  normalizeService, 
  normalizePlan,
  getCanonicalCatalogPackage,
  validateCheckoutUrl 
} from '@/services/commercial-offer.resolver';
import { CLOUTFLOW_CATALOG_PACKAGES } from '@/config/financial-protection.config';

const offerCreateSchema = z.object({
  platform: z.enum(['instagram', 'tiktok', 'twitter', 'youtube']),
  service: z.enum(['followers', 'likes', 'views']),
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  quantity: z.number().int().positive(),
  bonusQuantity: z.number().int().nonnegative().optional().default(0),
  priceCents: z.number().int().nonnegative(),
  oldPriceCents: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().default('USD'),
  badge: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  deliveryText: z.string().optional().nullable(),
  refillText: z.string().optional().nullable(),
  qualityText: z.string().optional().nullable(),
  isPopular: z.boolean().default(false),
  externalCheckoutUrl: z.string().optional().nullable(),
  perfectpayProductId: z.string().optional().nullable(),
  perfectpayPlanId: z.string().optional().nullable(),
  syncHome: z.boolean().default(true),
  syncOfferStep3: z.boolean().default(true),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  benefits: z.array(z.string()).optional().nullable(),
  ctaText: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const user = await requireAdmin();

    const items = await db.query.offers.findMany({
      orderBy: [desc(offers.createdAt)],
    });

    const formatted = items.map((o) => {
      const meta = (o.metadata as Record<string, any>) || {};
      const normPlat = normalizePlatform(o.platform) || o.platform;
      const normServ = normalizeService(o.service) || o.service;
      const normPlan = normalizePlan(o.name || o.slug) || 'starter';

      return {
        id: o.id,
        platform: normPlat as any,
        service: normServ,
        plan: normPlan,
        name: o.name,
        slug: o.slug,
        description: o.description || undefined,
        quantity: o.quantity,
        bonus: o.bonusQuantity || 0,
        price: Number(o.priceCents) / 100,
        priceCents: Number(o.priceCents),
        oldPrice: o.oldPriceCents ? Number(o.oldPriceCents) / 100 : undefined,
        oldPriceCents: o.oldPriceCents ? Number(o.oldPriceCents) : undefined,
        currency: o.currency,
        tag: o.badge || meta.badge || undefined,
        badge: o.badge || meta.badge || undefined,
        title: meta.title || undefined,
        subtitle: meta.subtitle || undefined,
        deliveryText: meta.deliveryText || undefined,
        refillText: meta.refillText || undefined,
        qualityText: meta.qualityText || undefined,
        popular: o.isPopular || Boolean(meta.isPopular || meta.featured),
        checkoutUrl: o.externalCheckoutUrl || undefined,
        perfectpayProductId: o.perfectpayProductId || undefined,
        perfectpayPlanId: o.perfectpayPlanId || undefined,
        syncHome: o.syncHome ?? true,
        syncOfferStep3: o.syncOfferStep3 ?? true,
        active: o.active,
        sortOrder: o.sortOrder,
        benefits: Array.isArray(meta.benefits) ? meta.benefits : undefined,
        ctaText: typeof meta.ctaText === 'string' ? meta.ctaText : undefined,
        updatedAt: o.updatedAt,
      };
    });

    return NextResponse.json({ success: true, data: { items: formatted } });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }
    console.error('[AdminOffersAPI] GET Error:', err);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();

    const body = await request.json();
    const data = offerCreateSchema.parse(body);

    const platform = normalizePlatform(data.platform);
    const service = normalizeService(data.service);
    const plan = normalizePlan(data.name);

    if (!platform || !service || !plan) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid platform, service, or plan identity' } },
        { status: 400 }
      );
    }

    // Enforce business matrix
    const allowedServices = PLATFORM_SERVICES[platform];
    if (!allowedServices || !allowedServices.includes(service)) {
      return NextResponse.json(
        { success: false, error: { message: `Service '${service}' is not permitted for platform '${platform}'` } },
        { status: 400 }
      );
    }

    // Validate checkout URL if present
    if (data.externalCheckoutUrl && !validateCheckoutUrl(data.externalCheckoutUrl)) {
      return NextResponse.json(
        { success: false, error: { message: 'Checkout URL must use a valid secure https:// protocol' } },
        { status: 400 }
      );
    }

    // Check unique active identity constraint
    const existingActive = await db.query.offers.findMany({
      where: and(
        eq(sql`LOWER(${offers.platform})`, platform),
        eq(sql`LOWER(${offers.service})`, service),
        eq(sql`LOWER(${offers.name})`, data.name.toLowerCase().trim())
      ),
      limit: 1,
    }).catch(() => []);

    if (existingActive.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `An offer for '${platform} ${service} ${data.name}' already exists. Please edit the existing offer instead.`,
          },
        },
        { status: 409 }
      );
    }

    const planObj = CANONICAL_PLANS.find((p) => p.key === plan);
    const planDisplayName = planObj ? planObj.displayName : data.name;
    const generatedSlug = data.slug || `${platform}-${service}-${plan}`;

    const metadata: Record<string, any> = {};
    if (data.title) metadata.title = data.title;
    if (data.subtitle) metadata.subtitle = data.subtitle;
    if (data.deliveryText) metadata.deliveryText = data.deliveryText;
    if (data.refillText) metadata.refillText = data.refillText;
    if (data.qualityText) metadata.qualityText = data.qualityText;
    if (data.benefits) metadata.benefits = data.benefits;
    if (data.ctaText) metadata.ctaText = data.ctaText;

    const payload = {
      platform,
      service,
      name: data.name,
      slug: generatedSlug,
      description: data.description || null,
      quantity: data.quantity,
      bonusQuantity: data.bonusQuantity || 0,
      priceCents: data.priceCents,
      oldPriceCents: data.oldPriceCents || null,
      currency: data.currency || 'USD',
      badge: data.badge || null,
      isPopular: data.isPopular || false,
      externalCheckoutUrl: data.externalCheckoutUrl ? data.externalCheckoutUrl.trim() : null,
      perfectpayProductId: data.perfectpayProductId ? data.perfectpayProductId.trim() : null,
      perfectpayPlanId: data.perfectpayPlanId ? data.perfectpayPlanId.trim() : null,
      syncHome: data.syncHome ?? true,
      syncOfferStep3: data.syncOfferStep3 ?? true,
      active: data.active ?? true,
      sortOrder: data.sortOrder || 0,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    };

    const [created] = await db
      .insert(offers)
      .values(payload as any)
      .returning();

    // Audit logging
    if (user?.id) {
      try {
        await db.insert(adminActivityLogs).values({
          userId: user.id,
          action: 'CREATE_COMMERCIAL_OFFER',
          entity: 'offers',
          entityId: created.id,
          metadata: {
            platform,
            service,
            plan,
            quantity: data.quantity,
            priceCents: data.priceCents,
            hasCheckoutUrl: Boolean(payload.externalCheckoutUrl),
            hasProductCode: Boolean(payload.perfectpayProductId),
            hasPlanCode: Boolean(payload.perfectpayPlanId),
            syncHome: payload.syncHome,
            syncOfferStep3: payload.syncOfferStep3,
          },
        });
      } catch (e) {
        console.warn('[AdminOffersAPI] Audit log error:', e);
      }
    }

    // Revalidate public caches
    try {
      revalidatePath('/');
      revalidatePath('/offer/[code]', 'page');
    } catch (revalErr) {
      console.warn('[AdminOffersAPI] Revalidation notice:', revalErr);
    }

    return NextResponse.json({ success: true, data: { offer: created } }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      return NextResponse.json(
        { success: false, error: { message: firstIssue.message, details: error.issues } },
        { status: 400 }
      );
    }
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }
    console.error('[AdminOffersAPI] POST Error:', err);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
