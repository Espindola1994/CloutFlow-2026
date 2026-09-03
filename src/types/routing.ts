/**
 * CloutFlow Supplier Routing & Cost Ceiling Types
 */

export type RoutingStatus =
  | 'PENDING'
  | 'CHECKING_SUPPLIER'
  | 'SUBMITTED'
  | 'HOLD_SUPPLIER_COST'
  | 'HOLD_NO_SUPPLIER'
  | 'MANUAL_REVIEW'
  | 'FAILED';

export type SupplierPosition = 'priority' | 'fallback1' | 'fallback2';

export type SupplierRoutingDecision = 'ACCEPTED' | 'REJECTED' | 'MANUAL_REVIEW' | 'HOLD_COST';

/**
 * Product/Package configuration interface with routing & financial ceiling parameters.
 */
export interface ProductPackageConfig {
  platform: string;
  serviceType: string;
  packageName: string;
  quantity: number;
  sellingPrice: number; // in USD dollars (e.g. 19.99)
  priorityServiceId: string;
  fallback1ServiceId?: string | null;
  fallback2ServiceId?: string | null;

  // Financial Rules
  minimumGrossMarginPercent: number; // e.g. 40 for 40%
  minimumGrossProfit: number; // in USD dollars (e.g. 5.00)
  maxSupplierCostAbsolute?: number | null; // in USD dollars (e.g. 8.00)
  costCeilingEnabled: boolean;
  manualReviewEnabled: boolean;
}

/**
 * Historical record of a supplier attempt evaluation.
 */
export interface SupplierAttemptRecord {
  id?: string;
  orderId: string;
  supplierServiceId: string;
  supplierPosition: SupplierPosition;
  supplierRate: number; // Provider rate per 1000 units (e.g. 0.80)
  supplierCalculatedCost: number; // (quantity / 1000) * rate in USD dollars
  sellingPrice: number; // Card selling price in USD dollars (never auto-altered)
  grossProfit: number; // sellingPrice - supplierCalculatedCost in USD dollars
  grossMarginPercent: number; // ((sellingPrice - supplierCalculatedCost) / sellingPrice) * 100
  allowedSupplierCost: number; // Max allowed cost in USD dollars calculated by cost ceiling
  decision: SupplierRoutingDecision;
  reason: string;
  createdAt: Date | string;
}

/**
 * Input parameters for financial ceiling computation.
 */
export interface CostCeilingCalculationParams {
  sellingPrice: number;
  minimumGrossMarginPercent: number;
  minimumGrossProfit: number;
  maxSupplierCostAbsolute?: number | null;
}

/**
 * Result of the pure financial ceiling calculation.
 */
export interface CostCeilingCalculationResult {
  maximumCostByMargin: number;
  maximumCostByProfit: number;
  maxSupplierCostAbsolute: number | null;
  allowedSupplierCost: number;
}

/**
 * Input parameters for evaluating a specific supplier against financial rules.
 */
export interface EvaluateSupplierParams {
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
  supplierServiceId: string;
  supplierPosition: SupplierPosition;
  supplierRate: number; // Rate per 1000 units
}

/**
 * Evaluation outcome for a single supplier attempt.
 */
export interface EvaluateSupplierResult {
  allowed: boolean;
  decision: SupplierRoutingDecision;
  nextStatus: RoutingStatus;
  reason: string;
  attemptRecord: SupplierAttemptRecord;
}
