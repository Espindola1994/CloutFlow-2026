import { db } from '@/db';
import { orders, offers, fulfillmentChains, fulfillmentChainServices } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export interface FulfillmentPreviewSuccess {
  success: true;
  action: 'DRY_RUN_READY';
  orderId: string;
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
  eligibleServices: {
    serviceId: string;
    priority: number;
    minQuantity: number;
    maxQuantity: number;
  }[];
  dryRunMode: true;
}

export interface FulfillmentPreviewError {
  success: false;
  error: {
    code:
      | 'ORDER_NOT_FOUND'
      | 'PAYMENT_NOT_ELIGIBLE'
      | 'FULFILLMENT_STATUS_INVALID'
      | 'INVALID_QUANTITY'
      | 'MISSING_TARGET'
      | 'CHAIN_NOT_FOUND'
      | 'NO_ACTIVE_SERVICES'
      | 'QUANTITY_OUT_OF_BOUNDS';
    message: string;
  };
}

export type FulfillmentPreviewResult = FulfillmentPreviewSuccess | FulfillmentPreviewError;

/**
 * Resolves the exact target URL / string from the order according to service rules.
 */
export function resolveOrderTarget(order: {
  service: string;
  platform: string;
  targetUrl?: string | null;
  profileUrl?: string | null;
  socialUsername?: string | null;
}): { target: string | null; targetType: string } {
  const s = order.service.toLowerCase();

  if (s === 'followers') {
    if (order.profileUrl && order.profileUrl.trim().length > 0) {
      return { target: order.profileUrl.trim(), targetType: 'profile_url' };
    }
    if (order.socialUsername && order.socialUsername.trim().length > 0) {
      const clean = order.socialUsername.replace(/^@+/, '').trim();
      const p = order.platform.toLowerCase();
      const domain = p === 'twitter' ? 'x.com' : `${p}.com`;
      const fallbackUrl = p === 'youtube' ? `https://youtube.com/@${clean}` : `https://${domain}/${clean}`;
      return { target: fallbackUrl, targetType: 'profile_fallback' };
    }
    return { target: null, targetType: 'missing' };
  }

  // Likes, Views, Comments strictly require content targetUrl
  if (order.targetUrl && order.targetUrl.trim().length > 0) {
    return { target: order.targetUrl.trim(), targetType: 'content_url' };
  }

  return { target: null, targetType: 'missing' };
}

/**
 * Generates a Dry Run Fulfillment Preview for a specific Order ID.
 * Strictly verifies payment status, order quantity (from Order, NEVER Plan=1),
 * target compliance, and resolves the Peakerr Fulfillment Chain.
 */
export async function generateFulfillmentPreview(orderId: string, variant = 'standard'): Promise<FulfillmentPreviewResult> {
  // 1. Fetch Order
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

  // 2. Validate Payment Status (Must be PAID or COMPLETED)
  if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'COMPLETED') {
    return {
      success: false,
      error: {
        code: 'PAYMENT_NOT_ELIGIBLE',
        message: `Order payment status is ${order.paymentStatus}; must be PAID or COMPLETED.`,
      },
    };
  }

  // 3. Validate Fulfillment Status (Must be NOT_DISPATCHED)
  if (order.fulfillmentStatus !== 'NOT_DISPATCHED') {
    return {
      success: false,
      error: {
        code: 'FULFILLMENT_STATUS_INVALID',
        message: `Order fulfillment status is ${order.fulfillmentStatus}; cannot preview already dispatched orders.`,
      },
    };
  }

  // 4. Validate Quantity from Order (Critical requirement: uses orders.quantity)
  const quantity = Number(order.quantity);
  if (!quantity || quantity <= 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_QUANTITY',
        message: `Order quantity is ${quantity}; must be greater than 0.`,
      },
    };
  }

  // 5. Validate Platform and Service presence
  if (!order.platform || !order.service) {
    return {
      success: false,
      error: {
        code: 'ORDER_NOT_FOUND',
        message: 'Order platform or service is missing.',
      },
    };
  }

  // 6. Resolve Target
  const { target, targetType } = resolveOrderTarget({
    service: order.service || '',
    platform: order.platform || '',
    targetUrl: order.targetUrl,
    profileUrl: order.profileUrl,
    socialUsername: order.socialUsername,
  });

  if (!target) {
    return {
      success: false,
      error: {
        code: 'MISSING_TARGET',
        message: `Order does not have a valid ${order.service === 'followers' ? 'profile' : 'content'} target.`,
      },
    };
  }

  // 7. Resolve Fulfillment Chain (platform + service + variant)
  const platform = order.platform.toLowerCase();
  const service = order.service.toLowerCase();

  const [chain] = await db.query.fulfillmentChains.findMany({
    where: and(
      eq(fulfillmentChains.platform, platform),
      eq(fulfillmentChains.service, service),
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
        message: `No active fulfillment chain found for ${platform} ${service} (${variant}).`,
      },
    };
  }

  // 8. Load Chain Services ordered by Priority (1 = primary, 2 = fallback 1, 3 = fallback 2)
  const rawChainServices = await db.query.fulfillmentChainServices.findMany({
    where: and(
      eq(fulfillmentChainServices.chainId, chain.id),
      eq(fulfillmentChainServices.active, true)
    ),
    orderBy: [asc(fulfillmentChainServices.priority)],
  });

  const chainServices = [...rawChainServices].sort((a, b) => a.priority - b.priority);

  if (chainServices.length === 0) {
    return {
      success: false,
      error: {
        code: 'NO_ACTIVE_SERVICES',
        message: `Fulfillment chain ${chain.name} has no active Peakerr services assigned.`,
      },
    };
  }

  // 9. Filter by Min / Max quantity limits
  const eligibleServices = chainServices.filter((s) => {
    return quantity >= s.minQuantity && quantity <= s.maxQuantity;
  });

  if (eligibleServices.length === 0) {
    return {
      success: false,
      error: {
        code: 'QUANTITY_OUT_OF_BOUNDS',
        message: `Order quantity (${quantity}) does not satisfy min/max constraints of any service in this chain.`,
      },
    };
  }

  const primary = eligibleServices[0];
  const fallbacks = eligibleServices.slice(1).map((s) => s.providerServiceId);

  return {
    success: true,
    action: 'DRY_RUN_READY',
    orderId: order.id,
    publicId: order.publicId,
    platform,
    service,
    variant,
    quantity,
    target,
    targetType,
    chain: {
      id: chain.id,
      name: chain.name,
      autoFallback: chain.autoFallback,
    },
    primaryServiceId: primary.providerServiceId,
    fallbacks,
    eligibleServices: eligibleServices.map((s) => ({
      serviceId: s.providerServiceId,
      priority: s.priority,
      minQuantity: s.minQuantity,
      maxQuantity: s.maxQuantity,
    })),
    dryRunMode: true,
  };
}
