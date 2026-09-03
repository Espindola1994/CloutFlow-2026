import { OFFICIAL_PERFECTPAY_66_DATASET, PerfectPayDatasetItem } from './official-perfectpay-dataset';
import { CLOUTFLOW_CATALOG_PACKAGES } from './financial-protection.config';

export interface DatasetValidationReport {
  isValid: boolean;
  totalCount: number;
  instagramCount: number;
  tiktokCount: number;
  twitterCount: number;
  youtubeCount: number;
  youtubeFollowersCount: number;
  invalidProductCodes: string[];
  invalidUrls: string[];
  duplicateIdentities: string[];
  missingIdentities: string[];
  duplicatePlanCodes: string[];
  duplicateUrls: string[];
  errors: string[];
}

export function validatePerfectPayDataset(dataset: PerfectPayDatasetItem[] = OFFICIAL_PERFECTPAY_66_DATASET): DatasetValidationReport {
  const report: DatasetValidationReport = {
    isValid: true,
    totalCount: dataset.length,
    instagramCount: 0,
    tiktokCount: 0,
    twitterCount: 0,
    youtubeCount: 0,
    youtubeFollowersCount: 0,
    invalidProductCodes: [],
    invalidUrls: [],
    duplicateIdentities: [],
    missingIdentities: [],
    duplicatePlanCodes: [],
    duplicateUrls: [],
    errors: [],
  };

  const identitySet = new Set<string>();
  const planCodeSet = new Set<string>();
  const urlSet = new Set<string>();

  for (const item of dataset) {
    const idKey = `${item.platform}:${item.service}:${item.plan}`.toLowerCase();

    // Counts
    if (item.platform === 'instagram') report.instagramCount++;
    else if (item.platform === 'tiktok') report.tiktokCount++;
    else if (item.platform === 'twitter') report.twitterCount++;
    else if (item.platform === 'youtube') {
      report.youtubeCount++;
      if (item.service === 'followers') {
        report.youtubeFollowersCount++;
      }
    }

    // Product Code check (all must be PPPBF6TP)
    if (item.productCode !== 'PPPBF6TP') {
      report.invalidProductCodes.push(`${idKey}: ${item.productCode}`);
    }

    // URL validation (must be HTTPS and go.centerpag.com)
    try {
      const parsedUrl = new URL(item.checkoutUrl);
      if (parsedUrl.protocol !== 'https:' || parsedUrl.hostname !== 'go.centerpag.com') {
        report.invalidUrls.push(`${idKey}: ${item.checkoutUrl}`);
      }
    } catch {
      report.invalidUrls.push(`${idKey}: malformed URL ${item.checkoutUrl}`);
    }

    // Identity uniqueness
    if (identitySet.has(idKey)) {
      report.duplicateIdentities.push(idKey);
    } else {
      identitySet.add(idKey);
    }

    // Plan Code uniqueness
    if (planCodeSet.has(item.planCode)) {
      report.duplicatePlanCodes.push(`${item.planCode} (at ${idKey})`);
    } else {
      planCodeSet.add(item.planCode);
    }

    // URL uniqueness
    if (urlSet.has(item.checkoutUrl)) {
      report.duplicateUrls.push(`${item.checkoutUrl} (at ${idKey})`);
    } else {
      urlSet.add(item.checkoutUrl);
    }
  }

  // Canonical cross-reference with CLOUTFLOW_CATALOG_PACKAGES
  for (const pkg of CLOUTFLOW_CATALOG_PACKAGES) {
    const idKey = `${pkg.platform}:${pkg.service}:${pkg.name.toLowerCase()}`;
    if (!identitySet.has(idKey)) {
      report.missingIdentities.push(idKey);
    }
  }

  // Evaluate validity
  if (report.totalCount !== 66) {
    report.errors.push(`Expected 66 items, got ${report.totalCount}`);
  }
  if (report.instagramCount !== 18) {
    report.errors.push(`Expected 18 Instagram items, got ${report.instagramCount}`);
  }
  if (report.tiktokCount !== 18) {
    report.errors.push(`Expected 18 TikTok items, got ${report.tiktokCount}`);
  }
  if (report.twitterCount !== 18) {
    report.errors.push(`Expected 18 Twitter items, got ${report.twitterCount}`);
  }
  if (report.youtubeCount !== 12) {
    report.errors.push(`Expected 12 YouTube items, got ${report.youtubeCount}`);
  }
  if (report.youtubeFollowersCount > 0) {
    report.errors.push(`Detected ${report.youtubeFollowersCount} YouTube Followers items`);
  }
  if (report.invalidProductCodes.length > 0) {
    report.errors.push(`Invalid product codes: ${report.invalidProductCodes.join(', ')}`);
  }
  if (report.invalidUrls.length > 0) {
    report.errors.push(`Invalid URLs: ${report.invalidUrls.join(', ')}`);
  }
  if (report.duplicateIdentities.length > 0) {
    report.errors.push(`Duplicate identities: ${report.duplicateIdentities.join(', ')}`);
  }
  if (report.missingIdentities.length > 0) {
    report.errors.push(`Missing canonical identities: ${report.missingIdentities.join(', ')}`);
  }
  if (report.duplicatePlanCodes.length > 0) {
    report.errors.push(`Duplicate Plan Codes: ${report.duplicatePlanCodes.join(', ')}`);
  }
  if (report.duplicateUrls.length > 0) {
    report.errors.push(`Duplicate URLs: ${report.duplicateUrls.join(', ')}`);
  }

  report.isValid = report.errors.length === 0;
  return report;
}
