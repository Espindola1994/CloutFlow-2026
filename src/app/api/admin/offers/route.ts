import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { offers } from '@/db/schema';
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';

const offerCreateSchema = z.object({
  platform: z.enum(['instagram', 'tiktok', 'twitter', 'youtube']),
  service: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().int().positive(),
  bonusQuantity: z.number().int().nonnegative().optional().default(0),
  priceCents: z.number().int().nonnegative(),
  oldPriceCents: z.number().int().nonnegative().optional(),
  currency: z.string().default('USD'),
  badge: z.string().optional(),
  isPopular: z.boolean().default(false),
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
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  benefits: z.array(z.string()).optional().nullable(),
  ctaText: z.string().optional().nullable(),
});

export async function GET() {
  try {
    await requireAdmin();

    const items = await db.query.offers.findMany({
      orderBy: [desc(offers.createdAt)],
    });

    const formatted = items.map((o) => {
      const meta = (o.metadata as Record<string, any>) || {};
      return {
        id: o.id,
        platform: o.platform as any,
        service: o.service,
        name: o.name,
        slug: o.slug,
        description: o.description || undefined,
        quantity: o.quantity,
        bonus: o.bonusQuantity || 0,
        price: Number(o.priceCents) / 100,
        oldPrice: o.oldPriceCents ? Number(o.oldPriceCents) / 100 : undefined,
        currency: o.currency,
        tag: o.badge || meta.badge || undefined,
        popular: o.isPopular || Boolean(meta.isPopular || meta.featured),
        checkoutUrl: o.externalCheckoutUrl || undefined,
        perfectpayProductId: o.perfectpayProductId || undefined,
        perfectpayPlanId: o.perfectpayPlanId || undefined,
        active: o.active,
        sortOrder: o.sortOrder,
        benefits: Array.isArray(meta.benefits) ? meta.benefits : undefined,
        ctaText: typeof meta.ctaText === 'string' ? meta.ctaText : undefined,
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
    await requireAdmin();

    const body = await request.json();
    const data = offerCreateSchema.parse(body);

    const payload: Record<string, any> = {
      platform: data.platform,
      service: data.service,
      name: data.name,
      slug: data.slug,
      description: data.description,
      quantity: data.quantity,
      bonusQuantity: data.bonusQuantity,
      priceCents: data.priceCents,
      oldPriceCents: data.oldPriceCents,
      currency: data.currency,
      badge: data.badge,
      isPopular: data.isPopular,
      externalCheckoutUrl: data.externalCheckoutUrl || null,
      perfectpayProductId: data.perfectpayProductId ? data.perfectpayProductId.trim() : null,
      perfectpayPlanId: data.perfectpayPlanId ? data.perfectpayPlanId.trim() : null,
      active: data.active,
      sortOrder: data.sortOrder,
    };

    const metadata: Record<string, any> = {};
    if (data.benefits) metadata.benefits = data.benefits;
    if (data.ctaText) metadata.ctaText = data.ctaText;
    if (Object.keys(metadata).length > 0) {
      payload.metadata = metadata;
    }

    const [created] = await db
      .insert(offers)
      .values(payload as any)
      .returning();

    return NextResponse.json({ success: true, data: { offer: created } }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      let customMessage = 'Invalid offer input';
      if (firstIssue) {
        const pathStr = firstIssue.path.join('.');
        if (pathStr.includes('quantity')) {
          customMessage = 'Quantity must be a positive integer.';
        } else if (pathStr.includes('externalCheckoutUrl')) {
          customMessage = 'External checkout URL must be a valid secure URL (https://).';
        } else if (pathStr.includes('priceCents')) {
          customMessage = 'Price is invalid or missing.';
        } else if (pathStr.includes('name')) {
          customMessage = 'Offer name is required.';
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
    console.error('[AdminOffersAPI] POST Error:', err);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
