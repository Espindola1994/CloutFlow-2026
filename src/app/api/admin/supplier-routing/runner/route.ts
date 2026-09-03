import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { plans, services, platforms } from '@/db/schema/catalog';
import { offers } from '@/db/schema/offers';
import { fulfillmentChains, fulfillmentChainServices } from '@/db/schema/fulfillment-chains';
import { supplierRateSnapshots } from '@/db/schema/supplier-routing';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import { SupplierRateMonitorService } from '@/services/supplier-rate-monitor.service';
import { CLOUTFLOW_CATALOG_PACKAGES, DEFAULT_FINANCIAL_PROTECTION_RULES, CRITICAL_CARD_CEILING_OVERRIDES } from '@/config/financial-protection.config';
import { calculateCostCeiling, calculateSupplierCost, calculateGrossProfit, calculateGrossMarginPercent } from '@/lib/routing/financial-routing';

export const dynamic = 'force-dynamic';

export const CANONICAL_SUPPLIER_ROUTING: Record<string, { primary: string; fallback1: string; fallback2: string | null }> = {
  'instagram:followers': { primary: '31714', fallback1: '31849', fallback2: '31850' },
  'instagram:likes': { primary: '31783', fallback1: '31784', fallback2: '31785' },
  'instagram:views': { primary: '26641', fallback1: '16453', fallback2: '14863' },
  'tiktok:followers': { primary: '30159', fallback1: '32771', fallback2: '33105' },
  'tiktok:likes': { primary: '31040', fallback1: '30163', fallback2: '31264' },
  'tiktok:views': { primary: '32011', fallback1: '29890', fallback2: '31761' },
  'twitter:followers': { primary: '33882', fallback1: '33608', fallback2: '33883' },
  'twitter:likes': { primary: '33478', fallback1: '33696', fallback2: null },
  'twitter:views': { primary: '29863', fallback1: '29859', fallback2: '9276' },
  'youtube:likes': { primary: '33471', fallback1: '33528', fallback2: '33529' },
  'youtube:views': { primary: '33451', fallback1: '30202', fallback2: '30751' },
};

export const TARGET_SUPPLIER_IDS = [
  '31714', '31849', '31850',
  '31783', '31784', '31785',
  '26641', '16453', '14863',
  '30159', '32771', '33105',
  '31040', '30163', '31264',
  '32011', '29890', '31761',
  '33882', '33608', '33883',
  '33478', '33696',
  '29863', '29859', '9276',
  '33471', '33528', '33529',
  '33451', '30202', '30751',
];

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key');
    if (key !== 'cloutflow_canonical_routing_2026_apply') {
      return NextResponse.json({ error: 'Unauthorized runner' }, { status: 401 });
    }

    // 1. Check Peakerr Catalog
    let peakerrServices: any[] = [];
    try {
      const pRes = await peakerrClient.getServices();
      if (Array.isArray(pRes)) {
        peakerrServices = pRes;
      }
    } catch (e: any) {
      console.error('Peakerr catalog fetch error:', e);
    }

    const peakerrMap = new Map<string, any>();
    for (const s of peakerrServices) {
      peakerrMap.set(String(s.service), s);
    }

    const catalogVerification = TARGET_SUPPLIER_IDS.map((id) => {
      const item = peakerrMap.get(id);
      return {
        id,
        name: item?.name || 'NOT_FOUND',
        category: item?.category || 'N/A',
        rate: item?.rate ? parseFloat(String(item.rate)) : null,
        min: item?.min ? parseInt(String(item.min), 10) : null,
        max: item?.max ? parseInt(String(item.max), 10) : null,
        exists: Boolean(item),
      };
    });

    // 2. Database Idempotent Fix - Execute statements one by one for Postgres driver safety
    const ddlStatements = [
      `CREATE TABLE IF NOT EXISTS "supplier_rate_snapshots" (
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
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_supplier_rate_snapshots_provider_service" 
       ON "supplier_rate_snapshots" ("provider", "supplier_service_id")`,
      `CREATE TABLE IF NOT EXISTS "fulfillment_chains" (
        "id" text PRIMARY KEY NOT NULL,
        "platform" varchar(50) NOT NULL,
        "service" varchar(50) NOT NULL,
        "variant" varchar(50) DEFAULT 'standard' NOT NULL,
        "name" varchar(100) NOT NULL,
        "active" boolean DEFAULT true NOT NULL,
        "auto_fallback" boolean DEFAULT true NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_fulfillment_chains_platform_service_variant" 
       ON "fulfillment_chains" ("platform", "service", "variant")`,
      `CREATE TABLE IF NOT EXISTS "fulfillment_chain_services" (
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
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_fulfillment_chain_services_chain_priority" 
       ON "fulfillment_chain_services" ("chain_id", "priority")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_fulfillment_chain_services_chain_provider_service" 
       ON "fulfillment_chain_services" ("chain_id", "provider_service_id")`,
      `ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "priority_service_id" varchar(255)`,
      `ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "fallback1_service_id" varchar(255)`,
      `ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "fallback2_service_id" varchar(255)`,
      `ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "minimum_gross_margin_percent" integer DEFAULT 40`,
      `ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "minimum_gross_profit_cents" bigint DEFAULT 500`,
      `ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "max_supplier_cost_absolute_cents" bigint`,
      `ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "cost_ceiling_enabled" boolean DEFAULT true`,
      `ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "manual_review_enabled" boolean DEFAULT false`,
      `ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "priority_service_id" varchar(255)`,
      `ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "fallback1_service_id" varchar(255)`,
      `ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "fallback2_service_id" varchar(255)`,
      `ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "minimum_gross_margin_percent" integer DEFAULT 40`,
      `ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "minimum_gross_profit_cents" bigint DEFAULT 500`,
      `ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "max_supplier_cost_absolute_cents" bigint`,
      `ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "cost_ceiling_enabled" boolean DEFAULT true`,
      `ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "manual_review_enabled" boolean DEFAULT false`
    ];

    for (const stmt of ddlStatements) {
      try {
        await db.execute(sql.raw(stmt));
      } catch (err: any) {
        console.error('DDL execute error:', stmt, err.message);
      }
    }

    // Clean obsolete chains
    await db.execute(sql`
      DELETE FROM "fulfillment_chains"
      WHERE LOWER("platform") NOT IN ('instagram', 'tiktok', 'twitter', 'youtube')
         OR (LOWER("platform") = 'youtube' AND LOWER("service") = 'followers')
         OR LOWER("service") = 'comments';
    `);

    let chainsSynchronized = 0;
    let plansUpdated = 0;
    let offersUpdated = 0;

    for (const [key, chainData] of Object.entries(CANONICAL_SUPPLIER_ROUTING)) {
      const [platform, service] = key.split(':');
      const chainName = `${platform.charAt(0).toUpperCase() + platform.slice(1)} ${service.charAt(0).toUpperCase() + service.slice(1)} (Standard)`;

      const existing = await db
        .select()
        .from(fulfillmentChains)
        .where(
          sql`LOWER(${fulfillmentChains.platform}) = ${platform} AND LOWER(${fulfillmentChains.service}) = ${service} AND ${fulfillmentChains.variant} = 'standard'`
        );

      let chainId = existing[0]?.id;
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

      const slots = [
        { priority: 1, serviceId: chainData.primary },
        { priority: 2, serviceId: chainData.fallback1 },
        { priority: 3, serviceId: chainData.fallback2 },
      ].filter((s) => Boolean(s.serviceId && s.serviceId.trim().length > 0));

      for (const slot of slots) {
        await db.execute(sql`
          INSERT INTO "fulfillment_chain_services" ("id", "chain_id", "provider", "provider_service_id", "priority", "active", "min_quantity", "max_quantity", "refill", "created_at", "updated_at")
          VALUES (gen_random_uuid(), ${chainId}, 'peakerr', ${slot.serviceId!.trim()}, ${slot.priority}, true, 10, 1000000, false, now(), now())
          ON CONFLICT ("chain_id", "priority") 
          DO UPDATE SET "provider_service_id" = ${slot.serviceId!.trim()}, "active" = true, "updated_at" = now();
        `);
      }

      await db.execute(sql`
        DELETE FROM "fulfillment_chain_services"
        WHERE "chain_id" = ${chainId} AND "priority" > ${slots.length};
      `);

      chainsSynchronized++;

      const pId = chainData.primary || null;
      const fb1 = chainData.fallback1 || null;
      const fb2 = chainData.fallback2 || null;

      try {
        const updatedPlanRes = await db.execute(sql`
          UPDATE "plans"
          SET 
            "priority_service_id" = ${pId},
            "fallback1_service_id" = ${fb1},
            "fallback2_service_id" = ${fb2},
            "updated_at" = now()
          WHERE "slug" LIKE ${platform + '-' + service + '%'};
        `);
        plansUpdated += Number((updatedPlanRes as any).rowCount || 0);
      } catch (planErr: any) {
        console.error('Plan update error for', key, planErr.message);
      }

      try {
        const updatedOfferRes = await db.execute(sql`
          UPDATE "offers"
          SET 
            "priority_service_id" = ${pId},
            "fallback1_service_id" = ${fb1},
            "fallback2_service_id" = ${fb2},
            "updated_at" = now()
          WHERE LOWER("platform") = ${platform} AND LOWER("service") = ${service};
        `);
        offersUpdated += Number((updatedOfferRes as any).rowCount || 0);
      } catch (offerErr: any) {
        console.error('Offer update error for', key, offerErr.message);
      }
    }

    // 3. Refresh Rates Snapshot from Provider
    const refreshResult = await SupplierRateMonitorService.refreshRatesFromProvider();
    const cachedRates = await SupplierRateMonitorService.getAllCachedRates();
    const countRes = await db.execute(sql`SELECT count(*) as cnt FROM "supplier_rate_snapshots"`);
    const snapshotsCount = Number(countRes.rows[0]?.cnt || 0);

    // 4. Calculate Cards Audit for the 66 cards
    const cardsTable: any[] = [];
    const healthCounts = { GREEN: 0, YELLOW: 0, RED: 0, UNKNOWN: 0 };
    const incompatibleCards: any[] = [];

    for (const pkg of CLOUTFLOW_CATALOG_PACKAGES) {
      const routing = CANONICAL_SUPPLIER_ROUTING[`${pkg.platform}:${pkg.service}`];
      const priorityId = routing?.primary || null;
      const fallback1Id = routing?.fallback1 || null;
      const fallback2Id = routing?.fallback2 || null;

      const ruleKey = `${pkg.platform}:${pkg.service}`;
      const defaultRule = DEFAULT_FINANCIAL_PROTECTION_RULES[ruleKey] || {
        minimumGrossMarginPercent: 40,
        minimumGrossProfitCents: 500,
      };

      const override = CRITICAL_CARD_CEILING_OVERRIDES.find(
        (o) => o.platform === pkg.platform && o.service === pkg.service && o.packageName === pkg.name
      );

      const sellingPrice = pkg.priceCents / 100;
      const minimumGrossMarginPercent = defaultRule.minimumGrossMarginPercent;
      const minimumGrossProfit = defaultRule.minimumGrossProfitCents / 100;
      const maxSupplierCostAbsolute = override ? override.maxSupplierCostAbsoluteCents / 100 : null;

      const ceiling = calculateCostCeiling({
        sellingPrice,
        minimumGrossMarginPercent,
        minimumGrossProfit,
        maxSupplierCostAbsolute,
      });

      const prioritySnapshot = priorityId ? cachedRates.get(priorityId) : undefined;
      const fallback1Snapshot = fallback1Id ? cachedRates.get(fallback1Id) : undefined;
      const fallback2Snapshot = fallback2Id ? cachedRates.get(fallback2Id) : undefined;

      const priorityRate = prioritySnapshot ? prioritySnapshot.rate : null;
      const fallback1Rate = fallback1Snapshot ? fallback1Snapshot.rate : null;
      const fallback2Rate = fallback2Snapshot ? fallback2Snapshot.rate : null;

      const priorityEstCost = priorityRate !== null ? calculateSupplierCost(pkg.quantity, priorityRate) : null;
      const fallback1EstCost = fallback1Rate !== null ? calculateSupplierCost(pkg.quantity, fallback1Rate) : null;
      const fallback2EstCost = fallback2Rate !== null ? calculateSupplierCost(pkg.quantity, fallback2Rate) : null;

      const priorityApproved = priorityEstCost !== null && priorityEstCost <= ceiling.allowedSupplierCost;
      const fallback1Approved = fallback1EstCost !== null && fallback1EstCost <= ceiling.allowedSupplierCost;
      const fallback2Approved = fallback2EstCost !== null && fallback2EstCost <= ceiling.allowedSupplierCost;

      let isPriorityIncompatibleQuantity = false;
      let ineligibilityReason: string | null = null;
      if (prioritySnapshot) {
        if (prioritySnapshot.maxQuantity && pkg.quantity > prioritySnapshot.maxQuantity) {
          isPriorityIncompatibleQuantity = true;
          ineligibilityReason = `Priority Quantity ${pkg.quantity} > Supplier Max ${prioritySnapshot.maxQuantity}`;
        } else if (prioritySnapshot.minQuantity && pkg.quantity < prioritySnapshot.minQuantity) {
          isPriorityIncompatibleQuantity = true;
          ineligibilityReason = `Priority Quantity ${pkg.quantity} < Supplier Min ${prioritySnapshot.minQuantity}`;
        }
      }

      let isFallback1IncompatibleQuantity = false;
      if (fallback1Snapshot) {
        if (fallback1Snapshot.maxQuantity && pkg.quantity > fallback1Snapshot.maxQuantity) {
          isFallback1IncompatibleQuantity = true;
        } else if (fallback1Snapshot.minQuantity && pkg.quantity < fallback1Snapshot.minQuantity) {
          isFallback1IncompatibleQuantity = true;
        }
      }

      let isFallback2IncompatibleQuantity = false;
      if (fallback2Snapshot) {
        if (fallback2Snapshot.maxQuantity && pkg.quantity > fallback2Snapshot.maxQuantity) {
          isFallback2IncompatibleQuantity = true;
        } else if (fallback2Snapshot.minQuantity && pkg.quantity < fallback2Snapshot.minQuantity) {
          isFallback2IncompatibleQuantity = true;
        }
      }

      const priorityQtyOk = !isPriorityIncompatibleQuantity;
      const fb1QtyOk = !isFallback1IncompatibleQuantity;
      const fb2QtyOk = !isFallback2IncompatibleQuantity;

      let health: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN' = 'UNKNOWN';
      if (prioritySnapshot || fallback1Snapshot) {
        if (priorityApproved && priorityQtyOk) {
          health = 'GREEN';
        } else if ((fallback1Approved && fb1QtyOk) || (fallback2Approved && fb2QtyOk)) {
          health = 'GREEN';
        } else {
          health = 'RED';
        }
      }

      healthCounts[health]++;

      if (isPriorityIncompatibleQuantity && !fb1QtyOk && !fb2QtyOk) {
        incompatibleCards.push({
          platform: pkg.platform,
          service: pkg.service,
          plan: pkg.name,
          quantity: pkg.quantity,
          priorityId,
          supplierMin: prioritySnapshot?.minQuantity,
          supplierMax: prioritySnapshot?.maxQuantity,
          reason: ineligibilityReason,
        });
      }

      cardsTable.push({
        platform: pkg.platform,
        service: pkg.service,
        plan: pkg.name,
        quantity: pkg.quantity,
        priority: priorityId,
        fallback1: fallback1Id || '--',
        fallback2: fallback2Id || '--',
        currentRate: priorityRate !== null ? `$${priorityRate.toFixed(4)}/K` : 'N/A',
        estimatedCost: priorityEstCost !== null ? `$${priorityEstCost.toFixed(2)}` : 'N/A',
        maxCostAllowed: `$${ceiling.allowedSupplierCost.toFixed(2)}`,
        routingHealth: health,
        incompatibleQuantity: isPriorityIncompatibleQuantity && !fb1QtyOk && !fb2QtyOk,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      catalogVerification,
      dbResults: {
        chainsSynchronized,
        plansUpdated,
        offersUpdated,
        ratesRefreshed: refreshResult.updatedCount,
        snapshotsCount,
      },
      healthSummary: healthCounts,
      incompatibleCount: incompatibleCards.length,
      incompatibleCards,
      cardsTable,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
