import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { plans, services, platforms } from '@/db/schema/catalog';
import { offers } from '@/db/schema/offers';
import { fulfillmentChains, fulfillmentChainServices } from '@/db/schema/fulfillment-chains';
import { supplierRateSnapshots } from '@/db/schema/supplier-routing';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import { SupplierRateMonitorService } from '@/services/supplier-rate-monitor.service';
import { CLOUTFLOW_CATALOG_PACKAGES } from '@/config/financial-protection.config';

export const dynamic = 'force-dynamic';

/**
 * CANONICAL_SUPPLIER_CHAINS: Commercial selection approved for CloutFlow.
 * 11 approved platform:service combinations for the 66 cards.
 * Key: `${platform}:${service}`
 */
const DEFAULT_SUPPLIER_CHAINS: Record<string, { primary: string; fallback1: string; fallback2: string }> = {
  'instagram:followers': { primary: '31714', fallback1: '31849', fallback2: '31850' },
  'instagram:likes': { primary: '31783', fallback1: '31784', fallback2: '31785' },
  'instagram:views': { primary: '26641', fallback1: '16453', fallback2: '14863' },
  'tiktok:followers': { primary: '30159', fallback1: '32771', fallback2: '33105' },
  'tiktok:likes': { primary: '31040', fallback1: '30163', fallback2: '31264' },
  'tiktok:views': { primary: '32011', fallback1: '29890', fallback2: '31761' },
  'twitter:followers': { primary: '33882', fallback1: '33608', fallback2: '33883' },
  'twitter:likes': { primary: '33478', fallback1: '33696', fallback2: '' },
  'twitter:views': { primary: '29863', fallback1: '29859', fallback2: '9276' },
  'youtube:likes': { primary: '33471', fallback1: '33528', fallback2: '33529' },
  'youtube:views': { primary: '33451', fallback1: '30202', fallback2: '30751' },
};

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const results: any = {
      tablesCreated: [],
      plansUpdated: 0,
      offersUpdated: 0,
      fulfillmentChainsSynchronized: 0,
      ratesRefreshed: 0,
      snapshotsCount: 0,
      errors: [],
    };

    // 1. Ensure required tables exist in production DB (Idempotent DDL)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "supplier_rate_snapshots" (
        "id" text PRIMARY KEY NOT NULL,
        "provider" varchar(50) DEFAULT 'peakerr' NOT NULL,
        "supplier_service_id" varchar(255) NOT NULL,
        "rate" numeric(12, 6) NOT NULL,
        "currency" varchar(10) DEFAULT 'USD' NOT NULL,
        "min_quantity" integer,
        "max_quantity" integer,
        "previous_rate" numeric(12, 6),
        "last_price_change_percent" numeric(7, 2),
        "fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_supplier_rate_snapshots_provider_service" 
      ON "supplier_rate_snapshots" ("provider", "supplier_service_id");
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "admin_alerts" (
        "id" text PRIMARY KEY NOT NULL,
        "type" varchar(50) NOT NULL,
        "severity" varchar(20) DEFAULT 'WARNING' NOT NULL,
        "title" varchar(255) NOT NULL,
        "message" text NOT NULL,
        "metadata" jsonb,
        "resolved" boolean DEFAULT false NOT NULL,
        "resolved_by" text,
        "resolved_at" timestamp with time zone,
        "dismissed" boolean DEFAULT false NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "supplier_attempts" (
        "id" text PRIMARY KEY NOT NULL,
        "order_id" text NOT NULL,
        "supplier_service_id" varchar(255) NOT NULL,
        "supplier_position" varchar(50) NOT NULL,
        "supplier_rate" numeric(12, 6) NOT NULL,
        "supplier_calculated_cost" numeric(12, 4) NOT NULL,
        "selling_price" numeric(12, 4) NOT NULL,
        "gross_profit" numeric(12, 4) NOT NULL,
        "gross_margin_percent" numeric(7, 2) NOT NULL,
        "allowed_supplier_cost" numeric(12, 4) NOT NULL,
        "decision" varchar(50) NOT NULL,
        "reason" text NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    // Ensure columns exist on plans and offers
    await db.execute(sql`
      ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "priority_service_id" varchar(255);
      ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "fallback1_service_id" varchar(255);
      ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "fallback2_service_id" varchar(255);
      ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "minimum_gross_margin_percent" integer DEFAULT 40;
      ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "minimum_gross_profit_cents" bigint DEFAULT 500;
      ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "max_supplier_cost_absolute_cents" bigint;
      ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "cost_ceiling_enabled" boolean DEFAULT true NOT NULL;
      ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "manual_review_enabled" boolean DEFAULT false NOT NULL;

      ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "priority_service_id" varchar(255);
      ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "fallback1_service_id" varchar(255);
      ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "fallback2_service_id" varchar(255);
      ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "minimum_gross_margin_percent" integer DEFAULT 40;
      ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "minimum_gross_profit_cents" bigint DEFAULT 500;
      ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "max_supplier_cost_absolute_cents" bigint;
      ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "cost_ceiling_enabled" boolean DEFAULT true NOT NULL;
      ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "manual_review_enabled" boolean DEFAULT false NOT NULL;
    `);

    // Ensure fulfillment chains tables exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "fulfillment_chains" (
        "id" text PRIMARY KEY NOT NULL,
        "platform" varchar(50) NOT NULL,
        "service" varchar(50) NOT NULL,
        "variant" varchar(50) DEFAULT 'standard' NOT NULL,
        "name" varchar(100) NOT NULL,
        "active" boolean DEFAULT true NOT NULL,
        "auto_fallback" boolean DEFAULT true NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_fulfillment_chains_platform_service_variant" 
      ON "fulfillment_chains" ("platform", "service", "variant");

      CREATE TABLE IF NOT EXISTS "fulfillment_chain_services" (
        "id" text PRIMARY KEY NOT NULL,
        "chain_id" text NOT NULL REFERENCES "fulfillment_chains"("id") ON DELETE CASCADE,
        "provider" varchar(50) DEFAULT 'peakerr' NOT NULL,
        "provider_service_id" varchar(255) NOT NULL,
        "priority" integer NOT NULL,
        "active" boolean DEFAULT true NOT NULL,
        "min_quantity" integer DEFAULT 10 NOT NULL,
        "max_quantity" integer DEFAULT 1000000 NOT NULL,
        "refill" boolean DEFAULT false NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_fulfillment_chain_services_chain_priority" 
      ON "fulfillment_chain_services" ("chain_id", "priority");
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_fulfillment_chain_services_chain_provider_service" 
      ON "fulfillment_chain_services" ("chain_id", "provider_service_id");
    `);

    results.tablesCreated = [
      'supplier_rate_snapshots',
      'admin_alerts',
      'supplier_attempts',
      'fulfillment_chains',
      'fulfillment_chain_services',
    ];

    // 2. Restore / Populate fulfillment_chains and fulfillment_chain_services
    for (const [key, chainData] of Object.entries(DEFAULT_SUPPLIER_CHAINS)) {
      const [platform, service] = key.split(':');
      const chainName = `${platform.charAt(0).toUpperCase() + platform.slice(1)} ${service.charAt(0).toUpperCase() + service.slice(1)} (Standard)`;

      // Upsert chain
      const existingChains = await db
        .select()
        .from(fulfillmentChains)
        .where(
          sql`LOWER(${fulfillmentChains.platform}) = ${platform} AND LOWER(${fulfillmentChains.service}) = ${service} AND ${fulfillmentChains.variant} = 'standard'`
        );

      let chainId = existingChains[0]?.id;
      if (!chainId) {
        const [inserted] = await db
          .insert(fulfillmentChains)
          .values({
            platform,
            service,
            variant: 'standard',
            name: chainName,
            active: true,
            autoFallback: true,
          })
          .returning();
        chainId = inserted.id;
      }

      // Upsert slots: Priority (1), Fallback 1 (2), Fallback 2 (3)
      const slots = [
        { priority: 1, serviceId: chainData.primary },
        { priority: 2, serviceId: chainData.fallback1 },
        { priority: 3, serviceId: chainData.fallback2 },
      ].filter((s) => Boolean(s.serviceId && s.serviceId.trim().length > 0));

      for (const slot of slots) {
        await db.execute(sql`
          INSERT INTO "fulfillment_chain_services" ("id", "chain_id", "provider", "provider_service_id", "priority", "active", "min_quantity", "max_quantity", "refill", "created_at", "updated_at")
          VALUES (gen_random_uuid(), ${chainId}, 'peakerr', ${slot.serviceId.trim()}, ${slot.priority}, true, 10, 1000000, false, now(), now())
          ON CONFLICT ("chain_id", "priority") 
          DO UPDATE SET "provider_service_id" = ${slot.serviceId.trim()}, "active" = true, "updated_at" = now();
        `);
      }

      // Clean up any old fulfillment chain services that are not in canonical list
      await db.execute(sql`
        DELETE FROM "fulfillment_chain_services"
        WHERE "chain_id" = ${chainId} AND "priority" > ${slots.length};
      `);

      results.fulfillmentChainsSynchronized++;
    }

    // Remove inactive/unsupported chains (such as comments, youtube:followers)
    await db.execute(sql`
      DELETE FROM "fulfillment_chains"
      WHERE LOWER("platform") NOT IN ('instagram', 'tiktok', 'twitter', 'youtube')
         OR (LOWER("platform") = 'youtube' AND LOWER("service") = 'followers')
         OR LOWER("service") = 'comments';
    `);
    for (const [key, chainData] of Object.entries(DEFAULT_SUPPLIER_CHAINS)) {
      const [platform, service] = key.split(':');
      const pId = chainData.primary || null;
      const fb1 = chainData.fallback1 || null;
      const fb2 = chainData.fallback2 || null;

      // Update plans for this platform/service (Explicit canonical override)
      const updatedPlanRes = await db.execute(sql`
        UPDATE "plans"
        SET 
          "priority_service_id" = ${pId},
          "fallback1_service_id" = ${fb1},
          "fallback2_service_id" = ${fb2},
          "updated_at" = now()
        WHERE "service_id" IN (
          SELECT s."id" FROM "services" s
          JOIN "platforms" p ON s."platform_id" = p."id"
          WHERE LOWER(p."slug") = ${platform} AND LOWER(s."slug") LIKE ${'%' + service + '%'}
        ) OR "slug" LIKE ${platform + '-' + service + '%'};
      `);
      results.plansUpdated += Number((updatedPlanRes as any).rowCount || 0);

      // Update offers for this platform/service
      const updatedOfferRes = await db.execute(sql`
        UPDATE "offers"
        SET 
          "priority_service_id" = ${pId},
          "fallback1_service_id" = ${fb1},
          "fallback2_service_id" = ${fb2},
          "updated_at" = now()
        WHERE LOWER("platform") = ${platform} AND LOWER("service") = ${service};
      `);
      results.offersUpdated += Number((updatedOfferRes as any).rowCount || 0);
    }

    // 4. Perform Rate Refresh from Peakerr Catalog into supplier_rate_snapshots
    const refreshResult = await SupplierRateMonitorService.refreshRatesFromProvider();
    results.ratesRefreshed = refreshResult.updatedCount;
    if (refreshResult.errors && refreshResult.errors.length > 0) {
      results.errors.push(...refreshResult.errors);
    }

    // Count snapshots in DB
    const snapshotsRes = await db.execute(sql`SELECT count(*) as cnt FROM "supplier_rate_snapshots"`);
    results.snapshotsCount = Number(snapshotsRes.rows[0]?.cnt || 0);

    return NextResponse.json({
      success: true,
      code: 'DATABASE_SETUP_AND_SEED_COMPLETED',
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: any) {
    console.error('[DatabaseSetupAPI] Error:', error);
    return NextResponse.json(
      {
        success: false,
        code: 'SETUP_FAILED',
        error: error.message || 'Setup execution failed',
      },
      { status: 500 }
    );
  }
}
