import {
  CostCeilingCalculationParams,
  CostCeilingCalculationResult,
  EvaluateSupplierParams,
  EvaluateSupplierResult,
  SupplierAttemptRecord,
  SupplierPosition,
  SupplierRoutingDecision,
  RoutingStatus,
} from '@/types/routing';

/**
 * Pure calculation of Cost Ceiling limits.
 * 
 * Rules:
 * maximumCostByMargin = sellingPrice * (1 - minimumGrossMarginPercent / 100)
 * maximumCostByProfit = sellingPrice - minimumGrossProfit
 * allowedSupplierCost = Math.min(
 *   maximumCostByMargin,
 *   maximumCostByProfit,
 *   maxSupplierCostAbsolute (if configured and > 0)
 * )
 * 
 * NOTE: The selling price of the card is NEVER automatically altered based on the supplier.
 * Cost ceiling is an internal financial protection mechanism.
 */
export function calculateCostCeiling(params: CostCeilingCalculationParams): CostCeilingCalculationResult {
  const {
    sellingPrice,
    minimumGrossMarginPercent,
    minimumGrossProfit,
    maxSupplierCostAbsolute,
  } = params;

  // sellingPrice * (1 - minimumGrossMarginPercent / 100)
  const maximumCostByMargin = sellingPrice * (1 - minimumGrossMarginPercent / 100);

  // sellingPrice - minimumGrossProfit
  const maximumCostByProfit = sellingPrice - minimumGrossProfit;

  const validCaps = [maximumCostByMargin, maximumCostByProfit];

  const hasAbsoluteCap =
    maxSupplierCostAbsolute !== undefined &&
    maxSupplierCostAbsolute !== null &&
    !isNaN(Number(maxSupplierCostAbsolute)) &&
    Number(maxSupplierCostAbsolute) > 0;

  if (hasAbsoluteCap) {
    validCaps.push(Number(maxSupplierCostAbsolute));
  }

  const rawAllowed = Math.min(...validCaps);
  // Ensure non-negative allowed cost
  const allowedSupplierCost = Math.max(0, rawAllowed);

  return {
    maximumCostByMargin: Number(maximumCostByMargin.toFixed(4)),
    maximumCostByProfit: Number(maximumCostByProfit.toFixed(4)),
    maxSupplierCostAbsolute: hasAbsoluteCap ? Number(Number(maxSupplierCostAbsolute).toFixed(4)) : null,
    allowedSupplierCost: Number(allowedSupplierCost.toFixed(4)),
  };
}

/**
 * Calculates supplier cost for a given quantity and rate per 1000.
 */
export function calculateSupplierCost(quantity: number, supplierRate: number): number {
  if (quantity <= 0 || supplierRate <= 0) return 0;
  return Number(((quantity / 1000) * supplierRate).toFixed(4));
}

/**
 * Calculates Gross Profit in USD dollars.
 * grossProfit = sellingPrice - supplierCalculatedCost
 */
export function calculateGrossProfit(sellingPrice: number, supplierCalculatedCost: number): number {
  return Number((sellingPrice - supplierCalculatedCost).toFixed(4));
}

/**
 * Calculates Gross Margin as a percentage.
 * grossMarginPercent = ((sellingPrice - supplierCalculatedCost) / sellingPrice) * 100
 */
export function calculateGrossMarginPercent(sellingPrice: number, supplierCalculatedCost: number): number {
  if (sellingPrice <= 0) return 0;
  const margin = ((sellingPrice - supplierCalculatedCost) / sellingPrice) * 100;
  return Number(margin.toFixed(2));
}

/**
 * Pure evaluation of a supplier against financial rules and cost ceiling.
 * Produces a full audit trail attempt record and decision.
 */
export function evaluateSupplierOption(params: EvaluateSupplierParams): EvaluateSupplierResult {
  const {
    orderId,
    quantity,
    sellingPrice,
    costCeilingEnabled,
    manualReviewEnabled,
    minimumGrossMarginPercent,
    minimumGrossProfit,
    maxSupplierCostAbsolute,
    supplierServiceId,
    supplierPosition,
    supplierRate,
  } = params;

  // 1. Calculate actual supplier cost
  const supplierCalculatedCost = calculateSupplierCost(quantity, supplierRate);

  // 2. Calculate gross profit and margin
  const grossProfit = calculateGrossProfit(sellingPrice, supplierCalculatedCost);
  const grossMarginPercent = calculateGrossMarginPercent(sellingPrice, supplierCalculatedCost);

  // 3. Compute cost ceiling limits
  const ceiling = calculateCostCeiling({
    sellingPrice,
    minimumGrossMarginPercent,
    minimumGrossProfit,
    maxSupplierCostAbsolute,
  });

  const allowedSupplierCost = ceiling.allowedSupplierCost;

  let decision: SupplierRoutingDecision = 'ACCEPTED';
  let nextStatus: RoutingStatus = 'CHECKING_SUPPLIER';
  let allowed = true;
  let reason = `Supplier cost $${supplierCalculatedCost.toFixed(4)} is within allowed ceiling $${allowedSupplierCost.toFixed(4)}.`;

  if (manualReviewEnabled) {
    decision = 'MANUAL_REVIEW';
    nextStatus = 'MANUAL_REVIEW';
    allowed = false;
    reason = `Manual review is enabled for this package. Required admin sign-off.`;
  } else if (costCeilingEnabled && supplierCalculatedCost > allowedSupplierCost) {
    decision = 'HOLD_COST';
    nextStatus = 'HOLD_SUPPLIER_COST';
    allowed = false;
    reason = `Supplier cost ($${supplierCalculatedCost.toFixed(4)}) exceeds allowed ceiling ($${allowedSupplierCost.toFixed(4)}). Min margin: ${minimumGrossMarginPercent}%, Min profit: $${minimumGrossProfit.toFixed(2)}.`;
  }

  const attemptRecord: SupplierAttemptRecord = {
    orderId,
    supplierServiceId,
    supplierPosition,
    supplierRate,
    supplierCalculatedCost,
    sellingPrice,
    grossProfit,
    grossMarginPercent,
    allowedSupplierCost,
    decision,
    reason,
    createdAt: new Date().toISOString(),
  };

  return {
    allowed,
    decision,
    nextStatus,
    reason,
    attemptRecord,
  };
}

/**
 * Evaluates a sequence of suppliers (Priority -> Fallback 1 -> Fallback 2) in order.
 * Strictly respects financial ceiling and does not alter selling price.
 */
export interface SupplierCandidate {
  position: SupplierPosition;
  serviceId: string;
  rate: number;
}

export interface CascadeEvaluationResult {
  selectedSupplier: SupplierCandidate | null;
  selectedDecision: SupplierRoutingDecision;
  finalStatus: RoutingStatus;
  attempts: SupplierAttemptRecord[];
  reason: string;
}

export function evaluateSupplierCascade(
  orderParams: {
    orderId: string;
    platform: string;
    serviceType: string;
    quantity: number;
    sellingPrice: number;
    costCeilingEnabled: boolean;
    manualReviewEnabled: boolean;
    minimumGrossMarginPercent: number;
    minimumGrossProfit: number;
    maxSupplierCostAbsolute?: number | null;
  },
  candidates: SupplierCandidate[]
): CascadeEvaluationResult {
  const attempts: SupplierAttemptRecord[] = [];

  if (candidates.length === 0) {
    return {
      selectedSupplier: null,
      selectedDecision: 'REJECTED',
      finalStatus: 'HOLD_NO_SUPPLIER',
      attempts: [],
      reason: 'No supplier candidates configured or available.',
    };
  }

  if (orderParams.manualReviewEnabled) {
    const first = candidates[0];
    const evalRes = evaluateSupplierOption({
      ...orderParams,
      supplierServiceId: first.serviceId,
      supplierPosition: first.position,
      supplierRate: first.rate,
    });
    attempts.push(evalRes.attemptRecord);

    return {
      selectedSupplier: null,
      selectedDecision: 'MANUAL_REVIEW',
      finalStatus: 'MANUAL_REVIEW',
      attempts,
      reason: 'Manual review required before routing to supplier.',
    };
  }

  let lastDecision: SupplierRoutingDecision = 'REJECTED';
  let lastStatus: RoutingStatus = 'HOLD_NO_SUPPLIER';

  for (const candidate of candidates) {
    const evalRes = evaluateSupplierOption({
      ...orderParams,
      supplierServiceId: candidate.serviceId,
      supplierPosition: candidate.position,
      supplierRate: candidate.rate,
    });

    attempts.push(evalRes.attemptRecord);

    if (evalRes.allowed) {
      return {
        selectedSupplier: candidate,
        selectedDecision: 'ACCEPTED',
        finalStatus: 'SUBMITTED', // Ready for submission (not dispatched in this phase)
        attempts,
        reason: `Selected ${candidate.position} supplier (${candidate.serviceId}) - satisfies all financial ceiling criteria.`,
      };
    }

    lastDecision = evalRes.decision;
    lastStatus = evalRes.nextStatus;
  }

  // If all failed cost ceiling
  const allCostBlocked = attempts.every((a) => a.decision === 'HOLD_COST');

  return {
    selectedSupplier: null,
    selectedDecision: allCostBlocked ? 'HOLD_COST' : lastDecision,
    finalStatus: allCostBlocked ? 'HOLD_SUPPLIER_COST' : lastStatus,
    attempts,
    reason: allCostBlocked
      ? 'All supplier options exceeded the cost ceiling protection limit.'
      : 'No supplier candidate was accepted.',
  };
}
