import { calculateCostCeiling } from '../lib/routing/financial-routing';

export interface CardFinancialProtectionRule {
  platform: 'instagram' | 'tiktok' | 'twitter' | 'youtube';
  service: 'followers' | 'likes' | 'views';
  minimumGrossMarginPercent: number;
  minimumGrossProfitCents: number; // in cents ($5 = 500)
}

export const DEFAULT_FINANCIAL_PROTECTION_RULES: Record<string, CardFinancialProtectionRule> = {
  'instagram:followers': {
    platform: 'instagram',
    service: 'followers',
    minimumGrossMarginPercent: 45,
    minimumGrossProfitCents: 500, // $5.00
  },
  'instagram:likes': {
    platform: 'instagram',
    service: 'likes',
    minimumGrossMarginPercent: 70,
    minimumGrossProfitCents: 300, // $3.00
  },
  'instagram:views': {
    platform: 'instagram',
    service: 'views',
    minimumGrossMarginPercent: 75,
    minimumGrossProfitCents: 300, // $3.00
  },
  'tiktok:followers': {
    platform: 'tiktok',
    service: 'followers',
    minimumGrossMarginPercent: 35,
    minimumGrossProfitCents: 500, // $5.00
  },
  'tiktok:likes': {
    platform: 'tiktok',
    service: 'likes',
    minimumGrossMarginPercent: 70,
    minimumGrossProfitCents: 300, // $3.00
  },
  'tiktok:views': {
    platform: 'tiktok',
    service: 'views',
    minimumGrossMarginPercent: 70,
    minimumGrossProfitCents: 300, // $3.00
  },
  'twitter:followers': {
    platform: 'twitter',
    service: 'followers',
    minimumGrossMarginPercent: 20,
    minimumGrossProfitCents: 800, // $8.00
  },
  'twitter:likes': {
    platform: 'twitter',
    service: 'likes',
    minimumGrossMarginPercent: 40,
    minimumGrossProfitCents: 400, // $4.00
  },
  'twitter:views': {
    platform: 'twitter',
    service: 'views',
    minimumGrossMarginPercent: 70,
    minimumGrossProfitCents: 300, // $3.00
  },
  'youtube:likes': {
    platform: 'youtube',
    service: 'likes',
    minimumGrossMarginPercent: 45,
    minimumGrossProfitCents: 400, // $4.00
  },
  'youtube:views': {
    platform: 'youtube',
    service: 'views',
    minimumGrossMarginPercent: 25,
    minimumGrossProfitCents: 600, // $6.00
  },
};

export interface CardAbsoluteCeilingOverride {
  key: string; // e.g. "twitter:followers:Max" or by slug / exact parameters
  platform: string;
  service: string;
  packageName: string;
  sellingPriceCents: number; // e.g. 74990 for $749.90
  maxSupplierCostAbsoluteCents: number; // e.g. 56000 for $560.00
}

/**
 * Explicit initial seeds for critical high-ticket cards.
 * X Followers Max: selling price $749.90 -> maxSupplierCostAbsolute = $560.00 (56000 cents)
 * YouTube Views Max: selling price $399.90 -> maxSupplierCostAbsolute = $260.00 (26000 cents)
 */
export const CRITICAL_CARD_CEILING_OVERRIDES: CardAbsoluteCeilingOverride[] = [
  {
    key: 'twitter:followers:Max',
    platform: 'twitter',
    service: 'followers',
    packageName: 'Max',
    sellingPriceCents: 74990, // $749.90
    maxSupplierCostAbsoluteCents: 56000, // $560.00
  },
  {
    key: 'youtube:views:Max',
    platform: 'youtube',
    service: 'views',
    packageName: 'Max',
    sellingPriceCents: 39990, // $399.90
    maxSupplierCostAbsoluteCents: 26000, // $260.00
  },
];

/**
 * Standard CloutFlow catalog structure per platform and service (FINAL COMMERCIAL TABLE).
 * Quantities already include delivered bonuses.
 */
export const CLOUTFLOW_CATALOG_PACKAGES = [
  // Instagram Followers
  { platform: 'instagram', service: 'followers', name: 'Starter', quantity: 2000, priceCents: 1490 },
  { platform: 'instagram', service: 'followers', name: 'Boost', quantity: 6200, priceCents: 2990 },
  { platform: 'instagram', service: 'followers', name: 'Growth', quantity: 10500, priceCents: 3990 },
  { platform: 'instagram', service: 'followers', name: 'Pro', quantity: 21000, priceCents: 6990 },
  { platform: 'instagram', service: 'followers', name: 'Elite', quantity: 42000, priceCents: 11990 },
  { platform: 'instagram', service: 'followers', name: 'Max', quantity: 100000, priceCents: 19990 },

  // Instagram Likes
  { platform: 'instagram', service: 'likes', name: 'Starter', quantity: 2500, priceCents: 590 },
  { platform: 'instagram', service: 'likes', name: 'Boost', quantity: 5000, priceCents: 890 },
  { platform: 'instagram', service: 'likes', name: 'Growth', quantity: 10000, priceCents: 1490 },
  { platform: 'instagram', service: 'likes', name: 'Pro', quantity: 20000, priceCents: 2490 },
  { platform: 'instagram', service: 'likes', name: 'Elite', quantity: 30000, priceCents: 4990 },
  { platform: 'instagram', service: 'likes', name: 'Max', quantity: 50000, priceCents: 7990 },

  // Instagram Views
  { platform: 'instagram', service: 'views', name: 'Starter', quantity: 10000, priceCents: 590 },
  { platform: 'instagram', service: 'views', name: 'Boost', quantity: 25000, priceCents: 990 },
  { platform: 'instagram', service: 'views', name: 'Growth', quantity: 50000, priceCents: 1490 },
  { platform: 'instagram', service: 'views', name: 'Pro', quantity: 100000, priceCents: 2490 },
  { platform: 'instagram', service: 'views', name: 'Elite', quantity: 150000, priceCents: 3490 },
  { platform: 'instagram', service: 'views', name: 'Max', quantity: 250000, priceCents: 4490 },

  // TikTok Followers
  { platform: 'tiktok', service: 'followers', name: 'Starter', quantity: 2000, priceCents: 1490 },
  { platform: 'tiktok', service: 'followers', name: 'Boost', quantity: 5000, priceCents: 2990 },
  { platform: 'tiktok', service: 'followers', name: 'Growth', quantity: 10000, priceCents: 4990 },
  { platform: 'tiktok', service: 'followers', name: 'Pro', quantity: 25000, priceCents: 9990 },
  { platform: 'tiktok', service: 'followers', name: 'Elite', quantity: 50000, priceCents: 17990 },
  { platform: 'tiktok', service: 'followers', name: 'Max', quantity: 100000, priceCents: 32990 },

  // TikTok Likes
  { platform: 'tiktok', service: 'likes', name: 'Starter', quantity: 2500, priceCents: 590 },
  { platform: 'tiktok', service: 'likes', name: 'Boost', quantity: 5000, priceCents: 890 },
  { platform: 'tiktok', service: 'likes', name: 'Growth', quantity: 10000, priceCents: 1490 },
  { platform: 'tiktok', service: 'likes', name: 'Pro', quantity: 20000, priceCents: 2490 },
  { platform: 'tiktok', service: 'likes', name: 'Elite', quantity: 30000, priceCents: 4990 },
  { platform: 'tiktok', service: 'likes', name: 'Max', quantity: 50000, priceCents: 8490 },

  // TikTok Views
  { platform: 'tiktok', service: 'views', name: 'Starter', quantity: 10000, priceCents: 590 },
  { platform: 'tiktok', service: 'views', name: 'Boost', quantity: 25000, priceCents: 1290 },
  { platform: 'tiktok', service: 'views', name: 'Growth', quantity: 50000, priceCents: 1990 },
  { platform: 'tiktok', service: 'views', name: 'Pro', quantity: 100000, priceCents: 3490 },
  { platform: 'tiktok', service: 'views', name: 'Elite', quantity: 150000, priceCents: 4990 },
  { platform: 'tiktok', service: 'views', name: 'Max', quantity: 250000, priceCents: 6990 },

  // X (Twitter) Followers
  { platform: 'twitter', service: 'followers', name: 'Starter', quantity: 2000, priceCents: 2990 },
  { platform: 'twitter', service: 'followers', name: 'Boost', quantity: 5000, priceCents: 5990 },
  { platform: 'twitter', service: 'followers', name: 'Growth', quantity: 10000, priceCents: 9990 },
  { platform: 'twitter', service: 'followers', name: 'Pro', quantity: 25000, priceCents: 21990 },
  { platform: 'twitter', service: 'followers', name: 'Elite', quantity: 50000, priceCents: 39990 },
  { platform: 'twitter', service: 'followers', name: 'Max', quantity: 100000, priceCents: 74990 },

  // X (Twitter) Likes
  { platform: 'twitter', service: 'likes', name: 'Starter', quantity: 1000, priceCents: 790 },
  { platform: 'twitter', service: 'likes', name: 'Boost', quantity: 2500, priceCents: 1490 },
  { platform: 'twitter', service: 'likes', name: 'Growth', quantity: 5000, priceCents: 2490 },
  { platform: 'twitter', service: 'likes', name: 'Pro', quantity: 10000, priceCents: 4490 },
  { platform: 'twitter', service: 'likes', name: 'Elite', quantity: 15000, priceCents: 6490 },
  { platform: 'twitter', service: 'likes', name: 'Max', quantity: 20000, priceCents: 7990 },

  // X (Twitter) Views
  { platform: 'twitter', service: 'views', name: 'Starter', quantity: 10000, priceCents: 590 },
  { platform: 'twitter', service: 'views', name: 'Boost', quantity: 25000, priceCents: 990 },
  { platform: 'twitter', service: 'views', name: 'Growth', quantity: 50000, priceCents: 1490 },
  { platform: 'twitter', service: 'views', name: 'Pro', quantity: 100000, priceCents: 2490 },
  { platform: 'twitter', service: 'views', name: 'Elite', quantity: 150000, priceCents: 3490 },
  { platform: 'twitter', service: 'views', name: 'Max', quantity: 250000, priceCents: 4990 },

  // YouTube Likes
  { platform: 'youtube', service: 'likes', name: 'Starter', quantity: 1000, priceCents: 790 },
  { platform: 'youtube', service: 'likes', name: 'Boost', quantity: 2500, priceCents: 1490 },
  { platform: 'youtube', service: 'likes', name: 'Growth', quantity: 5000, priceCents: 2490 },
  { platform: 'youtube', service: 'likes', name: 'Pro', quantity: 10000, priceCents: 4490 },
  { platform: 'youtube', service: 'likes', name: 'Elite', quantity: 25000, priceCents: 9990 },
  { platform: 'youtube', service: 'likes', name: 'Max', quantity: 50000, priceCents: 17990 },

  // YouTube Views
  { platform: 'youtube', service: 'views', name: 'Starter', quantity: 5000, priceCents: 1490 },
  { platform: 'youtube', service: 'views', name: 'Boost', quantity: 10000, priceCents: 2490 },
  { platform: 'youtube', service: 'views', name: 'Growth', quantity: 25000, priceCents: 4990 },
  { platform: 'youtube', service: 'views', name: 'Pro', quantity: 50000, priceCents: 8990 },
  { platform: 'youtube', service: 'views', name: 'Elite', quantity: 100000, priceCents: 16990 },
  { platform: 'youtube', service: 'views', name: 'Max', quantity: 250000, priceCents: 39990 },
];

export interface CardFinancialAudit {
  cardKey: string;
  platform: string;
  service: string;
  packageName: string;
  quantity: number;
  sellingPriceFormatted: string;
  sellingPrice: number;
  minimumGrossMarginPercent: number;
  minimumGrossProfitFormatted: string;
  minimumGrossProfit: number;
  maxSupplierCostAbsoluteFormatted: string;
  maxSupplierCostAbsolute: number | null;
  allowedSupplierCostFormatted: string;
  allowedSupplierCost: number;
  costCeilingEnabled: boolean;
  manualReviewEnabled: boolean;
}

export function buildFinancialProtectionAudit(): CardFinancialAudit[] {
  return CLOUTFLOW_CATALOG_PACKAGES.map((pkg) => {
    const ruleKey = `${pkg.platform}:${pkg.service}`;
    const rule = DEFAULT_FINANCIAL_PROTECTION_RULES[ruleKey] || {
      minimumGrossMarginPercent: 40,
      minimumGrossProfitCents: 500,
    };

    // Check critical override
    const override = CRITICAL_CARD_CEILING_OVERRIDES.find(
      (o) => o.platform === pkg.platform && o.service === pkg.service && o.packageName === pkg.name
    );

    const sellingPrice = (pkg.priceCents) / 100;
    const minimumGrossMarginPercent = rule.minimumGrossMarginPercent;
    const minimumGrossProfit = rule.minimumGrossProfitCents / 100;
    const maxSupplierCostAbsolute = override ? override.maxSupplierCostAbsoluteCents / 100 : null;

    const ceiling = calculateCostCeiling({
      sellingPrice,
      minimumGrossMarginPercent,
      minimumGrossProfit,
      maxSupplierCostAbsolute,
    });

    return {
      cardKey: `${pkg.platform} > ${pkg.service} > ${pkg.name}`,
      platform: pkg.platform,
      service: pkg.service,
      packageName: pkg.name,
      quantity: pkg.quantity,
      sellingPriceFormatted: `$${sellingPrice.toFixed(2)}`,
      sellingPrice,
      minimumGrossMarginPercent,
      minimumGrossProfitFormatted: `$${minimumGrossProfit.toFixed(2)}`,
      minimumGrossProfit,
      maxSupplierCostAbsoluteFormatted: maxSupplierCostAbsolute !== null ? `$${maxSupplierCostAbsolute.toFixed(2)}` : 'null (Calculated by Margin & Profit)',
      maxSupplierCostAbsolute,
      allowedSupplierCostFormatted: `$${ceiling.allowedSupplierCost.toFixed(2)}`,
      allowedSupplierCost: ceiling.allowedSupplierCost,
      costCeilingEnabled: true,
      manualReviewEnabled: true,
    };
  });
}
