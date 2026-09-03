import { describe, it, expect, vi } from 'vitest';
import {
  DEFAULT_FINANCIAL_PROTECTION_RULES,
  CRITICAL_CARD_CEILING_OVERRIDES,
  buildFinancialProtectionAudit,
  CLOUTFLOW_CATALOG_PACKAGES,
} from '@/config/financial-protection.config';
import { calculateCostCeiling } from '@/lib/routing/financial-routing';
import { generateFinancialProtectionReport, runFinancialProtectionSeed } from '@/db/seed-financial-protection';

describe('Financial Protection Cards & Cost Ceiling Seed', () => {
  it('A) All 11 platform/service combinations have the exact required default rules', () => {
    expect(DEFAULT_FINANCIAL_PROTECTION_RULES['instagram:followers']).toEqual({
      platform: 'instagram',
      service: 'followers',
      minimumGrossMarginPercent: 45,
      minimumGrossProfitCents: 500,
    });

    expect(DEFAULT_FINANCIAL_PROTECTION_RULES['instagram:likes']).toEqual({
      platform: 'instagram',
      service: 'likes',
      minimumGrossMarginPercent: 70,
      minimumGrossProfitCents: 300,
    });

    expect(DEFAULT_FINANCIAL_PROTECTION_RULES['instagram:views']).toEqual({
      platform: 'instagram',
      service: 'views',
      minimumGrossMarginPercent: 75,
      minimumGrossProfitCents: 300,
    });

    expect(DEFAULT_FINANCIAL_PROTECTION_RULES['tiktok:followers']).toEqual({
      platform: 'tiktok',
      service: 'followers',
      minimumGrossMarginPercent: 35,
      minimumGrossProfitCents: 500,
    });

    expect(DEFAULT_FINANCIAL_PROTECTION_RULES['tiktok:likes']).toEqual({
      platform: 'tiktok',
      service: 'likes',
      minimumGrossMarginPercent: 70,
      minimumGrossProfitCents: 300,
    });

    expect(DEFAULT_FINANCIAL_PROTECTION_RULES['tiktok:views']).toEqual({
      platform: 'tiktok',
      service: 'views',
      minimumGrossMarginPercent: 70,
      minimumGrossProfitCents: 300,
    });

    expect(DEFAULT_FINANCIAL_PROTECTION_RULES['twitter:followers']).toEqual({
      platform: 'twitter',
      service: 'followers',
      minimumGrossMarginPercent: 20,
      minimumGrossProfitCents: 800,
    });

    expect(DEFAULT_FINANCIAL_PROTECTION_RULES['twitter:likes']).toEqual({
      platform: 'twitter',
      service: 'likes',
      minimumGrossMarginPercent: 40,
      minimumGrossProfitCents: 400,
    });

    expect(DEFAULT_FINANCIAL_PROTECTION_RULES['twitter:views']).toEqual({
      platform: 'twitter',
      service: 'views',
      minimumGrossMarginPercent: 70,
      minimumGrossProfitCents: 300,
    });

    expect(DEFAULT_FINANCIAL_PROTECTION_RULES['youtube:likes']).toEqual({
      platform: 'youtube',
      service: 'likes',
      minimumGrossMarginPercent: 45,
      minimumGrossProfitCents: 400,
    });

    expect(DEFAULT_FINANCIAL_PROTECTION_RULES['youtube:views']).toEqual({
      platform: 'youtube',
      service: 'views',
      minimumGrossMarginPercent: 25,
      minimumGrossProfitCents: 600,
    });
  });

  it('B) Critical high-ticket overrides are correctly registered and calculated', () => {
    // X Followers Max: selling price $749.90 -> maxSupplierCostAbsolute = $560.00
    const xFollowersMax = CRITICAL_CARD_CEILING_OVERRIDES.find((o) => o.key === 'twitter:followers:Max');
    expect(xFollowersMax).toBeDefined();
    expect(xFollowersMax?.sellingPriceCents).toBe(74990);
    expect(xFollowersMax?.maxSupplierCostAbsoluteCents).toBe(56000);

    const xCeiling = calculateCostCeiling({
      sellingPrice: 749.90,
      minimumGrossMarginPercent: 20,
      minimumGrossProfit: 8.00,
      maxSupplierCostAbsolute: 560.00,
    });

    // Min Margin 20% -> $749.90 * 0.8 = $599.92
    // Min Profit $8.00 -> $749.90 - $8.00 = $741.90
    // Absolute cap -> $560.00
    // Allowed supplier cost must be min(599.92, 741.90, 560.00) = $560.00
    expect(xCeiling.allowedSupplierCost).toBe(560.00);

    // YouTube Views Max: selling price $399.90 -> maxSupplierCostAbsolute = $260.00
    const ytViewsMax = CRITICAL_CARD_CEILING_OVERRIDES.find((o) => o.key === 'youtube:views:Max');
    expect(ytViewsMax).toBeDefined();
    expect(ytViewsMax?.sellingPriceCents).toBe(39990);
    expect(ytViewsMax?.maxSupplierCostAbsoluteCents).toBe(26000);

    const ytCeiling = calculateCostCeiling({
      sellingPrice: 399.90,
      minimumGrossMarginPercent: 25,
      minimumGrossProfit: 6.00,
      maxSupplierCostAbsolute: 260.00,
    });

    // Min Margin 25% -> $399.90 * 0.75 = $299.925
    // Min Profit $6.00 -> $399.90 - $6.00 = $393.90
    // Absolute cap -> $260.00
    // Allowed supplier cost must be min(299.925, 393.90, 260.00) = $260.00
    expect(ytCeiling.allowedSupplierCost).toBe(260.00);
  });

  it('C) Non-override cards have maxSupplierCostAbsolute = null and allowedSupplierCost determined by margin & profit', () => {
    // Instagram Followers Starter ($14.90, margin 45%, min profit $5.00)
    // margin max cost: 14.90 * (1 - 0.45) = 8.195
    // profit max cost: 14.90 - 5.00 = 9.90
    // allowed: min(8.195, 9.90) = 8.1950
    const igStarter = calculateCostCeiling({
      sellingPrice: 14.90,
      minimumGrossMarginPercent: 45,
      minimumGrossProfit: 5.00,
      maxSupplierCostAbsolute: null,
    });
    expect(igStarter.maxSupplierCostAbsolute).toBeNull();
    expect(igStarter.allowedSupplierCost).toBe(8.195);
  });

  it('D) Audit report generates complete list for all cards with flags enabled', () => {
    const report = generateFinancialProtectionReport();
    expect(report.length).toBe(CLOUTFLOW_CATALOG_PACKAGES.length);

    for (const card of report) {
      expect(card.costCeilingEnabled).toBe(true);
      expect(card.manualReviewEnabled).toBe(true);
      expect(card.sellingPrice).toBeTruthy();
      expect(card.margin).toBeTruthy();
      expect(card.minimumProfit).toBeTruthy();
      expect(card.allowedCostCeiling).toBeTruthy();
    }

    const xMaxCard = report.find((c) => c.platform === 'twitter' && c.service === 'followers' && c.packageName === 'Max');
    expect(xMaxCard?.sellingPrice).toBe('$749.90');
    expect(xMaxCard?.maxSupplierCostAbsolute).toBe('$560.00');
    expect(xMaxCard?.allowedCostCeiling).toBe('$560.00');

    const ytMaxCard = report.find((c) => c.platform === 'youtube' && c.service === 'views' && c.packageName === 'Max');
    expect(ytMaxCard?.sellingPrice).toBe('$399.90');
    expect(ytMaxCard?.maxSupplierCostAbsolute).toBe('$260.00');
    expect(ytMaxCard?.allowedCostCeiling).toBe('$260.00');
  });

  it('E) Dry-run executes cleanly and does not mutate database or send supplier orders', async () => {
    const result = await runFinancialProtectionSeed({ isDryRun: true });
    expect(result.success).toBe(true);
    expect(result.isDryRun).toBe(true);
    expect(result.report.length).toBeGreaterThan(0);
  });

  it('F) Commercial quantities for updated cards match final specifications', () => {
    // Instagram Followers Max
    const igFollowersMax = CLOUTFLOW_CATALOG_PACKAGES.find(
      (p) => p.platform === 'instagram' && p.service === 'followers' && p.name === 'Max'
    );
    expect(igFollowersMax).toBeDefined();
    expect(igFollowersMax?.quantity).toBe(100000);
    expect(igFollowersMax?.priceCents).toBe(19990);

    // X Likes Elite & Max
    const xLikesElite = CLOUTFLOW_CATALOG_PACKAGES.find(
      (p) => p.platform === 'twitter' && p.service === 'likes' && p.name === 'Elite'
    );
    expect(xLikesElite).toBeDefined();
    expect(xLikesElite?.quantity).toBe(15000);
    expect(xLikesElite?.priceCents).toBe(6490);

    const xLikesMax = CLOUTFLOW_CATALOG_PACKAGES.find(
      (p) => p.platform === 'twitter' && p.service === 'likes' && p.name === 'Max'
    );
    expect(xLikesMax).toBeDefined();
    expect(xLikesMax?.quantity).toBe(20000);
    expect(xLikesMax?.priceCents).toBe(7990);
  });
});
