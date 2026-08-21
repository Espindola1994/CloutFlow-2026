import { db } from '@/db';
import { orders, fulfillmentOrders, orderEvents } from '@/db/schema';
import { eq, and, inArray, isNotNull, ne } from 'drizzle-orm';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import { mapPeakerrStatusToLocal, resolveCanonicalFulfillmentTarget } from './fulfillment.service';
import { releaseNextQueuedOrderForTarget, releaseAllEligibleQueuedTargets } from './fulfillment-target-queue.service';

export interface SyncAndReleaseResult {
  success: boolean;
  statusSyncEnabled: boolean;
  targetQueueAutoReleaseEnabled: boolean;
  autoDispatchEnabled: boolean;
  liveFulfillmentEnabled: boolean;
  checked: number;
  updated: number;
  completed: number;
  partial: number;
  canceled: number;
  unchanged: number;
  queueReleaseAttempts: number;
  queueReleaseSuccess: number;
  queueReleaseBlocked: number;
  errors: number;
  details?: string[];
  error?: string;
  releasedOrders?: Array<{
    orderId?: string;
    publicId?: string;
    target?: string;
    status?: string;
  }>;
}

/**
 * ORCHESTRATOR: syncStatusesAndReleaseQueues
 * 1. Checks PEAKERR_STATUS_SYNC_ENABLED === 'true'. If false, returns early with STATUS_SYNC_DISABLED.
 * 2. Runs status sync on active fulfillment orders.
 * 3. Identifies targets that transitioned to COMPLETED during sync and releases their next queued order.
 * 4. Also performs a target queue sweep (releaseAllEligibleQueuedTargets) so any target whose slot is FREE is released.
 * 5. Respects all flags (PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED, PEAKERR_AUTO_DISPATCH_ENABLED, PEAKERR_LIVE_FULFILLMENT).
 * 6. Returns clear, structured metrics for Admin UI and Internal API responses.
 */
export async function syncStatusesAndReleaseQueues(options?: {
  forceAllActive?: boolean;
}): Promise<SyncAndReleaseResult> {
  const isSyncEnabled = process.env.PEAKERR_STATUS_SYNC_ENABLED === 'true';
  const isQueueAutoReleaseEnabled = process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED === 'true';
  const isAutoDispatch = process.env.PEAKERR_AUTO_DISPATCH_ENABLED === 'true';
  const isLiveFulfillment = process.env.PEAKERR_LIVE_FULFILLMENT === 'true';

  const result: SyncAndReleaseResult = {
    success: true,
    statusSyncEnabled: isSyncEnabled,
    targetQueueAutoReleaseEnabled: isQueueAutoReleaseEnabled,
    autoDispatchEnabled: isAutoDispatch,
    liveFulfillmentEnabled: isLiveFulfillment,
    checked: 0,
    updated: 0,
    completed: 0,
    partial: 0,
    canceled: 0,
    unchanged: 0,
    queueReleaseAttempts: 0,
    queueReleaseSuccess: 0,
    queueReleaseBlocked: 0,
    errors: 0,
    details: [],
    releasedOrders: [],
  };

  if (!isSyncEnabled) {
    result.details?.push('STATUS_SYNC_DISABLED: PEAKERR_STATUS_SYNC_ENABLED is false or not set.');
    return result;
  }

  // 1. Run core status synchronization
  const syncResult = await syncPeakerrFulfillmentStatuses(options);

  result.checked = syncResult.checked;
  result.updated = syncResult.updated;
  result.completed = syncResult.completed;
  result.partial = syncResult.partial;
  result.canceled = syncResult.canceled;
  result.unchanged = syncResult.unchanged;
  result.errors = syncResult.errors;

  if (syncResult.details && syncResult.details.length > 0) {
    result.details?.push(...syncResult.details);
  }

  if (!syncResult.success) {
    result.success = false;
    result.error = syncResult.error;
    return result;
  }

  // Released orders from transition triggers
  const allReleasedOrders: Array<{
    orderId?: string;
    publicId?: string;
    target?: string;
    status?: string;
  }> = [];

  const releasedOrderIds = new Set<string>();

  if (syncResult.releasedQueuedOrders && syncResult.releasedQueuedOrders.length > 0) {
    for (const ro of syncResult.releasedQueuedOrders) {
      if (ro.orderId) releasedOrderIds.add(ro.orderId);
      allReleasedOrders.push(ro);
    }
  }

  // 2. Perform a target queue sweep for any other queued orders whose target slot is currently free
  if (isQueueAutoReleaseEnabled) {
    try {
      const sweepResults = await releaseAllEligibleQueuedTargets({
        triggeredBy: 'STATUS_SYNC_ORCHESTRATOR_SWEEP',
        forceRelease: false,
      });

      for (const item of sweepResults) {
        if (item.status === 'PROCESSING' || item.status === 'SUBMITTING' || item.code === 'QUEUE_RELEASE_SUCCESS' || (item.orderId && !item.skippedReason)) {
          if (item.orderId && !releasedOrderIds.has(item.orderId)) {
            releasedOrderIds.add(item.orderId);
            allReleasedOrders.push({
              orderId: item.orderId,
              publicId: item.publicId,
              target: item.target,
              status: item.status,
            });
            result.details?.push(`Target queue sweep released next order ${item.publicId} for ${item.target}`);
          }
        } else if (item.skippedReason) {
          result.queueReleaseBlocked += 1;
        }
      }
    } catch (sweepErr: any) {
      console.error('[StatusSync] Error in queue sweep:', sweepErr);
      result.details?.push(`Queue sweep error: ${sweepErr?.message || 'Unknown error'}`);
    }
  }

  if (allReleasedOrders.length > 0) {
    result.queueReleaseAttempts += allReleasedOrders.length;
    result.queueReleaseSuccess += allReleasedOrders.length;
    result.releasedOrders = allReleasedOrders;
  }

  return result;
}


export interface SyncPeakerrStatusResult {
  success: boolean;
  checked: number;
  updated: number;
  completed: number;
  partial: number;
  canceled: number;
  unchanged: number;
  errors: number;
  details?: string[];
  error?: string;
  releasedQueuedOrders?: Array<{
    orderId?: string;
    publicId?: string;
    target?: string;
    status?: string;
  }>;
}

export interface SanitizedProviderStatusPayload {
  status: string;
  charge?: string | null;
  start_count?: string | null;
  remains?: string | null;
  currency?: string | null;
}

const BATCH_SIZE = 50; // Conservative batch size for multi-status query

/**
 * CENTRAL STATUS SYNC FUNCTION (READ-ONLY MONITORING):
 * 1. Queries active (non-terminal) fulfillment_orders with provider='peakerr' and valid externalOrderId.
 * 2. Fetches status from Peakerr in batches using action=status (or multi-status).
 * 3. Applies strict status mapping (mapPeakerrStatusToLocal) and state transition guards (no regression from COMPLETED).
 * 4. Atomically persists new status, sanitized response payload, and completedAt in short independent DB transactions.
 * 5. Records order_events only upon real status transitions.
 * 6. ZERO action=add calls, ZERO new fulfillment_order records.
 */
export async function syncPeakerrFulfillmentStatuses(options?: {
  forceAllActive?: boolean;
}): Promise<SyncPeakerrStatusResult> {
  const result: SyncPeakerrStatusResult = {
    success: true,
    checked: 0,
    updated: 0,
    completed: 0,
    partial: 0,
    canceled: 0,
    unchanged: 0,
    errors: 0,
    details: [],
  };

  try {
    // 1. SELECT ACTIVE (NON-TERMINAL) PEAKERR FULFILLMENT ORDERS
    // Eligible active statuses: SUBMITTING, PROCESSING, PARTIAL (also PENDING if any exists)
    const activeStatuses = ['SUBMITTING', 'PROCESSING', 'PARTIAL', 'PENDING'];

    const activeFulfillments = await db
      .select({
        id: fulfillmentOrders.id,
        orderId: fulfillmentOrders.orderId,
        provider: fulfillmentOrders.provider,
        externalOrderId: fulfillmentOrders.externalOrderId,
        status: fulfillmentOrders.status,
        orderFulfillmentStatus: orders.fulfillmentStatus,
        orderCompletedAt: orders.completedAt,
        orderPlatform: orders.platform,
        orderService: orders.service,
        orderProfileUrl: orders.profileUrl,
        orderSocialUsername: orders.socialUsername,
        orderUsername: orders.username,
        orderTargetUrl: orders.targetUrl,
      })
      .from(fulfillmentOrders)
      .innerJoin(orders, eq(fulfillmentOrders.orderId, orders.id))
      .where(
        and(
          eq(fulfillmentOrders.provider, 'peakerr'),
          isNotNull(fulfillmentOrders.externalOrderId),
          ne(fulfillmentOrders.externalOrderId, ''),
          inArray(fulfillmentOrders.status, activeStatuses)
        )
      );

    if (!activeFulfillments || activeFulfillments.length === 0) {
      return result;
    }

    result.checked = activeFulfillments.length;

    // 2. CHUNK INTO BATCHES FOR HTTP EXECUTION OUTSIDE DB TRANSACTIONS
    const batches: typeof activeFulfillments[] = [];
    for (let i = 0; i < activeFulfillments.length; i += BATCH_SIZE) {
      batches.push(activeFulfillments.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      const orderIds = batch.map((f) => f.externalOrderId as string);

      let multiStatusResponse: Record<string, any> = {};

      try {
        if (orderIds.length === 1) {
          // Single status call
          const singleRes = await peakerrClient.getStatus(orderIds[0]);
          if (singleRes && !singleRes.error) {
            multiStatusResponse[orderIds[0]] = singleRes;
          } else {
            result.errors += 1;
            result.details?.push(`Provider error for order ${orderIds[0]}: ${singleRes?.error || 'Unknown error'}`);
            continue;
          }
        } else {
          // Multi-status call
          const multiRes = await peakerrClient.getMultiStatus(orderIds);
          if (multiRes && typeof multiRes === 'object' && !('error' in multiRes)) {
            multiStatusResponse = multiRes;
          } else {
            result.errors += batch.length;
            result.details?.push(`Batch provider error: ${(multiRes as any)?.error || 'Failed to fetch multi-status'}`);
            continue;
          }
        }
      } catch (err: any) {
        // Network / HTTP failure - preserve local statuses safely
        result.errors += batch.length;
        result.details?.push(`Network failure connecting to Peakerr: ${err?.message || 'Provider unreachable'}`);
        continue;
      }

      // 3. PROCESS EACH RECORD INDEPENDENTLY WITH GUARDS AND SHORT ATOMIC TRANSACTIONS
      for (const item of batch) {
        const extId = item.externalOrderId!;
        const rawStatusItem = multiStatusResponse[extId];

        if (!rawStatusItem || typeof rawStatusItem !== 'object' || rawStatusItem.error) {
          result.unchanged += 1;
          continue;
        }

        const rawStatus = rawStatusItem.status;
        const mappedStatus = mapPeakerrStatusToLocal(rawStatus);

        if (!mappedStatus) {
          // UNKNOWN_PROVIDER_STATUS: do not invent state, preserve existing local state
          result.unchanged += 1;
          result.details?.push(`UNKNOWN_PROVIDER_STATUS for provider order #${extId}: "${rawStatus}"`);
          continue;
        }

        // GUARD: TERMINAL STATE REGRESSION PROTECTION
        // Never downgrade a COMPLETED order to PROCESSING or other non-completed states
        if (item.status === 'COMPLETED' || item.orderFulfillmentStatus === 'COMPLETED') {
          result.unchanged += 1;
          continue;
        }

        // Sanitize response payload
        const sanitizedPayload: SanitizedProviderStatusPayload = {
          status: String(rawStatusItem.status || ''),
          charge: rawStatusItem.charge !== undefined && rawStatusItem.charge !== null ? String(rawStatusItem.charge) : undefined,
          start_count: rawStatusItem.start_count !== undefined && rawStatusItem.start_count !== null ? String(rawStatusItem.start_count) : undefined,
          remains: rawStatusItem.remains !== undefined && rawStatusItem.remains !== null ? String(rawStatusItem.remains) : undefined,
          currency: rawStatusItem.currency ? String(rawStatusItem.currency) : 'USD',
        };

        const isStatusChanged = item.status !== mappedStatus || item.orderFulfillmentStatus !== mappedStatus;

        if (!isStatusChanged) {
          // Update payload if fresh but keep counts as unchanged
          await db
            .update(fulfillmentOrders)
            .set({
              responsePayload: sanitizedPayload,
              updatedAt: new Date(),
            })
            .where(eq(fulfillmentOrders.id, item.id));

          result.unchanged += 1;
          continue;
        }

        // ATOMIC LOCAL UPDATE
        await db.transaction(async (tx) => {
          // 1. Update fulfillment_orders
          await tx
            .update(fulfillmentOrders)
            .set({
              status: mappedStatus,
              responsePayload: sanitizedPayload,
              updatedAt: new Date(),
            })
            .where(eq(fulfillmentOrders.id, item.id));

          // 2. Update orders
          const orderUpdateData: Record<string, any> = {
            fulfillmentStatus: mappedStatus,
            updatedAt: new Date(),
          };

          if (mappedStatus === 'COMPLETED' && !item.orderCompletedAt) {
            orderUpdateData.completedAt = new Date();
          }

          await tx.update(orders).set(orderUpdateData).where(eq(orders.id, item.orderId));

          // 3. Create order_event on real transition
          let eventDescription = `Peakerr fulfillment status changed to ${mappedStatus}`;
          if (mappedStatus === 'COMPLETED') {
            eventDescription = 'Peakerr fulfillment completed';
          } else if (mappedStatus === 'PARTIAL') {
            eventDescription = `Peakerr fulfillment partial (remains: ${sanitizedPayload.remains || '0'})`;
          } else if (mappedStatus === 'CANCELED') {
            eventDescription = 'Peakerr fulfillment canceled by provider';
          }

          await tx.insert(orderEvents).values({
            orderId: item.orderId,
            status: mappedStatus,
            fulfillmentStatus: mappedStatus,
            description: eventDescription,
            metadata: sanitizedPayload as any,
          });
        });

        result.updated += 1;
        if (mappedStatus === 'COMPLETED') {
          result.completed += 1;

          // TARGET-AWARE QUEUE AUTO-RELEASE TRIGGER:
          // When an active delivery successfully reaches COMPLETED, check if subsequent orders
          // are waiting in WAITING_TARGET_SLOT for the same platform + canonical target.
          // Release is executed strictly AFTER the completion update is committed.
          // Errors during release are non-fatal to the status sync update.
          if (item.orderPlatform) {
            const tRes = resolveCanonicalFulfillmentTarget({
              platform: item.orderPlatform,
              service: item.orderService,
              profileUrl: item.orderProfileUrl,
              socialUsername: item.orderSocialUsername,
              username: item.orderUsername,
              targetUrl: item.orderTargetUrl,
            });

            if (tRes.success && tRes.target) {
              try {
                const releaseRes = await releaseNextQueuedOrderForTarget({
                  platform: item.orderPlatform,
                  canonicalTarget: tRes.target,
                  triggeredBy: `STATUS_SYNC_COMPLETED_ORDER_${item.orderId}`,
                  forceRelease: false, // strictly respects PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED
                });

                if (releaseRes.success && releaseRes.orderId) {
                  result.releasedQueuedOrders = result.releasedQueuedOrders || [];
                  result.releasedQueuedOrders.push({
                    orderId: releaseRes.orderId,
                    publicId: releaseRes.publicId,
                    target: tRes.target,
                    status: releaseRes.status,
                  });
                  result.details?.push(`Target queue released next order ${releaseRes.publicId} for ${tRes.target}`);
                }
              } catch (relErr: any) {
                console.error(`[StatusSync] Error releasing queued order for target ${tRes.target}:`, relErr);
                result.details?.push(`Queue release error for target ${tRes.target}: ${relErr?.message || 'Unknown error'}`);
              }
            }
          }
        }
        else if (mappedStatus === 'PARTIAL') result.partial += 1;
        else if (mappedStatus === 'CANCELED') result.canceled += 1;
      }
    }

    return result;
  } catch (error: any) {
    console.error('[SyncPeakerrFulfillmentStatuses] Unexpected error:', error);
    return {
      ...result,
      success: false,
      error: error?.message || 'Unexpected error during status sync execution',
    };
  }
}
