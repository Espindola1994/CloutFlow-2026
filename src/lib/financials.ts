/**
 * CloutFlow Canonical USD Financial Calculations & Rules Engine
 * 
 * Rules:
 * 1. Canonical Currency: USD only ($0.00).
 * 2. Integer cents precision used throughout to avoid floating-point errors.
 * 3. PerfectPay Standard Commercial Fee Fallback: 8.9% + $1.00 USD (100 cents).
 * 4. Refund / Chargeback Policy:
 *    - validRevenue = $0.00 (0 cents)
 *    - refundAmount = original transaction amount
 *    - Gateway fee remains a financial cost unless explicitly reversed
 *    - Provider cost remains a financial cost if fulfillment occurred (dispatched/completed/processing)
 *    - Net Profit for refunded order = 0 - gatewayFee - providerCost
 */

export const PERFECTPAY_PERCENT_FEE = 0.089; // 8.9%
export const PERFECTPAY_FIXED_FEE_CENTS = 100; // $1.00 USD

export type ProviderCostSource = 
  | 'ACTUAL_PROVIDER_CHARGE' 
  | 'CHAIN_RATE_SNAPSHOT' 
  | 'ADMIN_COST_ESTIMATE' 
  | 'UNKNOWN';

export interface OrderFinancialRecord {
  id: string;
  totalCents: number;
  currency: string;
  paymentStatus: string;
  fulfillmentStatus?: string | null;
  platform?: string | null;
  service?: string | null;
  quantity?: number | null;
  // Optional authoritative PerfectPay fee overrides
  authoritativeGatewayFeeCents?: number | null;
  // Immutable provider cost snapshot
  immutableProviderCostCents?: number | null;
  providerCostSource?: ProviderCostSource | string | null;
}

export interface CostConfigItem {
  platform: string;
  service: string;
  pricingModel: string; // per_1000, per_unit, fixed
  costValueCents: number;
  gatewayPercentFee?: string | number;
  gatewayFixedFeeCents?: number;
}

export interface FinancialBreakdown {
  grossSalesCents: number;
  refundsCents: number;
  chargebacksCents: number;
  netRevenueCents: number;
  perfectPayFeesCents: number;
  providerCostsCents: number;
  netProfitCents: number;
  netMarginPercent: string;
  aovCents: number;
  refundRatePercent: string;
  chargebackRatePercent: string;
  paidOrdersCount: number;
  refundedOrdersCount: number;
  chargebackOrdersCount: number;
  totalOrdersCount: number;
  unknownCostOrdersCount: number;
}

export interface OrderCostResolution {
  providerCostCents: number | null;
  providerCostSource: ProviderCostSource | null;
  providerTier: string | null;
  providerRateSnapshot: string | null;
  chargedAttemptsCount: number;
}

export interface FulfillmentOrderRecord {
  id: string;
  orderId: string;
  status: string;
  externalOrderId?: string | null;
  externalServiceId?: string | null;
  providerTier?: string | null;
  providerCostCents?: number | null;
  providerCostSource?: string | null;
  providerRateSnapshot?: string | null;
  responsePayload?: unknown;
  createdAt?: Date | string | null;
}

/**
 * Returns rank hierarchy for provider cost sources:
 * ACTUAL_PROVIDER_CHARGE (3) > CHAIN_RATE_SNAPSHOT (2) > ADMIN_COST_ESTIMATE (1) > UNKNOWN (0)
 */
export function getCostSourceRank(source?: string | null): number {
  switch (source) {
    case 'ACTUAL_PROVIDER_CHARGE':
      return 3;
    case 'CHAIN_RATE_SNAPSHOT':
      return 2;
    case 'ADMIN_COST_ESTIMATE':
      return 1;
    default:
      return 0;
  }
}

/**
 * Checks if a new cost source is allowed to upgrade an existing cost source.
 * Higher hierarchy source can upgrade lower hierarchy source once.
 * Never downgrade. Never overwrite ACTUAL_PROVIDER_CHARGE with an estimate.
 */
export function canUpgradeProviderCost(
  currentSource: string | null | undefined,
  newSource: ProviderCostSource
): boolean {
  const currentRank = getCostSourceRank(currentSource);
  const newRank = getCostSourceRank(newSource);
  return newRank > currentRank;
}

/**
 * Computes the immutable provider cost snapshot for an executed service.
 * Priority:
 * 1. ACTUAL_PROVIDER_CHARGE (authoritative charge returned by Peakerr)
 * 2. CHAIN_RATE_SNAPSHOT (rate of the service ID actually used at dispatch * quantity / 1000)
 * 3. ADMIN_COST_ESTIMATE (fallback to admin cost config)
 * 4. UNKNOWN
 */
export function calculateExecutedServiceCost(params: {
  actualCharge?: string | number | null;
  serviceRate?: string | number | null;
  quantity: number;
  adminConfig?: CostConfigItem | null;
  tier?: string | null;
}): {
  providerCostCents: number | null;
  providerCostSource: ProviderCostSource;
  providerRateSnapshot: string | null;
  providerTier: string | null;
} {
  const { actualCharge, serviceRate, quantity, adminConfig, tier } = params;

  // 1. Priority 1: ACTUAL_PROVIDER_CHARGE
  if (actualCharge !== undefined && actualCharge !== null && String(actualCharge).trim() !== '') {
    const chargeNum = Number(actualCharge);
    if (!isNaN(chargeNum) && chargeNum >= 0) {
      return {
        providerCostCents: Math.round(chargeNum * 100),
        providerCostSource: 'ACTUAL_PROVIDER_CHARGE',
        providerRateSnapshot: serviceRate !== undefined && serviceRate !== null ? String(serviceRate) : null,
        providerTier: tier || null,
      };
    }
  }

  // 2. Priority 2: CHAIN_RATE_SNAPSHOT (rate per 1000 in USD)
  if (serviceRate !== undefined && serviceRate !== null && String(serviceRate).trim() !== '') {
    const rateNum = Number(serviceRate);
    if (!isNaN(rateNum) && rateNum >= 0) {
      const costInDollars = (rateNum * quantity) / 1000;
      return {
        providerCostCents: Math.round(costInDollars * 100),
        providerCostSource: 'CHAIN_RATE_SNAPSHOT',
        providerRateSnapshot: String(serviceRate),
        providerTier: tier || null,
      };
    }
  }

  // 3. Priority 3: ADMIN_COST_ESTIMATE
  if (adminConfig && adminConfig.costValueCents !== undefined && adminConfig.costValueCents !== null) {
    const costCents = calculateProviderCostCents(quantity, adminConfig);
    return {
      providerCostCents: costCents,
      providerCostSource: 'ADMIN_COST_ESTIMATE',
      providerRateSnapshot: null,
      providerTier: tier || null,
    };
  }

  // 4. Priority 4: UNKNOWN
  return {
    providerCostCents: null,
    providerCostSource: 'UNKNOWN',
    providerRateSnapshot: null,
    providerTier: tier || null,
  };
}

/**
 * Resolves the immutable net provider cost for an order from its fulfillment history.
 * Aggregates all charged provider attempts while ignoring uncharged pre-creation failures ($0).
 */
export function resolveOrderFulfillmentCost(
  order: {
    id: string;
    quantity: number;
    platform?: string | null;
    service?: string | null;
    fulfillmentStatus?: string | null;
  },
  fulfillments: FulfillmentOrderRecord[] = [],
  costConfigs: CostConfigItem[] = []
): OrderCostResolution {
  const orderFulfillments = fulfillments.filter((f) => f.orderId === order.id);

  if (orderFulfillments.length === 0) {
    // No fulfillment attempts recorded
    const isDispatched = order.fulfillmentStatus && order.fulfillmentStatus !== 'NOT_DISPATCHED' && order.fulfillmentStatus !== 'CANCELED';
    if (!isDispatched) {
      return {
        providerCostCents: 0,
        providerCostSource: null,
        providerTier: null,
        providerRateSnapshot: null,
        chargedAttemptsCount: 0,
      };
    }

    // Dispatched status without fulfillment order record -> ADMIN_COST_ESTIMATE fallback
    const config = costConfigs.find(
      (c) => c.platform.toLowerCase() === (order.platform || '').toLowerCase() &&
             c.service.toLowerCase() === (order.service || '').toLowerCase()
    );
    if (config) {
      return {
        providerCostCents: calculateProviderCostCents(order.quantity, config),
        providerCostSource: 'ADMIN_COST_ESTIMATE',
        providerTier: 'primary',
        providerRateSnapshot: null,
        chargedAttemptsCount: 0,
      };
    }

    return {
      providerCostCents: null,
      providerCostSource: 'UNKNOWN',
      providerTier: null,
      providerRateSnapshot: null,
      chargedAttemptsCount: 0,
    };
  }

  // Find all attempts that were created at provider or charged
  // Rule: Failed before creation with no external order ID and no charge = $0 cost
  let totalCostCents = 0;
  let hasAnyCostSnapshot = false;
  let highestSource: ProviderCostSource = 'UNKNOWN';
  let primaryTier: string | null = null;
  let primaryRateSnapshot: string | null = null;
  let chargedAttemptsCount = 0;

  for (const f of orderFulfillments) {
    const hasExternalOrder = Boolean(f.externalOrderId && f.externalOrderId.trim().length > 0);
    const hasExplicitCost = f.providerCostCents !== undefined && f.providerCostCents !== null;

    // Check if responsePayload contains a charge
    let payloadChargeNum: number | null = null;
    if (f.responsePayload && typeof f.responsePayload === 'object') {
      const payloadObj = f.responsePayload as Record<string, unknown>;
      if (payloadObj.charge !== undefined && payloadObj.charge !== null) {
        const parsed = Number(payloadObj.charge);
        if (!isNaN(parsed) && parsed >= 0) {
          payloadChargeNum = parsed;
        }
      }
    }

    const wasChargedOrCreated = hasExternalOrder || hasExplicitCost || payloadChargeNum !== null || f.status === 'PROCESSING' || f.status === 'COMPLETED' || f.status === 'PARTIAL';

    if (!wasChargedOrCreated) {
      // Failed before creation -> no cost incurred for this attempt
      continue;
    }

    chargedAttemptsCount++;

    // Determine cost for this attempt
    let attemptCostCents: number | null = null;
    let attemptSource: ProviderCostSource = 'UNKNOWN';

    if (hasExplicitCost) {
      attemptCostCents = f.providerCostCents!;
      attemptSource = (f.providerCostSource as ProviderCostSource) || 'CHAIN_RATE_SNAPSHOT';
    } else if (payloadChargeNum !== null) {
      attemptCostCents = Math.round(payloadChargeNum * 100);
      attemptSource = 'ACTUAL_PROVIDER_CHARGE';
    } else if (f.providerRateSnapshot) {
      const rateNum = Number(f.providerRateSnapshot);
      if (!isNaN(rateNum) && rateNum >= 0) {
        attemptCostCents = Math.round(((rateNum * order.quantity) / 1000) * 100);
        attemptSource = 'CHAIN_RATE_SNAPSHOT';
      }
    }

    if (attemptCostCents === null) {
      // Fallback to admin cost config if available
      const config = costConfigs.find(
        (c) => c.platform.toLowerCase() === (order.platform || '').toLowerCase() &&
               c.service.toLowerCase() === (order.service || '').toLowerCase()
      );
      if (config) {
        attemptCostCents = calculateProviderCostCents(order.quantity, config);
        attemptSource = 'ADMIN_COST_ESTIMATE';
      }
    }

    if (attemptCostCents !== null) {
      totalCostCents += attemptCostCents;
      hasAnyCostSnapshot = true;
      if (getCostSourceRank(attemptSource) > getCostSourceRank(highestSource)) {
        highestSource = attemptSource;
      }
    }

    if (!primaryTier && f.providerTier) {
      primaryTier = f.providerTier;
    }
    if (!primaryRateSnapshot && f.providerRateSnapshot) {
      primaryRateSnapshot = f.providerRateSnapshot;
    }
  }

  if (chargedAttemptsCount === 0) {
    return {
      providerCostCents: 0,
      providerCostSource: null,
      providerTier: primaryTier,
      providerRateSnapshot: primaryRateSnapshot,
      chargedAttemptsCount: 0,
    };
  }

  return {
    providerCostCents: hasAnyCostSnapshot ? totalCostCents : null,
    providerCostSource: hasAnyCostSnapshot ? highestSource : 'UNKNOWN',
    providerTier: primaryTier,
    providerRateSnapshot: primaryRateSnapshot,
    chargedAttemptsCount,
  };
}

/**
 * Calculates the gateway fee in integer cents for an order.
 * Uses authoritative gateway fee if provided, otherwise costConfig settings or fallback (8.9% + $1.00).
 * For $0 orders, gateway fee is $0 unless explicitly provided.
 */
export function calculateGatewayFeeCents(
  grossAmountCents: number,
  config?: CostConfigItem | null,
  authoritativeFeeCents?: number | null
): { feeCents: number; isAuthoritative: boolean } {
  if (authoritativeFeeCents !== undefined && authoritativeFeeCents !== null && authoritativeFeeCents >= 0) {
    return { feeCents: authoritativeFeeCents, isAuthoritative: true };
  }

  // If order amount is 0, no gateway fee is incurred
  if (grossAmountCents === 0) {
    return { feeCents: 0, isAuthoritative: false };
  }

  if (config) {
    const percent = config.gatewayPercentFee !== undefined ? Number(config.gatewayPercentFee) / 100 : PERFECTPAY_PERCENT_FEE;
    const fixedCents = config.gatewayFixedFeeCents !== undefined ? Number(config.gatewayFixedFeeCents) : PERFECTPAY_FIXED_FEE_CENTS;
    return {
      feeCents: Math.round(grossAmountCents * percent + fixedCents),
      isAuthoritative: false,
    };
  }

  // CloutFlow standard fallback: (grossAmount * 0.089) + 1.00 USD (100 cents)
  return {
    feeCents: Math.round(grossAmountCents * PERFECTPAY_PERCENT_FEE + PERFECTPAY_FIXED_FEE_CENTS),
    isAuthoritative: false,
  };
}

/**
 * Calculates provider fulfillment cost in integer cents from admin config.
 */
export function calculateProviderCostCents(
  quantity: number,
  config?: CostConfigItem | null
): number {
  if (!config || !config.costValueCents) return 0;
  if (config.pricingModel === 'per_1000') {
    return Math.round((quantity / 1000) * Number(config.costValueCents));
  } else if (config.pricingModel === 'per_unit') {
    return Math.round(quantity * Number(config.costValueCents));
  }
  return Number(config.costValueCents);
}

/**
 * Computes complete financial metrics across a list of orders according to CloutFlow USD-only specifications.
 * Consolidates Payment Economics (Gross, Net Revenue, Refunds, PerfectPay Fees)
 * and Fulfillment Economics (Immutable Provider Cost Snapshots per executed service) separately.
 */
export function calculateFinancialTotals(
  orderList: OrderFinancialRecord[],
  costConfigs: CostConfigItem[] = []
): FinancialBreakdown {
  let grossSalesCents = 0;
  let refundsCents = 0;
  let chargebacksCents = 0;
  let netRevenueCents = 0;
  let perfectPayFeesCents = 0;
  let providerCostsCents = 0;
  let netProfitCents = 0;

  let paidOrdersCount = 0;
  let refundedOrdersCount = 0;
  let chargebackOrdersCount = 0;
  let unknownCostOrdersCount = 0;
  const totalOrdersCount = orderList.length;

  for (const order of orderList) {
    const amountCents = Number(order.totalCents) || 0;
    const paymentStatus = (order.paymentStatus || '').toUpperCase();
    const fulfillmentStatus = (order.fulfillmentStatus || 'NOT_DISPATCHED').toUpperCase();
    const platform = (order.platform || 'instagram').toLowerCase();
    const service = (order.service || 'followers').toLowerCase();
    const quantity = Number(order.quantity) || 0;

    const config = costConfigs.find(
      (c) => c.platform.toLowerCase() === platform && c.service.toLowerCase() === service
    ) || null;

    const { feeCents } = calculateGatewayFeeCents(amountCents, config, order.authoritativeGatewayFeeCents);

    // Determine Provider Cost:
    // Priority: Persisted Immutable Snapshot > Admin Cost Config > 0
    let providerCost = 0;
    let hasSnapshot = false;

    if (order.immutableProviderCostCents !== undefined && order.immutableProviderCostCents !== null) {
      providerCost = order.immutableProviderCostCents;
      hasSnapshot = true;
    } else if (order.providerCostSource === 'UNKNOWN') {
      unknownCostOrdersCount++;
      providerCost = 0;
    } else {
      providerCost = calculateProviderCostCents(quantity, config);
    }

    if (paymentStatus === 'PAID' || paymentStatus === 'COMPLETED' || paymentStatus === 'APPROVED') {
      if (amountCents > 0) {
        paidOrdersCount++;
      }
      grossSalesCents += amountCents;
      netRevenueCents += amountCents;
      perfectPayFeesCents += feeCents;
      providerCostsCents += providerCost;
      netProfitCents += (amountCents - feeCents - providerCost);
    } else if (paymentStatus === 'REFUNDED') {
      if (amountCents > 0) {
        refundedOrdersCount++;
      }
      grossSalesCents += amountCents;
      refundsCents += amountCents;
      // validRevenue = $0.00 for refunded sales
      // Gateway fee & provider cost remain costs if fulfillment occurred
      perfectPayFeesCents += feeCents;
      const wasFulfillmentAttempted = fulfillmentStatus !== 'NOT_DISPATCHED' && fulfillmentStatus !== 'CANCELED';
      const incurredProviderCost = wasFulfillmentAttempted ? providerCost : (hasSnapshot ? providerCost : 0);
      providerCostsCents += incurredProviderCost;
      netProfitCents -= (feeCents + incurredProviderCost);
    } else if (paymentStatus === 'CHARGEBACK' || paymentStatus === 'CHARGED_BACK') {
      if (amountCents > 0) {
        chargebackOrdersCount++;
      }
      grossSalesCents += amountCents;
      chargebacksCents += amountCents;
      perfectPayFeesCents += feeCents;
      const wasFulfillmentAttempted = fulfillmentStatus !== 'NOT_DISPATCHED' && fulfillmentStatus !== 'CANCELED';
      const incurredProviderCost = wasFulfillmentAttempted ? providerCost : (hasSnapshot ? providerCost : 0);
      providerCostsCents += incurredProviderCost;
      netProfitCents -= (feeCents + incurredProviderCost);
    } else {
      // Unpaid or other orders (e.g. $0 or free orders with paymentStatus like NOT_PAID or PENDING)
      // If fulfillment actually occurred, capture provider cost and subtract from profit
      const wasFulfillmentAttempted = fulfillmentStatus !== 'NOT_DISPATCHED' && fulfillmentStatus !== 'CANCELED';
      if (wasFulfillmentAttempted && hasSnapshot) {
        providerCostsCents += providerCost;
        netProfitCents -= (feeCents + providerCost);
      }
    }
  }

  const effectiveSalesCount = paidOrdersCount + refundedOrdersCount + chargebackOrdersCount;
  const aovCents = paidOrdersCount > 0 ? Math.round(netRevenueCents / paidOrdersCount) : 0;
  const netMarginPercent = netRevenueCents > 0
    ? ((netProfitCents / netRevenueCents) * 100).toFixed(1)
    : '0.0';
  const refundRatePercent = effectiveSalesCount > 0
    ? ((refundedOrdersCount / effectiveSalesCount) * 100).toFixed(1)
    : '0.0';
  const chargebackRatePercent = effectiveSalesCount > 0
    ? ((chargebackOrdersCount / effectiveSalesCount) * 100).toFixed(1)
    : '0.0';

  return {
    grossSalesCents,
    refundsCents,
    chargebacksCents,
    netRevenueCents,
    perfectPayFeesCents,
    providerCostsCents,
    netProfitCents,
    netMarginPercent,
    aovCents,
    refundRatePercent,
    chargebackRatePercent,
    paidOrdersCount,
    refundedOrdersCount,
    chargebackOrdersCount,
    totalOrdersCount,
    unknownCostOrdersCount,
  };
}

/**
 * Format USD amount with standard $0.00 notation.
 */
export function formatUSD(cents: number): string {
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const dollars = (absCents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isNegative ? `-$${dollars}` : `$${dollars}`;
}
