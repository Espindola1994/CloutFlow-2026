import { db } from '@/db';
import { orders, fulfillmentOrders, orderEvents, offers, fulfillmentChains, fulfillmentChainServices } from '@/db/schema';
import { eq, and, inArray, or, sql, count, desc } from 'drizzle-orm';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import { resolveCanonicalFulfillmentTarget } from './fulfillment.service';
import { resolveFulfillmentChainAndPreview } from './fulfillment-chain.service';

export interface AutoDispatchEvaluation {
  eligible: boolean;
  reason?: string;
  code?: string;
  orderId?: string;
  publicId?: string;
  platform?: string;
  service?: string;
  quantity?: number;
  target?: string;
  targetType?: string;
  chainId?: string;
  chainName?: string;
  primaryServiceId?: string;
  estimatedCost?: number;
  providerBalance?: number;
  currency?: string;
}

export interface AutoDispatchResult {
  success: boolean;
  code: string;
  error?: string;
  message?: string;
  orderId?: string;
  publicId?: string;
  providerOrderId?: number | string;
  status?: string;
}

export interface FulfillmentOverviewStats {
  notDispatched: number;
  submitting: number;
  processing: number;
  partial: number;
  completed: number;
  failed: number;
  canceled: number;
  waitingProvider: number;
  totalDispatched: number;
  totalPaid: number;
}

export interface WaitingProviderReconciliationEvaluation {
  eligibleForReconciliation: boolean;
  reason?: string;
  code?: string;
  orderId?: string;
  publicId?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  provider?: string;
  providerServiceId?: string;
  providerOrderId?: string | null;
  target?: string;
  lastError?: string | null;
  classification?: string;
}

export interface WaitingProviderRecoveryEvaluation {
  eligibleForRecovery: boolean;
  reason?: string;
  code?: string;
  orderId?: string;
  publicId?: string;
  platform?: string;
  service?: string;
  quantity?: number;
  target?: string;
  chainId?: string;
  chainName?: string;
  primaryServiceId?: string;
  estimatedCost?: number;
  providerBalance?: number;
  currency?: string;
  autoDispatchEnabled: boolean;
  liveFulfillmentEnabled: boolean;
}

export interface AutoDispatchOverviewStats {
  autoDispatchEnabled: boolean;
  liveFulfillmentEnabled: boolean;
  paymentTriggerConnected: boolean;
  eligiblePaidOrders: number;
  blockedMissingTarget: number;
  blockedMissingChain: number;
  blockedInvalidQuantity: number;
  blockedInactiveOffer: number;
  blockedInsufficientBalance: number;
  blockedPaymentIneligible: number;
  blockedAlreadyClaimed: number;
  providerBalance?: number;
  currency?: string;
}

/**
 * Kill switch status checks
 */
export function isAutoDispatchEnabled(): boolean {
  return process.env.PEAKERR_AUTO_DISPATCH_ENABLED === 'true';
}

export function isLiveFulfillmentEnabled(): boolean {
  return process.env.PEAKERR_LIVE_FULFILLMENT === 'true';
}

/**
 * 11. DRY AUTO DISPATCH EVALUATOR:
 * Evaluates an order for auto-dispatch eligibility without ANY database mutations or Peakerr orders.
 * ZERO action=add calls.
 */
export async function evaluateOrderForAutoDispatch(orderIdentifier: string): Promise<AutoDispatchEvaluation> {
  const cleanInput = (orderIdentifier || '').trim();
  if (!cleanInput) {
    return {
      eligible: false,
      code: 'INVALID_INPUT',
      reason: 'Order UUID or Public ID is required.',
    };
  }

  // 1. Fetch Order from Source of Truth
  const [order] = await db.query.orders.findMany({
    where: or(
      eq(orders.id, cleanInput),
      eq(orders.publicId, cleanInput)
    ),
    limit: 1,
  });

  if (!order) {
    return {
      eligible: false,
      code: 'ORDER_NOT_FOUND',
      reason: `Order with identifier "${cleanInput}" does not exist.`,
    };
  }

  const orderQuantity = Number(order.quantity);

  // 2. Validate Payment Status
  if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'COMPLETED') {
    return {
      eligible: false,
      code: 'BLOCKED_PAYMENT_INELIGIBLE',
      reason: `Payment status is "${order.paymentStatus}". Must be PAID or COMPLETED.`,
      orderId: order.id,
      publicId: order.publicId,
      platform: order.platform || undefined,
      service: order.service || undefined,
      quantity: orderQuantity,
    };
  }

  // 3. Validate Fulfillment Status
  if (order.fulfillmentStatus !== 'NOT_DISPATCHED') {
    return {
      eligible: false,
      code: 'BLOCKED_ALREADY_CLAIMED',
      reason: `Fulfillment status is already "${order.fulfillmentStatus}". Only NOT_DISPATCHED orders can be auto-dispatched.`,
      orderId: order.id,
      publicId: order.publicId,
      platform: order.platform || undefined,
      service: order.service || undefined,
      quantity: orderQuantity,
    };
  }

  // 4. Validate Target
  const targetValidation = resolveCanonicalFulfillmentTarget(order);
  if (!targetValidation.success) {
    return {
      eligible: false,
      code: targetValidation.code === 'MISSING_TARGET' ? 'BLOCKED_MISSING_TARGET' : targetValidation.code,
      reason: targetValidation.message,
      orderId: order.id,
      publicId: order.publicId,
      platform: order.platform || undefined,
      service: order.service || undefined,
      quantity: orderQuantity,
    };
  }

  // 5. Validate Offer (if offerId present)
  if (order.offerId) {
    const [offer] = await db.query.offers.findMany({
      where: eq(offers.id, order.offerId),
      limit: 1,
    });

    if (!offer) {
      return {
        eligible: false,
        code: 'BLOCKED_OFFER_NOT_FOUND',
        reason: `Associated offer "${order.offerId}" was not found.`,
        orderId: order.id,
        publicId: order.publicId,
      };
    }

    if (!offer.active) {
      return {
        eligible: false,
        code: 'BLOCKED_INACTIVE_OFFER',
        reason: `Offer "${offer.name}" is currently inactive.`,
        orderId: order.id,
        publicId: order.publicId,
      };
    }

    if (offer.platform?.toLowerCase() !== (order.platform || '').toLowerCase() ||
        offer.service?.toLowerCase() !== (order.service || '').toLowerCase()) {
      return {
        eligible: false,
        code: 'BLOCKED_OFFER_MISMATCH',
        reason: 'Offer platform or service does not match order parameters.',
        orderId: order.id,
        publicId: order.publicId,
      };
    }
  }

  // 6. Chain & Primary Service Resolution
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
      platform: order.platform || undefined,
      service: order.service || undefined,
      quantity: orderQuantity,
      target: targetValidation.target,
      targetType: targetValidation.targetType,
    };
  }

  // 7. Special Comments Payload Validation (standard pipeline unsupported)
  const primaryServiceEvaluation = resolution.chainServicesEvaluation?.find(
    (s) => s.serviceId === resolution.primaryServiceId
  );
  if (order.service?.toLowerCase() === 'comments' && primaryServiceEvaluation?.specialPayloadRequired) {
    return {
      eligible: false,
      code: 'BLOCKED_SPECIAL_PAYLOAD_UNSUPPORTED',
      reason: 'Comments service requires custom payload format which is not supported in standard auto-dispatch pipeline.',
      orderId: order.id,
      publicId: order.publicId,
      platform: order.platform || undefined,
      service: order.service || undefined,
      quantity: orderQuantity,
    };
  }

  // 8. Balance Check & Rate Evaluation
  let providerBalance: number | undefined;
  let estimatedCost: number | undefined;
  const currency = 'USD';

  try {
    // Get live balance from Peakerr
    const balanceRes = await peakerrClient.getBalance();
    if (balanceRes && 'balance' in balanceRes && balanceRes.balance !== undefined) {
      providerBalance = Number(balanceRes.balance);
    }
  } catch {
    // If balance call fails or not configured, providerBalance stays undefined
  }

  // Query rate of primary service in chain
  const [chainService] = await db
    .select()
    .from(fulfillmentChainServices)
    .where(
      and(
        eq(fulfillmentChainServices.chainId, resolution.chain.id),
        eq(fulfillmentChainServices.providerServiceId, resolution.primaryServiceId)
      )
    )
    .limit(1);

  if (chainService && (chainService as any).rate) {
    const rateNumber = Number((chainService as any).rate);
    estimatedCost = (rateNumber * orderQuantity) / 1000;
  }

  if (providerBalance !== undefined && estimatedCost !== undefined && providerBalance < estimatedCost) {
    return {
      eligible: false,
      code: 'BLOCKED_INSUFFICIENT_PROVIDER_BALANCE',
      reason: `Insufficient Peakerr balance (Balance: $${providerBalance.toFixed(2)}, Estimated Cost: $${estimatedCost.toFixed(4)}).`,
      orderId: order.id,
      publicId: order.publicId,
      platform: order.platform || undefined,
      service: order.service || undefined,
      quantity: orderQuantity,
      target: targetValidation.target,
      targetType: targetValidation.targetType,
      chainId: resolution.chain.id,
      chainName: resolution.chain.name,
      primaryServiceId: resolution.primaryServiceId,
      estimatedCost,
      providerBalance,
      currency,
    };
  }

  return {
    eligible: true,
    code: 'ELIGIBLE_FOR_AUTO_DISPATCH',
    reason: 'Order fulfills all automated dispatch criteria and is ready for execution.',
    orderId: order.id,
    publicId: order.publicId,
    platform: order.platform || undefined,
    service: order.service || undefined,
    quantity: orderQuantity,
    target: targetValidation.target,
    targetType: targetValidation.targetType,
    chainId: resolution.chain.id,
    chainName: resolution.chain.name,
    primaryServiceId: resolution.primaryServiceId,
    estimatedCost,
    providerBalance,
    currency,
  };
}

/**
 * 12. CENTRAL AUTO DISPATCH EXECUTOR:
 * Executes the full safe auto-dispatch lifecycle:
 * A. Verify PEAKERR_AUTO_DISPATCH_ENABLED
 * B. Verify PEAKERR_LIVE_FULFILLMENT
 * C. Evaluate order (read-only)
 * D. Atomic Claim & Pre-insert fulfillment_order in a single DB transaction
 * E. Execute Peakerr action=add HTTP call outside DB transaction
 * F. Finalize DB state (SUCCESS / FAILED / AMBIGUOUS_TIMEOUT) in separate transaction
 */
export async function autoDispatchOrder(orderIdentifier: string): Promise<AutoDispatchResult> {
  const cleanInput = (orderIdentifier || '').trim();
  if (!cleanInput) {
    return {
      success: false,
      code: 'INVALID_INPUT',
      error: 'Order UUID or Public ID is required.',
    };
  }

  // A. Check PEAKERR_AUTO_DISPATCH_ENABLED
  if (!isAutoDispatchEnabled()) {
    return {
      success: false,
      code: 'AUTO_DISPATCH_DISABLED',
      error: 'PEAKERR_AUTO_DISPATCH_DISABLED: Auto-dispatch kill switch is active (PEAKERR_AUTO_DISPATCH_ENABLED is false or absent).',
    };
  }

  // B. Check PEAKERR_LIVE_FULFILLMENT
  if (!isLiveFulfillmentEnabled()) {
    return {
      success: false,
      code: 'LIVE_FULFILLMENT_DISABLED',
      error: 'PEAKERR_LIVE_FULFILLMENT_DISABLED: Live fulfillment kill switch is active (PEAKERR_LIVE_FULFILLMENT is false or absent).',
    };
  }

  // C. Full Read-Only Evaluation
  const evalResult = await evaluateOrderForAutoDispatch(cleanInput);
  if (!evalResult.eligible || !evalResult.primaryServiceId || !evalResult.target || !evalResult.quantity || !evalResult.orderId) {
    return {
      success: false,
      code: evalResult.code || 'NOT_ELIGIBLE_FOR_AUTO_DISPATCH',
      error: evalResult.reason || 'Order is not eligible for auto-dispatch.',
      orderId: evalResult.orderId,
      publicId: evalResult.publicId,
    };
  }

  const safeRequestPayload = {
    provider: 'peakerr',
    service: evalResult.primaryServiceId,
    link: evalResult.target,
    quantity: evalResult.quantity,
  };

  // --- PHASE 1: ATOMIC DB CLAIM & PRE-INSERT IN A SINGLE TRANSACTION ---
  let fulfillmentEntryId: string;
  try {
    const claimTxResult = await db.transaction(async (tx) => {
      // Step A: Atomic claim on orders
      const [claimedOrder] = await tx
        .update(orders)
        .set({
          fulfillmentStatus: 'SUBMITTING',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(orders.id, evalResult.orderId!),
            eq(orders.fulfillmentStatus, 'NOT_DISPATCHED'),
            inArray(orders.paymentStatus, ['PAID', 'COMPLETED'])
          )
        )
        .returning();

      if (!claimedOrder) {
        throw new Error('CONCURRENT_CLAIM_FAILED: Order was claimed by another concurrent process.');
      }

      // Step B: Insert record into fulfillment_orders
      const [newFulfillment] = await tx
        .insert(fulfillmentOrders)
        .values({
          orderId: evalResult.orderId!,
          provider: 'peakerr',
          externalServiceId: evalResult.primaryServiceId!,
          status: 'SUBMITTING',
          requestPayload: safeRequestPayload,
          attemptCount: 1,
          submittedAt: new Date(),
        })
        .returning();

      return {
        claimedOrder,
        fulfillmentEntry: newFulfillment,
      };
    });

    fulfillmentEntryId = claimTxResult.fulfillmentEntry.id;
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[AutoDispatch] Atomic claim & pre-insert transaction failed:', error);
    return {
      success: false,
      code: 'ATOMIC_CLAIM_FAILED',
      error: `ATOMIC_CLAIM_FAILED: Failed to atomically claim order: ${error.message}`,
      orderId: evalResult.orderId,
      publicId: evalResult.publicId,
    };
  }

  // --- PHASE 2: HTTP EXECUTION (STRICTLY OUTSIDE DATABASE TRANSACTION) ---
  const result = await peakerrClient.createOrder({
    service: evalResult.primaryServiceId,
    link: evalResult.target,
    quantity: evalResult.quantity,
  });

  // --- PHASE 3: DB FINALIZATION IN A SEPARATE TRANSACTION ---
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
        .where(eq(orders.id, evalResult.orderId!));

      await tx.insert(orderEvents).values({
        orderId: evalResult.orderId!,
        fulfillmentStatus: 'PROCESSING',
        description: `Order automatically dispatched to Peakerr (Provider Order ID: ${result.order})`,
      });
    });

    return {
      success: true,
      code: 'AUTO_DISPATCH_SUCCESS',
      providerOrderId: result.order,
      status: 'PROCESSING',
      message: `Order automatically submitted to Peakerr (Provider Order ID: ${result.order})`,
      orderId: evalResult.orderId,
      publicId: evalResult.publicId,
    };
  }

  // Error / Ambiguous Timeout Handling
  if (result.isAmbiguous) {
    await db.transaction(async (tx) => {
      await tx
        .update(fulfillmentOrders)
        .set({
          lastError: 'TIMEOUT_AMBIGUOUS: Peakerr connection timed out during auto-dispatch. Manual inspection required.',
          updatedAt: new Date(),
        })
        .where(eq(fulfillmentOrders.id, fulfillmentEntryId));

      await tx.insert(orderEvents).values({
        orderId: evalResult.orderId!,
        fulfillmentStatus: 'SUBMITTING',
        description: 'Auto-dispatch timed out. Status ambiguous. Manual inspection required.',
      });
    });

    return {
      success: false,
      code: 'AMBIGUOUS_SUBMISSION',
      error: result.error,
      orderId: evalResult.orderId,
      publicId: evalResult.publicId,
    };
  }

  // Handle Provider Active Order Conflict specifically
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
        .where(eq(orders.id, evalResult.orderId!));

      await tx.insert(orderEvents).values({
        orderId: evalResult.orderId!,
        fulfillmentStatus: 'WAITING_PROVIDER',
        description: `Peakerr temporarily blocked submission because another active order exists for this target.`,
      });
    });

    return {
      success: false,
      code: 'PROVIDER_ACTIVE_ORDER_CONFLICT',
      error: result.error,
      orderId: evalResult.orderId,
      publicId: evalResult.publicId,
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
      .where(eq(orders.id, evalResult.orderId!));

    await tx.insert(orderEvents).values({
      orderId: evalResult.orderId!,
      fulfillmentStatus: 'FAILED',
      description: `Auto-dispatch failed at provider: ${result.error}`,
    });
  });

  return {
    success: false,
    code: result.errorKind || 'DISPATCH_FAILED',
    error: result.error,
    orderId: evalResult.orderId,
    publicId: evalResult.publicId,
  };
}

/**
 * 23. GET AUTO DISPATCH CANDIDATES:
 * Read-only list of candidate orders (PAID/COMPLETED + NOT_DISPATCHED).
 * Never returns secrets.
 */
export async function getAutoDispatchCandidates(limit = 50) {
  const candidateOrders = await db.query.orders.findMany({
    where: and(
      inArray(orders.paymentStatus, ['PAID', 'COMPLETED']),
      eq(orders.fulfillmentStatus, 'NOT_DISPATCHED')
    ),
    orderBy: desc(orders.createdAt),
    limit,
  });

  const evaluations = await Promise.all(
    candidateOrders.map(async (o) => {
      const evalRes = await evaluateOrderForAutoDispatch(o.id);
      return {
        id: o.id,
        publicId: o.publicId,
        platform: o.platform,
        service: o.service,
        quantity: Number(o.quantity),
        paymentStatus: o.paymentStatus,
        fulfillmentStatus: o.fulfillmentStatus,
        createdAt: o.createdAt,
        evaluation: evalRes,
      };
    })
  );

  return evaluations;
}

/**
 * 26. GET FULFILLMENT OVERVIEW METRICS:
 * Real accumulated database metrics across all orders.
 */
export async function getFulfillmentOverview(): Promise<FulfillmentOverviewStats> {
  const allOrders = await db
    .select({
      fulfillmentStatus: orders.fulfillmentStatus,
      paymentStatus: orders.paymentStatus,
    })
    .from(orders);

  const stats: FulfillmentOverviewStats = {
    notDispatched: 0,
    submitting: 0,
    processing: 0,
    partial: 0,
    completed: 0,
    failed: 0,
    canceled: 0,
    waitingProvider: 0,
    totalDispatched: 0,
    totalPaid: 0,
  };

  for (const o of allOrders) {
    if (o.paymentStatus === 'PAID' || o.paymentStatus === 'COMPLETED') {
      stats.totalPaid++;
    }

    const fs = (o.fulfillmentStatus || 'NOT_DISPATCHED').toUpperCase();
    if (fs === 'NOT_DISPATCHED') stats.notDispatched++;
    else if (fs === 'SUBMITTING') stats.submitting++;
    else if (fs === 'WAITING_PROVIDER') stats.waitingProvider++;
    else if (fs === 'PROCESSING') {
      stats.processing++;
      stats.totalDispatched++;
    } else if (fs === 'PARTIAL') {
      stats.partial++;
      stats.totalDispatched++;
    } else if (fs === 'COMPLETED') {
      stats.completed++;
      stats.totalDispatched++;
    } else if (fs === 'FAILED') stats.failed++;
    else if (fs === 'CANCELED' || fs === 'CANCELLED') stats.canceled++;
  }

  return stats;
}

/**
 * 27. GET AUTO DISPATCH OVERVIEW METRICS:
 * Metrics detailing eligibility vs blockers across all paid NOT_DISPATCHED candidates.
 */
export async function getAutoDispatchOverview(): Promise<AutoDispatchOverviewStats> {
  let providerBalance: number | undefined;
  try {
    const bal = await peakerrClient.getBalance();
    if (bal && 'balance' in bal && bal.balance !== undefined) {
      providerBalance = Number(bal.balance);
    }
  } catch {
    // Non-blocking
  }

  const candidates = await db.query.orders.findMany({
    where: and(
      inArray(orders.paymentStatus, ['PAID', 'COMPLETED']),
      eq(orders.fulfillmentStatus, 'NOT_DISPATCHED')
    ),
    limit: 100,
  });

  const stats: AutoDispatchOverviewStats = {
    autoDispatchEnabled: isAutoDispatchEnabled(),
    liveFulfillmentEnabled: isLiveFulfillmentEnabled(),
    paymentTriggerConnected: true,
    eligiblePaidOrders: 0,
    blockedMissingTarget: 0,
    blockedMissingChain: 0,
    blockedInvalidQuantity: 0,
    blockedInactiveOffer: 0,
    blockedInsufficientBalance: 0,
    blockedPaymentIneligible: 0,
    blockedAlreadyClaimed: 0,
    providerBalance,
    currency: 'USD',
  };

  for (const c of candidates) {
    const ev = await evaluateOrderForAutoDispatch(c.id);
    if (ev.eligible) {
      stats.eligiblePaidOrders++;
    } else {
      if (ev.code === 'BLOCKED_MISSING_TARGET' || ev.code === 'MISSING_TARGET' || ev.code === 'INVALID_CONTENT_URL' || ev.code === 'TARGET_PLATFORM_MISMATCH') {
        stats.blockedMissingTarget++;
      } else if (ev.code === 'BLOCKED_CHAIN_NOT_FOUND' || ev.code === 'CHAIN_NOT_FOUND') {
        stats.blockedMissingChain++;
      } else if (ev.code === 'BLOCKED_INVALID_QUANTITY' || ev.code === 'INVALID_QUANTITY') {
        stats.blockedInvalidQuantity++;
      } else if (ev.code === 'BLOCKED_INACTIVE_OFFER' || ev.code === 'BLOCKED_OFFER_NOT_FOUND' || ev.code === 'BLOCKED_OFFER_MISMATCH') {
        stats.blockedInactiveOffer++;
      } else if (ev.code === 'BLOCKED_INSUFFICIENT_PROVIDER_BALANCE') {
        stats.blockedInsufficientBalance++;
      } else if (ev.code === 'BLOCKED_PAYMENT_INELIGIBLE') {
        stats.blockedPaymentIneligible++;
      } else if (ev.code === 'BLOCKED_ALREADY_CLAIMED') {
        stats.blockedAlreadyClaimed++;
      }
    }
  }

  return stats;
}

/**
 * 28. EVALUATE WAITING PROVIDER RECONCILIATION:
 * Read-only check to see if a FAILED order qualifies for reconciliation to WAITING_PROVIDER.
 * Strictly ZERO action=add calls, ZERO mutations.
 */
export async function evaluateWaitingProviderReconciliation(orderIdentifier: string): Promise<WaitingProviderReconciliationEvaluation> {
  const cleanInput = (orderIdentifier || '').trim();
  if (!cleanInput) {
    return {
      eligibleForReconciliation: false,
      code: 'INVALID_INPUT',
      reason: 'Order UUID or Public ID is required.',
    };
  }

  const [order] = await db.query.orders.findMany({
    where: or(
      eq(orders.id, cleanInput),
      eq(orders.publicId, cleanInput)
    ),
    limit: 1,
  });

  if (!order) {
    return {
      eligibleForReconciliation: false,
      code: 'ORDER_NOT_FOUND',
      reason: `Order "${cleanInput}" not found.`,
    };
  }

  // Check 1: paymentStatus IN ('PAID', 'COMPLETED')
  if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'COMPLETED') {
    return {
      eligibleForReconciliation: false,
      code: 'BLOCK_RECONCILIATION_UNPAID',
      reason: `Payment status is ${order.paymentStatus}, must be PAID or COMPLETED.`,
      orderId: order.id,
      publicId: order.publicId,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
    };
  }

  // Check 2: fulfillmentStatus must be FAILED
  if (order.fulfillmentStatus !== 'FAILED') {
    return {
      eligibleForReconciliation: false,
      code: order.fulfillmentStatus === 'WAITING_PROVIDER' ? 'ALREADY_RECONCILED' : 'BLOCK_RECONCILIATION_NOT_FAILED',
      reason: `Order fulfillment status is currently "${order.fulfillmentStatus}". Only FAILED orders are eligible for reconciliation.`,
      orderId: order.id,
      publicId: order.publicId,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
    };
  }

  // Check 3: fulfillment_orders lookup
  const fOrders = await db.query.fulfillmentOrders.findMany({
    where: eq(fulfillmentOrders.orderId, order.id),
    orderBy: desc(fulfillmentOrders.createdAt),
    limit: 1,
  });

  const latestFulfillment = fOrders[0];

  if (!latestFulfillment) {
    return {
      eligibleForReconciliation: false,
      code: 'BLOCK_RECONCILIATION_NO_FULFILLMENT_RECORD',
      reason: 'No fulfillment attempt record found for this order.',
      orderId: order.id,
      publicId: order.publicId,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
    };
  }

  // Check 4: provider must be peakerr
  if (latestFulfillment.provider !== 'peakerr') {
    return {
      eligibleForReconciliation: false,
      code: 'BLOCK_RECONCILIATION_NON_PEAKERR',
      reason: `Provider is "${latestFulfillment.provider}". Only Peakerr orders can be reconciled.`,
      orderId: order.id,
      publicId: order.publicId,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      provider: latestFulfillment.provider,
    };
  }

  // Check 5: externalOrderId must be null
  if (latestFulfillment.externalOrderId) {
    return {
      eligibleForReconciliation: false,
      code: 'BLOCK_RECONCILIATION_PROVIDER_ORDER_EXISTS',
      reason: `Provider order ID already exists (#${latestFulfillment.externalOrderId}). Cannot reconcile.`,
      orderId: order.id,
      publicId: order.publicId,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      provider: latestFulfillment.provider,
      providerOrderId: latestFulfillment.externalOrderId,
    };
  }

  // Check 6: lastError must match active order conflict
  const errorMsg = (latestFulfillment.lastError || '').toLowerCase();
  const isConflict = errorMsg.includes('active order') || errorMsg.includes('wait until order being completed');

  if (!isConflict) {
    return {
      eligibleForReconciliation: false,
      code: 'BLOCK_RECONCILIATION_GENERIC_ERROR',
      reason: `Error "${latestFulfillment.lastError || 'None'}" does not match PROVIDER_ACTIVE_ORDER_CONFLICT.`,
      orderId: order.id,
      publicId: order.publicId,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      provider: latestFulfillment.provider,
      lastError: latestFulfillment.lastError,
      classification: 'GENERIC_PROVIDER_FAILURE',
    };
  }

  return {
    eligibleForReconciliation: true,
    code: 'ELIGIBLE_FOR_RECONCILIATION',
    reason: 'Order qualifies for reconciliation to WAITING_PROVIDER.',
    orderId: order.id,
    publicId: order.publicId,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    provider: latestFulfillment.provider,
    providerServiceId: latestFulfillment.externalServiceId || undefined,
    providerOrderId: null,
    target: order.targetUrl || order.profileUrl || order.socialUsername || undefined,
    lastError: latestFulfillment.lastError,
    classification: 'PROVIDER_ACTIVE_ORDER_CONFLICT',
  };
}

/**
 * 29. RECONCILE WAITING PROVIDER ORDER (MUTATION):
 * Safely changes FAILED -> WAITING_PROVIDER for active order conflicts.
 * STRICTLY NO action=add, NO HTTP calls, NO balance deductions.
 */
export async function reconcileWaitingProviderOrder(orderIdentifier: string): Promise<AutoDispatchResult> {
  const cleanInput = (orderIdentifier || '').trim();
  if (!cleanInput) {
    return { success: false, code: 'INVALID_INPUT', error: 'Order UUID or Public ID is required.' };
  }

  const evaluation = await evaluateWaitingProviderReconciliation(cleanInput);
  if (!evaluation.eligibleForReconciliation || !evaluation.orderId) {
    return {
      success: false,
      code: evaluation.code || 'BLOCK_RECONCILIATION',
      error: evaluation.reason || 'Order is not eligible for reconciliation.',
      orderId: evaluation.orderId,
      publicId: evaluation.publicId,
    };
  }

  // Atomic update
  const [updatedOrder] = await db
    .update(orders)
    .set({
      fulfillmentStatus: 'WAITING_PROVIDER',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(orders.id, evaluation.orderId),
        eq(orders.fulfillmentStatus, 'FAILED'),
        inArray(orders.paymentStatus, ['PAID', 'COMPLETED'])
      )
    )
    .returning();

  if (!updatedOrder) {
    return {
      success: false,
      code: 'RECONCILIATION_CLAIM_FAILED',
      error: 'Order could not be reconciled. Status may have changed concurrently.',
      orderId: evaluation.orderId,
      publicId: evaluation.publicId,
    };
  }

  await db.insert(orderEvents).values({
    orderId: evaluation.orderId,
    fulfillmentStatus: 'WAITING_PROVIDER',
    description: 'Historical provider active-order conflict reconciled to WAITING_PROVIDER by Admin.',
  });

  return {
    success: true,
    code: 'RECONCILIATION_SUCCESS',
    message: 'Order successfully reconciled to WAITING_PROVIDER.',
    orderId: evaluation.orderId,
    publicId: evaluation.publicId,
    status: 'WAITING_PROVIDER',
  };
}

/**
 * 30. EVALUATE WAITING PROVIDER RECOVERY:
 * Read-only check for recovery readiness on WAITING_PROVIDER orders.
 * Revalidates chain, primary service, balance, flags, target, etc.
 * ZERO action=add calls, ZERO mutations.
 */
export async function evaluateWaitingProviderRecovery(orderIdentifier: string): Promise<WaitingProviderRecoveryEvaluation> {
  const cleanInput = (orderIdentifier || '').trim();
  const autoDispatchEnabled = isAutoDispatchEnabled();
  const liveFulfillmentEnabled = isLiveFulfillmentEnabled();

  if (!cleanInput) {
    return {
      eligibleForRecovery: false,
      code: 'INVALID_INPUT',
      reason: 'Order UUID or Public ID is required.',
      autoDispatchEnabled,
      liveFulfillmentEnabled,
    };
  }

  const [order] = await db.query.orders.findMany({
    where: or(
      eq(orders.id, cleanInput),
      eq(orders.publicId, cleanInput)
    ),
    limit: 1,
  });

  if (!order) {
    return {
      eligibleForRecovery: false,
      code: 'ORDER_NOT_FOUND',
      reason: `Order "${cleanInput}" not found.`,
      autoDispatchEnabled,
      liveFulfillmentEnabled,
    };
  }

  if (order.fulfillmentStatus !== 'WAITING_PROVIDER') {
    return {
      eligibleForRecovery: false,
      code: 'NOT_WAITING_PROVIDER',
      reason: `Fulfillment status is "${order.fulfillmentStatus}". Only WAITING_PROVIDER orders can be recovered.`,
      orderId: order.id,
      publicId: order.publicId,
      platform: order.platform || undefined,
      service: order.service || undefined,
      quantity: Number(order.quantity),
      autoDispatchEnabled,
      liveFulfillmentEnabled,
    };
  }

  // Evaluate order targeting, chains and pricing
  const orderQuantity = Number(order.quantity);
  const targetValidation = resolveCanonicalFulfillmentTarget(order);
  if (!targetValidation.success) {
    return {
      eligibleForRecovery: false,
      code: targetValidation.code === 'MISSING_TARGET' ? 'BLOCKED_MISSING_TARGET' : targetValidation.code,
      reason: targetValidation.message,
      orderId: order.id,
      publicId: order.publicId,
      platform: order.platform || undefined,
      service: order.service || undefined,
      quantity: orderQuantity,
      autoDispatchEnabled,
      liveFulfillmentEnabled,
    };
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
    return {
      eligibleForRecovery: false,
      code: resolution.error.code,
      reason: resolution.error.message,
      orderId: order.id,
      publicId: order.publicId,
      platform: order.platform || undefined,
      service: order.service || undefined,
      quantity: orderQuantity,
      target: targetValidation.target,
      autoDispatchEnabled,
      liveFulfillmentEnabled,
    };
  }

  let providerBalance: number | undefined;
  let estimatedCost: number | undefined;
  try {
    const bal = await peakerrClient.getBalance();
    if (bal && 'balance' in bal && bal.balance !== undefined) {
      providerBalance = Number(bal.balance);
    }
  } catch {
    // balance non-blocking
  }

  const [chainService] = await db
    .select()
    .from(fulfillmentChainServices)
    .where(
      and(
        eq(fulfillmentChainServices.chainId, resolution.chain.id),
        eq(fulfillmentChainServices.providerServiceId, resolution.primaryServiceId)
      )
    )
    .limit(1);

  if (chainService && (chainService as any).rate) {
    estimatedCost = (Number((chainService as any).rate) * orderQuantity) / 1000;
  }

  if (providerBalance !== undefined && estimatedCost !== undefined && providerBalance < estimatedCost) {
    return {
      eligibleForRecovery: false,
      code: 'BLOCKED_INSUFFICIENT_PROVIDER_BALANCE',
      reason: `Insufficient Peakerr balance ($${providerBalance.toFixed(2)} vs cost $${estimatedCost.toFixed(4)}).`,
      orderId: order.id,
      publicId: order.publicId,
      platform: order.platform || undefined,
      service: order.service || undefined,
      quantity: orderQuantity,
      target: targetValidation.target,
      chainId: resolution.chain.id,
      chainName: resolution.chain.name,
      primaryServiceId: resolution.primaryServiceId,
      estimatedCost,
      providerBalance,
      currency: 'USD',
      autoDispatchEnabled,
      liveFulfillmentEnabled,
    };
  }

  return {
    eligibleForRecovery: true,
    code: 'ELIGIBLE_FOR_RECOVERY',
    reason: 'Order is ready for single controlled recovery retry.',
    orderId: order.id,
    publicId: order.publicId,
    platform: order.platform || undefined,
    service: order.service || undefined,
    quantity: orderQuantity,
    target: targetValidation.target,
    chainId: resolution.chain.id,
    chainName: resolution.chain.name,
    primaryServiceId: resolution.primaryServiceId,
    estimatedCost,
    providerBalance,
    currency: 'USD',
    autoDispatchEnabled,
    liveFulfillmentEnabled,
  };
}

/**
 * 31. RETRY WAITING PROVIDER ORDER (MUTATION):
 * Executes exactly ONE manual action=add attempt for a WAITING_PROVIDER order.
 * Follows atomic claim, separate transactions, and safe conflict handling.
 */
export async function retryWaitingProviderOrder(orderIdentifier: string): Promise<AutoDispatchResult> {
  const cleanInput = (orderIdentifier || '').trim();
  if (!cleanInput) {
    return { success: false, code: 'INVALID_INPUT', error: 'Order UUID or Public ID is required.' };
  }

  // Validate flags
  if (!isAutoDispatchEnabled()) {
    return {
      success: false,
      code: 'AUTO_DISPATCH_DISABLED',
      error: 'PEAKERR_AUTO_DISPATCH_DISABLED: Auto-dispatch kill switch is active.',
    };
  }

  if (!isLiveFulfillmentEnabled()) {
    return {
      success: false,
      code: 'LIVE_FULFILLMENT_DISABLED',
      error: 'PEAKERR_LIVE_FULFILLMENT_DISABLED: Live fulfillment kill switch is active.',
    };
  }

  // Pre-evaluation
  const evalResult = await evaluateWaitingProviderRecovery(cleanInput);
  if (!evalResult.eligibleForRecovery || !evalResult.primaryServiceId || !evalResult.target || !evalResult.quantity || !evalResult.orderId) {
    return {
      success: false,
      code: evalResult.code || 'NOT_ELIGIBLE_FOR_RECOVERY',
      error: evalResult.reason || 'Order is not eligible for recovery retry.',
      orderId: evalResult.orderId,
      publicId: evalResult.publicId,
    };
  }

  // Count past attempts to set attemptCount
  const pastAttempts = await db.query.fulfillmentOrders.findMany({
    where: eq(fulfillmentOrders.orderId, evalResult.orderId),
  });
  const nextAttemptCount = pastAttempts.length + 1;

  const safeRequestPayload = {
    provider: 'peakerr',
    service: evalResult.primaryServiceId,
    link: evalResult.target,
    quantity: evalResult.quantity,
    attempt: nextAttemptCount,
  };

  // Phase 1: Atomic Claim (WAITING_PROVIDER -> SUBMITTING) + Insert new fulfillment_order
  let fulfillmentEntryId: string;
  try {
    const claimTxResult = await db.transaction(async (tx) => {
      const [claimedOrder] = await tx
        .update(orders)
        .set({
          fulfillmentStatus: 'SUBMITTING',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(orders.id, evalResult.orderId!),
            eq(orders.fulfillmentStatus, 'WAITING_PROVIDER'),
            inArray(orders.paymentStatus, ['PAID', 'COMPLETED'])
          )
        )
        .returning();

      if (!claimedOrder) {
        throw new Error('RECOVERY_ALREADY_CLAIMED: Order was claimed or modified concurrently.');
      }

      const [newFulfillment] = await tx
        .insert(fulfillmentOrders)
        .values({
          orderId: evalResult.orderId!,
          provider: 'peakerr',
          externalServiceId: evalResult.primaryServiceId!,
          status: 'SUBMITTING',
          requestPayload: safeRequestPayload,
          attemptCount: nextAttemptCount,
          submittedAt: new Date(),
        })
        .returning();

      return { claimedOrder, fulfillmentEntry: newFulfillment };
    });

    fulfillmentEntryId = claimTxResult.fulfillmentEntry.id;
  } catch (err: unknown) {
    const error = err as Error;
    return {
      success: false,
      code: 'ATOMIC_CLAIM_FAILED',
      error: `ATOMIC_CLAIM_FAILED: ${error.message}`,
      orderId: evalResult.orderId,
      publicId: evalResult.publicId,
    };
  }

  // Phase 2: HTTP Execution (OUTSIDE Transaction)
  const result = await peakerrClient.createOrder({
    service: evalResult.primaryServiceId,
    link: evalResult.target,
    quantity: evalResult.quantity,
  });

  // Phase 3: DB Finalization
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
        .where(eq(orders.id, evalResult.orderId!));

      await tx.insert(orderEvents).values({
        orderId: evalResult.orderId!,
        fulfillmentStatus: 'PROCESSING',
        description: `Recovery dispatch successful to Peakerr (Provider Order ID: ${result.order})`,
      });
    });

    return {
      success: true,
      code: 'RECOVERY_SUCCESS',
      providerOrderId: result.order,
      status: 'PROCESSING',
      message: `Recovery order submitted to Peakerr (Provider Order ID: ${result.order})`,
      orderId: evalResult.orderId,
      publicId: evalResult.publicId,
    };
  }

  // Ambiguous Timeout
  if (result.isAmbiguous) {
    await db.transaction(async (tx) => {
      await tx
        .update(fulfillmentOrders)
        .set({
          lastError: 'TIMEOUT_AMBIGUOUS: Peakerr connection timed out during recovery retry. Manual inspection required.',
          updatedAt: new Date(),
        })
        .where(eq(fulfillmentOrders.id, fulfillmentEntryId));

      await tx.insert(orderEvents).values({
        orderId: evalResult.orderId!,
        fulfillmentStatus: 'SUBMITTING',
        description: 'Recovery retry timed out. Status ambiguous. Manual inspection required.',
      });
    });

    return {
      success: false,
      code: 'AMBIGUOUS_SUBMISSION',
      error: result.error,
      orderId: evalResult.orderId,
      publicId: evalResult.publicId,
    };
  }

  // Active Order Conflict AGAIN
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
        .where(eq(orders.id, evalResult.orderId!));

      await tx.insert(orderEvents).values({
        orderId: evalResult.orderId!,
        fulfillmentStatus: 'WAITING_PROVIDER',
        description: `Peakerr active order conflict persisted during recovery retry. Returned to WAITING_PROVIDER.`,
      });
    });

    return {
      success: false,
      code: 'PROVIDER_ACTIVE_ORDER_CONFLICT',
      error: result.error,
      orderId: evalResult.orderId,
      publicId: evalResult.publicId,
    };
  }

  // Generic Provider Failure
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
      .where(eq(orders.id, evalResult.orderId!));

    await tx.insert(orderEvents).values({
      orderId: evalResult.orderId!,
      fulfillmentStatus: 'FAILED',
      description: `Recovery retry failed at provider: ${result.error}`,
    });
  });

  return {
    success: false,
    code: result.errorKind || 'DISPATCH_FAILED',
    error: result.error,
    orderId: evalResult.orderId,
    publicId: evalResult.publicId,
  };
}
