import { db } from '@/db';
import { orders, fulfillmentChains, fulfillmentChainServices } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export interface ChainServiceEvaluation {
  serviceId: string;
  priority: number;
  priorityLabel: 'Primary' | 'Fallback 1' | 'Fallback 2';
  minQuantity: number;
  maxQuantity: number;
  eligible: boolean;
  specialPayloadRequired?: boolean;
  ineligibilityReason?: 'INELIGIBLE_QUANTITY' | 'INACTIVE' | null;
}

export interface PeakerrSimulatedPayload {
  provider: 'peakerr';
  service: string;
  link: string;
  quantity: number;
}

export interface FulfillmentSimulationSuccess {
  success: true;
  action: 'DRY_RUN_READY';
  orderId?: string;
  publicId?: string;
  platform: string;
  service: string;
  variant: string;
  quantity: number;
  target: string;
  targetType: string;
  chain: {
    id: string;
    name: string;
    autoFallback: boolean;
  };
  primaryServiceId: string;
  fallbacks: string[];
  chainServicesEvaluation: ChainServiceEvaluation[];
  peakerrRequestPayload: PeakerrSimulatedPayload;
  notice: 'SIMULATION ONLY - NO REQUEST SENT TO PEAKERR';
  dryRunMode: true;
}

export interface FulfillmentSimulationError {
  success: false;
  error: {
    code:
      | 'ORDER_NOT_FOUND'
      | 'PAYMENT_NOT_ELIGIBLE'
      | 'FULFILLMENT_STATUS_INVALID'
      | 'INVALID_QUANTITY'
      | 'MISSING_TARGET'
      | 'TARGET_PLATFORM_MISMATCH'
      | 'INVALID_CONTENT_URL'
      | 'CHAIN_NOT_FOUND'
      | 'NO_ACTIVE_SERVICES'
      | 'NO_ELIGIBLE_PROVIDER'
      | 'PRIMARY_INELIGIBLE_AUTO_FALLBACK_DISABLED';
    message: string;
  };
}

export type FulfillmentSimulationResult = FulfillmentSimulationSuccess | FulfillmentSimulationError;

// Platform domain host mappings for strict host / mismatch validation
const PLATFORM_DOMAINS: Record<string, string[]> = {
  instagram: ['instagram.com', 'www.instagram.com', 'instagr.am'],
  tiktok: ['tiktok.com', 'www.tiktok.com', 'm.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
  youtube: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'],
  twitter: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'],
};

/**
 * Validates whether a given URL belongs to the expected platform.
 */
export function isUrlOfPlatform(urlStr: string, platform: string): boolean {
  try {
    const parsed = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    const host = parsed.hostname.toLowerCase();
    const allowed = PLATFORM_DOMAINS[platform.toLowerCase()] || [];
    return allowed.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

/**
 * Checks if a URL is a content URL (post, reel, video, tweet) rather than a profile home URL.
 */
export function isContentUrl(urlStr: string, platform: string): boolean {
  try {
    const parsed = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    const path = parsed.pathname.toLowerCase();
    const p = platform.toLowerCase();

    if (p === 'instagram') {
      return path.includes('/p/') || path.includes('/reel/') || path.includes('/tv/') || path.includes('/reels/');
    }
    if (p === 'tiktok') {
      return path.includes('/video/') || path.includes('/v/') || parsed.hostname.includes('vm.tiktok.com') || parsed.hostname.includes('vt.tiktok.com');
    }
    if (p === 'youtube') {
      return path.includes('/watch') || path.includes('/shorts/') || parsed.hostname.includes('youtu.be') || path.includes('/v/');
    }
    if (p === 'twitter') {
      return path.includes('/status/') || path.includes('/statuses/');
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves and normalizes the target for any service/platform combination with strict validation.
 */
export function resolveAndValidateTarget(
  targetInput: string | null | undefined,
  platform: string,
  service: string
): { success: true; target: string; targetType: string } | { success: false; code: 'MISSING_TARGET' | 'TARGET_PLATFORM_MISMATCH' | 'INVALID_CONTENT_URL'; message: string } {
  if (!targetInput || targetInput.trim().length === 0) {
    return {
      success: false,
      code: 'MISSING_TARGET',
      message: `Target is required for ${platform} ${service}.`,
    };
  }

  const raw = targetInput.trim();
  const p = platform.toLowerCase();
  const s = service.toLowerCase();

  // 1. Check if input is a full URL of another platform (Mismatch Check)
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    const isMatched = isUrlOfPlatform(raw, p);
    if (!isMatched) {
      return {
        success: false,
        code: 'TARGET_PLATFORM_MISMATCH',
        message: `Target URL does not match platform ${platform.toUpperCase()}. Provided: ${raw}`,
      };
    }
  }

  // 2. Service-Specific Validation
  if (s === 'followers') {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return { success: true, target: raw, targetType: 'profile_url' };
    }

    // Normalized handle to standard profile URL
    const cleanUsername = raw.replace(/^@+/, '').trim();
    if (!cleanUsername) {
      return { success: false, code: 'MISSING_TARGET', message: 'Valid username or profile URL required.' };
    }

    let normalizedUrl = `https://${p === 'twitter' ? 'x.com' : `${p}.com`}/${cleanUsername}`;
    if (p === 'youtube') {
      normalizedUrl = `https://youtube.com/@${cleanUsername}`;
    }
    return { success: true, target: normalizedUrl, targetType: 'profile_fallback' };
  }

  // 3. Content Services (likes, views, comments) STRICTLY REQUIRE valid content URL
  if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
    return {
      success: false,
      code: 'INVALID_CONTENT_URL',
      message: `${service.toUpperCase()} requires a valid full content URL (e.g. https://${p === 'twitter' ? 'x.com' : `${p}.com`}/...).`,
    };
  }

  if (!isContentUrl(raw, p)) {
    return {
      success: false,
      code: 'INVALID_CONTENT_URL',
      message: `The provided URL does not appear to be a direct content/post URL for ${platform}.`,
    };
  }

  return { success: true, target: raw, targetType: 'content_url' };
}

/**
 * SHARED CORE CHAIN RESOLVER:
 * Resolves fulfillment chains from Supabase, evaluates min/max bounds, applies auto_fallback logic,
 * and formats the exact Peakerr payload preview.
 */
export async function resolveFulfillmentChainAndPreview(params: {
  platform: string;
  service: string;
  variant?: string;
  quantity: number;
  target: string;
  targetType: string;
  orderId?: string;
  publicId?: string;
}): Promise<FulfillmentSimulationResult> {
  const { platform, service, quantity, target, targetType, orderId, publicId } = params;
  const variant = params.variant || 'standard';

  // 1. Fetch Active Chain from Database
  const [chain] = await db.query.fulfillmentChains.findMany({
    where: and(
      eq(fulfillmentChains.platform, platform.toLowerCase()),
      eq(fulfillmentChains.service, service.toLowerCase()),
      eq(fulfillmentChains.variant, variant),
      eq(fulfillmentChains.active, true)
    ),
    limit: 1,
  });

  if (!chain) {
    return {
      success: false,
      error: {
        code: 'CHAIN_NOT_FOUND',
        message: `No active fulfillment chain found in database for ${platform} ${service} (${variant}).`,
      },
    };
  }

  // 2. Fetch Active Chain Services (Priority 1 = Primary, 2 = Fallback 1, 3 = Fallback 2)
  const rawServices = await db.query.fulfillmentChainServices.findMany({
    where: and(
      eq(fulfillmentChainServices.chainId, chain.id),
      eq(fulfillmentChainServices.active, true)
    ),
    orderBy: [asc(fulfillmentChainServices.priority)],
  });

  const chainServices = [...rawServices].sort((a, b) => a.priority - b.priority);

  if (chainServices.length === 0) {
    return {
      success: false,
      error: {
        code: 'NO_ACTIVE_SERVICES',
        message: `Fulfillment chain "${chain.name}" has no active Peakerr services assigned.`,
      },
    };
  }

  // 3. Evaluate each service slot (min/max range & eligibility)
  const priorityLabels: Record<number, 'Primary' | 'Fallback 1' | 'Fallback 2'> = {
    1: 'Primary',
    2: 'Fallback 1',
    3: 'Fallback 2',
  };

  const chainServicesEvaluation: ChainServiceEvaluation[] = chainServices.map((s) => {
    const isEligible = quantity >= s.minQuantity && quantity <= s.maxQuantity;
    return {
      serviceId: s.providerServiceId,
      priority: s.priority,
      priorityLabel: priorityLabels[s.priority] || `Fallback ${s.priority - 1}`,
      minQuantity: s.minQuantity,
      maxQuantity: s.maxQuantity,
      eligible: isEligible,
      ineligibilityReason: isEligible ? null : 'INELIGIBLE_QUANTITY',
    };
  });

  const eligibleServices = chainServicesEvaluation.filter((s) => s.eligible);

  if (eligibleServices.length === 0) {
    return {
      success: false,
      error: {
        code: 'NO_ELIGIBLE_PROVIDER',
        message: `Order quantity (${quantity}) does not satisfy min/max constraints of any service in chain "${chain.name}".`,
      },
    };
  }

  // 4. Evaluate Auto Fallback Policy
  const primaryCandidate = chainServicesEvaluation.find((s) => s.priority === 1);
  const isPrimaryEligible = primaryCandidate?.eligible ?? false;

  if (!isPrimaryEligible && !chain.autoFallback) {
    return {
      success: false,
      error: {
        code: 'PRIMARY_INELIGIBLE_AUTO_FALLBACK_DISABLED',
        message: `Primary service (${primaryCandidate?.serviceId}) is ineligible for quantity ${quantity}, and Auto Fallback is disabled on chain "${chain.name}".`,
      },
    };
  }

  const selectedPrimary = isPrimaryEligible
    ? primaryCandidate!.serviceId
    : eligibleServices[0].serviceId;

  const eligibleFallbacks = chain.autoFallback
    ? eligibleServices.filter((s) => s.serviceId !== selectedPrimary).map((s) => s.serviceId)
    : [];

  // 5. Construct Simulated Peakerr Payload (Exact JSON structure for future execution)
  const peakerrRequestPayload: PeakerrSimulatedPayload = {
    provider: 'peakerr',
    service: selectedPrimary,
    link: target,
    quantity,
  };

  return {
    success: true,
    action: 'DRY_RUN_READY',
    orderId,
    publicId,
    platform: platform.toLowerCase(),
    service: service.toLowerCase(),
    variant,
    quantity,
    target,
    targetType,
    chain: {
      id: chain.id,
      name: chain.name,
      autoFallback: chain.autoFallback,
    },
    primaryServiceId: selectedPrimary,
    fallbacks: eligibleFallbacks,
    chainServicesEvaluation,
    peakerrRequestPayload,
    notice: 'SIMULATION ONLY - NO REQUEST SENT TO PEAKERR',
    dryRunMode: true,
  };
}

/**
 * Generates Dry Run for an EXISTING Order ID using the shared resolver.
 */
export async function generateFulfillmentPreview(orderId: string, variant = 'standard'): Promise<FulfillmentSimulationResult> {
  const [order] = await db.query.orders.findMany({
    where: eq(orders.id, orderId),
    limit: 1,
  });

  if (!order) {
    return {
      success: false,
      error: { code: 'ORDER_NOT_FOUND', message: `Order with ID ${orderId} does not exist.` },
    };
  }

  if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'COMPLETED') {
    return {
      success: false,
      error: {
        code: 'PAYMENT_NOT_ELIGIBLE',
        message: `Order payment status is ${order.paymentStatus}; must be PAID or COMPLETED.`,
      },
    };
  }

  if (order.fulfillmentStatus !== 'NOT_DISPATCHED') {
    return {
      success: false,
      error: {
        code: 'FULFILLMENT_STATUS_INVALID',
        message: `Order fulfillment status is ${order.fulfillmentStatus}; cannot preview already dispatched orders.`,
      },
    };
  }

  const quantity = Number(order.quantity);
  if (!quantity || quantity <= 0) {
    return {
      success: false,
      error: { code: 'INVALID_QUANTITY', message: `Order quantity is ${quantity}; must be greater than 0.` },
    };
  }

  if (!order.platform || !order.service) {
    return {
      success: false,
      error: { code: 'ORDER_NOT_FOUND', message: 'Order platform or service is missing.' },
    };
  }

  const targetInput = order.service.toLowerCase() === 'followers'
    ? (order.profileUrl || order.socialUsername)
    : order.targetUrl;

  const targetRes = resolveAndValidateTarget(targetInput, order.platform, order.service);
  if (!targetRes.success) {
    return {
      success: false,
      error: { code: targetRes.code, message: targetRes.message },
    };
  }

  return resolveFulfillmentChainAndPreview({
    platform: order.platform,
    service: order.service,
    variant,
    quantity,
    target: targetRes.target,
    targetType: targetRes.targetType,
    orderId: order.id,
    publicId: order.publicId,
  });
}
