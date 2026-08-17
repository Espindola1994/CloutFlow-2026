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
});

export async function GET() {
  try {
    await requireAdmin();

    const items = await db.query.offers.findMany({
      orderBy: [desc(offers.createdAt)],
    });

    const formatted = items.map((o) => ({
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
      tag: o.badge || undefined,
      popular: o.isPopular,
      checkoutUrl: o.externalCheckoutUrl || undefined,
      perfectpayProductId: o.perfectpayProductId || undefined,
      perfectpayPlanId: o.perfectpayPlanId || undefined,
      active: o.active,
      sortOrder: o.sortOrder,
    }));

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

    const [created] = await db
      .insert(offers)
      .values({
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
      })
      .returning();

    return NextResponse.json({ success: true, data: { offer: created } }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { message: 'Invalid offer input', details: error.issues } }, { status: 400 });
    }
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }
    console.error('[AdminOffersAPI] POST Error:', err);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
