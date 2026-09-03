import { db } from '@/db';
import {
  orders,
  fulfillmentOrders,
  orderEvents,
  plans,
  offers,
  fulfillmentChains,
  fulfillmentChainServices,
  supplierAttempts,
} from '@/db/schema';
import { eq, and, inArray, desc, or, asc } from 'drizzle-orm';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import {
  resolveCanonicalFulfillmentTarget,
  mapPeakerrStatusToLocal,
} from './fulfillment.service';
import {
  calculateCostCeiling,
  calculateSupplierCost,
  calculateGrossProfit,
  calculateGrossMarginPercent,
  evaluateSupplierOption,
} from '@/lib/routing/financial-routing';
import {
  SupplierPosition,
  SupplierRoutingDecision,
  RoutingStatus,
  SupplierAttemptRecord,
} from '@/types/routing';
import { calculateExecutedServiceCost } from '@/lib/financials';
import { planSplitOrder } from '@/lib/routing/split-planner';
import { SplitFulfillmentService } from './split-fulfillment.service';

export interface RouteAndDispatchOptions {
  dryRun?: boolean;
}

export interface SupplierCandidateSlot {
  position: SupplierPosition;
  serviceId: string;
  configuredRate?: string | number | null;
}

export interface SupplierRoutingExecutionResult {
  success: boolean;
  code: string;
  orderId: string;
  publicId?: string;
  routingStatus: RoutingStatus;
  selectedSupplierPosition?: SupplierPosition;
  selectedSupplierServiceId?: string;
  selectedRate?: number;
  calculatedCost?: number;
  sellingPrice?: number;
  allowedSupplierCost?: number;
  grossProfit?: number;
  grossMarginPercent?: number;
  providerOrderId?: string | number;
  attempts: SupplierAttemptRecord[];
  isDryRun: boolean;
  message: string;
  error?: string;
}

/**
 * Pure helper to structure formatted console / audit logs without leaking secrets.
 */
export function logOrderRoutingAudit(data: {
  orderId: string;
  platform?: string | null;
  serviceType?: string | null;
  packageName?: string | null;
  sellingPrice: number;
  quantity: number;
  supplierPosition: SupplierPosition;
  supplierId: string;
  currentRate: number;
  calculatedCost: number;
  allowedSupplierCost: number;
  grossProfit: number;
  grossMarginPercent: number;
  decision: string;
  reason: string;
}) {
  console.log(`[ORDER ROUTING]
Order: ${data.orderId}
Platform: ${data.platform || 'N/A'}
Service: ${data.serviceType || 'N/A'}
Package: ${data.packageName || 'N/A'}
Quantity: ${data.quantity}
Selling price: $${data.sellingPrice.toFixed(2)}
Position: ${data.supplierPosition}
Service ID: ${data.supplierId}
Rate: ${data.currentRate}
Supplier cost: $${data.calculatedCost.toFixed(4)}
Allowed supplier cost: $${data.allowedSupplierCost.toFixed(4)}
Gross profit: $${data.grossProfit.toFixed(2)}
Gross margin: ${data.grossMarginPercent.toFixed(2)}%
Decision: ${data.decision}
Reason: ${data.reason}`);
}

/**
 * Resolves candidate suppliers (Priority -> Fallback 1 -> Fallback 2) for an order
 * Checking both the plan/offer financial configs and the chain mappings.
 */
export async function resolveCandidateSuppliersForOrder(order: typeof orders.$inferSelect): Promise<{
  candidates: SupplierCandidateSlot[];
  financialConfig: {
    sellingPrice: number;
    minimumGrossMarginPercent: number;
    minimumGrossProfit: number;
    maxSupplierCostAbsolute?: number | null;
    costCeilingEnabled: boolean;
    manualReviewEnabled: boolean;
    packageName: string;
  };
}> {
  let sellingPrice = (order.totalCents || 0) / 100;
  let minimumGrossMarginPercent = 40;
  let minimumGrossProfit = 5.0;
  let maxSupplierCostAbsolute: number | null = null;
  let costCeilingEnabled = true;
  let manualReviewEnabled = false;
  let packageName = order.service || 'Default Package';

  const candidates: SupplierCandidateSlot[] = [];

  // 1. Check if linked to an Offer
  if (order.offerId) {
    const [offer] = await db.query.offers.findMany({
      where: eq(offers.id, order.offerId),
      limit: 1,
    });
    if (offer) {
      packageName = offer.name;
      if (offer.priceCents) sellingPrice = offer.priceCents / 100;
      if (offer.minimumGrossMarginPercent !== null && offer.minimumGrossMarginPercent !== undefined) {
        minimumGrossMarginPercent = offer.minimumGrossMarginPercent;
      }
      if (offer.minimumGrossProfitCents !== null && offer.minimumGrossProfitCents !== undefined) {
        minimumGrossProfit = offer.minimumGrossProfitCents / 100;
      }
      if (offer.maxSupplierCostAbsoluteCents !== null && offer.maxSupplierCostAbsoluteCents !== undefined) {
        maxSupplierCostAbsolute = offer.maxSupplierCostAbsoluteCents / 100;
      }
      if (offer.costCeilingEnabled !== null && offer.costCeilingEnabled !== undefined) {
        costCeilingEnabled = offer.costCeilingEnabled;
      }
      if (offer.manualReviewEnabled !== null && offer.manualReviewEnabled !== undefined) {
        manualReviewEnabled = offer.manualReviewEnabled;
      }

      if (offer.priorityServiceId) {
        candidates.push({ position: 'priority', serviceId: offer.priorityServiceId });
      }
      if (offer.fallback1ServiceId) {
        candidates.push({ position: 'fallback1', serviceId: offer.fallback1ServiceId });
      }
      if (offer.fallback2ServiceId) {
        candidates.push({ position: 'fallback2', serviceId: offer.fallback2ServiceId });
      }
    }
  }

  // 2. Check if linked to a Plan (if candidates empty)
  if (candidates.length === 0 && order.planId) {
    const [plan] = await db.query.plans.findMany({
      where: eq(plans.id, order.planId),
      limit: 1,
    });
    if (plan) {
      packageName = plan.name;
      const priceCents = plan.salePriceCents || plan.regularPriceCents;
      if (priceCents) sellingPrice = priceCents / 100;
      if (plan.minimumGrossMarginPercent !== null && plan.minimumGrossMarginPercent !== undefined) {
        minimumGrossMarginPercent = plan.minimumGrossMarginPercent;
      }
      if (plan.minimumGrossProfitCents !== null && plan.minimumGrossProfitCents !== undefined) {
        minimumGrossProfit = plan.minimumGrossProfitCents / 100;
      }
      if (plan.maxSupplierCostAbsoluteCents !== null && plan.maxSupplierCostAbsoluteCents !== undefined) {
        maxSupplierCostAbsolute = plan.maxSupplierCostAbsoluteCents / 100;
      }
      if (plan.costCeilingEnabled !== null && plan.costCeilingEnabled !== undefined) {
        costCeilingEnabled = plan.costCeilingEnabled;
      }
      if (plan.manualReviewEnabled !== null && plan.manualReviewEnabled !== undefined) {
        manualReviewEnabled = plan.manualReviewEnabled;
      }

      if (plan.priorityServiceId) {
        candidates.push({ position: 'priority', serviceId: plan.priorityServiceId });
      }
      if (plan.fallback1ServiceId) {
        candidates.push({ position: 'fallback1', serviceId: plan.fallback1ServiceId });
      }
      if (plan.fallback2ServiceId) {
        candidates.push({ position: 'fallback2', serviceId: plan.fallback2ServiceId });
      }
    }
  }

  // 3. Fallback to fulfillment_chains table if no direct package mapping found
  if (candidates.length === 0 && order.platform && order.service) {
    const [chain] = await db.query.fulfillmentChains.findMany({
      where: and(
        eq(fulfillmentChains.platform, order.platform.toLowerCase()),
        eq(fulfillmentChains.service, order.service.toLowerCase()),
        eq(fulfillmentChains.active, true)
      ),
      limit: 1,
    });

    if (chain) {
      const chainServices = await db.query.fulfillmentChainServices.findMany({
        where: and(
          eq(fulfillmentChainServices.chainId, chain.id),
          eq(fulfillmentChainServices.active, true)
        ),
        orderBy: [asc(fulfillmentChainServices.priority)],
      });

      for (const s of chainServices) {
        const pos: SupplierPosition = s.priority === 1 ? 'priority' : s.priority === 2 ? 'fallback1' : 'fallback2';
        candidates.push({
          position: pos,
          serviceId: s.providerServiceId,
          configuredRate: s.rate,
        });
      }
    }
  }

  return {
    candidates,
    financialConfig: {
      sellingPrice,
      minimumGrossMarginPercent,
      minimumGrossProfit,
      maxSupplierCostAbsolute,
      costCeilingEnabled,
      manualReviewEnabled,
      packageName,
    },
  };
}

/**
 * Executes the Supplier Routing Engine with cascade (Priority -> Fallback 1 -> Fallback 2)
 * and strict Cost Ceiling validation.
 * 
 * Supports dryRun mode:
 * - When dryRun=true: evaluates real rates, calculates financial ceiling, logs attempts, NEVER calls Peakerr createOrder.
 * - When dryRun=false: performs atomic claim, runs external call outside DB tx, records final result and logs supplier_attempts.
 */
export async function executeSupplierRouting(
  orderIdentifier: string,
  options: RouteAndDispatchOptions = {}
): Promise<SupplierRoutingExecutionResult> {
  const isDryRun = options.dryRun === true;
  const cleanInput = (orderIdentifier || '').trim();

  if (!cleanInput) {
    return {
      success: false,
      code: 'INVALID_INPUT',
      orderId: '',
      routingStatus: 'FAILED',
      attempts: [],
      isDryRun,
      message: 'Order UUID or Public ID is required.',
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
      success: false,
      code: 'ORDER_NOT_FOUND',
      orderId: cleanInput,
      routingStatus: 'FAILED',
      attempts: [],
      isDryRun,
      message: `Order with identifier "${cleanInput}" does not exist.`,
    };
  }

  // 2. Validate Payment Status (Must be PAID or COMPLETED)
  if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'COMPLETED') {
    return {
      success: false,
      code: 'PAYMENT_NOT_ELIGIBLE',
      orderId: order.id,
      publicId: order.publicId,
      routingStatus: 'HOLD_NO_SUPPLIER',
      attempts: [],
      isDryRun,
      message: `Payment status is "${order.paymentStatus}". Must be PAID or COMPLETED.`,
    };
  }

  // 3. Idempotency & Concurrency Check
  // In live mode, only NOT_DISPATCHED (or retryable) orders can be routed
  if (!isDryRun && order.fulfillmentStatus !== 'NOT_DISPATCHED' && order.fulfillmentStatus !== 'HOLD_NO_SUPPLIER' && order.fulfillmentStatus !== 'HOLD_SUPPLIER_COST') {
    return {
      success: false,
      code: 'ORDER_ALREADY_CLAIMED',
      orderId: order.id,
      publicId: order.publicId,
      routingStatus: 'FAILED',
      attempts: [],
      isDryRun,
      message: `Order fulfillment status is already "${order.fulfillmentStatus}". Cannot route again.`,
    };
  }

  // 4. Resolve Target URL
  const targetValidation = resolveCanonicalFulfillmentTarget(order);
  if (!targetValidation.success) {
    return {
      success: false,
      code: targetValidation.code,
      orderId: order.id,
      publicId: order.publicId,
      routingStatus: 'FAILED',
      attempts: [],
      isDryRun,
      message: targetValidation.message,
    };
  }

  // 5. Resolve Candidates and Financial Rules
  const { candidates, financialConfig } = await resolveCandidateSuppliersForOrder(order);
  const quantity = Number(order.quantity);

  if (candidates.length === 0) {
    if (!isDryRun) {
      await db.update(orders).set({ fulfillmentStatus: 'HOLD_NO_SUPPLIER', updatedAt: new Date() }).where(eq(orders.id, order.id));
      await db.insert(orderEvents).values({
        orderId: order.id,
        fulfillmentStatus: 'HOLD_NO_SUPPLIER',
        description: 'Supplier Routing: No suppliers configured for this platform/service.',
      });
    }

    return {
      success: false,
      code: 'HOLD_NO_SUPPLIER',
      orderId: order.id,
      publicId: order.publicId,
      routingStatus: 'HOLD_NO_SUPPLIER',
      attempts: [],
      isDryRun,
      message: 'No supplier candidates configured for this platform/service.',
    };
  }

  // 6. Manual Review Gate
  if (financialConfig.manualReviewEnabled) {
    const firstCandidate = candidates[0];
    const initialAttempt: SupplierAttemptRecord = {
      orderId: order.id,
      supplierServiceId: firstCandidate.serviceId,
      supplierPosition: firstCandidate.position,
      supplierRate: Number(firstCandidate.configuredRate || 0),
      supplierCalculatedCost: calculateSupplierCost(quantity, Number(firstCandidate.configuredRate || 0)),
      sellingPrice: financialConfig.sellingPrice,
      grossProfit: calculateGrossProfit(financialConfig.sellingPrice, 0),
      grossMarginPercent: 100,
      allowedSupplierCost: 0,
      decision: 'MANUAL_REVIEW',
      reason: 'Package requires manual admin review before dispatch.',
      createdAt: new Date().toISOString(),
    };

    if (!isDryRun) {
      await db.insert(supplierAttempts).values({
        orderId: order.id,
        supplierServiceId: initialAttempt.supplierServiceId,
        supplierPosition: initialAttempt.supplierPosition,
        supplierRate: String(initialAttempt.supplierRate),
        supplierCalculatedCost: String(initialAttempt.supplierCalculatedCost),
        sellingPrice: String(initialAttempt.sellingPrice),
        grossProfit: String(initialAttempt.grossProfit),
        grossMarginPercent: String(initialAttempt.grossMarginPercent),
        allowedSupplierCost: String(initialAttempt.allowedSupplierCost),
        decision: initialAttempt.decision,
        reason: initialAttempt.reason,
      });

      await db.update(orders).set({ fulfillmentStatus: 'MANUAL_REVIEW', updatedAt: new Date() }).where(eq(orders.id, order.id));
      await db.insert(orderEvents).values({
        orderId: order.id,
        fulfillmentStatus: 'MANUAL_REVIEW',
        description: 'Order placed on MANUAL_REVIEW according to package configuration.',
      });
    }

    logOrderRoutingAudit({
      orderId: order.id,
      platform: order.platform,
      serviceType: order.service,
      packageName: financialConfig.packageName,
      sellingPrice: financialConfig.sellingPrice,
      quantity,
      supplierPosition: firstCandidate.position,
      supplierId: firstCandidate.serviceId,
      currentRate: initialAttempt.supplierRate,
      calculatedCost: initialAttempt.supplierCalculatedCost,
      allowedSupplierCost: initialAttempt.allowedSupplierCost,
      grossProfit: initialAttempt.grossProfit,
      grossMarginPercent: initialAttempt.grossMarginPercent,
      decision: 'MANUAL_REVIEW',
      reason: initialAttempt.reason,
    });

    return {
      success: false,
      code: 'MANUAL_REVIEW',
      orderId: order.id,
      publicId: order.publicId,
      routingStatus: 'MANUAL_REVIEW',
      attempts: [initialAttempt],
      isDryRun,
      message: 'Order requires manual admin review.',
    };
  }

  // 7. Iterate Cascade (Priority -> Fallback 1 -> Fallback 2)
  const attempts: SupplierAttemptRecord[] = [];
  let approvedCandidate: {
    slot: SupplierCandidateSlot;
    currentRate: number;
    calculatedCost: number;
    allowedSupplierCost: number;
    grossProfit: number;
    grossMarginPercent: number;
    reason: string;
  } | null = null;

  // Try fetching live catalog once if available to avoid multiple round-trips
  let liveCatalog: any[] | null = null;
  try {
    const catalogRes = await peakerrClient.getServices();
    if (Array.isArray(catalogRes)) {
      liveCatalog = catalogRes;
    }
  } catch {
    // Non-blocking, fallback to service-level or configured rate
  }

  for (const candidate of candidates) {
    let effectiveRate = Number(candidate.configuredRate || 0);
    let minQty = 1;
    let maxQty = 10000000;
    let isServiceAvailable = true;

    // Check Live Catalog if available
    if (liveCatalog) {
      const liveDetails = liveCatalog.find((s) => String(s.service).trim() === String(candidate.serviceId).trim());
      if (liveDetails) {
        effectiveRate = Number(liveDetails.rate);
        minQty = Number(liveDetails.min) || 1;
        maxQty = Number(liveDetails.max) || 10000000;
      } else {
        isServiceAvailable = false;
      }
    }

    // A. Check Supplier Availability
    if (!isServiceAvailable) {
      const attempt: SupplierAttemptRecord = {
        orderId: order.id,
        supplierServiceId: candidate.serviceId,
        supplierPosition: candidate.position,
        supplierRate: effectiveRate,
        supplierCalculatedCost: calculateSupplierCost(quantity, effectiveRate),
        sellingPrice: financialConfig.sellingPrice,
        grossProfit: calculateGrossProfit(financialConfig.sellingPrice, calculateSupplierCost(quantity, effectiveRate)),
        grossMarginPercent: calculateGrossMarginPercent(financialConfig.sellingPrice, calculateSupplierCost(quantity, effectiveRate)),
        allowedSupplierCost: 0,
        decision: 'REJECTED',
        reason: `SERVICE_UNAVAILABLE: Service ${candidate.serviceId} was not found active in Peakerr catalog.`,
        createdAt: new Date().toISOString(),
      };
      attempts.push(attempt);
      continue;
    }

    // B. Check Quantity Bounds (Min / Max) & Split Routing Eligibility
    const isXTwitterLikes = (order.platform?.toLowerCase() === 'twitter' || order.platform?.toLowerCase() === 'x') && order.service?.toLowerCase() === 'likes';
    const isSplitCandidate = isXTwitterLikes && candidate.position === 'priority' && quantity > maxQty;

    if (quantity > maxQty && !isSplitCandidate) {
      const calculatedCost = calculateSupplierCost(quantity, effectiveRate);
      const attempt: SupplierAttemptRecord = {
        orderId: order.id,
        supplierServiceId: candidate.serviceId,
        supplierPosition: candidate.position,
        supplierRate: effectiveRate,
        supplierCalculatedCost: calculatedCost,
        sellingPrice: financialConfig.sellingPrice,
        grossProfit: calculateGrossProfit(financialConfig.sellingPrice, calculatedCost),
        grossMarginPercent: calculateGrossMarginPercent(financialConfig.sellingPrice, calculatedCost),
        allowedSupplierCost: 0,
        decision: 'REJECTED',
        reason: `INCOMPATIBLE_MAX_QUANTITY: Requested quantity (${quantity}) exceeds supplier maximum (${maxQty}).`,
        createdAt: new Date().toISOString(),
      };
      attempts.push(attempt);
      continue;
    }

    if (quantity < minQty) {
      const calculatedCost = calculateSupplierCost(quantity, effectiveRate);
      const attempt: SupplierAttemptRecord = {
        orderId: order.id,
        supplierServiceId: candidate.serviceId,
        supplierPosition: candidate.position,
        supplierRate: effectiveRate,
        supplierCalculatedCost: calculatedCost,
        sellingPrice: financialConfig.sellingPrice,
        grossProfit: calculateGrossProfit(financialConfig.sellingPrice, calculatedCost),
        grossMarginPercent: calculateGrossMarginPercent(financialConfig.sellingPrice, calculatedCost),
        allowedSupplierCost: 0,
        decision: 'REJECTED',
        reason: `INCOMPATIBLE_MIN_QUANTITY: Requested quantity (${quantity}) is below supplier minimum (${minQty}).`,
        createdAt: new Date().toISOString(),
      };
      attempts.push(attempt);
      continue;
    }

    // C. Evaluate Pure Financial Cost Ceiling (or Split Plan for X Likes > 5k)
    if (isSplitCandidate) {
      const splitPlan = planSplitOrder({
        platform: order.platform || '',
        service: order.service || '',
        totalQuantity: quantity,
        sellingPrice: financialConfig.sellingPrice,
        supplierServiceId: candidate.serviceId,
        supplierRate: effectiveRate,
        supplierMinQuantity: minQty,
        supplierMaxQuantity: maxQty,
        minimumGrossMarginPercent: financialConfig.minimumGrossMarginPercent,
        minimumGrossProfit: financialConfig.minimumGrossProfit,
        maxSupplierCostAbsolute: financialConfig.maxSupplierCostAbsolute,
        costCeilingEnabled: financialConfig.costCeilingEnabled,
      });

      const attempt: SupplierAttemptRecord = {
        orderId: order.id,
        supplierServiceId: candidate.serviceId,
        supplierPosition: candidate.position,
        supplierRate: effectiveRate,
        supplierCalculatedCost: splitPlan.estimatedTotalCost,
        sellingPrice: financialConfig.sellingPrice,
        grossProfit: splitPlan.grossProfit,
        grossMarginPercent: splitPlan.grossMarginPercent,
        allowedSupplierCost: splitPlan.allowedSupplierCost,
        decision: splitPlan.isFinanciallySafe ? 'ACCEPTED' : 'HOLD_COST',
        reason: splitPlan.failureReason || `Split Plan Approved: ${splitPlan.chunkCount} child orders of 5,000 likes. Total Cost $${splitPlan.estimatedTotalCost.toFixed(2)} <= Allowed $${splitPlan.allowedSupplierCost.toFixed(2)}.`,
        createdAt: new Date().toISOString(),
      };

      attempts.push(attempt);

      logOrderRoutingAudit({
        orderId: order.id,
        platform: order.platform,
        serviceType: order.service,
        packageName: financialConfig.packageName,
        sellingPrice: financialConfig.sellingPrice,
        quantity,
        supplierPosition: candidate.position,
        supplierId: candidate.serviceId,
        currentRate: effectiveRate,
        calculatedCost: splitPlan.estimatedTotalCost,
        allowedSupplierCost: splitPlan.allowedSupplierCost,
        grossProfit: splitPlan.grossProfit,
        grossMarginPercent: splitPlan.grossMarginPercent,
        decision: splitPlan.isFinanciallySafe ? 'APPROVED' : 'HOLD_COST',
        reason: attempt.reason,
      });

      if (splitPlan.isFinanciallySafe) {
        approvedCandidate = {
          slot: candidate,
          currentRate: effectiveRate,
          calculatedCost: splitPlan.estimatedTotalCost,
          allowedSupplierCost: splitPlan.allowedSupplierCost,
          grossProfit: splitPlan.grossProfit,
          grossMarginPercent: splitPlan.grossMarginPercent,
          reason: attempt.reason,
        };
        break; // Split route approved!
      } else {
        continue; // Fallback to candidate 2 if available
      }
    }

    const evalRes = evaluateSupplierOption({
      orderId: order.id,
      platform: order.platform || '',
      serviceType: order.service || '',
      quantity,
      sellingPrice: financialConfig.sellingPrice,
      costCeilingEnabled: financialConfig.costCeilingEnabled,
      manualReviewEnabled: financialConfig.manualReviewEnabled,
      minimumGrossMarginPercent: financialConfig.minimumGrossMarginPercent,
      minimumGrossProfit: financialConfig.minimumGrossProfit,
      maxSupplierCostAbsolute: financialConfig.maxSupplierCostAbsolute,
      supplierServiceId: candidate.serviceId,
      supplierPosition: candidate.position,
      supplierRate: effectiveRate,
    });

    attempts.push(evalRes.attemptRecord);

    logOrderRoutingAudit({
      orderId: order.id,
      platform: order.platform,
      serviceType: order.service,
      packageName: financialConfig.packageName,
      sellingPrice: financialConfig.sellingPrice,
      quantity,
      supplierPosition: candidate.position,
      supplierId: candidate.serviceId,
      currentRate: effectiveRate,
      calculatedCost: evalRes.attemptRecord.supplierCalculatedCost,
      allowedSupplierCost: evalRes.attemptRecord.allowedSupplierCost,
      grossProfit: evalRes.attemptRecord.grossProfit,
      grossMarginPercent: evalRes.attemptRecord.grossMarginPercent,
      decision: evalRes.decision === 'ACCEPTED' ? 'APPROVED' : evalRes.decision,
      reason: evalRes.reason,
    });

    if (evalRes.allowed) {
      approvedCandidate = {
        slot: candidate,
        currentRate: effectiveRate,
        calculatedCost: evalRes.attemptRecord.supplierCalculatedCost,
        allowedSupplierCost: evalRes.attemptRecord.allowedSupplierCost,
        grossProfit: evalRes.attemptRecord.grossProfit,
        grossMarginPercent: evalRes.attemptRecord.grossMarginPercent,
        reason: evalRes.reason,
      };
      break; // First approved candidate wins!
    }
  }

  // 8. Persist Attempts in Database (if not dry run)
  if (!isDryRun && attempts.length > 0) {
    for (const att of attempts) {
      await db.insert(supplierAttempts).values({
        orderId: order.id,
        supplierServiceId: att.supplierServiceId,
        supplierPosition: att.supplierPosition,
        supplierRate: String(att.supplierRate),
        supplierCalculatedCost: String(att.supplierCalculatedCost),
        sellingPrice: String(att.sellingPrice),
        grossProfit: String(att.grossProfit),
        grossMarginPercent: String(att.grossMarginPercent),
        allowedSupplierCost: String(att.allowedSupplierCost),
        decision: att.decision,
        reason: att.reason,
      });
    }
  }

  // 9. Handle Case: No Candidate Approved
  if (!approvedCandidate) {
    const isCostBlocked = attempts.some((a) => a.decision === 'HOLD_COST');
    const finalRoutingStatus: RoutingStatus = isCostBlocked ? 'HOLD_SUPPLIER_COST' : 'HOLD_NO_SUPPLIER';

    if (!isDryRun) {
      await db.update(orders).set({ fulfillmentStatus: finalRoutingStatus, updatedAt: new Date() }).where(eq(orders.id, order.id));
      await db.insert(orderEvents).values({
        orderId: order.id,
        fulfillmentStatus: finalRoutingStatus,
        description: `Supplier Routing: No supplier approved. Placed on ${finalRoutingStatus}.`,
      });
    }

    return {
      success: false,
      code: finalRoutingStatus,
      orderId: order.id,
      publicId: order.publicId,
      routingStatus: finalRoutingStatus,
      sellingPrice: financialConfig.sellingPrice,
      attempts,
      isDryRun,
      message: isCostBlocked
        ? 'All candidate suppliers exceeded internal Cost Ceiling limits.'
        : 'No compatible supplier available for this package quantity.',
    };
  }

  // Check if approved route requires Split Routing (e.g. X Likes Pro/Elite/Max > 5k)
  const isXTwitterLikes = (order.platform?.toLowerCase() === 'twitter' || order.platform?.toLowerCase() === 'x') && order.service?.toLowerCase() === 'likes';
  const requiresSplit = isXTwitterLikes && quantity > 5000 && approvedCandidate.slot.position === 'priority';

  if (requiresSplit) {
    const splitResult = await SplitFulfillmentService.planAndExecuteSplit(
      order,
      {
        position: approvedCandidate.slot.position,
        serviceId: approvedCandidate.slot.serviceId,
        rate: approvedCandidate.currentRate,
        minQuantity: 50,
        maxQuantity: 5000,
      },
      financialConfig,
      targetValidation.target,
      { dryRun: isDryRun }
    );

    return {
      success: splitResult.success,
      code: splitResult.code,
      orderId: order.id,
      publicId: order.publicId,
      routingStatus: splitResult.parentStatus as RoutingStatus,
      selectedSupplierPosition: approvedCandidate.slot.position,
      selectedSupplierServiceId: approvedCandidate.slot.serviceId,
      selectedRate: approvedCandidate.currentRate,
      calculatedCost: splitResult.estimatedTotalCost,
      sellingPrice: financialConfig.sellingPrice,
      allowedSupplierCost: approvedCandidate.allowedSupplierCost,
      grossProfit: splitResult.grossProfit,
      grossMarginPercent: splitResult.grossMarginPercent,
      attempts,
      isDryRun,
      message: splitResult.message,
    };
  }

  // 10. DRY RUN MODE / SAFE MODE: Stop before any mutation or Peakerr order creation
  if (isDryRun || !peakerrClient.isLiveEnabled()) {
    return {
      success: true,
      code: isDryRun ? 'DRY_RUN_APPROVED' : 'SAFE_MODE_FULFILLMENT_BLOCKED',
      orderId: order.id,
      publicId: order.publicId,
      routingStatus: 'SUBMITTED',
      selectedSupplierPosition: approvedCandidate.slot.position,
      selectedSupplierServiceId: approvedCandidate.slot.serviceId,
      selectedRate: approvedCandidate.currentRate,
      calculatedCost: approvedCandidate.calculatedCost,
      sellingPrice: financialConfig.sellingPrice,
      allowedSupplierCost: approvedCandidate.allowedSupplierCost,
      grossProfit: approvedCandidate.grossProfit,
      grossMarginPercent: approvedCandidate.grossMarginPercent,
      attempts,
      isDryRun: true,
      message: isDryRun
        ? `[DRY RUN] Order would be routed to ${approvedCandidate.slot.position} supplier (${approvedCandidate.slot.serviceId}) at rate ${approvedCandidate.currentRate}.`
        : `[SAFE MODE] Order routed to ${approvedCandidate.slot.position} supplier (#${approvedCandidate.slot.serviceId}) in SAFE MODE. Live Peakerr fulfillment blocked.`,
    };
  }

  // 11. LIVE DISPATCH EXECUTION: Safe 3-Phase Pattern
  // Phase 1: Atomic Claim & Pre-insert fulfillment order
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
            eq(orders.id, order.id),
            inArray(orders.paymentStatus, ['PAID', 'COMPLETED']),
            inArray(orders.fulfillmentStatus, ['NOT_DISPATCHED', 'HOLD_NO_SUPPLIER', 'HOLD_SUPPLIER_COST'])
          )
        )
        .returning();

      if (!claimedOrder) {
        throw new Error('CONCURRENT_CLAIM_FAILED: Order was claimed concurrently.');
      }

      const [newFulfillment] = await tx
        .insert(fulfillmentOrders)
        .values({
          orderId: order.id,
          provider: 'peakerr',
          externalServiceId: approvedCandidate.slot.serviceId,
          providerTier: approvedCandidate.slot.position,
          providerRateSnapshot: String(approvedCandidate.currentRate),
          status: 'SUBMITTING',
          requestPayload: {
            provider: 'peakerr',
            service: approvedCandidate.slot.serviceId,
            link: targetValidation.target,
            quantity,
          },
          attemptCount: 1,
          submittedAt: new Date(),
        })
        .returning();

      return { claimedOrder, newFulfillment };
    });

    fulfillmentEntryId = claimTxResult.newFulfillment.id;
  } catch (err: any) {
    return {
      success: false,
      code: 'ATOMIC_CLAIM_FAILED',
      orderId: order.id,
      publicId: order.publicId,
      routingStatus: 'FAILED',
      attempts,
      isDryRun: false,
      message: `Failed to atomically claim order: ${err.message}`,
      error: err.message,
    };
  }

  // Phase 2: External HTTP Call (OUTSIDE DB Transaction)
  const result = await peakerrClient.createOrder({
    service: approvedCandidate.slot.serviceId,
    link: targetValidation.target,
    quantity,
  });

  // Phase 3: DB Finalization in Separate Transaction
  if (result.success) {
    const costSnapshot = calculateExecutedServiceCost({
      actualCharge: (result.rawResponse as any)?.charge,
      serviceRate: approvedCandidate.currentRate,
      quantity,
      tier: approvedCandidate.slot.position,
    });

    await db.transaction(async (tx) => {
      await tx
        .update(fulfillmentOrders)
        .set({
          status: 'PROCESSING',
          externalOrderId: String(result.order),
          providerTier: approvedCandidate.slot.position,
          providerCostCents: costSnapshot.providerCostCents,
          providerCostCurrency: 'USD',
          providerCostSource: costSnapshot.providerCostSource,
          providerRateSnapshot: String(approvedCandidate.currentRate),
          providerCostCapturedAt: new Date(),
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
        .where(eq(orders.id, order.id));

      await tx.insert(orderEvents).values({
        orderId: order.id,
        fulfillmentStatus: 'PROCESSING',
        description: `Order successfully routed to ${approvedCandidate.slot.position} Peakerr service (#${approvedCandidate.slot.serviceId}), Provider Order: ${result.order}`,
      });
    });

    return {
      success: true,
      code: 'DISPATCH_SUCCESS',
      orderId: order.id,
      publicId: order.publicId,
      routingStatus: 'SUBMITTED',
      selectedSupplierPosition: approvedCandidate.slot.position,
      selectedSupplierServiceId: approvedCandidate.slot.serviceId,
      selectedRate: approvedCandidate.currentRate,
      calculatedCost: approvedCandidate.calculatedCost,
      sellingPrice: financialConfig.sellingPrice,
      allowedSupplierCost: approvedCandidate.allowedSupplierCost,
      grossProfit: approvedCandidate.grossProfit,
      grossMarginPercent: approvedCandidate.grossMarginPercent,
      providerOrderId: result.order,
      attempts,
      isDryRun: false,
      message: `Order submitted successfully to Peakerr (Order ID: ${result.order}).`,
    };
  }

  // Handle Ambiguous Timeout
  if (result.isAmbiguous) {
    await db.transaction(async (tx) => {
      await tx
        .update(fulfillmentOrders)
        .set({
          lastError: 'TIMEOUT_AMBIGUOUS: Peakerr connection timed out. Do not retry automatically.',
          updatedAt: new Date(),
        })
        .where(eq(fulfillmentOrders.id, fulfillmentEntryId));

      await tx.insert(orderEvents).values({
        orderId: order.id,
        fulfillmentStatus: 'SUBMITTING',
        description: 'Supplier Routing timed out. Status ambiguous. Manual check required.',
      });
    });

    return {
      success: false,
      code: 'AMBIGUOUS_SUBMISSION',
      orderId: order.id,
      publicId: order.publicId,
      routingStatus: 'SUBMITTED',
      attempts,
      isDryRun: false,
      message: result.error,
      error: result.error,
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
      .where(eq(orders.id, order.id));

    await tx.insert(orderEvents).values({
      orderId: order.id,
      fulfillmentStatus: 'FAILED',
      description: `Supplier Routing failed: ${result.error}`,
    });
  });

  return {
    success: false,
    code: result.errorKind || 'DISPATCH_FAILED',
    orderId: order.id,
    publicId: order.publicId,
    routingStatus: 'FAILED',
    attempts,
    isDryRun: false,
    message: result.error,
    error: result.error,
  };
}
