import { db } from '@/db';
import {
  orders,
  fulfillmentOrders,
  fulfillmentOrderSplits,
  orderEvents,
  supplierAttempts,
} from '@/db/schema';
import { eq, and, asc, inArray } from 'drizzle-orm';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import { planSplitOrder, SplitOrderPlan, SplitChunkPlan } from '@/lib/routing/split-planner';
import { logOrderRoutingAudit } from './supplier-routing.service';
import { calculateExecutedServiceCost } from '@/lib/financials';

export interface SplitExecutionOptions {
  dryRun?: boolean;
  adminUserId?: string;
  executionMode?: 'sequential' | 'parallel';
}

export interface SplitExecutionResult {
  success: boolean;
  code: string;
  orderId: string;
  parentFulfillmentId?: string;
  isSplit: boolean;
  chunkCount: number;
  totalQuantity: number;
  estimatedTotalCost: number;
  grossProfit: number;
  grossMarginPercent: number;
  chunks: Array<{
    chunkIndex: number;
    splitId?: string;
    quantity: number;
    supplierServiceId: string;
    status: string;
    externalOrderId?: string | null;
    error?: string | null;
  }>;
  parentStatus: string;
  message: string;
}

export class SplitFulfillmentService {
  /**
   * Plans, validates financial ceiling, saves split chunks atomically, and executes sequential chunk submissions.
   */
  public static async planAndExecuteSplit(
    order: typeof orders.$inferSelect,
    supplierCandidate: {
      position: 'priority' | 'fallback1' | 'fallback2';
      serviceId: string;
      rate: number;
      minQuantity?: number;
      maxQuantity?: number;
    },
    financialConfig: {
      sellingPrice: number;
      minimumGrossMarginPercent: number;
      minimumGrossProfit: number;
      maxSupplierCostAbsolute?: number | null;
      costCeilingEnabled: boolean;
      manualReviewEnabled: boolean;
      packageName: string;
    },
    targetUrl: string,
    options: SplitExecutionOptions = {}
  ): Promise<SplitExecutionResult> {
    const isDryRun = options.dryRun === true;
    const quantity = Number(order.quantity);

    // 1. Plan the split
    const splitPlan = planSplitOrder({
      platform: order.platform || '',
      service: order.service || '',
      totalQuantity: quantity,
      sellingPrice: financialConfig.sellingPrice,
      supplierServiceId: supplierCandidate.serviceId,
      supplierRate: supplierCandidate.rate,
      supplierMinQuantity: supplierCandidate.minQuantity || 50,
      supplierMaxQuantity: supplierCandidate.maxQuantity || 5000,
      minimumGrossMarginPercent: financialConfig.minimumGrossMarginPercent,
      minimumGrossProfit: financialConfig.minimumGrossProfit,
      maxSupplierCostAbsolute: financialConfig.maxSupplierCostAbsolute,
      costCeilingEnabled: financialConfig.costCeilingEnabled,
      executionMode: options.executionMode || 'sequential',
    });

    // 2. Audit log attempt record
    logOrderRoutingAudit({
      orderId: order.id,
      platform: order.platform,
      serviceType: order.service,
      packageName: financialConfig.packageName,
      sellingPrice: financialConfig.sellingPrice,
      quantity,
      supplierPosition: supplierCandidate.position,
      supplierId: supplierCandidate.serviceId,
      currentRate: supplierCandidate.rate,
      calculatedCost: splitPlan.estimatedTotalCost,
      allowedSupplierCost: splitPlan.allowedSupplierCost,
      grossProfit: splitPlan.grossProfit,
      grossMarginPercent: splitPlan.grossMarginPercent,
      decision: splitPlan.isFinanciallySafe ? 'ACCEPTED' : 'HOLD_COST',
      reason: splitPlan.failureReason || `Split plan approved (${splitPlan.chunkCount} chunks of ~${splitPlan.chunkSize} likes).`,
    });

    // 3. Pre-Submission Atomic Financial Gate: If cost ceiling fails, ZERO child orders are generated/submitted
    if (!splitPlan.isFinanciallySafe) {
      if (!isDryRun) {
        await db.insert(supplierAttempts).values({
          orderId: order.id,
          supplierServiceId: supplierCandidate.serviceId,
          supplierPosition: supplierCandidate.position,
          supplierRate: String(supplierCandidate.rate),
          supplierCalculatedCost: String(splitPlan.estimatedTotalCost),
          sellingPrice: String(financialConfig.sellingPrice),
          grossProfit: String(splitPlan.grossProfit),
          grossMarginPercent: String(splitPlan.grossMarginPercent),
          allowedSupplierCost: String(splitPlan.allowedSupplierCost),
          decision: 'HOLD_COST',
          reason: splitPlan.failureReason || 'Split Total Cost exceeded allowed ceiling.',
        });

        await db.update(orders).set({
          fulfillmentStatus: 'HOLD_SUPPLIER_COST',
          updatedAt: new Date(),
        }).where(eq(orders.id, order.id));

        await db.insert(orderEvents).values({
          orderId: order.id,
          fulfillmentStatus: 'HOLD_SUPPLIER_COST',
          description: `Split Routing blocked: Total cost ($${splitPlan.estimatedTotalCost.toFixed(2)}) exceeds ceiling ($${splitPlan.allowedSupplierCost.toFixed(2)}).`,
        });
      }

      return {
        success: false,
        code: 'HOLD_SUPPLIER_COST',
        orderId: order.id,
        isSplit: splitPlan.isSplit,
        chunkCount: splitPlan.chunkCount,
        totalQuantity: quantity,
        estimatedTotalCost: splitPlan.estimatedTotalCost,
        grossProfit: splitPlan.grossProfit,
        grossMarginPercent: splitPlan.grossMarginPercent,
        chunks: [],
        parentStatus: 'HOLD_SUPPLIER_COST',
        message: splitPlan.failureReason || 'Total split cost exceeds Cost Ceiling.',
      };
    }

    // 4. Dry Run Stop: Return planned chunks without database mutation or Peakerr calls
    if (isDryRun || !peakerrClient.isLiveEnabled()) {
      return {
        success: true,
        code: isDryRun ? 'DRY_RUN_SPLIT_APPROVED' : 'SAFE_MODE_SPLIT_BLOCKED',
        orderId: order.id,
        isSplit: splitPlan.isSplit,
        chunkCount: splitPlan.chunkCount,
        totalQuantity: quantity,
        estimatedTotalCost: splitPlan.estimatedTotalCost,
        grossProfit: splitPlan.grossProfit,
        grossMarginPercent: splitPlan.grossMarginPercent,
        chunks: splitPlan.chunks.map((c) => ({
          chunkIndex: c.chunkIndex,
          quantity: c.quantity,
          supplierServiceId: c.supplierServiceId,
          status: 'PLANNED',
          externalOrderId: null,
        })),
        parentStatus: 'SPLIT_PLANNED',
        message: isDryRun
          ? `[DRY RUN] Split plan approved: ${splitPlan.chunkCount} child orders planned with total cost $${splitPlan.estimatedTotalCost.toFixed(2)}.`
          : `[SAFE MODE] Split plan evaluated safely (${splitPlan.chunkCount} child orders). Live fulfillment blocked by SAFE MODE.`,
      };
    }

    // 5. Atomic Claim & Creation of Parent Fulfillment & Child Splits in Database
    let parentFulfillmentId: string;
    let savedSplits: Array<typeof fulfillmentOrderSplits.$inferSelect>;

    try {
      const txResult = await db.transaction(async (tx) => {
        // Atomic lock on orders table
        const [claimedOrder] = await tx
          .update(orders)
          .set({
            fulfillmentStatus: 'SUBMITTING',
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(orders.id, order.id),
              inArray(orders.paymentStatus, ['PAID', 'COMPLETED']),
              inArray(orders.fulfillmentStatus, ['NOT_DISPATCHED', 'HOLD_NO_SUPPLIER', 'HOLD_SUPPLIER_COST'])
            )
          )
          .returning();

        if (!claimedOrder) {
          throw new Error('CONCURRENT_CLAIM_FAILED: Order was claimed or updated concurrently.');
        }

        // Insert or find Parent fulfillment order
        const [parentFulfillment] = await tx
          .insert(fulfillmentOrders)
          .values({
            orderId: order.id,
            provider: 'peakerr',
            externalServiceId: supplierCandidate.serviceId,
            providerTier: supplierCandidate.position,
            providerRateSnapshot: String(supplierCandidate.rate),
            status: 'SUBMITTING',
            requestPayload: {
              isSplit: true,
              totalQuantity: quantity,
              chunkCount: splitPlan.chunkCount,
              executionMode: splitPlan.executionMode,
              target: targetUrl,
            },
            attemptCount: 1,
            submittedAt: new Date(),
          })
          .returning();

        // Insert each chunk deterministically with unique constraint protection
        const splitInserts: Array<typeof fulfillmentOrderSplits.$inferInsert> = splitPlan.chunks.map((chunk) => ({
          parentFulfillmentOrderId: parentFulfillment.id,
          orderId: order.id,
          supplierServiceId: chunk.supplierServiceId,
          chunkIndex: chunk.chunkIndex,
          quantity: chunk.quantity,
          estimatedSupplierCost: chunk.estimatedCost.toFixed(4),
          status: 'PENDING',
          attemptCount: 0,
          requestPayload: {
            service: chunk.supplierServiceId,
            link: targetUrl,
            quantity: chunk.quantity,
            chunkIndex: chunk.chunkIndex,
          },
        }));

        const insertedSplits = await tx
          .insert(fulfillmentOrderSplits)
          .values(splitInserts)
          .returning();

        return { parentFulfillment, insertedSplits };
      });

      parentFulfillmentId = txResult.parentFulfillment.id;
      savedSplits = txResult.insertedSplits;
    } catch (err: any) {
      return {
        success: false,
        code: 'ATOMIC_SPLIT_CLAIM_FAILED',
        orderId: order.id,
        isSplit: true,
        chunkCount: splitPlan.chunkCount,
        totalQuantity: quantity,
        estimatedTotalCost: splitPlan.estimatedTotalCost,
        grossProfit: splitPlan.grossProfit,
        grossMarginPercent: splitPlan.grossMarginPercent,
        chunks: [],
        parentStatus: 'FAILED',
        message: `Failed to claim and save split plan atomically: ${err.message}`,
      };
    }

    // 6. Record Attempt Record for Audit Log
    await db.insert(supplierAttempts).values({
      orderId: order.id,
      supplierServiceId: supplierCandidate.serviceId,
      supplierPosition: supplierCandidate.position,
      supplierRate: String(supplierCandidate.rate),
      supplierCalculatedCost: String(splitPlan.estimatedTotalCost),
      sellingPrice: String(financialConfig.sellingPrice),
      grossProfit: String(splitPlan.grossProfit),
      grossMarginPercent: String(splitPlan.grossMarginPercent),
      allowedSupplierCost: String(splitPlan.allowedSupplierCost),
      decision: 'ACCEPTED',
      reason: `Split Routing Approved (${splitPlan.chunkCount} chunks): Total cost $${splitPlan.estimatedTotalCost.toFixed(2)} <= Allowed $${splitPlan.allowedSupplierCost.toFixed(2)}.`,
    });

    // 7. Sequential Execution of Child Chunks (Outside DB Transaction)
    // In current dev/test mode, ZERO real Peakerr orders are placed (mocked via peakerrClient)
    const chunkResults: Array<{
      chunkIndex: number;
      splitId: string;
      quantity: number;
      supplierServiceId: string;
      status: string;
      externalOrderId?: string | null;
      error?: string | null;
    }> = [];

    let hasFailure = false;

    // Order splits by chunkIndex ascending for strict sequential dispatch
    savedSplits.sort((a, b) => a.chunkIndex - b.chunkIndex);

    for (const split of savedSplits) {
      // Guard: Never resend child with externalOrderId existing
      if (split.externalOrderId) {
        chunkResults.push({
          chunkIndex: split.chunkIndex,
          splitId: split.id,
          quantity: split.quantity,
          supplierServiceId: split.supplierServiceId,
          status: split.status,
          externalOrderId: split.externalOrderId,
        });
        continue;
      }

      // Mark split submitting
      await db
        .update(fulfillmentOrderSplits)
        .set({
          status: 'SUBMITTING',
          attemptCount: split.attemptCount + 1,
          submittedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(fulfillmentOrderSplits.id, split.id));

      // Call Peakerr (safe mock in non-live mode)
      const dispatchResult = await peakerrClient.createOrder({
        service: split.supplierServiceId,
        link: targetUrl,
        quantity: split.quantity,
      });

      if (dispatchResult.success) {
        const actualCost = calculateExecutedServiceCost({
          actualCharge: (dispatchResult.rawResponse as any)?.charge,
          serviceRate: supplierCandidate.rate,
          quantity: split.quantity,
          tier: supplierCandidate.position,
        });

        const actualCostCents = actualCost.providerCostCents ?? Math.round(split.quantity * (supplierCandidate.rate / 1000) * 100);

        await db
          .update(fulfillmentOrderSplits)
          .set({
            status: 'PROCESSING',
            externalOrderId: String(dispatchResult.order),
            actualSupplierCost: (actualCostCents / 100).toFixed(4),
            responsePayload: dispatchResult.rawResponse as any,
            updatedAt: new Date(),
          })
          .where(eq(fulfillmentOrderSplits.id, split.id));

        chunkResults.push({
          chunkIndex: split.chunkIndex,
          splitId: split.id,
          quantity: split.quantity,
          supplierServiceId: split.supplierServiceId,
          status: 'PROCESSING',
          externalOrderId: String(dispatchResult.order),
        });
      } else {
        hasFailure = true;
        await db
          .update(fulfillmentOrderSplits)
          .set({
            status: 'FAILED',
            errorCode: dispatchResult.errorKind || 'DISPATCH_FAILED',
            errorMessage: dispatchResult.error || 'Peakerr submission failed.',
            responsePayload: dispatchResult.rawResponse as any,
            updatedAt: new Date(),
          })
          .where(eq(fulfillmentOrderSplits.id, split.id));

        chunkResults.push({
          chunkIndex: split.chunkIndex,
          splitId: split.id,
          quantity: split.quantity,
          supplierServiceId: split.supplierServiceId,
          status: 'FAILED',
          error: dispatchResult.error,
        });

        // In sequential execution, stop cascade on failure
        break;
      }
    }

    // 8. Aggregate Parent Status
    const aggregated = await this.aggregateParentStatus(parentFulfillmentId, order.id);

    return {
      success: !hasFailure,
      code: hasFailure ? 'SPLIT_PARTIAL_FAILURE' : 'SPLIT_DISPATCH_SUCCESS',
      orderId: order.id,
      parentFulfillmentId,
      isSplit: true,
      chunkCount: splitPlan.chunkCount,
      totalQuantity: quantity,
      estimatedTotalCost: splitPlan.estimatedTotalCost,
      grossProfit: splitPlan.grossProfit,
      grossMarginPercent: splitPlan.grossMarginPercent,
      chunks: chunkResults,
      parentStatus: aggregated.parentStatus,
      message: hasFailure
        ? 'One or more split child orders failed during submission.'
        : `Successfully dispatched all ${splitPlan.chunkCount} split child orders.`,
    };
  }

  /**
   * Status Aggregation Engine:
   * Aggregates statuses of child splits to compute parent fulfillment and order status.
   * Rules:
   * - Parent is COMPLETED ONLY when ALL child splits are COMPLETED.
   * - If all chunks are PROCESSING / SUBMITTED -> parent is PROCESSING / SPLIT_SUBMITTED.
   * - If some are PROCESSING and some PENDING -> PARTIALLY_SUBMITTED.
   * - If any failed and no active retry -> PARTIAL or FAILED (with safe manual review).
   */
  public static async aggregateParentStatus(
    parentFulfillmentOrderId: string,
    orderId: string
  ): Promise<{
    parentStatus: string;
    orderFulfillmentStatus: string;
    allCompleted: boolean;
    totalActualCostCents: number;
  }> {
    const splits = await db
      .select()
      .from(fulfillmentOrderSplits)
      .where(eq(fulfillmentOrderSplits.parentFulfillmentOrderId, parentFulfillmentOrderId))
      .orderBy(asc(fulfillmentOrderSplits.chunkIndex));

    if (splits.length === 0) {
      return {
        parentStatus: 'NOT_DISPATCHED',
        orderFulfillmentStatus: 'NOT_DISPATCHED',
        allCompleted: false,
        totalActualCostCents: 0,
      };
    }

    let totalActualCostCents = 0;
    for (const s of splits) {
      if (s.actualSupplierCost) {
        totalActualCostCents += Math.round(parseFloat(s.actualSupplierCost) * 100);
      }
    }

    const allCompleted = splits.every((s) => s.status === 'COMPLETED');
    const allProcessingOrCompleted = splits.every(
      (s) => s.status === 'PROCESSING' || s.status === 'COMPLETED'
    );
    const anyFailed = splits.some((s) => s.status === 'FAILED' || s.status === 'CANCELED');
    const anySubmitted = splits.some((s) => s.status === 'PROCESSING' || s.status === 'SUBMITTING' || s.status === 'COMPLETED');

    let parentStatus = 'PROCESSING';
    let orderFulfillmentStatus = 'PROCESSING';

    if (allCompleted) {
      parentStatus = 'COMPLETED';
      orderFulfillmentStatus = 'COMPLETED';
    } else if (anyFailed) {
      if (anySubmitted) {
        parentStatus = 'PARTIALLY_SUBMITTED';
        orderFulfillmentStatus = 'PROCESSING'; // Keep processing for potential retry
      } else {
        parentStatus = 'FAILED';
        orderFulfillmentStatus = 'FAILED';
      }
    } else if (allProcessingOrCompleted) {
      parentStatus = 'PROCESSING';
      orderFulfillmentStatus = 'PROCESSING';
    } else {
      parentStatus = 'SUBMITTING';
      orderFulfillmentStatus = 'SUBMITTING';
    }

    // Update DB
    await db
      .update(fulfillmentOrders)
      .set({
        status: parentStatus,
        providerCostCents: totalActualCostCents > 0 ? totalActualCostCents : undefined,
        updatedAt: new Date(),
      })
      .where(eq(fulfillmentOrders.id, parentFulfillmentOrderId));

    await db
      .update(orders)
      .set({
        fulfillmentStatus: orderFulfillmentStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    return {
      parentStatus,
      orderFulfillmentStatus,
      allCompleted,
      totalActualCostCents,
    };
  }

  /**
   * Isolated Child Retry:
   * Retries ONLY failed child orders.
   * Never recreates already submitted chunks.
   * Never resends chunks with an existing externalOrderId.
   */
  public static async retryFailedChunk(
    splitId: string,
    targetUrl: string,
    supplierRate: number
  ): Promise<{
    success: boolean;
    split: typeof fulfillmentOrderSplits.$inferSelect | null;
    message: string;
  }> {
    const [split] = await db
      .select()
      .from(fulfillmentOrderSplits)
      .where(eq(fulfillmentOrderSplits.id, splitId))
      .limit(1);

    if (!split) {
      return { success: false, split: null, message: 'Split chunk not found.' };
    }

    // Guard: Never resend child with externalOrderId existing
    if (split.externalOrderId && split.status !== 'FAILED') {
      return {
        success: false,
        split,
        message: `Child chunk already has externalOrderId "${split.externalOrderId}". Duplicate submission blocked.`,
      };
    }

    if (!peakerrClient.isLiveEnabled()) {
      return {
        success: false,
        split,
        message: 'PEAKERR_LIVE_FULFILLMENT_DISABLED: Live fulfillment kill switch is active. Retry blocked.',
      };
    }

    // Update status to SUBMITTING
    await db
      .update(fulfillmentOrderSplits)
      .set({
        status: 'SUBMITTING',
        attemptCount: split.attemptCount + 1,
        errorCode: null,
        errorMessage: null,
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(fulfillmentOrderSplits.id, split.id));

    // Submit to Peakerr
    const result = await peakerrClient.createOrder({
      service: split.supplierServiceId,
      link: targetUrl,
      quantity: split.quantity,
    });

    if (result.success) {
      const actualCost = calculateExecutedServiceCost({
        actualCharge: (result.rawResponse as any)?.charge,
        serviceRate: supplierRate,
        quantity: split.quantity,
      });

      const actualCostCents = actualCost.providerCostCents ?? Math.round(split.quantity * (supplierRate / 1000) * 100);

      const [updatedSplit] = await db
        .update(fulfillmentOrderSplits)
        .set({
          status: 'PROCESSING',
          externalOrderId: String(result.order),
          actualSupplierCost: (actualCostCents / 100).toFixed(4),
          responsePayload: result.rawResponse as any,
          updatedAt: new Date(),
        })
        .where(eq(fulfillmentOrderSplits.id, split.id))
        .returning();

      // Aggregate parent status
      await this.aggregateParentStatus(split.parentFulfillmentOrderId, split.orderId);

      return {
        success: true,
        split: updatedSplit,
        message: `Child chunk #${split.chunkIndex} retry successful (External Order ID: ${result.order}).`,
      };
    }

    const [failedSplit] = await db
      .update(fulfillmentOrderSplits)
      .set({
        status: 'FAILED',
        errorCode: result.errorKind || 'DISPATCH_FAILED',
        errorMessage: result.error || 'Retry failed.',
        responsePayload: result.rawResponse as any,
        updatedAt: new Date(),
      })
      .where(eq(fulfillmentOrderSplits.id, split.id))
      .returning();

    await this.aggregateParentStatus(split.parentFulfillmentOrderId, split.orderId);

    return {
      success: false,
      split: failedSplit,
      message: result.error || 'Child chunk retry failed.',
    };
  }
}
