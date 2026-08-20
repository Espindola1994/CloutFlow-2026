import { db } from '@/db';
import { orders, fulfillmentOrders, orderEvents, offers } from '@/db/schema';
import { eq, and, inArray, desc, or } from 'drizzle-orm';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import { resolveFulfillmentChainAndPreview, resolveAndValidateTarget } from './fulfillment-chain.service';

export interface ClaimOrderResult {
  success: boolean;
  order?: typeof orders.$inferSelect;
  error?: string;
  code?: string;
}

/**
 * Maps Peakerr status response strings to standard internal fulfillmentStatus enums.
 * Returns null if status is unrecognized, allowing callers to handle unknown status safely without state regression.
 */
export function mapPeakerrStatusToLocal(peakerrStatus?: string | null): string | null {
  if (!peakerrStatus || typeof peakerrStatus !== 'string') return null;
  const s = peakerrStatus.toLowerCase().trim();

  if (s === 'completed') return 'COMPLETED';
  if (s === 'in progress' || s === 'processing' || s === 'pending') return 'PROCESSING';
  if (s === 'partial') return 'PARTIAL';
  if (s === 'canceled' || s === 'cancelled') return 'CANCELED';

  return null;
}

export function mapPeakerrStatusToInternal(peakerrStatus?: string | null): string {
  const mapped = mapPeakerrStatusToLocal(peakerrStatus);
  return mapped || 'PROCESSING';
}

/**
 * HELPER: Resolves the canonical target URL for an order with exact consistency between Preview, Dry Run and Live Submit.
 * Followers: orders.profileUrl -> orders.targetUrl (if profile url) -> orders.socialUsername (normalized to platform canonical URL)
 * Likes/Views/Comments: orders.targetUrl (strictly content URL)
 */
export function resolveCanonicalFulfillmentTarget(order: {
  platform?: string | null;
  service?: string | null;
  profileUrl?: string | null;
  socialUsername?: string | null;
  username?: string | null;
  targetUrl?: string | null;
}) {
  const p = order.platform || '';
  const s = order.service || '';
  const isFollowers = s.toLowerCase() === 'followers';

  let rawTarget: string | null = null;

  if (isFollowers) {
    if (order.profileUrl && order.profileUrl.trim().length > 0) {
      rawTarget = order.profileUrl.trim();
    } else if (order.targetUrl && order.targetUrl.trim().length > 0) {
      rawTarget = order.targetUrl.trim();
    } else if (order.socialUsername && order.socialUsername.trim().length > 0) {
      rawTarget = order.socialUsername.trim();
    } else if (order.username && order.username.trim().length > 0) {
      rawTarget = order.username.trim();
    }
  } else {
    rawTarget = order.targetUrl ? order.targetUrl.trim() : null;
  }

  return resolveAndValidateTarget(rawTarget, p, s);
}

/**
 * CONTROLLED LIVE SUBMIT (Primary Only / Manual Approval):
 * Safe 3-phase execution pattern:
 * 1. DB Claim & Pre-insert Phase (Atomic Claim + Pre-insert SUBMITTING fulfillment_order in a SINGLE transaction) -> Transação comitada antes do HTTP.
 *    - Se qualquer erro ocorrer no claim ou no insert, toda a transação sofre ROLLBACK e a Order permanece NOT_DISPATCHED.
 * 2. External HTTP Phase (Peakerr Client execution outside DB transaction).
 * 3. DB Finalization Phase (Record Result / Ambiguous Timeout Handling) -> Transação comitada.
 */
export async function submitOrderToPeakerrManual(orderIdentifier: string) {
  const cleanInput = (orderIdentifier || '').trim();
  if (!cleanInput) {
    return {
      success: false,
      code: 'INVALID_INPUT',
      error: 'Order UUID or Public ID is required.',
    };
  }

  // Live Kill Switch Check (Fast return before any DB operations)
  if (!peakerrClient.isLiveEnabled()) {
    return {
      success: false,
      code: 'LIVE_FULFILLMENT_DISABLED',
      error: 'PEAKERR_LIVE_FULFILLMENT_DISABLED: Live fulfillment kill switch is active (PEAKERR_LIVE_FULFILLMENT is false or absent).',
    };
  }

  // 1. Fetch and validate order eligibility first (Read-only check)
  const [existingOrder] = await db.query.orders.findMany({
    where: or(
      eq(orders.id, cleanInput),
      eq(orders.publicId, cleanInput)
    ),
    limit: 1,
  });

  if (!existingOrder) {
    return {
      success: false,
      code: 'ORDER_NOT_FOUND',
      error: `ORDER_NOT_FOUND: Order with identifier "${cleanInput}" does not exist.`,
    };
  }

  if (existingOrder.paymentStatus !== 'PAID' && existingOrder.paymentStatus !== 'COMPLETED') {
    return {
      success: false,
      code: 'PAYMENT_NOT_ELIGIBLE',
      error: `PAYMENT_NOT_ELIGIBLE: Order payment status is "${existingOrder.paymentStatus}". Must be PAID or COMPLETED.`,
    };
  }

  if (existingOrder.fulfillmentStatus !== 'NOT_DISPATCHED') {
    return {
      success: false,
      code: 'ORDER_ALREADY_CLAIMED',
      error: `ORDER_ALREADY_CLAIMED: Order fulfillment status is already "${existingOrder.fulfillmentStatus}". Only NOT_DISPATCHED orders can be submitted.`,
    };
  }

  // 2. Resolve Canonical Target consistently
  const targetValidation = resolveCanonicalFulfillmentTarget(existingOrder);
  if (!targetValidation.success) {
    return {
      success: false,
      code: targetValidation.code,
      error: targetValidation.message,
    };
  }

  // 3. Resolve Chain & Primary Service from database
  const resolution = await resolveFulfillmentChainAndPreview({
    platform: existingOrder.platform || '',
    service: existingOrder.service || '',
    quantity: Number(existingOrder.quantity),
    target: targetValidation.target,
    targetType: targetValidation.targetType,
    orderId: existingOrder.id,
    publicId: existingOrder.publicId,
  });

  if (!resolution.success) {
    return {
      success: false,
      code: resolution.error.code,
      error: resolution.error.message,
    };
  }

  // 4. Special Comments Check: Custom comments require custom payload format
  const primaryServiceEvaluation = resolution.chainServicesEvaluation?.find(
    (s) => s.serviceId === resolution.primaryServiceId
  );
  if (existingOrder.service?.toLowerCase() === 'comments' && primaryServiceEvaluation?.specialPayloadRequired) {
    return {
      success: false,
      code: 'SPECIAL_PAYLOAD_NOT_IMPLEMENTED',
      error: 'SPECIAL_PAYLOAD_NOT_IMPLEMENTED: Comments service requires custom payload format which is not supported in Standard pipeline.',
    };
  }

  // Safe Request Payload (Never contains API keys)
  const safeRequestPayload = {
    provider: 'peakerr',
    service: resolution.primaryServiceId,
    link: resolution.target,
    quantity: resolution.quantity,
  };

  // --- PHASE 1: ATOMIC DB CLAIM & PRE-INSERT IN A SINGLE TRANSACTION ---
  // If the insert to fulfillment_orders fails (e.g. table missing or constraint error),
  // the transaction rolls back entirely, leaving orders.fulfillment_status as NOT_DISPATCHED.
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
            eq(orders.id, existingOrder.id),
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
          orderId: existingOrder.id,
          provider: 'peakerr',
          externalServiceId: resolution.primaryServiceId,
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
    console.error('[PeakerrSubmit] Atomic claim & pre-insert transaction failed:', error);
    return {
      success: false,
      code: 'ATOMIC_CLAIM_FAILED',
      error: `ATOMIC_CLAIM_FAILED: Failed to atomically claim order and initialize fulfillment record: ${error.message}`,
    };
  }

  // --- PHASE 2: HTTP EXECUTION (STRICTLY OUTSIDE DATABASE TRANSACTION) ---
  // The database transaction is already committed above.
  const result = await peakerrClient.createOrder({
    service: resolution.primaryServiceId,
    link: resolution.target,
    quantity: resolution.quantity,
  });

  // --- PHASE 3: DB FINALIZATION IN A SEPARATE TRANSACTION ---
  if (result.success) {
    // Peakerr successfully confirmed order creation
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
        .where(eq(orders.id, existingOrder.id));

      await tx.insert(orderEvents).values({
        orderId: existingOrder.id,
        fulfillmentStatus: 'PROCESSING',
        description: `Order successfully dispatched to Peakerr (Provider Order ID: ${result.order})`,
      });
    });

    return {
      success: true,
      providerOrderId: result.order,
      status: 'PROCESSING',
      message: `Order submitted to Peakerr successfully (Provider Order ID: ${result.order})`,
    };
  }

  // Error / Ambiguous Timeout Handling
  if (result.isAmbiguous) {
    // CRITICAL: In timeout, keep SUBMITTING state to prevent double fulfillment
    await db.transaction(async (tx) => {
      await tx
        .update(fulfillmentOrders)
        .set({
          lastError: 'TIMEOUT_AMBIGUOUS: Peakerr connection timed out. Do not retry without verifying provider dashboard.',
          updatedAt: new Date(),
        })
        .where(eq(fulfillmentOrders.id, fulfillmentEntryId));

      await tx.insert(orderEvents).values({
        orderId: existingOrder.id,
        fulfillmentStatus: 'SUBMITTING',
        description: 'Peakerr dispatch timed out. Status ambiguous. Manual inspection required.',
      });
    });

    return {
      success: false,
      isAmbiguous: true,
      code: 'AMBIGUOUS_SUBMISSION',
      error: result.error,
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
        .where(eq(orders.id, existingOrder.id));

      await tx.insert(orderEvents).values({
        orderId: existingOrder.id,
        fulfillmentStatus: 'WAITING_PROVIDER',
        description: `Peakerr temporarily blocked submission because another active order exists for this target.`,
      });
    });

    return {
      success: false,
      code: 'PROVIDER_ACTIVE_ORDER_CONFLICT',
      error: result.error,
    };
  }

  // Definitively safe provider failure (No order created at provider)
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
      .where(eq(orders.id, existingOrder.id));

    await tx.insert(orderEvents).values({
      orderId: existingOrder.id,
      fulfillmentStatus: 'FAILED',
      description: `Peakerr dispatch failed: ${result.error}`,
    });
  });

  return {
    success: false,
    code: result.errorKind || 'DISPATCH_FAILED',
    error: result.error,
  };
}

/**
 * MANUAL STATUS CHECK HELPER (READ-ONLY INSPECTION):
 * Queries Peakerr for the live status of an order's externalOrderId (action=status, order=<id>).
 * Synchronizes the verified status back to fulfillment_orders and orders safely.
 * Executes ZERO action=add calls.
 */
export async function checkPeakerrOrderStatus(orderIdentifier: string) {
  const cleanInput = (orderIdentifier || '').trim();
  if (!cleanInput) {
    return {
      success: false,
      error: 'NO_PROVIDER_ORDER: Order identifier is required.',
    };
  }

  // Look up order first to find its UUID
  const [order] = await db.query.orders.findMany({
    where: or(
      eq(orders.id, cleanInput),
      eq(orders.publicId, cleanInput)
    ),
    limit: 1,
  });

  if (!order) {
    return {
      success: false,
      error: `ORDER_NOT_FOUND: Order with identifier "${cleanInput}" does not exist.`,
    };
  }

  const [latestFulfillment] = await db
    .select()
    .from(fulfillmentOrders)
    .where(eq(fulfillmentOrders.orderId, order.id))
    .orderBy(desc(fulfillmentOrders.createdAt))
    .limit(1);

  if (!latestFulfillment || !latestFulfillment.externalOrderId) {
    return {
      success: false,
      error: 'NO_PROVIDER_ORDER_YET: No external Peakerr order ID registered for this order yet. Submit the order to Peakerr first.',
    };
  }

  // Execute READ-ONLY action=status request
  const statusRes = await peakerrClient.getStatus(latestFulfillment.externalOrderId);

  if (statusRes.error) {
    return {
      success: false,
      error: statusRes.error,
    };
  }

  // Synchronize status safely to database
  const mappedStatus = mapPeakerrStatusToInternal(statusRes.status);

  await db.transaction(async (tx) => {
    await tx
      .update(fulfillmentOrders)
      .set({
        status: mappedStatus,
        responsePayload: statusRes as any,
        updatedAt: new Date(),
      })
      .where(eq(fulfillmentOrders.id, latestFulfillment.id));

    // Only update orders.fulfillmentStatus if status progressed
    if (mappedStatus === 'COMPLETED' || mappedStatus === 'PARTIAL' || mappedStatus === 'CANCELED') {
      const updateData: Record<string, any> = {
        fulfillmentStatus: mappedStatus,
        updatedAt: new Date(),
      };
      if (mappedStatus === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
      await tx.update(orders).set(updateData).where(eq(orders.id, order.id));
    }
  });

  return {
    success: true,
    data: {
      publicId: order.publicId,
      orderId: order.id,
      provider: latestFulfillment.provider || 'peakerr',
      externalOrderId: latestFulfillment.externalOrderId,
      externalServiceId: latestFulfillment.externalServiceId,
      localStatus: mappedStatus,
      status: statusRes.status,
      charge: statusRes.charge,
      startCount: statusRes.start_count,
      remains: statusRes.remains,
      currency: statusRes.currency || 'USD',
    },
  };
}
