import { CLOUTFLOW_CATALOG_PACKAGES } from '@/config/financial-protection.config';
import { OFFICIAL_PERFECTPAY_66_DATASET, PerfectPayDatasetItem } from '@/config/official-perfectpay-dataset';

export type CommercialPlatform = 'instagram' | 'tiktok' | 'twitter' | 'youtube';
export type CommercialService = 'followers' | 'likes' | 'views';
export type CommercialPlan = 'starter' | 'boost' | 'growth' | 'pro' | 'elite' | 'max';
export type CommercialSurface = 'home' | 'offer_step3' | 'admin';

export interface CommercialIdentity {
  platform: CommercialPlatform;
  service: CommercialService;
  plan: CommercialPlan;
}

export interface CommercialOfferResolved {
  id: string | null;
  identity: CommercialIdentity;
  platform: CommercialPlatform;
  service: CommercialService;
  plan: CommercialPlan;
  planDisplayName: string;
  quantity: number;
  bonusQuantity: number;
  deliveredQuantity: number;
  priceCents: number;
  priceFormatted: string;
  compareAtPriceCents: number;
  compareAtPriceFormatted: string;
  discountPercent: number;
  badge: string | null;
  title: string | null;
  subtitle: string | null;
  deliveryText: string | null;
  refillText: string | null;
  qualityText: string | null;
  features: string[];
  productCode: string | null;
  planCode: string | null;
  checkoutUrl: string | null;
  hasCheckoutConfigured: boolean;
  syncHome: boolean;
  syncOfferStep3: boolean;
  active: boolean;
  isOverride: boolean;
  source: 'ADMIN_OVERRIDE' | 'CANONICAL_CATALOG';
}

export const CANONICAL_PLANS: { key: CommercialPlan; displayName: string }[] = [
  { key: 'starter', displayName: 'Starter' },
  { key: 'boost', displayName: 'Boost' },
  { key: 'growth', displayName: 'Growth' },
  { key: 'pro', displayName: 'Pro' },
  { key: 'elite', displayName: 'Elite' },
  { key: 'max', displayName: 'Max' },
];

export const VALID_PLATFORMS: CommercialPlatform[] = ['instagram', 'tiktok', 'twitter', 'youtube'];

export const PLATFORM_SERVICES: Record<CommercialPlatform, CommercialService[]> = {
  instagram: ['followers', 'likes', 'views'],
  tiktok: ['followers', 'likes', 'views'],
  twitter: ['followers', 'likes', 'views'],
  youtube: ['likes', 'views'], // YouTube Followers is NOT supported
};

/**
 * Normalizes platform slug: 'x' -> 'twitter'
 */
export function normalizePlatform(platform: string): CommercialPlatform | null {
  const p = platform?.toLowerCase().trim();
  if (p === 'twitter' || p === 'x') return 'twitter';
  if (p === 'instagram' || p === 'tiktok' || p === 'youtube') return p as CommercialPlatform;
  return null;
}

/**
 * Normalizes service slug
 */
export function normalizeService(service: string): CommercialService | null {
  const s = service?.toLowerCase().trim();
  if (s === 'followers' || s === 'likes' || s === 'views') return s as CommercialService;
  return null;
}

/**
 * Normalizes plan name
 */
export function normalizePlan(plan: string): CommercialPlan | null {
  const pl = plan?.toLowerCase().trim();
  if (!pl) return null;
  const match = CANONICAL_PLANS.find((c) => c.key === pl || c.displayName.toLowerCase() === pl);
  if (match) return match.key;
  
  // Fuzzy lookup for names like "1,000 Premium Followers Starter" or slugs containing canonical plan
  for (const c of CANONICAL_PLANS) {
    if (pl.includes(c.key) || pl.includes(c.displayName.toLowerCase())) {
      return c.key;
    }
  }
  // Default to starter if creating custom plan names
  return 'starter';
}

/**
 * Validates if the combination platform + service is valid (e.g. YouTube Followers is blocked)
 */
export function isValidPlatformService(platform: CommercialPlatform, service: CommercialService): boolean {
  const allowed = PLATFORM_SERVICES[platform];
  return Boolean(allowed && allowed.includes(service));
}

/**
 * Validates URL format and security for checkout
 */
export function validateCheckoutUrl(urlStr: string | null | undefined): boolean {
  if (!urlStr) return false;
  const trimmed = urlStr.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    if (parsed.protocol === 'http:' && !parsed.hostname.includes('localhost')) return false;
    // Reject javascript:, data:, etc
    if (trimmed.toLowerCase().startsWith('javascript:') || trimmed.toLowerCase().startsWith('data:')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves the canonical package fallback from CLOUTFLOW_CATALOG_PACKAGES
 */
export function getCanonicalCatalogPackage(
  platform: CommercialPlatform,
  service: CommercialService,
  plan: CommercialPlan
) {
  const planObj = CANONICAL_PLANS.find((p) => p.key === plan);
  const planDisplayName = planObj ? planObj.displayName : plan;

  const pkg = CLOUTFLOW_CATALOG_PACKAGES.find(
    (p) =>
      p.platform === platform &&
      p.service === service &&
      p.name.toLowerCase() === planDisplayName.toLowerCase()
  );

  if (!pkg) return null;

  const sellingPriceCents = pkg.priceCents;
  const compareAtPriceCents = Math.round(sellingPriceCents * 1.35);
  const discountPercent = Math.round(((compareAtPriceCents - sellingPriceCents) / compareAtPriceCents) * 100);

  return {
    platform,
    service,
    plan,
    planDisplayName: pkg.name,
    quantity: pkg.quantity,
    bonusQuantity: 0,
    deliveredQuantity: pkg.quantity,
    priceCents: sellingPriceCents,
    priceFormatted: `$${(sellingPriceCents / 100).toFixed(2)}`,
    compareAtPriceCents,
    compareAtPriceFormatted: `$${(compareAtPriceCents / 100).toFixed(2)}`,
    discountPercent,
    badge: null,
    title: null,
    subtitle: null,
    deliveryText: 'Instant Start',
    refillText: 'Refill Guarantee',
    qualityText: 'High Quality',
    features: ['Instant Delivery', 'High Retention', '24/7 Support', 'No Password Required'],
  };
}

/**
 * Resolves the canonical PerfectPay dataset configuration for an exact (platform, service, plan) identity.
 */
export function getCanonicalPerfectPayItem(
  platformInput: string,
  serviceInput: string,
  planInput: string
): PerfectPayDatasetItem | null {
  const platform = normalizePlatform(platformInput);
  const service = normalizeService(serviceInput);
  const plan = normalizePlan(planInput);

  if (!platform || !service || !plan || !isValidPlatformService(platform, service)) {
    return null;
  }

  const match = OFFICIAL_PERFECTPAY_66_DATASET.find(
    (item) => item.platform === platform && item.service === service && item.plan === plan
  );

  return match || null;
}

export type CheckoutStatus = 'READY' | 'INCOMPLETE' | 'MISSING';

export interface CheckoutIdentityStatus {
  productCodeStatus: 'configured' | 'missing';
  planCodeStatus: 'configured' | 'missing';
  checkoutUrlStatus: 'configured' | 'missing';
  status: CheckoutStatus;
  productCode: string | null;
  planCode: string | null;
  checkoutUrl: string | null;
}

export interface DuplicateCheckoutWarning {
  type: 'DUPLICATE_CHECKOUT_URL' | 'DUPLICATE_PRODUCT_PLAN_CODE';
  value: string;
  identities: {
    platform: CommercialPlatform;
    service: CommercialService;
    plan: CommercialPlan;
    offerId?: string | null;
  }[];
}

export interface CommercialCounters {
  totalCards: number; // Always 66
  checkoutReady: number;
  checkoutIncomplete: number;
  checkoutMissing: number;
  productCodeConfigured: number;
  planCodeConfigured: number;
  checkoutUrlConfigured: number;
}

/**
 * Evaluates the exact checkout status for an offer:
 * - READY: productCode exists AND planCode exists AND checkoutUrl is valid HTTPS URL
 * - INCOMPLETE: at least one field is filled/valid, but not all three
 * - MISSING: none of the three fields are filled
 */
export function evaluateCheckoutStatus(
  productCode: string | null | undefined,
  planCode: string | null | undefined,
  checkoutUrl: string | null | undefined
): CheckoutIdentityStatus {
  const normProduct = productCode && typeof productCode === 'string' && productCode.trim().length > 0 ? productCode.trim() : null;
  const normPlan = planCode && typeof planCode === 'string' && planCode.trim().length > 0 ? planCode.trim() : null;
  const isValidUrl = validateCheckoutUrl(checkoutUrl);
  const normUrl = isValidUrl && checkoutUrl ? checkoutUrl.trim() : null;

  const hasProduct = Boolean(normProduct);
  const hasPlan = Boolean(normPlan);
  const hasUrl = Boolean(normUrl);

  let status: CheckoutStatus = 'MISSING';
  if (hasProduct && hasPlan && hasUrl) {
    status = 'READY';
  } else if (hasProduct || hasPlan || hasUrl) {
    status = 'INCOMPLETE';
  } else {
    status = 'MISSING';
  }

  return {
    productCodeStatus: hasProduct ? 'configured' : 'missing',
    planCodeStatus: hasPlan ? 'configured' : 'missing',
    checkoutUrlStatus: hasUrl ? 'configured' : 'missing',
    status,
    productCode: normProduct,
    planCode: normPlan,
    checkoutUrl: normUrl,
  };
}

/**
 * Dedicated Canonical Checkout Resolver by exact (platform, service, plan) identity.
 * Precedence Rule:
 * 1. Normalizes platform, service, plan
 * 2. Validates PLATFORM_SERVICES matrix (e.g. rejects youtube + followers)
 * 3. Finds exact matching active offer override if present
 * 4. Verifies externalCheckoutUrl
 * 5. Returns checkout URL only for that exact identity (NO cross-identity leaks)
 */
export function resolveCheckoutForIdentity(
  platformInput: string,
  serviceInput: string,
  planInput: string,
  adminOffers: any[] = []
): {
  identity: CommercialIdentity | null;
  offerId: string | null;
  checkoutUrl: string | null;
  productCode: string | null;
  planCode: string | null;
  status: CheckoutStatus;
  isAllowed: boolean;
} {
  const platform = normalizePlatform(platformInput);
  const service = normalizeService(serviceInput);
  const plan = normalizePlan(planInput);

  if (!platform || !service || !plan || !isValidPlatformService(platform, service)) {
    return {
      identity: null,
      offerId: null,
      checkoutUrl: null,
      productCode: null,
      planCode: null,
      status: 'MISSING',
      isAllowed: false,
    };
  }

  // Exact lookup: NEVER fallback by plan only or service only or platform only
  const matchingOffer = adminOffers.find((o) => {
    const oPlat = normalizePlatform(o.platform);
    const oServ = normalizeService(o.service);
    const oPlan = normalizePlan(o.name || o.slug || '');
    return oPlat === platform && oServ === service && oPlan === plan && (o.active ?? true);
  });

  const rawUrl = matchingOffer?.externalCheckoutUrl || matchingOffer?.checkoutUrl || null;
  const productCode = matchingOffer?.perfectpayProductId || null;
  const planCode = matchingOffer?.perfectpayPlanId || null;

  const evalStatus = evaluateCheckoutStatus(productCode, planCode, rawUrl);

  return {
    identity: { platform, service, plan },
    offerId: matchingOffer?.id || null,
    checkoutUrl: evalStatus.checkoutUrl,
    productCode: evalStatus.productCode,
    planCode: evalStatus.planCode,
    status: evalStatus.status,
    isAllowed: true,
  };
}

/**
 * Computes administrative diagnostics for all 66 commercial cards:
 * - Counters: Ready (X), Incomplete (Y), Missing (Z), where X + Y + Z = 66
 * - Duplicate checkout URL warnings
 * - Duplicate (productCode + planCode) warnings
 */
export function computeCommercialDiagnostics(adminOffers: any[] = []): {
  counters: CommercialCounters;
  duplicateWarnings: DuplicateCheckoutWarning[];
  cards: (CommercialOfferResolved & { checkoutDetails: CheckoutIdentityStatus })[];
} {
  const cards: (CommercialOfferResolved & { checkoutDetails: CheckoutIdentityStatus })[] = [];
  const urlMap = new Map<string, { platform: CommercialPlatform; service: CommercialService; plan: CommercialPlan; offerId?: string | null }[]>();
  const codeMap = new Map<string, { platform: CommercialPlatform; service: CommercialService; plan: CommercialPlan; offerId?: string | null }[]>();

  let readyCount = 0;
  let incompleteCount = 0;
  let missingCount = 0;
  let prodCount = 0;
  let planCount = 0;
  let urlCount = 0;

  for (const plat of VALID_PLATFORMS) {
    const services = PLATFORM_SERVICES[plat];
    for (const serv of services) {
      for (const planObj of CANONICAL_PLANS) {
        const resolved = resolveCommercialOffer(plat, serv, planObj.key, adminOffers, 'admin');
        if (resolved) {
          const details = evaluateCheckoutStatus(resolved.productCode, resolved.planCode, resolved.checkoutUrl);
          
          if (details.status === 'READY') readyCount++;
          else if (details.status === 'INCOMPLETE') incompleteCount++;
          else missingCount++;

          if (details.productCode) prodCount++;
          if (details.planCode) planCount++;
          if (details.checkoutUrl) urlCount++;

          if (details.checkoutUrl) {
            const existing = urlMap.get(details.checkoutUrl) || [];
            existing.push({ platform: plat, service: serv, plan: planObj.key, offerId: resolved.id });
            urlMap.set(details.checkoutUrl, existing);
          }

          if (details.productCode && details.planCode) {
            const comboKey = `${details.productCode}::${details.planCode}`;
            const existing = codeMap.get(comboKey) || [];
            existing.push({ platform: plat, service: serv, plan: planObj.key, offerId: resolved.id });
            codeMap.set(comboKey, existing);
          }

          cards.push({
            ...resolved,
            checkoutDetails: details,
          });
        }
      }
    }
  }

  const duplicateWarnings: DuplicateCheckoutWarning[] = [];

  for (const [url, identities] of urlMap.entries()) {
    if (identities.length > 1) {
      duplicateWarnings.push({
        type: 'DUPLICATE_CHECKOUT_URL',
        value: url,
        identities,
      });
    }
  }

  for (const [combo, identities] of codeMap.entries()) {
    if (identities.length > 1) {
      duplicateWarnings.push({
        type: 'DUPLICATE_PRODUCT_PLAN_CODE',
        value: combo,
        identities,
      });
    }
  }

  return {
    counters: {
      totalCards: cards.length, // ALWAYS 66
      checkoutReady: readyCount,
      checkoutIncomplete: incompleteCount,
      checkoutMissing: missingCount,
      productCodeConfigured: prodCount,
      planCodeConfigured: planCount,
      checkoutUrlConfigured: urlCount,
    },
    duplicateWarnings,
    cards,
  };
}

/**
 * Pure Single Shared Commercial Resolver for Home, Offers Step 3, Checkout, and Admin.
 * Precedence Rule:
 * 1. Active Admin Offer Override (matching platform, service, plan)
 * 2. If present and sync is enabled for the surface -> Use Admin Offer
 * 3. Otherwise -> Fallback to Canonical Catalog Package (CLOUTFLOW_CATALOG_PACKAGES)
 */
export function resolveCommercialOffer(
  platformInput: string,
  serviceInput: string,
  planInput: string,
  adminOffers: any[] = [],
  surface: CommercialSurface = 'home'
): CommercialOfferResolved | null {
  const platform = normalizePlatform(platformInput);
  const service = normalizeService(serviceInput);
  const plan = normalizePlan(planInput);

  if (!platform || !service || !plan) {
    return null;
  }

  if (!isValidPlatformService(platform, service)) {
    return null;
  }

  const canonical = getCanonicalCatalogPackage(platform, service, plan);
  if (!canonical) {
    return null;
  }

  const planDisplayName = canonical.planDisplayName;

  // Search for matching Admin Offer
  const matchingOffer = adminOffers.find((o) => {
    const oPlat = normalizePlatform(o.platform);
    const oServ = normalizeService(o.service);
    const oPlan = normalizePlan(o.name || o.slug || '');
    return oPlat === platform && oServ === service && oPlan === plan;
  });

  const isOverrideActive = Boolean(matchingOffer && matchingOffer.active);
  const isSyncAllowed =
    surface === 'admin'
      ? true
      : surface === 'home'
      ? Boolean(matchingOffer?.syncHome ?? true)
      : surface === 'offer_step3'
      ? Boolean(matchingOffer?.syncOfferStep3 ?? true)
      : true;

  if (matchingOffer && isOverrideActive && isSyncAllowed) {
    const rawPriceCents = matchingOffer.priceCents ?? (matchingOffer.price ? Math.round(Number(matchingOffer.price) * 100) : canonical.priceCents);
    const priceCents = Number(rawPriceCents);
    const rawOldPriceCents = matchingOffer.oldPriceCents ?? (matchingOffer.oldPrice ? Math.round(Number(matchingOffer.oldPrice) * 100) : null);
    const compareAtPriceCents = rawOldPriceCents ? Number(rawOldPriceCents) : Math.round(priceCents * 1.35);
    const discountPercent =
      compareAtPriceCents > priceCents
        ? Math.round(((compareAtPriceCents - priceCents) / compareAtPriceCents) * 100)
        : canonical.discountPercent;

    const quantity = Number(matchingOffer.quantity ?? canonical.quantity);
    const bonusQuantity = Number(matchingOffer.bonusQuantity ?? matchingOffer.bonus ?? 0);
    const deliveredQuantity = quantity + bonusQuantity;

    const meta = (matchingOffer.metadata as Record<string, any>) || {};
    const features = Array.isArray(matchingOffer.benefits)
      ? matchingOffer.benefits
      : Array.isArray(meta.benefits)
      ? meta.benefits
      : canonical.features;

    const rawCheckoutUrl = matchingOffer.externalCheckoutUrl || matchingOffer.checkoutUrl || null;
    const isCheckoutValid = validateCheckoutUrl(rawCheckoutUrl);
    const checkoutUrl = isCheckoutValid ? rawCheckoutUrl.trim() : null;

    const productCode = matchingOffer.perfectpayProductId || null;
    const planCode = matchingOffer.perfectpayPlanId || null;

    return {
      id: matchingOffer.id || null,
      identity: { platform, service, plan },
      platform,
      service,
      plan,
      planDisplayName,
      quantity,
      bonusQuantity,
      deliveredQuantity,
      priceCents,
      priceFormatted: `$${(priceCents / 100).toFixed(2)}`,
      compareAtPriceCents,
      compareAtPriceFormatted: `$${(compareAtPriceCents / 100).toFixed(2)}`,
      discountPercent,
      badge: matchingOffer.badge || matchingOffer.tag || meta.badge || null,
      title: meta.title || null,
      subtitle: meta.subtitle || null,
      deliveryText: meta.deliveryText || canonical.deliveryText,
      refillText: meta.refillText || canonical.refillText,
      qualityText: meta.qualityText || canonical.qualityText,
      features,
      productCode,
      planCode,
      checkoutUrl,
      hasCheckoutConfigured: Boolean(checkoutUrl && productCode && planCode),
      syncHome: matchingOffer.syncHome ?? true,
      syncOfferStep3: matchingOffer.syncOfferStep3 ?? true,
      active: matchingOffer.active ?? true,
      isOverride: true,
      source: 'ADMIN_OVERRIDE',
    };
  }

  // Canonical Catalog Fallback
  const productCode = matchingOffer?.perfectpayProductId || null;
  const planCode = matchingOffer?.perfectpayPlanId || null;
  const rawFallbackUrl = matchingOffer?.externalCheckoutUrl || matchingOffer?.checkoutUrl || null;
  const checkoutUrl = validateCheckoutUrl(rawFallbackUrl) ? rawFallbackUrl.trim() : null;

  return {
    id: matchingOffer?.id || null,
    identity: { platform, service, plan },
    platform,
    service,
    plan,
    planDisplayName,
    quantity: canonical.quantity,
    bonusQuantity: canonical.bonusQuantity,
    deliveredQuantity: canonical.deliveredQuantity,
    priceCents: canonical.priceCents,
    priceFormatted: canonical.priceFormatted,
    compareAtPriceCents: canonical.compareAtPriceCents,
    compareAtPriceFormatted: canonical.compareAtPriceFormatted,
    discountPercent: canonical.discountPercent,
    badge: canonical.badge,
    title: canonical.title,
    subtitle: canonical.subtitle,
    deliveryText: canonical.deliveryText,
    refillText: canonical.refillText,
    qualityText: canonical.qualityText,
    features: canonical.features,
    productCode,
    planCode,
    checkoutUrl,
    hasCheckoutConfigured: Boolean(
      productCode &&
        planCode &&
        checkoutUrl
    ),
    syncHome: matchingOffer?.syncHome ?? true,
    syncOfferStep3: matchingOffer?.syncOfferStep3 ?? true,
    active: matchingOffer?.active ?? true,
    isOverride: false,
    source: 'CANONICAL_CATALOG',
  };
}

/**
 * Returns all resolved offers for a given platform + service (always exactly 6 plans if valid)
 */
export function resolveCommercialCardsForService(
  platformInput: string,
  serviceInput: string,
  adminOffers: any[] = [],
  surface: CommercialSurface = 'home'
): CommercialOfferResolved[] {
  const platform = normalizePlatform(platformInput);
  const service = normalizeService(serviceInput);

  if (!platform || !service || !isValidPlatformService(platform, service)) {
    return [];
  }

  return CANONICAL_PLANS.map((p) => {
    return resolveCommercialOffer(platform, service, p.key, adminOffers, surface)!;
  }).filter(Boolean);
}
