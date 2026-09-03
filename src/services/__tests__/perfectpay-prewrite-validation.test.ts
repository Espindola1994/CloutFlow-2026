import { describe, it, expect } from 'vitest';
import { validatePerfectPayDataset } from '@/config/validate-perfectpay-dataset';
import { OFFICIAL_PERFECTPAY_66_DATASET } from '@/config/official-perfectpay-dataset';
import { CLOUTFLOW_CATALOG_PACKAGES } from '@/config/financial-protection.config';

describe('Official PerfectPay 66 Cards Dataset Pre-Write Validation', () => {
  const report = validatePerfectPayDataset(OFFICIAL_PERFECTPAY_66_DATASET);

  it('should validate exactly 66 records in total', () => {
    expect(report.totalCount).toBe(66);
    expect(OFFICIAL_PERFECTPAY_66_DATASET).toHaveLength(66);
  });

  it('should validate distribution: 18 Instagram, 18 TikTok, 18 Twitter, 12 YouTube', () => {
    expect(report.instagramCount).toBe(18);
    expect(report.tiktokCount).toBe(18);
    expect(report.twitterCount).toBe(18);
    expect(report.youtubeCount).toBe(12);
  });

  it('should confirm 0 YouTube Followers', () => {
    expect(report.youtubeFollowersCount).toBe(0);
    const ytFollowers = OFFICIAL_PERFECTPAY_66_DATASET.filter(
      (item) => item.platform === 'youtube' && item.service === 'followers'
    );
    expect(ytFollowers).toHaveLength(0);
  });

  it('should have 0 duplicate identities and 0 missing canonical identities', () => {
    expect(report.duplicateIdentities).toHaveLength(0);
    expect(report.missingIdentities).toHaveLength(0);
  });

  it('should confirm all 66 items have Product Code PPPBF6TP', () => {
    expect(report.invalidProductCodes).toHaveLength(0);
    for (const item of OFFICIAL_PERFECTPAY_66_DATASET) {
      expect(item.productCode).toBe('PPPBF6TP');
    }
  });

  it('should confirm all 66 items have valid HTTPS URLs from go.centerpag.com', () => {
    expect(report.invalidUrls).toHaveLength(0);
    for (const item of OFFICIAL_PERFECTPAY_66_DATASET) {
      expect(item.checkoutUrl).toMatch(/^https:\/\/go\.centerpag\.com\/[A-Z0-9]+$/);
    }
  });

  it('should confirm 0 duplicate Plan Codes across all 66 records', () => {
    expect(report.duplicatePlanCodes).toHaveLength(0);
    const planCodes = OFFICIAL_PERFECTPAY_66_DATASET.map((i) => i.planCode);
    const uniquePlanCodes = new Set(planCodes);
    expect(uniquePlanCodes.size).toBe(66);
  });

  it('should confirm 0 duplicate Checkout URLs across all 66 records', () => {
    expect(report.duplicateUrls).toHaveLength(0);
    const urls = OFFICIAL_PERFECTPAY_66_DATASET.map((i) => i.checkoutUrl);
    const uniqueUrls = new Set(urls);
    expect(uniqueUrls.size).toBe(66);
  });

  it('should pass full report validation with isValid === true and 0 errors', () => {
    expect(report.errors).toHaveLength(0);
    expect(report.isValid).toBe(true);
  });

  it('should exactly match all 66 canonical packages in CLOUTFLOW_CATALOG_PACKAGES', () => {
    expect(CLOUTFLOW_CATALOG_PACKAGES).toHaveLength(66);
    const catalogKeySet = new Set(
      CLOUTFLOW_CATALOG_PACKAGES.map(
        (p) => `${p.platform}:${p.service}:${p.name.toLowerCase()}`
      )
    );
    const datasetKeySet = new Set(
      OFFICIAL_PERFECTPAY_66_DATASET.map(
        (d) => `${d.platform}:${d.service}:${d.plan.toLowerCase()}`
      )
    );
    expect(datasetKeySet.size).toBe(66);
    expect(catalogKeySet.size).toBe(66);
    for (const key of catalogKeySet) {
      expect(datasetKeySet.has(key)).toBe(true);
    }
  });
});
