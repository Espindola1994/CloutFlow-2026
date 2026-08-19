import { db } from '@/db';
import { orders, fulfillmentOrders, orderEvents, offers } from '@/db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import { resolveFulfillmentChainAndPreview } from './fulfillment-chain.service';

export interface ClaimOrderResult {
  success: boolean;
  order?: typeof orders.$inferSelect;
  error?: string;
  code?: string;
}

/**
 * ATOMIC CLAIM HELPER:
 * Uses an atomic UPDATE ... WHERE condition to safely acquire an exclusive lock on an order
 * without race conditions and without keeping database transactions open during long HTTP calls.
 */
export async function claimOrderForFulfillment(orderId: string): Promise<ClaimOrderResult> {
  const [claimedOrder] = await db
    .update(orders)
    .set({
      fulfillmentStatus: 'SUBMITTING',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(orders.id, orderId),
        eq(orders.fulfillmentStatus, 'NOT_DISPATCHED'),
        inArray(orders.paymentStatus, ['PAID', 'COMPLETED'])
      )
    )
    .returning();

  if (!claimedOrder) {
    return {
      success: false,
      code: 'ORDER_NOT_CLAIMABLE',
      error: 'ORDER_NOT_CLAIMABLE: Order does not exist, is not paid, or is already claimed/dispatched.',
    };
  }

  return {
    success: true,
    order: claimedOrder,
  };
}

/**
 * CONTROLLED LIVE SUBMIT (Primary Only / Manual Approval):
 * Safe 3-phase execution pattern:
 * 1. DB Claim Phase (Atomic Claim + Record SUBMITTING fulfillment_order) -> Transaction Closed.
 * 2. External HTTP Phase (Peakerr Client execution outside DB transaction).
 * 3. DB Finalization Phase (Record Result / Ambiguous Timeout Handling) -> Transaction Closed.
 */
export async function submitOrderToPeakerrManual(orderId: string) {
  // Phase 1: Pre-flight Verification & Atomic DB Claim
  if (!peakerrClient.isLiveEnabled()) {
    return {
      success: false,
      code: 'LIVE_FULFILLMENT_DISABLED',
      error: 'PEAKERR_LIVE_FULFILLMENT_DISABLED: Live fulfillment kill switch is active (PEAKERR_LIVE_FULFILLMENT is false or absent).',
    };
  }

  // 1. Atomic claim order in database
  const claim = await claimOrderForFulfillment(orderId);
  if (!claim.success || !claim.order) {
    return { success: false, code: claim.code || 'CLAIM_FAILED', error: claim.error };
  }

  const order = claim.order;

  // 2. Resolve target & primary service from database chain
  const target = order.service?.toLowerCase() === 'followers'
    ? (order.profileUrl || order.socialUsername)
    : order.targetUrl;

  const resolution = await resolveFulfillmentChainAndPreview({
    platform: order.platform || '',
    service: order.service || '',
    quantity: Number(order.quantity),
    target: target || '',
    targetType: 'order_target',
    orderId: order.id,
    publicId: order.publicId,
  });

  if (!resolution.success) {
    // Revert claim safely if chain cannot be resolved
    await db.update(orders).set({ fulfillmentStatus: 'NOT_DISPATCHED' }).where(eq(orders.id, order.id));
    return { success: false, code: resolution.error.code, error: resolution.error.message };
  }

  // 3. Special Comments check: Custom comments require special payload
  const primaryServiceEvaluation = resolution.chainServicesEvaluation?.find(
    (s) => s.serviceId === resolution.primaryServiceId
  );
  if (order.service?.toLowerCase() === 'comments' && primaryServiceEvaluation?.specialPayloadRequired) {
    await db.update(orders).set({ fulfillmentStatus: 'NOT_DISPATCHED' }).where(eq(orders.id, order.id));
    return {
      success: false,
      code: 'SPECIAL_PAYLOAD_NOT_IMPLEMENTED',
      error: 'SPECIAL_PAYLOAD_NOT_IMPLEMENTED: Comments service requires custom payload format which is not supported in Standard pipeline.',
    };
  }

  // 4. Create initial fulfillment_order entry in SUBMITTING status (Primary Only)
  const safeRequestPayload = {
    provider: 'peakerr',
    service: resolution.primaryServiceId,
    link: resolution.target,
    quantity: resolution.quantity,
  };

  const [fulfillmentEntry] = await db
    .insert(fulfillmentOrders)
    .values({
      orderId: order.id,
      provider: 'peakerr',
      externalServiceId: resolution.primaryServiceId,
      status: 'SUBMITTING',
      requestPayload: safeRequestPayload,
      attemptCount: 1,
      submittedAt: new Date(),
    })
    .returning();

  // Phase 2: HTTP Execution (OUTSIDE Database Transaction)
  const result = await peakerrClient.createOrder({
    service: resolution.primaryServiceId,
    link: resolution.target,
    quantity: resolution.quantity,
  });

  // Phase 3: DB Finalization Phase
  if (result.success) {
    // Order confirmed by Peakerr
    await db
      .update(fulfillmentOrders)
      .set({
        status: 'PROCESSING',
        externalOrderId: String(result.order),
        responsePayload: result.rawResponse as any,
        updatedAt: new Date(),
      })
      .where(eq(fulfillmentOrders.id, fulfillmentEntry.id));

    await db
      .update(orders)
      .set({
        fulfillmentStatus: 'PROCESSING',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    await db.insert(orderEvents).values({
      orderId: order.id,
      fulfillmentStatus: 'PROCESSING',
      description: `Order successfully dispatched to Peakerr (Provider Order ID: ${result.order})`,
    });

    return {
      success: true,
      providerOrderId: result.order,
      status: 'PROCESSING',
      message: `Order submitted to Peakerr successfully (ID: ${result.order})`,
    };
  }

  // Error / Ambiguous Timeout Handling
  if (result.isAmbiguous) {
    // CRITICAL: In timeout, keep SUBMITTING state to prevent double fulfillment
    await db
      .update(fulfillmentOrders)
      .set({
        lastError: 'TIMEOUT_AMBIGUOUS: Peakerr connection timed out. Do not retry without verifying provider dashboard.',
        updatedAt: new Date(),
      })
      .where(eq(fulfillmentOrders.id, fulfillmentEntry.id));

    await db.insert(orderEvents).values({
      orderId: order.id,
      fulfillmentStatus: 'SUBMITTING',
      description: 'Peakerr dispatch timed out. Status ambiguous. Manual inspection required.',
    });

    return {
      success: false,
      isAmbiguous: true,
      code: 'AMBIGUOUS_SUBMISSION',
      error: result.error,
    };
  }

  // Definitively safe failure (No order created at provider)
  await db
    .update(fulfillmentOrders)
    .set({
      status: 'FAILED',
      lastError: result.error,
      responsePayload: result.rawResponse as any,
      updatedAt: new Date(),
    })
    .where(eq(fulfillmentOrders.id, fulfillmentEntry.id));

  await db
    .update(orders)
    .set({
      fulfillmentStatus: 'FAILED',
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id));

  await db.insert(orderEvents).values({
    orderId: order.id,
    fulfillmentStatus: 'FAILED',
    description: `Peakerr dispatch failed: ${result.error}`,
  });

  return {
    success: false,
    code: result.errorKind || 'DISPATCH_FAILED',
    error: result.error,
  };
}

/**
 * MANUAL STATUS CHECK HELPER:
 * Queries Peakerr for the live status of an order's externalOrderId (action=status, order=<id>).
 */
export async function checkPeakerrOrderStatus(orderId: string) {
  const [latestFulfillment] = await db
    .select()
    .from(fulfillmentOrders)
    .where(eq(fulfillmentOrders.orderId, orderId))
    .orderBy(desc(fulfillmentOrders.createdAt))
    .limit(1);

  if (!latestFulfillment || !latestFulfillment.externalOrderId) {
    return {
      success: false,
      error: 'NO_PROVIDER_ORDER: No external Peakerr order ID registered for this order.',
    };
  }

  const statusRes = await peakerrClient.getStatus(latestFulfillment.externalOrderId);

  if (statusRes.error) {
    return {
      success: false,
      error: statusRes.error,
    };
  }

  return {
    success: true,
    data: {
      providerOrderId: latestFulfillment.externalOrderId,
      status: statusRes.status,
      charge: statusRes.charge,
      startCount: statusRes.start_count,
      remains: statusRes.remains,
      currency: statusRes.currency || 'USD',
    },
  };
}
