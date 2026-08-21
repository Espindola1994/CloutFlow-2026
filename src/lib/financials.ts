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
}

/**
 * Calculates the gateway fee in integer cents for an order.
 * Uses authoritative gateway fee if provided, otherwise costConfig settings or fallback (8.9% + $1.00).
 */
export function calculateGatewayFeeCents(
  grossAmountCents: number,
  config?: CostConfigItem | null,
  authoritativeFeeCents?: number | null
): { feeCents: number; isAuthoritative: boolean } {
  if (authoritativeFeeCents !== undefined && authoritativeFeeCents !== null && authoritativeFeeCents >= 0) {
    return { feeCents: authoritativeFeeCents, isAuthoritative: true };
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
 * Calculates provider fulfillment cost in integer cents.
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
    const providerCost = calculateProviderCostCents(quantity, config);

    if (paymentStatus === 'PAID' || paymentStatus === 'COMPLETED' || paymentStatus === 'APPROVED') {
      paidOrdersCount++;
      grossSalesCents += amountCents;
      netRevenueCents += amountCents;
      perfectPayFeesCents += feeCents;
      providerCostsCents += providerCost;
      netProfitCents += (amountCents - feeCents - providerCost);
    } else if (paymentStatus === 'REFUNDED') {
      refundedOrdersCount++;
      grossSalesCents += amountCents;
      refundsCents += amountCents;
      // validRevenue = $0.00 for refunded sales
      // Gateway fee & provider cost remain costs
      perfectPayFeesCents += feeCents;
      // Only retain provider cost if fulfillment took place or started
      const wasFulfillmentAttempted = fulfillmentStatus !== 'NOT_DISPATCHED' && fulfillmentStatus !== 'CANCELED';
      const incurredProviderCost = wasFulfillmentAttempted ? providerCost : 0;
      providerCostsCents += incurredProviderCost;
      netProfitCents -= (feeCents + incurredProviderCost);
    } else if (paymentStatus === 'CHARGEBACK' || paymentStatus === 'CHARGED_BACK') {
      chargebackOrdersCount++;
      grossSalesCents += amountCents;
      chargebacksCents += amountCents;
      perfectPayFeesCents += feeCents;
      const wasFulfillmentAttempted = fulfillmentStatus !== 'NOT_DISPATCHED' && fulfillmentStatus !== 'CANCELED';
      const incurredProviderCost = wasFulfillmentAttempted ? providerCost : 0;
      providerCostsCents += incurredProviderCost;
      netProfitCents -= (feeCents + incurredProviderCost);
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
