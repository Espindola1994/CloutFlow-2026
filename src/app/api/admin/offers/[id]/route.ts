import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { offers, adminActivityLogs } from '@/db/schema';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { 
  normalizePlatform, 
  normalizeService, 
  normalizePlan,
  validateCheckoutUrl,
  isValidPlatformService,
  CommercialPlatform,
  CommercialService
} from '@/services/commercial-offer.resolver';

const offerUpdateSchema = z.object({
  platform: z.string().optional(),
  service: z.string().optional(),
  slug: z.string().optional(),
  name: z.string().min(1).optional(),
  quantity: z.number().int().positive().optional(),
  bonusQuantity: z.number().int().nonnegative().optional(),
  priceCents: z.number().int().nonnegative().optional(),
  oldPriceCents: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().optional(),
  badge: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  deliveryText: z.string().optional().nullable(),
  refillText: z.string().optional().nullable(),
  qualityText: z.string().optional().nullable(),
  isPopular: z.boolean().optional(),
  externalCheckoutUrl: z.string().optional().nullable(),
  perfectpayProductId: z.string().optional().nullable(),
  perfectpayPlanId: z.string().optional().nullable(),
  syncHome: z.boolean().optional(),
  syncOfferStep3: z.boolean().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  benefits: z.array(z.string()).optional().nullable(),
  ctaText: z.string().optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const [offer] = await db.query.offers.findMany({
      where: eq(offers.id, id),
      limit: 1,
    });

    if (!offer) {
      return NextResponse.json({ success: false, error: { message: 'Offer not found' } }, { status: 404 });
    }

    const meta = (offer.metadata as Record<string, any>) || {};
    const normPlat = normalizePlatform(offer.platform) || offer.platform;
    const normServ = normalizeService(offer.service) || offer.service;
    const normPlan = normalizePlan(offer.name || offer.slug) || 'starter';

    const formatted = {
      id: offer.id,
      platform: normPlat as any,
      service: normServ,
      plan: normPlan,
      name: offer.name,
      slug: offer.slug,
      description: offer.description || undefined,
      quantity: offer.quantity,
      bonus: offer.bonusQuantity || 0,
      price: Number(offer.priceCents) / 100,
      priceCents: Number(offer.priceCents),
      oldPrice: offer.oldPriceCents ? Number(offer.oldPriceCents) / 100 : undefined,
      oldPriceCents: offer.oldPriceCents ? Number(offer.oldPriceCents) : undefined,
      currency: offer.currency,
      tag: offer.badge || meta.badge || undefined,
      badge: offer.badge || meta.badge || undefined,
      title: meta.title || undefined,
      subtitle: meta.subtitle || undefined,
      deliveryText: meta.deliveryText || undefined,
      refillText: meta.refillText || undefined,
      qualityText: meta.qualityText || undefined,
      popular: offer.isPopular || Boolean(meta.isPopular || meta.featured),
      checkoutUrl: offer.externalCheckoutUrl || undefined,
      perfectpayProductId: offer.perfectpayProductId || undefined,
      perfectpayPlanId: offer.perfectpayPlanId || undefined,
      syncHome: offer.syncHome ?? true,
      syncOfferStep3: offer.syncOfferStep3 ?? true,
      active: offer.active,
      sortOrder: offer.sortOrder,
      benefits: Array.isArray(meta.benefits) ? meta.benefits : undefined,
      ctaText: typeof meta.ctaText === 'string' ? meta.ctaText : undefined,
      updatedAt: offer.updatedAt,
    };

    return NextResponse.json({ success: true, data: { offer: formatted } });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }
    console.error('[AdminOfferDetailAPI] GET Error:', err);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const data = offerUpdateSchema.parse(body);

    const [existing] = await db.query.offers.findMany({
      where: eq(offers.id, id),
      limit: 1,
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: { message: 'Offer not found' } }, { status: 404 });
    }

    const rawPlat = data.platform !== undefined ? data.platform : existing.platform;
    const rawServ = data.service !== undefined ? data.service : existing.service;
    const targetPlatform = (rawPlat ? normalizePlatform(rawPlat) || rawPlat : existing.platform) as CommercialPlatform;
    const targetService = (rawServ ? normalizeService(rawServ) || rawServ : existing.service) as CommercialService;

    if (targetPlatform && targetService && !isValidPlatformService(targetPlatform, targetService)) {
      return NextResponse.json(
        { success: false, error: { message: `Service '${targetService}' is not permitted for platform '${targetPlatform}'` } },
        { status: 400 }
      );
    }

    if (data.externalCheckoutUrl && !validateCheckoutUrl(data.externalCheckoutUrl)) {
      return NextResponse.json(
        { success: false, error: { message: 'Checkout URL must use a valid secure https:// protocol' } },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.platform !== undefined) updatePayload.platform = normalizePlatform(data.platform) || data.platform;
    if (data.service !== undefined) updatePayload.service = normalizeService(data.service) || data.service;
    if (data.slug !== undefined) updatePayload.slug = data.slug;
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.quantity !== undefined) updatePayload.quantity = data.quantity;
    if (data.bonusQuantity !== undefined) updatePayload.bonusQuantity = data.bonusQuantity;
    if (data.priceCents !== undefined) updatePayload.priceCents = data.priceCents;
    if (data.oldPriceCents !== undefined) updatePayload.oldPriceCents = data.oldPriceCents;
    if (data.currency !== undefined) updatePayload.currency = data.currency;
    if (data.badge !== undefined) updatePayload.badge = data.badge;
    if (data.isPopular !== undefined) updatePayload.isPopular = data.isPopular;
    if (data.externalCheckoutUrl !== undefined) updatePayload.externalCheckoutUrl = data.externalCheckoutUrl ? data.externalCheckoutUrl.trim() : null;
    if (data.perfectpayProductId !== undefined) updatePayload.perfectpayProductId = data.perfectpayProductId ? data.perfectpayProductId.trim() : null;
    if (data.perfectpayPlanId !== undefined) updatePayload.perfectpayPlanId = data.perfectpayPlanId ? data.perfectpayPlanId.trim() : null;
    if (data.syncHome !== undefined) updatePayload.syncHome = data.syncHome;
    if (data.syncOfferStep3 !== undefined) updatePayload.syncOfferStep3 = data.syncOfferStep3;
    if (data.active !== undefined) updatePayload.active = data.active;
    if (data.sortOrder !== undefined) updatePayload.sortOrder = data.sortOrder;

    const existingMeta = (existing.metadata as Record<string, any>) || {};
    const newMeta = { ...existingMeta };

    if (data.title !== undefined) {
      if (data.title === null) delete newMeta.title;
      else newMeta.title = data.title;
    }
    if (data.subtitle !== undefined) {
      if (data.subtitle === null) delete newMeta.subtitle;
      else newMeta.subtitle = data.subtitle;
    }
    if (data.deliveryText !== undefined) {
      if (data.deliveryText === null) delete newMeta.deliveryText;
      else newMeta.deliveryText = data.deliveryText;
    }
    if (data.refillText !== undefined) {
      if (data.refillText === null) delete newMeta.refillText;
      else newMeta.refillText = data.refillText;
    }
    if (data.qualityText !== undefined) {
      if (data.qualityText === null) delete newMeta.qualityText;
      else newMeta.qualityText = data.qualityText;
    }
    if (data.benefits !== undefined) {
      if (data.benefits === null) delete newMeta.benefits;
      else newMeta.benefits = data.benefits;
    }
    if (data.ctaText !== undefined) {
      if (data.ctaText === null) delete newMeta.ctaText;
      else newMeta.ctaText = data.ctaText;
    }
    updatePayload.metadata = Object.keys(newMeta).length > 0 ? newMeta : null;

    const [updated] = await db
      .update(offers)
      .set(updatePayload)
      .where(eq(offers.id, id))
      .returning();

    // Audit log
    if (user?.id) {
      try {
        await db.insert(adminActivityLogs).values({
          userId: user.id,
          action: 'UPDATE_COMMERCIAL_OFFER',
          entity: 'offers',
          entityId: updated.id,
          metadata: {
            platform: updated.platform,
            service: updated.service,
            name: updated.name,
            oldQuantity: existing.quantity,
            newQuantity: updated.quantity,
            oldPriceCents: existing.priceCents,
            newPriceCents: updated.priceCents,
            syncHome: updated.syncHome,
            syncOfferStep3: updated.syncOfferStep3,
            active: updated.active,
            perfectPayChanged:
              existing.perfectpayProductId !== updated.perfectpayProductId ||
              existing.perfectpayPlanId !== updated.perfectpayPlanId ||
              existing.externalCheckoutUrl !== updated.externalCheckoutUrl,
          },
        });
      } catch (e) {
        console.warn('[AdminOfferDetailAPI] Audit log error:', e);
      }
    }

    // Revalidation
    try {
      revalidatePath('/');
      revalidatePath('/offer/[code]', 'page');
    } catch (revalErr) {
      console.warn('[AdminOfferDetailAPI] Revalidation notice:', revalErr);
    }

    return NextResponse.json({ success: true, data: { offer: updated } });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      return NextResponse.json({ success: false, error: { message: firstIssue.message, details: error.issues } }, { status: 400 });
    }
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }
    console.error('[AdminOfferDetailAPI] PATCH Error:', err);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

/**
 * DELETE: Deletes or deactivates the admin offer override.
 * CRITICAL RULE: Card itself continues existing publicly through canonical catalog fallback.
 * Does NOT delete supplier routing, financial protections, or catalog package.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;

    const [existing] = await db.query.offers.findMany({
      where: eq(offers.id, id),
      limit: 1,
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: { message: 'Offer not found' } }, { status: 404 });
    }

    await db.delete(offers).where(eq(offers.id, id));

    // Audit log
    if (user?.id) {
      await db.insert(adminActivityLogs).values({
        userId: user.id,
        action: 'DELETE_COMMERCIAL_OFFER_OVERRIDE',
        entity: 'offers',
        entityId: id,
        metadata: {
          platform: existing.platform,
          service: existing.service,
          name: existing.name,
          notice: 'Admin override deleted; public card falls back to canonical catalog.',
        },
      }).catch((e) => console.warn('[AdminOfferDetailAPI] Audit log error:', e));
    }

    // Revalidate
    try {
      revalidatePath('/');
      revalidatePath('/offer/[code]', 'page');
    } catch (revalErr) {
      console.warn('[AdminOfferDetailAPI] Revalidation notice:', revalErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Offer override deleted. Public card remains active via canonical catalog fallback.',
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }
    console.error('[AdminOfferDetailAPI] DELETE Error:', err);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
