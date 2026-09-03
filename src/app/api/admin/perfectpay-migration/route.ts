import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { offers } from '@/db/schema/offers';
import { OFFICIAL_PERFECTPAY_66_DATASET } from '@/config/official-perfectpay-dataset';
import { validatePerfectPayDataset } from '@/config/validate-perfectpay-dataset';
import { eq, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Audit snapshot interface for each offer before / after update
 */
export interface OfferSnapshotItem {
  id: string;
  platform: string;
  service: string;
  name: string;
  quantity: number;
  bonusQuantity: number;
  priceCents: number;
  perfectpayProductId: string | null;
  perfectpayPlanId: string | null;
  externalCheckoutUrl: string | null;
  syncHome: boolean;
  syncOfferStep3: boolean;
  active: boolean;
  priorityServiceId: string | null;
  fallback1ServiceId: string | null;
  fallback2ServiceId: string | null;
  minimumGrossMarginPercent: number | null;
  minimumGrossProfitCents: number | null;
  maxSupplierCostAbsoluteCents: number | null;
  costCeilingEnabled: boolean;
  manualReviewEnabled: boolean;
  updatedAt: string;
}

/**
 * GET: Performs read-only diagnostic and generates logical snapshot of the 66 records in database
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    // 1. Fetch all offers
    const allOffers = await db.select().from(offers);
    
    // 2. Pre-write dataset validation
    const datasetValidation = validatePerfectPayDataset(OFFICIAL_PERFECTPAY_66_DATASET);

    // 3. Current database breakdown
    const platformCounts: Record<string, number> = {
      instagram: 0,
      tiktok: 0,
      twitter: 0,
      youtube: 0,
    };
    let youtubeFollowersCount = 0;
    let perfectpayProductCount = 0;
    let perfectpayPlanCount = 0;
    let perfectpayUrlCount = 0;
    let readyCount = 0;
    let incompleteCount = 0;
    let missingCount = 0;

    const offerSnapshots: OfferSnapshotItem[] = [];
    const identityMap = new Map<string, typeof allOffers[0]>();
    const duplicateIdentities: string[] = [];

    for (const off of allOffers) {
      const idKey = `${off.platform.toLowerCase()}:${off.service.toLowerCase()}:${off.name.toLowerCase()}`;
      if (identityMap.has(idKey)) {
        duplicateIdentities.push(idKey);
      } else {
        identityMap.set(idKey, off);
      }

      if (off.platform in platformCounts) {
        platformCounts[off.platform]++;
      }
      if (off.platform === 'youtube' && off.service === 'followers') {
        youtubeFollowersCount++;
      }

      const hasProd = Boolean(off.perfectpayProductId);
      const hasPlan = Boolean(off.perfectpayPlanId);
      const hasUrl = Boolean(off.externalCheckoutUrl);

      if (hasProd) perfectpayProductCount++;
      if (hasPlan) perfectpayPlanCount++;
      if (hasUrl) perfectpayUrlCount++;

      if (hasProd && hasPlan && hasUrl) {
        readyCount++;
      } else if (hasProd || hasPlan || hasUrl) {
        incompleteCount++;
      } else {
        missingCount++;
      }

      offerSnapshots.push({
        id: off.id,
        platform: off.platform,
        service: off.service,
        name: off.name,
        quantity: off.quantity,
        bonusQuantity: off.bonusQuantity,
        priceCents: Number(off.priceCents),
        perfectpayProductId: off.perfectpayProductId,
        perfectpayPlanId: off.perfectpayPlanId,
        externalCheckoutUrl: off.externalCheckoutUrl,
        syncHome: off.syncHome,
        syncOfferStep3: off.syncOfferStep3,
        active: off.active,
        priorityServiceId: off.priorityServiceId,
        fallback1ServiceId: off.fallback1ServiceId,
        fallback2ServiceId: off.fallback2ServiceId,
        minimumGrossMarginPercent: off.minimumGrossMarginPercent,
        minimumGrossProfitCents: off.minimumGrossProfitCents ? Number(off.minimumGrossProfitCents) : null,
        maxSupplierCostAbsoluteCents: off.maxSupplierCostAbsoluteCents ? Number(off.maxSupplierCostAbsoluteCents) : null,
        costCeilingEnabled: off.costCeilingEnabled,
        manualReviewEnabled: off.manualReviewEnabled,
        updatedAt: off.updatedAt ? new Date(off.updatedAt).toISOString() : '',
      });
    }

    // Check missing canonical identities
    const missingIdentities: string[] = [];
    for (const datasetItem of OFFICIAL_PERFECTPAY_66_DATASET) {
      const idKey = `${datasetItem.platform}:${datasetItem.service}:${datasetItem.plan}`.toLowerCase();
      if (!identityMap.has(idKey)) {
        missingIdentities.push(idKey);
      }
    }

    return NextResponse.json({
      success: true,
      diagnostic: {
        totalDbOffers: allOffers.length,
        canonicalIdentitiesCount: identityMap.size,
        platformCounts,
        youtubeFollowersCount,
        duplicateIdentities,
        missingIdentities,
        perfectpayCounts: {
          productCodeConfigured: perfectpayProductCount,
          planCodeConfigured: perfectpayPlanCount,
          checkoutUrlConfigured: perfectpayUrlCount,
          ready: readyCount,
          incomplete: incompleteCount,
          missing: missingCount,
        },
        datasetValidation,
      },
      snapshot: offerSnapshots,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Diagnostic failed' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

/**
 * POST: Transactional update of exactly the 66 PerfectPay checkouts
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    // 1. Strict Dataset Pre-Validation
    const datasetValidation = validatePerfectPayDataset(OFFICIAL_PERFECTPAY_66_DATASET);
    if (!datasetValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dataset pre-validation failed. Aborting database write.',
          details: datasetValidation.errors,
        },
        { status: 400 }
      );
    }

    // 2. Fetch current state before update for snapshot & matching
    const currentOffers = await db.select().from(offers);
    const initialMap = new Map<string, typeof currentOffers[0]>();
    const duplicateCheck = new Set<string>();

    for (const off of currentOffers) {
      const idKey = `${off.platform.toLowerCase()}:${off.service.toLowerCase()}:${off.name.toLowerCase()}`;
      if (duplicateCheck.has(idKey)) {
        return NextResponse.json(
          {
            success: false,
            error: `Duplicate identity in DB: ${idKey}. Aborting to avoid non-deterministic update.`,
          },
          { status: 409 }
        );
      }
      duplicateCheck.add(idKey);
      initialMap.set(idKey, off);
    }

    // Verify all 66 canonical dataset identities exist in the DB
    const missingDbIdentities: string[] = [];
    for (const item of OFFICIAL_PERFECTPAY_66_DATASET) {
      const idKey = `${item.platform}:${item.service}:${item.plan}`.toLowerCase();
      if (!initialMap.has(idKey)) {
        missingDbIdentities.push(idKey);
      }
    }

    if (missingDbIdentities.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing identities in database: ${missingDbIdentities.join(', ')}. Aborting.`,
        },
        { status: 422 }
      );
    }

    // 3. Before Snapshot
    const beforeSnapshot: OfferSnapshotItem[] = currentOffers.map((off) => ({
      id: off.id,
      platform: off.platform,
      service: off.service,
      name: off.name,
      quantity: off.quantity,
      bonusQuantity: off.bonusQuantity,
      priceCents: Number(off.priceCents),
      perfectpayProductId: off.perfectpayProductId,
      perfectpayPlanId: off.perfectpayPlanId,
      externalCheckoutUrl: off.externalCheckoutUrl,
      syncHome: off.syncHome,
      syncOfferStep3: off.syncOfferStep3,
      active: off.active,
      priorityServiceId: off.priorityServiceId,
      fallback1ServiceId: off.fallback1ServiceId,
      fallback2ServiceId: off.fallback2ServiceId,
      minimumGrossMarginPercent: off.minimumGrossMarginPercent,
      minimumGrossProfitCents: off.minimumGrossProfitCents ? Number(off.minimumGrossProfitCents) : null,
      maxSupplierCostAbsoluteCents: off.maxSupplierCostAbsoluteCents ? Number(off.maxSupplierCostAbsoluteCents) : null,
      costCeilingEnabled: off.costCeilingEnabled,
      manualReviewEnabled: off.manualReviewEnabled,
      updatedAt: off.updatedAt ? new Date(off.updatedAt).toISOString() : '',
    }));

    // 4. Perform Transactional Update
    const updateResults: { idKey: string; id: string; rowsAffected: number }[] = [];

    await db.transaction(async (tx) => {
      for (const item of OFFICIAL_PERFECTPAY_66_DATASET) {
        const idKey = `${item.platform}:${item.service}:${item.plan}`.toLowerCase();
        const existing = initialMap.get(idKey);
        if (!existing) {
          throw new Error(`Transaction aborted: identity not found: ${idKey}`);
        }

        const updateResult = await tx
          .update(offers)
          .set({
            perfectpayProductId: item.productCode,
            perfectpayPlanId: item.planCode,
            externalCheckoutUrl: item.checkoutUrl,
            updatedAt: new Date(),
          })
          .where(eq(offers.id, existing.id))
          .returning({ id: offers.id });

        if (updateResult.length !== 1) {
          throw new Error(
            `Transaction aborted: update on identity ${idKey} affected ${updateResult.length} rows (expected exactly 1).`
          );
        }

        updateResults.push({
          idKey,
          id: existing.id,
          rowsAffected: updateResult.length,
        });
      }
    });

    // 5. Post-Update Audit & Verification
    const updatedOffers = await db.select().from(offers);
    const afterSnapshot: OfferSnapshotItem[] = updatedOffers.map((off) => ({
      id: off.id,
      platform: off.platform,
      service: off.service,
      name: off.name,
      quantity: off.quantity,
      bonusQuantity: off.bonusQuantity,
      priceCents: Number(off.priceCents),
      perfectpayProductId: off.perfectpayProductId,
      perfectpayPlanId: off.perfectpayPlanId,
      externalCheckoutUrl: off.externalCheckoutUrl,
      syncHome: off.syncHome,
      syncOfferStep3: off.syncOfferStep3,
      active: off.active,
      priorityServiceId: off.priorityServiceId,
      fallback1ServiceId: off.fallback1ServiceId,
      fallback2ServiceId: off.fallback2ServiceId,
      minimumGrossMarginPercent: off.minimumGrossMarginPercent,
      minimumGrossProfitCents: off.minimumGrossProfitCents ? Number(off.minimumGrossProfitCents) : null,
      maxSupplierCostAbsoluteCents: off.maxSupplierCostAbsoluteCents ? Number(off.maxSupplierCostAbsoluteCents) : null,
      costCeilingEnabled: off.costCeilingEnabled,
      manualReviewEnabled: off.manualReviewEnabled,
      updatedAt: off.updatedAt ? new Date(off.updatedAt).toISOString() : '',
    }));

    // Before/After Diff Verification: ONLY perfectpayProductId, perfectpayPlanId, externalCheckoutUrl, updatedAt may change
    const unexpectedChanges: string[] = [];
    const beforeMap = new Map(beforeSnapshot.map((s) => [s.id, s]));

    let totalReady = 0;
    let totalIncomplete = 0;
    let totalMissing = 0;
    let totalProductConfigured = 0;
    let totalPlanConfigured = 0;
    let totalUrlConfigured = 0;

    for (const after of afterSnapshot) {
      const before = beforeMap.get(after.id);
      if (!before) {
        unexpectedChanges.push(`New record detected after update: ID ${after.id}`);
        continue;
      }

      if (after.platform !== before.platform) unexpectedChanges.push(`ID ${after.id} platform modified`);
      if (after.service !== before.service) unexpectedChanges.push(`ID ${after.id} service modified`);
      if (after.name !== before.name) unexpectedChanges.push(`ID ${after.id} name modified`);
      if (after.quantity !== before.quantity) unexpectedChanges.push(`ID ${after.id} quantity modified`);
      if (after.bonusQuantity !== before.bonusQuantity) unexpectedChanges.push(`ID ${after.id} bonusQuantity modified`);
      if (after.priceCents !== before.priceCents) unexpectedChanges.push(`ID ${after.id} priceCents modified`);
      if (after.syncHome !== before.syncHome) unexpectedChanges.push(`ID ${after.id} syncHome modified`);
      if (after.syncOfferStep3 !== before.syncOfferStep3) unexpectedChanges.push(`ID ${after.id} syncOfferStep3 modified`);
      if (after.active !== before.active) unexpectedChanges.push(`ID ${after.id} active modified`);
      if (after.priorityServiceId !== before.priorityServiceId) unexpectedChanges.push(`ID ${after.id} priorityServiceId modified`);
      if (after.fallback1ServiceId !== before.fallback1ServiceId) unexpectedChanges.push(`ID ${after.id} fallback1ServiceId modified`);
      if (after.fallback2ServiceId !== before.fallback2ServiceId) unexpectedChanges.push(`ID ${after.id} fallback2ServiceId modified`);
      if (after.minimumGrossMarginPercent !== before.minimumGrossMarginPercent) unexpectedChanges.push(`ID ${after.id} minimumGrossMarginPercent modified`);
      if (after.minimumGrossProfitCents !== before.minimumGrossProfitCents) unexpectedChanges.push(`ID ${after.id} minimumGrossProfitCents modified`);
      if (after.maxSupplierCostAbsoluteCents !== before.maxSupplierCostAbsoluteCents) unexpectedChanges.push(`ID ${after.id} maxSupplierCostAbsoluteCents modified`);
      if (after.costCeilingEnabled !== before.costCeilingEnabled) unexpectedChanges.push(`ID ${after.id} costCeilingEnabled modified`);
      if (after.manualReviewEnabled !== before.manualReviewEnabled) unexpectedChanges.push(`ID ${after.id} manualReviewEnabled modified`);

      const hasProd = Boolean(after.perfectpayProductId);
      const hasPlan = Boolean(after.perfectpayPlanId);
      const hasUrl = Boolean(after.externalCheckoutUrl);

      if (hasProd) totalProductConfigured++;
      if (hasPlan) totalPlanConfigured++;
      if (hasUrl) totalUrlConfigured++;

      if (hasProd && hasPlan && hasUrl) {
        totalReady++;
      } else if (hasProd || hasPlan || hasUrl) {
        totalIncomplete++;
      } else {
        totalMissing++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'All 66 PerfectPay checkouts updated successfully in production.',
      recordsUpdated: updateResults.length,
      audit: {
        totalRecords: afterSnapshot.length,
        checkoutReady: totalReady,
        checkoutIncomplete: totalIncomplete,
        checkoutMissing: totalMissing,
        productCodeConfigured: totalProductConfigured,
        planCodeConfigured: totalPlanConfigured,
        checkoutUrlConfigured: totalUrlConfigured,
        unexpectedChangesCount: unexpectedChanges.length,
        unexpectedChanges,
      },
      beforeSnapshot,
      afterSnapshot,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Update failed' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
