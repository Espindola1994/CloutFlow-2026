import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { plans, services, platforms } from '@/db/schema/catalog';
import { offers } from '@/db/schema/offers';
import { fulfillmentChains, fulfillmentChainServices } from '@/db/schema/fulfillment-chains';
import { supplierRateSnapshots } from '@/db/schema/supplier-routing';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import { CLOUTFLOW_CATALOG_PACKAGES } from '@/config/financial-protection.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    // 1. Check Tables Existence
    const tablesCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('plans', 'offers', 'fulfillment_chains', 'fulfillment_chain_services', 'supplier_rate_snapshots', 'admin_alerts', 'supplier_attempts')
    `);
    const existingTableNames = (tablesCheck.rows || []).map((r: any) => r.table_name);

    // 2. Count configured/null/empty supplier IDs in plans
    let configuredCount = 0;
    let nullCount = 0;
    let emptyCount = 0;

    let dbPlans: any[] = [];
    try {
      dbPlans = await db
        .select({
          id: plans.id,
          name: plans.name,
          slug: plans.slug,
          quantity: plans.quantity,
          priorityServiceId: plans.priorityServiceId,
          fallback1ServiceId: plans.fallback1ServiceId,
          fallback2ServiceId: plans.fallback2ServiceId,
          serviceSlug: services.slug,
          platformSlug: platforms.slug,
        })
        .from(plans)
        .leftJoin(services, sql`${plans.serviceId} = ${services.id}`)
        .leftJoin(platforms, sql`${services.platformId} = ${platforms.id}`);
    } catch (e: any) {
      console.error('Error fetching plans in diagnostic:', e);
    }

    // Check against 66 catalog packages
    const sampleCards: Record<string, any> = {};
    const targetCardNames = [
      'instagram:followers:Starter',
      'instagram:followers:Max',
      'tiktok:followers:Starter',
      'twitter:followers:Starter',
      'youtube:views:Max',
    ];

    for (const pkg of CLOUTFLOW_CATALOG_PACKAGES) {
      const dbMatch = dbPlans.find(
        (p) =>
          p.platformSlug === pkg.platform &&
          p.serviceSlug === pkg.service &&
          (p.name === pkg.name || p.quantity === pkg.quantity)
      );

      const pId = dbMatch?.priorityServiceId;
      if (pId === null || pId === undefined) {
        nullCount++;
      } else if (String(pId).trim() === '') {
        emptyCount++;
      } else {
        configuredCount++;
      }

      const key = `${pkg.platform}:${pkg.service}:${pkg.name}`;
      if (targetCardNames.includes(key)) {
        sampleCards[key] = {
          planId: dbMatch?.id || null,
          priorityServiceId: dbMatch?.priorityServiceId || null,
          fallback1ServiceId: dbMatch?.fallback1ServiceId || null,
          fallback2ServiceId: dbMatch?.fallback2ServiceId || null,
        };
      }
    }

    // 3. Test Peakerr Read-Only (getServices)
    const apiKeyPresent = peakerrClient.isConfigured();
    let peakerrStatus: any = {
      isConfigured: apiKeyPresent,
      httpOk: false,
      servicesCount: 0,
      sampleServices: [],
      error: null,
    };

    if (apiKeyPresent) {
      try {
        const servicesRes = await peakerrClient.getServices();
        if (Array.isArray(servicesRes)) {
          peakerrStatus.httpOk = true;
          peakerrStatus.servicesCount = servicesRes.length;
          peakerrStatus.sampleServices = servicesRes.slice(0, 5).map((s) => ({
            service: s.service,
            name: s.name,
            rate: s.rate,
            min: s.min,
            max: s.max,
            category: s.category,
          }));
        } else {
          peakerrStatus.error = (servicesRes as any)?.error || 'Non-array response from Peakerr';
        }
      } catch (err: any) {
        peakerrStatus.error = err.message || String(err);
      }
    }

    // 4. Check existing fulfillment chains
    let chainsInDb: any[] = [];
    if (existingTableNames.includes('fulfillment_chains')) {
      try {
        const cList = await db.select().from(fulfillmentChains);
        const sList = await db.select().from(fulfillmentChainServices);
        chainsInDb = cList.map((c) => ({
          ...c,
          services: sList.filter((s) => s.chainId === c.id),
        }));
      } catch (e: any) {
        console.error('Error reading chains in diagnostic:', e);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tables: existingTableNames,
      totalCatalogCards: CLOUTFLOW_CATALOG_PACKAGES.length,
      supplierIdCounts: {
        configured: configuredCount,
        null: nullCount,
        empty: emptyCount,
      },
      sampleCards,
      peakerr: peakerrStatus,
      chainsCount: chainsInDb.length,
      chains: chainsInDb,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Diagnostic failed' },
      { status: 500 }
    );
  }
}
