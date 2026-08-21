import { db } from '@/db';
import { orders, fulfillmentOrders, orderEvents, offers } from '@/db/schema';
import { eq, and, inArray, or, desc, sql, asc } from 'drizzle-orm';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import { resolveCanonicalFulfillmentTarget } from './fulfillment.service';
import { isAutoDispatchEnabled, isLiveFulfillmentEnabled } from './fulfillment-auto-dispatch.service';
import { resolveFulfillmentChainAndPreview } from './fulfillment-chain.service';

/**
 * Kill switch check for target queue auto release.
 * Requires explicit environment variable PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED === 'true'.
 */
export function isTargetQueueAutoReleaseEnabled(): boolean {
  return process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED === 'true';
}

/**
 * Builds a deterministic canonical key for target slot isolation.
 * Key strictly binds platform + canonicalTarget to prevent cross-platform collision.
 */
export function resolveTargetQueueKey(platform?: string | null, canonicalTarget?: string | null): string {
  const p = (platform || '').toLowerCase().trim();
  const t = (canonicalTarget || '').toLowerCase().trim();
  return `${p}|${t}`;
}

export interface TargetSlotInspectionResult {
  isSlotBusy: boolean;
  canonicalTarget: string | null;
  platform: string | null;
  queueKey: string | null;
  activeOrder?: {
    id: string;
    publicId: string;
    fulfillmentStatus: string;
    externalOrderId?: string | null;
    liveProviderStatus?: string | null;
  } | null;
  queuedCount: number;
  reason?: string;
}

export interface QueuedSweepItemResult {
  orderId?: string;
  publicId?: string;
  target?: string;
  status?: string;
  code?: string;
  skippedReason?: string;
  reason?: string;
  slotBusy?: boolean;
}

export interface ReleaseAllEligibleResult {
  queuedRowsFound: number;
  candidateTargetsFound: number;
  results: QueuedSweepItemResult[];
  details: string[];
}
export interface QueuedTargetGroup {
  queueKey: string;
  platform: string;
  canonicalTarget: string;
  activeDelivery: {
    id: string;
    publicId: string;
    fulfillmentStatus: string;
    providerOrderId: string | null;
    liveStatus?: string | null;
    createdAt: Date;
  } | null;
  queue: Array<{
    id: string;
    publicId: string;
    paymentStatus: string | null;
    fulfillmentStatus: string | null;
    quantity: number;
    service: string | null;
    paidAt: Date | null;
    createdAt: Date;
    queuePosition: number;
  }>;
}

export interface TargetQueueOverviewStats {
  autoReleaseEnabled: boolean;
  autoDispatchEnabled: boolean;
  liveFulfillmentEnabled: boolean;
  queuedOrdersCount: number;
  queuedTargetsCount: number;
  oldestQueueAgeMs: number | null;
  oldestQueueAgeFormatted: string | null;
  lastReleaseEvent: {
    orderId: string | null;
    timestamp: Date | null;
    description: string | null;
  } | null;
}

export interface ReleaseNextResult {
  success: boolean;
  code: string;
  message?: string;
  error?: string;
  orderId?: string;
  publicId?: string;
  providerOrderId?: number | string;
  status?: string;
  skippedReason?: string;
}

/**
 * Read-only evaluation of an order specifically for queue release (expects WAITING_TARGET_SLOT).
 */
export async function evaluateOrderForQueueRelease(orderIdentifier: string) {
  const cleanInput = (orderIdentifier || '').trim();
  if (!cleanInput) {
    return { eligible: false, code: 'INVALID_INPUT', reason: 'Order identifier required.' };
  }

  const fetchedOrders = (await db.query.orders.findMany({
    where: or(eq(orders.id, cleanInput), eq(orders.publicId, cleanInput)),
    limit: 1,
  })) || [];
  const order = fetchedOrders[0];

  if (!order) {
    return { eligible: false, code: 'ORDER_NOT_FOUND', reason: `Order "${cleanInput}" not found.` };
  }

  const orderQuantity = Number(order.quantity);

  if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'COMPLETED') {
    return { eligible: false, code: 'BLOCKED_PAYMENT_INELIGIBLE', reason: `Payment status is "${order.paymentStatus}".`, orderId: order.id, publicId: order.publicId };
  }

  if (order.fulfillmentStatus !== 'WAITING_TARGET_SLOT') {
    return { eligible: false, code: 'BLOCKED_NOT_QUEUED', reason: `Fulfillment status is "${order.fulfillmentStatus}". Only WAITING_TARGET_SLOT orders can be released from target queue.`, orderId: order.id, publicId: order.publicId };
  }

  const targetValidation = resolveCanonicalFulfillmentTarget(order);
  if (!targetValidation.success || !targetValidation.target) {
    return { eligible: false, code: 'BLOCKED_MISSING_TARGET', reason: targetValidation.success ? 'Invalid target' : targetValidation.message, orderId: order.id, publicId: order.publicId };
  }

  if (order.offerId) {
    const fetchedOffers = (await db.query.offers.findMany({
      where: eq(offers.id, order.offerId),
      limit: 1,
    })) || [];
    const offer = fetchedOffers[0];

    if (!offer) {
      return { eligible: false, code: 'BLOCKED_OFFER_NOT_FOUND', reason: `Offer "${order.offerId}" not found.`, orderId: order.id, publicId: order.publicId };
    }
    if (!offer.active) {
      return { eligible: false, code: 'BLOCKED_INACTIVE_OFFER', reason: `Offer "${offer.name}" is inactive.`, orderId: order.id, publicId: order.publicId };
    }
  }

  const resolution = await resolveFulfillmentChainAndPreview({
    platform: order.platform || '',
    service: order.service || '',
    quantity: orderQuantity,
    target: targetValidation.target,
    targetType: targetValidation.targetType,
    orderId: order.id,
    publicId: order.publicId,
  });

  if (!resolution.success) {
    let errorCode: string = resolution.error.code;
    if (errorCode === 'CHAIN_NOT_FOUND' || errorCode === 'NO_ACTIVE_SERVICES') {
      errorCode = 'BLOCKED_CHAIN_NOT_FOUND';
    } else if (errorCode === 'INVALID_QUANTITY') {
      errorCode = 'BLOCKED_INVALID_QUANTITY';
    }
    return {
      eligible: false,
      code: errorCode,
      reason: resolution.error.message,
      orderId: order.id,
      publicId: order.publicId,
    };
  }

  // Balance Check & Rate Evaluation
  let providerBalance: number | undefined;
  let estimatedCost: number | undefined;

  try {
    const balanceRes = await peakerrClient.getBalance();
    if (balanceRes && 'balance' in balanceRes && balanceRes.balance !== undefined) {
      providerBalance = Number(balanceRes.balance);
    }
  } catch {
    // Non-blocking
  }

  try {
    const { fulfillmentChainServices } = await import('@/db/schema');
    const [cs] = await db
      .select()
      .from(fulfillmentChainServices)
      .where(
        and(
          eq(fulfillmentChainServices.chainId, resolution.chain.id),
          eq(fulfillmentChainServices.providerServiceId, resolution.primaryServiceId)
        )
      )
      .limit(1);

    if (cs && 'rate' in cs && cs.rate) {
      const rateNumber = Number(cs.rate);
      estimatedCost = (rateNumber * orderQuantity) / 1000;
    }
  } catch {
    // fallback
  }

  if (providerBalance !== undefined && estimatedCost !== undefined && providerBalance < estimatedCost) {
    return {
      eligible: false,
      code: 'BLOCKED_INSUFFICIENT_PROVIDER_BALANCE',
      reason: `Insufficient Peakerr balance: live balance is $${providerBalance.toFixed(2)}, estimated cost is $${estimatedCost.toFixed(4)}.`,
      orderId: order.id,
      publicId: order.publicId,
      providerBalance,
      estimatedCost,
    };
  }

  return {
    eligible: true,
    orderId: order.id,
    publicId: order.publicId,
    platform: order.platform,
    service: order.service,
    quantity: orderQuantity,
    target: targetValidation.target,
    primaryServiceId: resolution.primaryServiceId,
    estimatedCost,
  };
}

/**
 * Inspects whether the target slot for a given order or target is currently busy.
 */
export async function inspectTargetDeliverySlot(params: {
  orderId?: string;
  platform?: string;
  canonicalTarget?: string;
}): Promise<TargetSlotInspectionResult> {
  let platform = params.platform;
  let canonicalTarget = params.canonicalTarget;
  const originOrderId = params.orderId;

  if (originOrderId && (!platform || !canonicalTarget)) {
    const originOrders = (await db.query.orders.findMany({
      where: or(
        eq(orders.id, originOrderId),
        eq(orders.publicId, originOrderId)
      ),
      limit: 1,
    })) || [];
    const originOrder = originOrders[0];

    if (originOrder) {
      platform = originOrder.platform || undefined;
      const targetRes = resolveCanonicalFulfillmentTarget(originOrder);
      if (targetRes.success && targetRes.target) {
        canonicalTarget = targetRes.target;
      }
    }
  }

  if (!platform || !canonicalTarget) {
    return {
      isSlotBusy: false,
      canonicalTarget: canonicalTarget || null,
      platform: platform || null,
      queueKey: null,
      queuedCount: 0,
      reason: 'MISSING_PLATFORM_OR_TARGET',
    };
  }

  const queueKey = resolveTargetQueueKey(platform, canonicalTarget);

  // Fetch all orders for this platform
  const candidateOrders = (await db.query.orders.findMany({
    where: eq(orders.platform, platform),
  })) || [];

  let activeOrderFound: TargetSlotInspectionResult['activeOrder'] = null;
  let queuedCount = 0;

  for (const o of candidateOrders) {
    // If checking for a specific order, don't let it collide with itself
    if (originOrderId && (o.id === originOrderId || o.publicId === originOrderId)) {
      continue;
    }

    const tRes = resolveCanonicalFulfillmentTarget(o);
    if (!tRes.success || !tRes.target) continue;

    if (resolveTargetQueueKey(o.platform, tRes.target) !== queueKey) {
      continue;
    }

    const fs = (o.fulfillmentStatus || '').toUpperCase();

    if (fs === 'WAITING_TARGET_SLOT') {
      queuedCount++;
    } else if (fs === 'SUBMITTING' || fs === 'PROCESSING') {
      // Find latest fulfillment order
      const latestFuls = (await db.query.fulfillmentOrders.findMany({
        where: eq(fulfillmentOrders.orderId, o.id),
        orderBy: desc(fulfillmentOrders.createdAt),
        limit: 1,
      })) || [];
      const latestFul = latestFuls[0];

      activeOrderFound = {
        id: o.id,
        publicId: o.publicId,
        fulfillmentStatus: fs,
        externalOrderId: latestFul?.externalOrderId || null,
      };
      break; // Found an active slot occupier
    }
  }

  return {
    isSlotBusy: !!activeOrderFound,
    canonicalTarget,
    platform,
    queueKey,
    activeOrder: activeOrderFound,
    queuedCount,
    reason: activeOrderFound ? `Target slot busy with order ${activeOrderFound.publicId} (${activeOrderFound.fulfillmentStatus})` : 'Target slot free',
  };
}

/**
 * Read-only pre-dispatch check: determines if an order's target is free for dispatch
 * or must enter the WAITING_TARGET_SLOT queue.
 */
export async function checkTargetDeliverySlot(orderId: string): Promise<{
  isSlotBusy: boolean;
  canonicalTarget?: string;
  platform?: string;
  activeOrder?: TargetSlotInspectionResult['activeOrder'];
  reason?: string;
}> {
  const inspection = await inspectTargetDeliverySlot({ orderId });
  return {
    isSlotBusy: inspection.isSlotBusy,
    canonicalTarget: inspection.canonicalTarget || undefined,
    platform: inspection.platform || undefined,
    activeOrder: inspection.activeOrder,
    reason: inspection.reason,
  };
}

/**
 * Fetches all orders currently in WAITING_TARGET_SLOT queue, strictly ordered FIFO by paidAt ASC, createdAt ASC, id ASC.
 * Canonical query shared between Queue Inspector and Queue Sweep to guarantee zero divergence.
 */
export async function getCanonicalQueuedOrders() {
  return (await db.query.orders.findMany({
    where: eq(orders.fulfillmentStatus, 'WAITING_TARGET_SLOT'),
    orderBy: [asc(orders.paidAt), asc(orders.createdAt), asc(orders.id)],
  })) || [];
}

/**
 * Returns all queued orders for a target, strictly ordered FIFO by paidAt ASC, createdAt ASC, id ASC.
 */
export async function getQueuedOrdersForTarget(params: {
  platform: string;
  canonicalTarget: string;
}) {
  const targetKey = resolveTargetQueueKey(params.platform, params.canonicalTarget);

  const candidateOrders = (await db.query.orders.findMany({
    where: and(
      eq(orders.platform, params.platform),
      eq(orders.fulfillmentStatus, 'WAITING_TARGET_SLOT')
    ),
    orderBy: [asc(orders.paidAt), asc(orders.createdAt), asc(orders.id)],
  })) || [];

  const matchingOrders = candidateOrders.filter((o) => {
    const tRes = resolveCanonicalFulfillmentTarget(o);
    return tRes.success && tRes.target && resolveTargetQueueKey(o.platform, tRes.target) === targetKey;
  });

  return matchingOrders;
}

/**
 * Lists all target queues grouped by canonical target for Admin Queue Inspector.
 */
export async function listTargetQueues(): Promise<QueuedTargetGroup[]> {
  const allOrders = (await db.query.orders.findMany({
    where: inArray(orders.fulfillmentStatus, ['WAITING_TARGET_SLOT', 'SUBMITTING', 'PROCESSING', 'WAITING_PROVIDER']),
    orderBy: [asc(orders.paidAt), asc(orders.createdAt), asc(orders.id)],
  })) || [];

  const groupsMap = new Map<string, QueuedTargetGroup>();

  for (const o of allOrders) {
    const tRes = resolveCanonicalFulfillmentTarget(o);
    if (!tRes.success || !tRes.target || !o.platform) continue;

    const queueKey = resolveTargetQueueKey(o.platform, tRes.target);

    if (!groupsMap.has(queueKey)) {
      groupsMap.set(queueKey, {
        queueKey,
        platform: o.platform,
        canonicalTarget: tRes.target,
        activeDelivery: null,
        queue: [],
      });
    }

    const group = groupsMap.get(queueKey)!;
    const fs = (o.fulfillmentStatus || '').toUpperCase();

    if (fs === 'SUBMITTING' || fs === 'PROCESSING') {
      if (!group.activeDelivery) {
        const latestFuls = (await db.query.fulfillmentOrders.findMany({
          where: eq(fulfillmentOrders.orderId, o.id),
          orderBy: desc(fulfillmentOrders.createdAt),
          limit: 1,
        })) || [];
        const latestFul = latestFuls[0];

        group.activeDelivery = {
          id: o.id,
          publicId: o.publicId,
          fulfillmentStatus: fs,
          providerOrderId: latestFul?.externalOrderId || null,
          createdAt: o.createdAt,
        };
      }
    } else if (fs === 'WAITING_TARGET_SLOT') {
      group.queue.push({
        id: o.id,
        publicId: o.publicId,
        paymentStatus: o.paymentStatus,
        fulfillmentStatus: o.fulfillmentStatus,
        quantity: Number(o.quantity),
        service: o.service,
        paidAt: o.paidAt,
        createdAt: o.createdAt,
        queuePosition: group.queue.length + 1,
      });
    }
  }

  return Array.from(groupsMap.values()).filter(
    (g) => g.queue.length > 0 || g.activeDelivery !== null
  );
}

/**
 * Returns overview statistics for the Target Delivery Queue card in Admin.
 */
export async function getTargetQueueOverview(): Promise<TargetQueueOverviewStats> {
  const queuedOrders = await getCanonicalQueuedOrders();

  const distinctTargets = new Set<string>();
  let oldestCreatedAt: Date | null = null;

  for (const o of queuedOrders) {
    const tRes = resolveCanonicalFulfillmentTarget(o);
    if (tRes.success && tRes.target && o.platform) {
      distinctTargets.add(resolveTargetQueueKey(o.platform, tRes.target));
    }
    if (!oldestCreatedAt || o.createdAt < oldestCreatedAt) {
      oldestCreatedAt = o.createdAt;
    }
  }

  let oldestAgeMs: number | null = null;
  let oldestAgeFormatted: string | null = null;

  if (oldestCreatedAt) {
    oldestAgeMs = Math.max(0, Date.now() - new Date(oldestCreatedAt).getTime());
    const minutes = Math.floor(oldestAgeMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) oldestAgeFormatted = `${days}d ${hours % 24}h`;
    else if (hours > 0) oldestAgeFormatted = `${hours}h ${minutes % 60}m`;
    else oldestAgeFormatted = `${minutes}m`;
  }

  const lastEvents = (await db.query.orderEvents.findMany({
    where: or(
      eq(orderEvents.description, 'Queued order selected for fulfillment from target queue.'),
      sql`${orderEvents.description} LIKE '%target queue%'`
    ),
    orderBy: desc(orderEvents.id),
    limit: 1,
  })) || [];
  const lastEvent = lastEvents[0];

  return {
    autoReleaseEnabled: isTargetQueueAutoReleaseEnabled(),
    autoDispatchEnabled: isAutoDispatchEnabled(),
    liveFulfillmentEnabled: isLiveFulfillmentEnabled(),
    queuedOrdersCount: queuedOrders.length,
    queuedTargetsCount: distinctTargets.size,
    oldestQueueAgeMs: oldestAgeMs,
    oldestQueueAgeFormatted: oldestAgeFormatted,
    lastReleaseEvent: lastEvent
      ? {
          orderId: lastEvent.orderId,
          timestamp: null,
          description: lastEvent.description,
        }
      : null,
  };
}

export interface TargetQueueSweepItem {
  orderId?: string;
  publicId?: string;
  target?: string;
  status?: string;
  code?: string;
  skippedReason?: string;
  reason?: string;
}

export interface TargetQueueSweepOutput {
  queuedRowsCount: number;
  candidateTargetsCount: number;
  results: TargetQueueSweepItem[];
  diagnosticDetails: string[];
}

/**
 * Scans all currently queued targets and releases the FIFO #1 order for any target whose slot is currently FREE.
 * Strictly:
 * - Releases at most 1 order per distinct canonical target (FIFO).
 * - Enforces target slot locking (if a slot is busy or becomes busy, skipped).
 * - Respects kill switches (PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED, PEAKERR_AUTO_DISPATCH_ENABLED, PEAKERR_LIVE_FULFILLMENT).
 * - Safe concurrent execution via atomic status claims.
 */
export async function releaseAllEligibleQueuedTargets(options?: {
  triggeredBy?: string;
  forceRelease?: boolean;
}): Promise<TargetQueueSweepItem[]> {
  const detailedOutput = await releaseAllEligibleQueuedTargetsDetailed(options);
  return detailedOutput.results;
}

export async function releaseAllEligibleQueuedTargetsDetailed(options?: {
  triggeredBy?: string;
  forceRelease?: boolean;
}): Promise<TargetQueueSweepOutput> {
  const { triggeredBy = 'SCHEDULED_QUEUE_SWEEP', forceRelease = false } = options || {};
  const autoRelease = isTargetQueueAutoReleaseEnabled();

  const diagnosticDetails: string[] = [];
  diagnosticDetails.push('QUEUE_SWEEP_STARTED');

  if (!forceRelease && !autoRelease) {
    diagnosticDetails.push('QUEUE_SWEEP_SKIPPED:AUTO_RELEASE_DISABLED');
    return {
      queuedRowsCount: 0,
      candidateTargetsCount: 0,
      results: [],
      diagnosticDetails,
    };
  }

  // 1. Fetch all queued orders in WAITING_TARGET_SLOT using canonical helper
  const queuedOrders = await getCanonicalQueuedOrders();
  diagnosticDetails.push(`QUEUE_ROWS_FOUND:${queuedOrders.length}`);

  if (queuedOrders.length === 0) {
    return {
      queuedRowsCount: 0,
      candidateTargetsCount: 0,
      results: [],
      diagnosticDetails,
    };
  }

  // 2. Group by unique target key (platform + canonical target) to ensure FIFO #1 per target
  const uniqueTargetsMap = new Map<string, { platform: string; canonicalTarget: string; firstOrderPublicId: string }>();

  for (const order of queuedOrders) {
    if (!order.platform) continue;
    const tRes = resolveCanonicalFulfillmentTarget(order);
    if (!tRes.success || !tRes.target) continue;

    const queueKey = resolveTargetQueueKey(order.platform, tRes.target);
    if (!uniqueTargetsMap.has(queueKey)) {
      uniqueTargetsMap.set(queueKey, {
        platform: order.platform,
        canonicalTarget: tRes.target,
        firstOrderPublicId: order.publicId,
      });
      diagnosticDetails.push(`QUEUE_CANDIDATE:${order.publicId}`);
    }
  }

  diagnosticDetails.push(`QUEUE_TARGETS_FOUND:${uniqueTargetsMap.size}`);

  const results: TargetQueueSweepItem[] = [];

  // 3. For each distinct canonical target with queued orders, attempt releaseNextQueuedOrderForTarget
  for (const { platform, canonicalTarget, firstOrderPublicId } of uniqueTargetsMap.values()) {
    try {
      // Diagnostic slot check
      let isBusy = false;
      try {
        const slotCheck = await inspectTargetDeliverySlot({ platform, canonicalTarget });
        isBusy = slotCheck.isSlotBusy;
        diagnosticDetails.push(`QUEUE_SLOT:${isBusy ? 'BUSY' : 'FREE'}`);
      } catch (slotErr) {
        // If inspection fails, fallback to attempting release safely
        diagnosticDetails.push(`QUEUE_SLOT:FREE`);
      }

      if (!isBusy) {
        diagnosticDetails.push(`QUEUE_RELEASE_ATTEMPTED:${firstOrderPublicId}`);
      }

      const releaseRes = await releaseNextQueuedOrderForTarget({
        platform,
        canonicalTarget,
        triggeredBy,
        forceRelease,
      });

      if (releaseRes.success && releaseRes.orderId) {
        diagnosticDetails.push(`QUEUE_CLAIM:SUCCESS:${releaseRes.publicId}`);
        results.push({
          orderId: releaseRes.orderId,
          publicId: releaseRes.publicId,
          target: canonicalTarget,
          status: releaseRes.status,
          code: releaseRes.code,
        });
      } else if (releaseRes.code === 'ATOMIC_CLAIM_FAILED') {
        diagnosticDetails.push(`QUEUE_CLAIM:FAILED:${firstOrderPublicId}`);
        results.push({
          orderId: releaseRes.orderId,
          publicId: releaseRes.publicId,
          target: canonicalTarget,
          code: releaseRes.code,
          skippedReason: 'ATOMIC_CLAIM_FAILED',
        });
      } else if (releaseRes.status === 'FAILED' || releaseRes.status === 'SUBMITTING' || releaseRes.code === 'AMBIGUOUS_SUBMISSION' || releaseRes.code === 'PROVIDER_ACTIVE_ORDER_CONFLICT' || (!releaseRes.success && releaseRes.orderId && !releaseRes.skippedReason)) {
        // Atomic claim succeeded and order left WAITING_TARGET_SLOT queue (even if provider dispatch failed/errored later)
        const finalStatus = releaseRes.status || 'FAILED';
        diagnosticDetails.push(`QUEUE_CLAIM:TRANSITIONED:${releaseRes.publicId}:${finalStatus}`);
        results.push({
          orderId: releaseRes.orderId,
          publicId: releaseRes.publicId,
          target: canonicalTarget,
          status: finalStatus,
          code: releaseRes.code,
        });
      } else if (releaseRes.skippedReason) {
        diagnosticDetails.push(`QUEUE_RELEASE_SKIPPED:${releaseRes.skippedReason}:${releaseRes.publicId || firstOrderPublicId}`);
        results.push({
          orderId: releaseRes.orderId,
          publicId: releaseRes.publicId,
          target: canonicalTarget,
          code: releaseRes.code,
          skippedReason: releaseRes.skippedReason,
          reason: releaseRes.message || releaseRes.error,
        });
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`[TargetQueueSweep] Error releasing target "${canonicalTarget}":`, error);
      const sanitizedMsg = (error?.message || 'UNKNOWN_ERROR')
        .replace(/https?:\/\/[^\s]+/g, '[REDACTED_URL]')
        .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
        .replace(/api[_-]?key\s*[:=]\s*[^\s]+/gi, 'api_key=[REDACTED]')
        .replace(/[\r\n\t]+/g, ' ')
        .substring(0, 150);
      diagnosticDetails.push(`QUEUE_RELEASE_ERROR:${firstOrderPublicId}:${error?.name || 'Error'}:${sanitizedMsg}`);
    }
  }

  return {
    queuedRowsCount: queuedOrders.length,
    candidateTargetsCount: uniqueTargetsMap.size,
    results,
    diagnosticDetails,
  };
}
export async function releaseNextQueuedOrderForTarget(params: {
  platform: string;
  canonicalTarget: string;
  triggeredBy?: string;
  forceRelease?: boolean;
}): Promise<ReleaseNextResult> {
  const { platform, canonicalTarget, triggeredBy = 'MANUAL', forceRelease = false } = params;

  // 1. Verify target slot availability
  const slotCheck = await inspectTargetDeliverySlot({ platform, canonicalTarget });
  if (slotCheck.isSlotBusy) {
    return {
      success: false,
      code: 'SLOT_BUSY',
      message: `Target slot for "${canonicalTarget}" is currently busy with order ${slotCheck.activeOrder?.publicId} (${slotCheck.activeOrder?.fulfillmentStatus}). No release performed.`,
      skippedReason: 'SLOT_BUSY',
    };
  }

  // 2. Fetch FIFO queue for this target
  const queuedOrders = await getQueuedOrdersForTarget({ platform, canonicalTarget });
  if (!queuedOrders || queuedOrders.length === 0) {
    return {
      success: false,
      code: 'QUEUE_EMPTY',
      message: `No queued orders found in WAITING_TARGET_SLOT for "${canonicalTarget}".`,
      skippedReason: 'QUEUE_EMPTY',
    };
  }

  // Next candidate is strictly FIFO oldest (index 0)
  const nextOrder = queuedOrders[0];

  // 3. Safety Flag Checks
  const autoDispatch = isAutoDispatchEnabled();
  const liveFulfillment = isLiveFulfillmentEnabled();
  const autoRelease = isTargetQueueAutoReleaseEnabled();

  if (!forceRelease) {
    if (!autoRelease) {
      return {
        success: false,
        code: 'AUTO_RELEASE_DISABLED',
        error: 'PEAKERR_TARGET_QUEUE_AUTO_RELEASE_DISABLED: Target queue auto-release kill switch is active (PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED is false or absent).',
        orderId: nextOrder.id,
        publicId: nextOrder.publicId,
        skippedReason: 'AUTO_RELEASE_DISABLED',
      };
    }

    if (!autoDispatch) {
      return {
        success: false,
        code: 'AUTO_DISPATCH_DISABLED',
        error: 'PEAKERR_AUTO_DISPATCH_DISABLED: Auto-dispatch kill switch is active.',
        orderId: nextOrder.id,
        publicId: nextOrder.publicId,
        skippedReason: 'AUTO_DISPATCH_DISABLED',
      };
    }

    if (!liveFulfillment) {
      return {
        success: false,
        code: 'LIVE_FULFILLMENT_DISABLED',
        error: 'PEAKERR_LIVE_FULFILLMENT_DISABLED: Live fulfillment kill switch is active.',
        orderId: nextOrder.id,
        publicId: nextOrder.publicId,
        skippedReason: 'LIVE_FULFILLMENT_DISABLED',
      };
    }
  }

  // 4. Complete Revalidation at Release Time (do not trust past evaluations)
  const evalResult = await evaluateOrderForQueueRelease(nextOrder.id);
  if (!evalResult.eligible || !evalResult.primaryServiceId || !evalResult.target || !evalResult.quantity || !evalResult.orderId) {
    const blockerReason = evalResult.reason || 'Order failed validation checks at release time.';
    const blockerCode = evalResult.code || 'VALIDATION_FAILED_AT_RELEASE';

    await db.insert(orderEvents).values({
      orderId: nextOrder.id,
      fulfillmentStatus: 'WAITING_TARGET_SLOT',
      description: `Target queue release blocked (${blockerCode}): ${blockerReason}`,
    });

    return {
      success: false,
      code: blockerCode,
      error: blockerReason,
      orderId: nextOrder.id,
      publicId: nextOrder.publicId,
      skippedReason: blockerCode,
    };
  }

  const safeRequestPayload = {
    provider: 'peakerr',
    service: evalResult.primaryServiceId,
    link: evalResult.target,
    quantity: evalResult.quantity,
  };

  // 5. ATOMIC QUEUE CLAIM & PRE-INSERT FULFILLMENT_ORDER
  let fulfillmentEntryId: string;
  try {
    const claimTxResult = await db.transaction(async (tx) => {
      // Step A: Atomic claim on orders (WAITING_TARGET_SLOT -> SUBMITTING)
      const [claimedOrder] = await tx
        .update(orders)
        .set({
          fulfillmentStatus: 'SUBMITTING',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(orders.id, nextOrder.id),
            eq(orders.fulfillmentStatus, 'WAITING_TARGET_SLOT'),
            inArray(orders.paymentStatus, ['PAID', 'COMPLETED'])
          )
        )
        .returning();

      if (!claimedOrder) {
        throw new Error('QUEUE_ORDER_ALREADY_CLAIMED: Order was claimed or modified by another concurrent worker.');
      }

      // Step B: Insert pre-record into fulfillment_orders
      const [newFulfillment] = await tx
        .insert(fulfillmentOrders)
        .values({
          orderId: nextOrder.id,
          provider: 'peakerr',
          externalServiceId: evalResult.primaryServiceId!,
          status: 'SUBMITTING',
          requestPayload: safeRequestPayload,
          attemptCount: 1,
          submittedAt: new Date(),
        })
        .returning();

      await tx.insert(orderEvents).values({
        orderId: nextOrder.id,
        fulfillmentStatus: 'SUBMITTING',
        description: `Queued order selected for fulfillment from target queue (${triggeredBy}).`,
      });

      return {
        claimedOrder,
        fulfillmentEntry: newFulfillment,
      };
    });

    fulfillmentEntryId = claimTxResult.fulfillmentEntry.id;
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[TargetQueue] Atomic claim failed:', error);
    return {
      success: false,
      code: 'ATOMIC_CLAIM_FAILED',
      error: `ATOMIC_CLAIM_FAILED: ${error.message}`,
      orderId: nextOrder.id,
      publicId: nextOrder.publicId,
    };
  }

  // 6. HTTP EXECUTION (STRICTLY OUTSIDE DATABASE TRANSACTION)
  const result = await peakerrClient.createOrder({
    service: evalResult.primaryServiceId,
    link: evalResult.target,
    quantity: evalResult.quantity,
  });

  // 7. DB FINALIZATION IN A SHORT INDEPENDENT TRANSACTION
  if (result.success) {
    await db.transaction(async (tx) => {
      await tx
        .update(fulfillmentOrders)
        .set({
          status: 'PROCESSING',
          externalOrderId: String(result.order),
          responsePayload: result.rawResponse as any,
          updatedAt: new Date(),
        })
        .where(eq(fulfillmentOrders.id, fulfillmentEntryId));

      await tx
        .update(orders)
        .set({
          fulfillmentStatus: 'PROCESSING',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, nextOrder.id));

      await tx.insert(orderEvents).values({
        orderId: nextOrder.id,
        fulfillmentStatus: 'PROCESSING',
        description: `Provider accepted queued order from target delivery queue (Provider Order ID: ${result.order})`,
      });
    });

    return {
      success: true,
      code: 'QUEUE_RELEASE_SUCCESS',
      providerOrderId: result.order,
      status: 'PROCESSING',
      message: `Queued order successfully released and accepted by Peakerr (Provider Order ID: ${result.order})`,
      orderId: nextOrder.id,
      publicId: nextOrder.publicId,
    };
  }

  // Ambiguous Timeout Handling
  if (result.isAmbiguous) {
    await db.transaction(async (tx) => {
      await tx
        .update(fulfillmentOrders)
        .set({
          lastError: 'TIMEOUT_AMBIGUOUS: Peakerr connection timed out during queue release. Manual inspection required.',
          updatedAt: new Date(),
        })
        .where(eq(fulfillmentOrders.id, fulfillmentEntryId));

      await tx.insert(orderEvents).values({
        orderId: nextOrder.id,
        fulfillmentStatus: 'SUBMITTING',
        description: 'Queue release timed out with provider. Status ambiguous. Kept in SUBMITTING for manual inspection.',
      });
    });

    return {
      success: false,
      code: 'AMBIGUOUS_SUBMISSION',
      error: result.error,
      orderId: nextOrder.id,
      publicId: nextOrder.publicId,
    };
  }

  // Active Provider Conflict Race Condition:
  // If Peakerr unexpectedly still reports an active order, move to WAITING_PROVIDER safely
  if (result.errorKind === 'PROVIDER_ACTIVE_ORDER_CONFLICT') {
    await db.transaction(async (tx) => {
      await tx
        .update(fulfillmentOrders)
        .set({
          status: 'FAILED',
          lastError: result.error,
          responsePayload: result.rawResponse as any,
          updatedAt: new Date(),
        })
        .where(eq(fulfillmentOrders.id, fulfillmentEntryId));

      await tx
        .update(orders)
        .set({
          fulfillmentStatus: 'WAITING_PROVIDER',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, nextOrder.id));

      await tx.insert(orderEvents).values({
        orderId: nextOrder.id,
        fulfillmentStatus: 'WAITING_PROVIDER',
        description: `Peakerr active-order conflict detected during queue release. Moved to WAITING_PROVIDER.`,
      });
    });

    return {
      success: false,
      code: 'PROVIDER_ACTIVE_ORDER_CONFLICT',
      error: result.error,
      orderId: nextOrder.id,
      publicId: nextOrder.publicId,
    };
  }

  // Safe Provider Failure
  await db.transaction(async (tx) => {
    await tx
      .update(fulfillmentOrders)
      .set({
        status: 'FAILED',
        lastError: result.error,
        responsePayload: result.rawResponse as any,
        updatedAt: new Date(),
      })
      .where(eq(fulfillmentOrders.id, fulfillmentEntryId));

    await tx
      .update(orders)
      .set({
        fulfillmentStatus: 'FAILED',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, nextOrder.id));

    await tx.insert(orderEvents).values({
      orderId: nextOrder.id,
      fulfillmentStatus: 'FAILED',
      description: `Target queue release failed at provider: ${result.error}`,
    });
  });

  return {
    success: false,
    code: result.errorKind || 'QUEUE_RELEASE_FAILED',
    error: result.error,
    orderId: nextOrder.id,
    publicId: nextOrder.publicId,
  };
}
