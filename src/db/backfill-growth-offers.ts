import { db } from './index';
import { offers } from './schema/offers';
import { CLOUTFLOW_CATALOG_PACKAGES, DEFAULT_FINANCIAL_PROTECTION_RULES, CRITICAL_CARD_CEILING_OVERRIDES } from '@/config/financial-protection.config';
import { eq, sql } from 'drizzle-orm';

export interface BackfillDiagnostic {
  totalCatalogIdentities: number;
  existingOffersCount: number;
  insertedCount: number;
  updatedCount: number;
  preservedPerfectPayCount: number;
  identities: {
    instagram: number;
    tiktok: number;
    twitter: number;
    youtube: number;
  };
  productCodeCount: number;
  planCodeCount: number;
  checkoutUrlCount: number;
  duplicatesCount: number;
  missingCount: number;
}

/**
 * Idempotent, non-destructive backfill for 66 Growth/Offer commercial identities.
 * Preserves existing PerfectPay metadata (productCode, planCode, checkoutUrl, supplier routing, etc.).
 */
export async function runGrowthOffersBackfill(dbInstance?: typeof db): Promise<BackfillDiagnostic> {
  const currentDb = dbInstance || db;

  // Diagnostic state
  const existingOffers = await currentDb.query.offers.findMany().catch(() => []);
  const initialMap = new Map<string, typeof existingOffers[0]>();

  let initialProductCodeCount = 0;
  let initialPlanCodeCount = 0;
  let initialCheckoutUrlCount = 0;

  for (const off of existingOffers) {
    const key = `${off.platform.toLowerCase()}:${off.service.toLowerCase()}:${off.name.toLowerCase()}`;
    initialMap.set(key, off);
    if (off.perfectpayProductId) initialProductCodeCount++;
    if (off.perfectpayPlanId) initialPlanCodeCount++;
    if (off.externalCheckoutUrl) initialCheckoutUrlCount++;
  }

  let insertedCount = 0;
  let updatedCount = 0;
  let preservedPerfectPayCount = 0;

  for (const [index, pkg] of CLOUTFLOW_CATALOG_PACKAGES.entries()) {
    const key = `${pkg.platform.toLowerCase()}:${pkg.service.toLowerCase()}:${pkg.name.toLowerCase()}`;
    const existing = initialMap.get(key);

    const ruleKey = `${pkg.platform}:${pkg.service}`;
    const rule = DEFAULT_FINANCIAL_PROTECTION_RULES[ruleKey] || {
      minimumGrossMarginPercent: 40,
      minimumGrossProfitCents: 500,
    };

    const override = CRITICAL_CARD_CEILING_OVERRIDES.find(
      (o) => o.platform === pkg.platform && o.service === pkg.service && o.packageName === pkg.name
    );

    if (existing) {
      // Non-destructive update: preserve existing perfectpay codes, checkout urls, custom metadata
      const hasPerfectPay = Boolean(existing.perfectpayProductId || existing.perfectpayPlanId || existing.externalCheckoutUrl);
      if (hasPerfectPay) {
        preservedPerfectPayCount++;
      }

      await currentDb
        .update(offers)
        .set({
          // Update routing / protection rules idempotently
          minimumGrossMarginPercent: rule.minimumGrossMarginPercent,
          minimumGrossProfitCents: rule.minimumGrossProfitCents,
          maxSupplierCostAbsoluteCents: override ? override.maxSupplierCostAbsoluteCents : null,
          costCeilingEnabled: true,
          manualReviewEnabled: true,
          updatedAt: new Date(),
        })
        .where(eq(offers.id, existing.id));

      updatedCount++;
    } else {
      // Insert canonical offer
      await currentDb.insert(offers).values({
        platform: pkg.platform,
        service: pkg.service,
        name: pkg.name,
        slug: `${pkg.platform}-${pkg.service}-${pkg.name.toLowerCase()}`,
        quantity: pkg.quantity,
        bonusQuantity: 0,
        priceCents: pkg.priceCents,
        currency: 'USD',
        active: true,
        syncHome: true,
        syncOfferStep3: true,
        sortOrder: index + 1,
        minimumGrossMarginPercent: rule.minimumGrossMarginPercent,
        minimumGrossProfitCents: rule.minimumGrossProfitCents,
        maxSupplierCostAbsoluteCents: override ? override.maxSupplierCostAbsoluteCents : null,
        costCeilingEnabled: true,
        manualReviewEnabled: true,
      });

      insertedCount++;
    }
  }

  // Verification
  const postOffers = await currentDb.query.offers.findMany().catch(() => []);
  const platformCounts = {
    instagram: 0,
    tiktok: 0,
    twitter: 0,
    youtube: 0,
  };

  let finalProductCodeCount = 0;
  let finalPlanCodeCount = 0;
  let finalCheckoutUrlCount = 0;
  const seenIdentities = new Set<string>();
  let duplicatesCount = 0;

  for (const off of postOffers) {
    const plat = off.platform.toLowerCase() as keyof typeof platformCounts;
    if (platformCounts[plat] !== undefined) {
      platformCounts[plat]++;
    }
    const key = `${off.platform.toLowerCase()}:${off.service.toLowerCase()}:${off.name.toLowerCase()}`;
    if (seenIdentities.has(key)) {
      duplicatesCount++;
    } else {
      seenIdentities.add(key);
    }
    if (off.perfectpayProductId) finalProductCodeCount++;
    if (off.perfectpayPlanId) finalPlanCodeCount++;
    if (off.externalCheckoutUrl) finalCheckoutUrlCount++;
  }

  let missingCount = 0;
  for (const pkg of CLOUTFLOW_CATALOG_PACKAGES) {
    const key = `${pkg.platform.toLowerCase()}:${pkg.service.toLowerCase()}:${pkg.name.toLowerCase()}`;
    if (!seenIdentities.has(key)) {
      missingCount++;
    }
  }

  return {
    totalCatalogIdentities: CLOUTFLOW_CATALOG_PACKAGES.length,
    existingOffersCount: existingOffers.length,
    insertedCount,
    updatedCount,
    preservedPerfectPayCount,
    identities: platformCounts,
    productCodeCount: finalProductCodeCount,
    planCodeCount: finalPlanCodeCount,
    checkoutUrlCount: finalCheckoutUrlCount,
    duplicatesCount,
    missingCount,
  };
}
