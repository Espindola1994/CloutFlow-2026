import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { fulfillmentChains, fulfillmentChainServices } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const chainServiceItemSchema = z.object({
  provider: z.string().default('peakerr'),
  providerServiceId: z.string().min(1, 'Provider Service ID is required'),
  priority: z.number().int().min(1).max(3),
  active: z.boolean().default(true),
  minQuantity: z.number().int().nonnegative().default(10),
  maxQuantity: z.number().int().nonnegative().default(1000000),
  refill: z.boolean().default(false),
});

const upsertChainSchema = z.object({
  platform: z.enum(['instagram', 'tiktok', 'twitter', 'youtube']),
  service: z.enum(['followers', 'likes', 'views', 'comments']),
  variant: z.string().default('standard'),
  name: z.string().min(1),
  active: z.boolean().default(true),
  autoFallback: z.boolean().default(true),
  services: z.array(chainServiceItemSchema).min(1, 'At least one service (Primary) is required'),
}).superRefine((data, ctx) => {
  // Validate duplicate priority within the same chain payload
  const priorities = data.services.map((s) => s.priority);
  const uniquePriorities = new Set(priorities);
  if (uniquePriorities.size !== priorities.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Duplicate priority found. Each slot (Primary=1, Fallback 1=2, Fallback 2=3) must have a unique priority.',
      path: ['services'],
    });
  }

  // Validate duplicate provider_service_id within the same chain payload
  const serviceIds = data.services.map((s) => s.providerServiceId.trim());
  const uniqueServiceIds = new Set(serviceIds);
  if (uniqueServiceIds.size !== serviceIds.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Duplicate Peakerr Service ID found in the same chain. Each priority must use a distinct service ID.',
      path: ['services'],
    });
  }
});

export async function GET() {
  try {
    await requireAdmin();

    const allChains = await db.select().from(fulfillmentChains).orderBy(desc(fulfillmentChains.createdAt));
    const allServices = await db.select().from(fulfillmentChainServices);

    const formatted = allChains.map((c) => {
      const srvs = allServices
        .filter((s) => s.chainId === c.id)
        .sort((a, b) => a.priority - b.priority);
      return {
        ...c,
        services: srvs,
      };
    });

    return NextResponse.json({ success: true, data: { items: formatted } });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }
    console.error('[AdminFulfillmentChainsAPI] GET Error:', err);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const data = upsertChainSchema.parse(body);

    const result = await db.transaction(async (tx) => {
      // 1. Check if chain already exists for this (platform, service, variant)
      const [existingChain] = await tx.select().from(fulfillmentChains).where(
        and(
          eq(fulfillmentChains.platform, data.platform),
          eq(fulfillmentChains.service, data.service),
          eq(fulfillmentChains.variant, data.variant)
        )
      ).limit(1);

      let chainRecord;

      if (existingChain) {
        // Update existing chain
        const [updated] = await tx.update(fulfillmentChains)
          .set({
            name: data.name,
            active: data.active,
            autoFallback: data.autoFallback,
            updatedAt: new Date(),
          })
          .where(eq(fulfillmentChains.id, existingChain.id))
          .returning();
        chainRecord = updated;

        // Delete old services for this chain and re-insert to guarantee clean state
        await tx.delete(fulfillmentChainServices).where(eq(fulfillmentChainServices.chainId, existingChain.id));
      } else {
        // Insert new chain
        const [inserted] = await tx.insert(fulfillmentChains)
          .values({
            platform: data.platform,
            service: data.service,
            variant: data.variant,
            name: data.name,
            active: data.active,
            autoFallback: data.autoFallback,
          })
          .returning();
        chainRecord = inserted;
      }

      // 2. Insert new chain services with proper chainId
      const servicesToInsert = data.services.map((s) => ({
        chainId: chainRecord.id,
        provider: s.provider,
        providerServiceId: s.providerServiceId.trim(),
        priority: s.priority,
        active: s.active,
        minQuantity: s.minQuantity,
        maxQuantity: s.maxQuantity,
        refill: s.refill,
      }));

      const newServices = await tx.insert(fulfillmentChainServices).values(servicesToInsert).returning();

      return {
        ...chainRecord,
        services: newServices.sort((a, b) => a.priority - b.priority),
      };
    });

    return NextResponse.json({ success: true, data: { chain: result } }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { message: error.issues[0]?.message || 'Invalid payload', details: error.issues } }, { status: 400 });
    }
    const err = error as any;
    if (err.code === '23505') {
      return NextResponse.json({ success: false, error: { message: 'Database constraint violation: duplicate chain or duplicate service priority detected.' } }, { status: 409 });
    }
    const standardErr = error as Error;
    if (standardErr.message === 'Unauthorized' || standardErr.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }
    console.error('[AdminFulfillmentChainsAPI] POST Error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

