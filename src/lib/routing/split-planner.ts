import {
  calculateCostCeiling,
  calculateGrossMarginPercent,
  calculateGrossProfit,
  calculateSupplierCost,
} from '@/lib/routing/financial-routing';
import {
  CostCeilingCalculationParams,
  CostCeilingCalculationResult,
} from '@/types/routing';

export interface SplitChunkPlan {
  chunkIndex: number;
  quantity: number;
  supplierServiceId: string;
  rate: number;
  estimatedCost: number;
}

export interface SplitOrderPlan {
  isSplit: boolean;
  platform: string;
  service: string;
  totalQuantity: number;
  sellingPrice: number;
  supplierServiceId: string;
  rate: number;
  chunks: SplitChunkPlan[];
  chunkCount: number;
  chunkSize: number;
  estimatedTotalCost: number;
  allowedSupplierCost: number;
  grossProfit: number;
  grossMarginPercent: number;
  isFinanciallySafe: boolean;
  isQuantityCompatible: boolean;
  failureReason?: string;
  executionMode: 'sequential' | 'parallel';
}

export interface SplitPlannerParams {
  platform: string;
  service: string;
  totalQuantity: number;
  sellingPrice: number;
  supplierServiceId: string;
  supplierRate: number;
  supplierMaxQuantity?: number;
  supplierMinQuantity?: number;
  minimumGrossMarginPercent: number;
  minimumGrossProfit: number;
  maxSupplierCostAbsolute?: number | null;
  costCeilingEnabled?: boolean;
  executionMode?: 'sequential' | 'parallel';
}

/**
 * Pure evaluation & planner for Split Orders.
 * Rules:
 * - Applicable specifically when totalQuantity > supplierMaxQuantity (e.g. X / Twitter Likes where 33478 max is 5,000).
 * - Only applied for Twitter/X Likes (or configured split-eligible services).
 * - Never generates a chunk > supplierMaxQuantity.
 * - If residual quantity exists, last chunk must also respect supplierMinQuantity.
 * - Total cost is calculated as the sum of all chunks.
 * - Cost Ceiling evaluates the TOTAL SPLIT COST before approval.
 */
export function planSplitOrder(params: SplitPlannerParams): SplitOrderPlan {
  const {
    platform,
    service,
    totalQuantity,
    sellingPrice,
    supplierServiceId,
    supplierRate,
    supplierMaxQuantity = 5000,
    supplierMinQuantity = 50,
    minimumGrossMarginPercent,
    minimumGrossProfit,
    maxSupplierCostAbsolute,
    costCeilingEnabled = true,
    executionMode = 'sequential',
  } = params;

  const normalizedPlatform = platform.toLowerCase().trim();
  const normalizedService = service.toLowerCase().trim();
  const isXTwitterLikes = (normalizedPlatform === 'twitter' || normalizedPlatform === 'x') && normalizedService === 'likes';

  // If quantity <= supplierMaxQuantity, it's a standard single chunk (not a split)
  if (totalQuantity <= supplierMaxQuantity) {
    const calculatedCost = calculateSupplierCost(totalQuantity, supplierRate);
    const ceiling = calculateCostCeiling({
      sellingPrice,
      minimumGrossMarginPercent,
      minimumGrossProfit,
      maxSupplierCostAbsolute,
    });

    const grossProfit = calculateGrossProfit(sellingPrice, calculatedCost);
    const grossMarginPercent = calculateGrossMarginPercent(sellingPrice, calculatedCost);
    const isSafe = !costCeilingEnabled || calculatedCost <= ceiling.allowedSupplierCost;
    const isQtyOk = totalQuantity >= supplierMinQuantity && totalQuantity <= supplierMaxQuantity;

    const singleChunk: SplitChunkPlan = {
      chunkIndex: 0,
      quantity: totalQuantity,
      supplierServiceId,
      rate: supplierRate,
      estimatedCost: calculatedCost,
    };

    return {
      isSplit: false,
      platform: normalizedPlatform,
      service: normalizedService,
      totalQuantity,
      sellingPrice,
      supplierServiceId,
      rate: supplierRate,
      chunks: [singleChunk],
      chunkCount: 1,
      chunkSize: totalQuantity,
      estimatedTotalCost: calculatedCost,
      allowedSupplierCost: ceiling.allowedSupplierCost,
      grossProfit,
      grossMarginPercent,
      isFinanciallySafe: isSafe,
      isQuantityCompatible: isQtyOk,
      failureReason: !isQtyOk
        ? `Quantity ${totalQuantity} out of supplier bounds [${supplierMinQuantity}, ${supplierMaxQuantity}].`
        : !isSafe
        ? `Estimated cost $${calculatedCost.toFixed(2)} exceeds allowed ceiling $${ceiling.allowedSupplierCost.toFixed(2)}.`
        : undefined,
      executionMode,
    };
  }

  // If NOT X Likes and quantity > max, split is currently restricted only to X Likes
  if (!isXTwitterLikes) {
    const ceiling = calculateCostCeiling({
      sellingPrice,
      minimumGrossMarginPercent,
      minimumGrossProfit,
      maxSupplierCostAbsolute,
    });
    return {
      isSplit: false,
      platform: normalizedPlatform,
      service: normalizedService,
      totalQuantity,
      sellingPrice,
      supplierServiceId,
      rate: supplierRate,
      chunks: [],
      chunkCount: 0,
      chunkSize: 0,
      estimatedTotalCost: 0,
      allowedSupplierCost: ceiling.allowedSupplierCost,
      grossProfit: 0,
      grossMarginPercent: 0,
      isFinanciallySafe: false,
      isQuantityCompatible: false,
      failureReason: `Split routing is not enabled for ${platform} ${service}. Maximum individual capacity is ${supplierMaxQuantity}.`,
      executionMode,
    };
  }

  // Calculate chunks for X Likes
  const chunks: SplitChunkPlan[] = [];
  let remainingQuantity = totalQuantity;
  let chunkIndex = 0;

  while (remainingQuantity > 0) {
    const currentChunkSize = Math.min(remainingQuantity, supplierMaxQuantity);

    // If residual chunk is smaller than minQuantity
    if (currentChunkSize < supplierMinQuantity && remainingQuantity === currentChunkSize) {
      // Rebalance with previous chunk if exists
      if (chunks.length > 0) {
        const prev = chunks[chunks.length - 1];
        const deficit = supplierMinQuantity - currentChunkSize;
        if (prev.quantity - deficit >= supplierMinQuantity) {
          prev.quantity -= deficit;
          prev.estimatedCost = calculateSupplierCost(prev.quantity, supplierRate);
          const adjustedChunkSize = currentChunkSize + deficit;
          chunks.push({
            chunkIndex,
            quantity: adjustedChunkSize,
            supplierServiceId,
            rate: supplierRate,
            estimatedCost: calculateSupplierCost(adjustedChunkSize, supplierRate),
          });
          remainingQuantity = 0;
          break;
        }
      }
    }

    const chunkCost = calculateSupplierCost(currentChunkSize, supplierRate);
    chunks.push({
      chunkIndex,
      quantity: currentChunkSize,
      supplierServiceId,
      rate: supplierRate,
      estimatedCost: chunkCost,
    });

    remainingQuantity -= currentChunkSize;
    chunkIndex++;
  }

  // Sum total estimated cost across all chunks
  const estimatedTotalCost = Number(
    chunks.reduce((sum, c) => sum + c.estimatedCost, 0).toFixed(4)
  );

  // Compute Cost Ceiling for the WHOLE PARENT ORDER
  const ceiling = calculateCostCeiling({
    sellingPrice,
    minimumGrossMarginPercent,
    minimumGrossProfit,
    maxSupplierCostAbsolute,
  });

  const grossProfit = calculateGrossProfit(sellingPrice, estimatedTotalCost);
  const grossMarginPercent = calculateGrossMarginPercent(sellingPrice, estimatedTotalCost);

  // Financial safety validation
  const isFinanciallySafe =
    !costCeilingEnabled ||
    (estimatedTotalCost <= ceiling.allowedSupplierCost &&
      grossMarginPercent >= minimumGrossMarginPercent &&
      grossProfit >= minimumGrossProfit);

  // Check that all chunks respect supplier bounds
  const isQuantityCompatible = chunks.every(
    (c) => c.quantity >= supplierMinQuantity && c.quantity <= supplierMaxQuantity
  );

  let failureReason: string | undefined = undefined;
  if (!isQuantityCompatible) {
    failureReason = `One or more chunks do not satisfy supplier bounds [${supplierMinQuantity}, ${supplierMaxQuantity}].`;
  } else if (!isFinanciallySafe) {
    failureReason = `Total split cost $${estimatedTotalCost.toFixed(2)} exceeds allowed ceiling $${ceiling.allowedSupplierCost.toFixed(2)} (Min Margin: ${minimumGrossMarginPercent}%, Min Profit: $${minimumGrossProfit.toFixed(2)}).`;
  }

  const primaryChunkSize = chunks.length > 0 ? chunks[0].quantity : 0;

  return {
    isSplit: true,
    platform: normalizedPlatform,
    service: normalizedService,
    totalQuantity,
    sellingPrice,
    supplierServiceId,
    rate: supplierRate,
    chunks,
    chunkCount: chunks.length,
    chunkSize: primaryChunkSize,
    estimatedTotalCost,
    allowedSupplierCost: ceiling.allowedSupplierCost,
    grossProfit,
    grossMarginPercent,
    isFinanciallySafe,
    isQuantityCompatible,
    failureReason,
    executionMode,
  };
}
