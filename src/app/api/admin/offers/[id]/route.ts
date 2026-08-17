import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { offers } from '@/db/schema';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

const offerUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  quantity: z.number().int().positive().optional(),
  bonusQuantity: z.number().int().nonnegative().optional(),
  priceCents: z.number().int().nonnegative().optional(),
  oldPriceCents: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().optional(),
  badge: z.string().optional().nullable(),
  isPopular: z.boolean().optional(),
  externalCheckoutUrl: z
    .string()
    .url()
    .refine((url) => url.startsWith('https://') || url.startsWith('http://localhost'), {
      message: 'Checkout URL must use a secure https:// protocol',
    })
    .optional()
    .nullable(),
  perfectpayProductId: z.string().optional().nullable(),
  perfectpayPlanId: z.string().optional().nullable(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
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

    const formatted = {
      id: offer.id,
      platform: offer.platform as any,
      service: offer.service,
      name: offer.name,
      slug: offer.slug,
      description: offer.description || undefined,
      quantity: offer.quantity,
      bonus: offer.bonusQuantity || 0,
      price: Number(offer.priceCents) / 100,
      oldPrice: offer.oldPriceCents ? Number(offer.oldPriceCents) / 100 : undefined,
      currency: offer.currency,
      tag: offer.badge || undefined,
      popular: offer.isPopular,
      checkoutUrl: offer.externalCheckoutUrl || undefined,
      perfectpayProductId: offer.perfectpayProductId || undefined,
      perfectpayPlanId: offer.perfectpayPlanId || undefined,
      active: offer.active,
      sortOrder: offer.sortOrder,
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
    await requireAdmin();
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

    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };

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
    if (data.active !== undefined) updatePayload.active = data.active;
    if (data.sortOrder !== undefined) updatePayload.sortOrder = data.sortOrder;

    const [updated] = await db
      .update(offers)
      .set(updatePayload)
      .where(eq(offers.id, id))
      .returning();

    return NextResponse.json({ success: true, data: { offer: updated } });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      let customMessage = 'Invalid update payload';
      if (firstIssue) {
        const pathStr = firstIssue.path.join('.');
        if (pathStr.includes('quantity')) {
          customMessage = 'Quantity must be a positive integer.';
        } else if (pathStr.includes('externalCheckoutUrl')) {
          customMessage = 'External checkout URL must be a valid secure URL (https://).';
        } else if (pathStr.includes('priceCents')) {
          customMessage = 'Price is invalid.';
        } else if (pathStr.includes('name')) {
          customMessage = 'Offer name cannot be empty.';
        } else {
          customMessage = `${firstIssue.message} (${pathStr})`;
        }
      }
      return NextResponse.json({ success: false, error: { message: customMessage, details: error.issues } }, { status: 400 });
    }
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }
    console.error('[AdminOfferDetailAPI] PATCH Error:', err);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
