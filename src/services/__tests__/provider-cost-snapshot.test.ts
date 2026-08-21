import { describe, it, expect } from 'vitest';
import {
  calculateExecutedServiceCost,
  canUpgradeProviderCost,
  getCostSourceRank,
  resolveOrderFulfillmentCost,
  calculateFinancialTotals,
  calculateGatewayFeeCents,
  OrderFinancialRecord,
  CostConfigItem,
  FulfillmentOrderRecord,
} from '@/lib/financials';

describe('CloutFlow Immutable Provider Cost Snapshot & Financials Engine', () => {
  // Generic synthetic service IDs used for tests to ensure no hardcoded Peakerr dependency
  const TEST_SERVICE_PRIMARY = 'SERVICE_PRIMARY_DYNAMIC';
  const TEST_SERVICE_FALLBACK_1 = 'SERVICE_FALLBACK_1_DYNAMIC';
  const TEST_SERVICE_FALLBACK_2 = 'SERVICE_FALLBACK_2_DYNAMIC';

  const costConfigs: CostConfigItem[] = [
    {
      platform: 'instagram',
      service: 'followers',
      pricingModel: 'per_1000',
      costValueCents: 50, // $0.50 per 1000 fallback estimate
      gatewayPercentFee: 8.9,
      gatewayFixedFeeCents: 100,
    },
    {
      platform: 'instagram',
      service: 'likes',
      pricingModel: 'per_1000',
      costValueCents: 20,
      gatewayPercentFee: 8.9,
      gatewayFixedFeeCents: 100,
    },
  ];

  // =========================================================================
  // TEST A: Primary service accepts => cost snapshot uses primary service ID & rate
  // =========================================================================
  it('TEST A: Primary service accepts => cost snapshot strictly uses primary service rate/cost', () => {
    // Primary rate: $0.45 per 1000, quantity: 2000 => cost = 2 * 0.45 = $0.90 (90 cents)
    const snapshot = calculateExecutedServiceCost({
      serviceRate: '0.45',
      quantity: 2000,
      tier: 'primary',
    });

    expect(snapshot.providerCostSource).toBe('CHAIN_RATE_SNAPSHOT');
    expect(snapshot.providerCostCents).toBe(90); // 90 cents ($0.90)
    expect(snapshot.providerRateSnapshot).toBe('0.45');
    expect(snapshot.providerTier).toBe('primary');

    // Test resolution for order
    const order = { id: 'ord_test_a', quantity: 2000, platform: 'instagram', service: 'followers' };
    const fulfillments: FulfillmentOrderRecord[] = [
      {
        id: 'ful_1',
        orderId: 'ord_test_a',
        status: 'PROCESSING',
        externalOrderId: '80339001',
        externalServiceId: TEST_SERVICE_PRIMARY,
        providerTier: 'primary',
        providerCostCents: snapshot.providerCostCents,
        providerCostSource: snapshot.providerCostSource,
        providerRateSnapshot: snapshot.providerRateSnapshot,
      },
    ];

    const resolution = resolveOrderFulfillmentCost(order, fulfillments, costConfigs);
    expect(resolution.providerCostCents).toBe(90);
    expect(resolution.providerCostSource).toBe('CHAIN_RATE_SNAPSHOT');
    expect(resolution.providerTier).toBe('primary');
  });

  // =========================================================================
  // TEST B: Primary fails; fallback 1 accepts => cost snapshot uses fallback 1
  // =========================================================================
  it('TEST B: Primary fails before creation; Fallback 1 accepts => cost uses Fallback 1, NOT Primary', () => {
    // Primary rate was $0.45/1k, but failed before creation (no cost)
    // Fallback 1 rate is $0.70/1k, quantity 2000 => cost = 2 * 0.70 = $1.40 (140 cents)
    const fallback1Snapshot = calculateExecutedServiceCost({
      serviceRate: '0.70',
      quantity: 2000,
      tier: 'fallback1',
    });

    expect(fallback1Snapshot.providerCostSource).toBe('CHAIN_RATE_SNAPSHOT');
    expect(fallback1Snapshot.providerCostCents).toBe(140);
    expect(fallback1Snapshot.providerRateSnapshot).toBe('0.70');
    expect(fallback1Snapshot.providerTier).toBe('fallback1');

    const order = { id: 'ord_test_b', quantity: 2000, platform: 'instagram', service: 'followers' };
    const fulfillments: FulfillmentOrderRecord[] = [
      {
        id: 'ful_attempt_1',
        orderId: 'ord_test_b',
        status: 'FAILED',
        externalOrderId: null,
        externalServiceId: TEST_SERVICE_PRIMARY,
        providerTier: 'primary',
        providerCostCents: null,
        providerCostSource: null,
      },
      {
        id: 'ful_attempt_2',
        orderId: 'ord_test_b',
        status: 'PROCESSING',
        externalOrderId: '80339002',
        externalServiceId: TEST_SERVICE_FALLBACK_1,
        providerTier: 'fallback1',
        providerCostCents: fallback1Snapshot.providerCostCents,
        providerCostSource: fallback1Snapshot.providerCostSource,
        providerRateSnapshot: fallback1Snapshot.providerRateSnapshot,
      },
    ];

    const resolution = resolveOrderFulfillmentCost(order, fulfillments, costConfigs);
    // Cost must strictly be the fallback1 cost (140 cents), never primary (90 cents)
    expect(resolution.providerCostCents).toBe(140);
    expect(resolution.providerCostSource).toBe('CHAIN_RATE_SNAPSHOT');
    expect(resolution.providerTier).toBe('fallback1');
    expect(resolution.providerRateSnapshot).toBe('0.70');
    expect(resolution.chargedAttemptsCount).toBe(1);
  });

  // =========================================================================
  // TEST C: Primary + Fallback 1 fail; Fallback 2 accepts => cost uses Fallback 2
  // =========================================================================
  it('TEST C: Primary + Fallback 1 fail; Fallback 2 accepts => cost snapshot uses Fallback 2', () => {
    // Fallback 2 rate: $0.95/1k, quantity: 1000 => cost = $0.95 (95 cents)
    const fallback2Snapshot = calculateExecutedServiceCost({
      serviceRate: '0.95',
      quantity: 1000,
      tier: 'fallback2',
    });

    const order = { id: 'ord_test_c', quantity: 1000, platform: 'instagram', service: 'followers' };
    const fulfillments: FulfillmentOrderRecord[] = [
      {
        id: 'ful_1',
        orderId: 'ord_test_c',
        status: 'FAILED',
        externalOrderId: null,
        externalServiceId: TEST_SERVICE_PRIMARY,
        providerTier: 'primary',
      },
      {
        id: 'ful_2',
        orderId: 'ord_test_c',
        status: 'FAILED',
        externalOrderId: null,
        externalServiceId: TEST_SERVICE_FALLBACK_1,
        providerTier: 'fallback1',
      },
      {
        id: 'ful_3',
        orderId: 'ord_test_c',
        status: 'PROCESSING',
        externalOrderId: '80339003',
        externalServiceId: TEST_SERVICE_FALLBACK_2,
        providerTier: 'fallback2',
        providerCostCents: fallback2Snapshot.providerCostCents,
        providerCostSource: fallback2Snapshot.providerCostSource,
        providerRateSnapshot: fallback2Snapshot.providerRateSnapshot,
      },
    ];

    const resolution = resolveOrderFulfillmentCost(order, fulfillments, costConfigs);
    expect(resolution.providerCostCents).toBe(95);
    expect(resolution.providerCostSource).toBe('CHAIN_RATE_SNAPSHOT');
    expect(resolution.providerTier).toBe('fallback2');
    expect(resolution.providerRateSnapshot).toBe('0.95');
    expect(resolution.chargedAttemptsCount).toBe(1);
  });

  // =========================================================================
  // TEST D: Rate of service changes later => historical order does NOT change
  // =========================================================================
  it('TEST D: Rate of dynamic service changes later in provider/catalog => old order snapshot does NOT change', () => {
    const historicalOrder = { id: 'ord_hist_d', quantity: 1000, platform: 'instagram', service: 'followers' };
    const historicalFulfillments: FulfillmentOrderRecord[] = [
      {
        id: 'ful_hist_d',
        orderId: 'ord_hist_d',
        status: 'COMPLETED',
        externalOrderId: '80339004',
        externalServiceId: TEST_SERVICE_FALLBACK_1,
        providerTier: 'fallback1',
        providerCostCents: 70, // Rate was $0.70/1k => 70 cents
        providerCostSource: 'CHAIN_RATE_SNAPSHOT',
        providerRateSnapshot: '0.70',
      },
    ];

    // Simulate changed cost configs (e.g. rate doubled to $1.40/1k)
    const modifiedCostConfigs: CostConfigItem[] = [
      {
        platform: 'instagram',
        service: 'followers',
        pricingModel: 'per_1000',
        costValueCents: 140, // Changed from 50 to 140
      },
    ];

    const resolution = resolveOrderFulfillmentCost(historicalOrder, historicalFulfillments, modifiedCostConfigs);
    // Historical order must remain exactly 70 cents, not 140 cents
    expect(resolution.providerCostCents).toBe(70);
    expect(resolution.providerRateSnapshot).toBe('0.70');
  });

  // =========================================================================
  // TEST E: Chain reconfigured later => historical order does NOT change
  // =========================================================================
  it('TEST E: Chain reconfigured with different service IDs and rates => old order does NOT change', () => {
    const historicalOrder = { id: 'ord_hist_e', quantity: 3000, platform: 'instagram', service: 'likes' };
    const historicalFulfillments: FulfillmentOrderRecord[] = [
      {
        id: 'ful_hist_e',
        orderId: 'ord_hist_e',
        status: 'COMPLETED',
        externalOrderId: '80339005',
        externalServiceId: 'SERVICE_PREVIOUS_OLD',
        providerTier: 'primary',
        providerCostCents: 60, // 3 * $0.20 = 60 cents
        providerCostSource: 'CHAIN_RATE_SNAPSHOT',
        providerRateSnapshot: '0.20',
      },
    ];

    // Chain is later reconfigured to use a new service ID with rate $0.80
    const reconfiguredConfigs: CostConfigItem[] = [
      {
        platform: 'instagram',
        service: 'likes',
        pricingModel: 'per_1000',
        costValueCents: 80,
      },
    ];

    const resolution = resolveOrderFulfillmentCost(historicalOrder, historicalFulfillments, reconfiguredConfigs);
    expect(resolution.providerCostCents).toBe(60);
    expect(resolution.providerCostSource).toBe('CHAIN_RATE_SNAPSHOT');
  });

  // =========================================================================
  // TEST F: Actual charge arrives after rate estimate => upgrade to ACTUAL_PROVIDER_CHARGE
  // =========================================================================
  it('TEST F: Actual charge arrives from Peakerr status => upgrades from CHAIN_RATE_SNAPSHOT to ACTUAL_PROVIDER_CHARGE', () => {
    // Current source is CHAIN_RATE_SNAPSHOT
    expect(canUpgradeProviderCost('CHAIN_RATE_SNAPSHOT', 'ACTUAL_PROVIDER_CHARGE')).toBe(true);
    expect(canUpgradeProviderCost('ADMIN_COST_ESTIMATE', 'ACTUAL_PROVIDER_CHARGE')).toBe(true);
    expect(canUpgradeProviderCost('UNKNOWN', 'ACTUAL_PROVIDER_CHARGE')).toBe(true);

    // Actual charge returned by Peakerr status check: "1.325" ($1.33 => 133 cents)
    const actualChargeFromProvider = '1.325';
    const upgradedSnapshot = calculateExecutedServiceCost({
      actualCharge: actualChargeFromProvider,
      serviceRate: '0.70',
      quantity: 2000,
      tier: 'fallback1',
    });

    expect(upgradedSnapshot.providerCostSource).toBe('ACTUAL_PROVIDER_CHARGE');
    expect(upgradedSnapshot.providerCostCents).toBe(133); // Math.round(1.325 * 100) = 133 cents
  });

  // =========================================================================
  // TEST G: Actual charge existing => never overwrite with estimate
  // =========================================================================
  it('TEST G: Actual charge existing => never overwrite with rate snapshot or admin estimate', () => {
    // Higher hierarchy cannot be upgraded by lower hierarchy
    expect(canUpgradeProviderCost('ACTUAL_PROVIDER_CHARGE', 'CHAIN_RATE_SNAPSHOT')).toBe(false);
    expect(canUpgradeProviderCost('ACTUAL_PROVIDER_CHARGE', 'ADMIN_COST_ESTIMATE')).toBe(false);
    expect(canUpgradeProviderCost('ACTUAL_PROVIDER_CHARGE', 'UNKNOWN')).toBe(false);
    expect(canUpgradeProviderCost('CHAIN_RATE_SNAPSHOT', 'ADMIN_COST_ESTIMATE')).toBe(false);

    // Rank check
    expect(getCostSourceRank('ACTUAL_PROVIDER_CHARGE')).toBe(3);
    expect(getCostSourceRank('CHAIN_RATE_SNAPSHOT')).toBe(2);
    expect(getCostSourceRank('ADMIN_COST_ESTIMATE')).toBe(1);
    expect(getCostSourceRank('UNKNOWN')).toBe(0);
  });

  // =========================================================================
  // TEST H: $0 order + real fulfillment => real provider cost => negative net profit
  // =========================================================================
  it('TEST H: $0 order + real fulfillment => Gross $0, Fee $0, Real Provider Cost, Negative Net Profit', () => {
    const zeroDollarOrder: OrderFinancialRecord = {
      id: 'ord_zero',
      totalCents: 0, // $0 order
      currency: 'USD',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'COMPLETED',
      platform: 'instagram',
      service: 'followers',
      quantity: 1000,
      immutableProviderCostCents: 75, // $0.75 real provider cost
      providerCostSource: 'CHAIN_RATE_SNAPSHOT',
    };

    const fee = calculateGatewayFeeCents(0);
    expect(fee.feeCents).toBe(0); // PerfectPay Fee is $0 for $0 order

    const totals = calculateFinancialTotals([zeroDollarOrder], costConfigs);

    expect(totals.grossSalesCents).toBe(0);
    expect(totals.netRevenueCents).toBe(0);
    expect(totals.perfectPayFeesCents).toBe(0);
    expect(totals.providerCostsCents).toBe(75); // $0.75
    expect(totals.netProfitCents).toBe(-75); // -$0.75 net profit
  });

  // =========================================================================
  // TEST I: Provider attempt fails before creation => no cost ($0)
  // =========================================================================
  it('TEST I: Provider attempt fails before order creation => cost is $0 for that attempt', () => {
    const order = { id: 'ord_failed_attempt', quantity: 1000, platform: 'instagram', service: 'followers' };
    const failedFulfillments: FulfillmentOrderRecord[] = [
      {
        id: 'ful_failed_before_creation',
        orderId: 'ord_failed_attempt',
        status: 'FAILED',
        externalOrderId: null,
        externalServiceId: '31832',
        providerCostCents: null,
        providerCostSource: null,
      },
    ];

    const resolution = resolveOrderFulfillmentCost(order, failedFulfillments, costConfigs);
    expect(resolution.providerCostCents).toBe(0);
    expect(resolution.chargedAttemptsCount).toBe(0);
  });

  // =========================================================================
  // TEST J: Provider order created/charged then fails => cost retained
  // =========================================================================
  it('TEST J: Provider order created/charged on provider then fails => cost is retained as incurred loss', () => {
    const order = { id: 'ord_created_then_failed', quantity: 1000, platform: 'instagram', service: 'followers' };
    const fulfillments: FulfillmentOrderRecord[] = [
      {
        id: 'ful_created_then_failed',
        orderId: 'ord_created_then_failed',
        status: 'FAILED',
        externalOrderId: '80339007', // Provider created order ID before failing
        externalServiceId: '31832',
        providerCostCents: 45, // $0.45 was charged by provider
        providerCostSource: 'CHAIN_RATE_SNAPSHOT',
        providerRateSnapshot: '0.45',
      },
    ];

    const resolution = resolveOrderFulfillmentCost(order, fulfillments, costConfigs);
    expect(resolution.providerCostCents).toBe(45);
    expect(resolution.chargedAttemptsCount).toBe(1);
  });

  // =========================================================================
  // INTEGRATED FINANCIAL TOTALS (Section 10 test dataset)
  // =========================================================================
  it('Financial Totals accurately consolidates Payment Economics vs Fulfillment Economics', () => {
    // Dataset:
    // Order 1: $5 Paid ($5.00), fulfilled with 1000 followers (cost: $0.45 = 45 cents)
    // Order 2: $5 Refunded ($5.00), fulfilled with 1000 followers (cost: $0.45 = 45 cents)
    // Order 3: $0 Free order ($0.00), fulfilled with 500 followers (cost: $0.25 = 25 cents)
    // Order 4: $0 Unpaid not dispatched ($0.00)

    const ordersDataset: OrderFinancialRecord[] = [
      {
        id: 'ord_paid_5',
        totalCents: 500, // $5.00
        currency: 'USD',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'COMPLETED',
        immutableProviderCostCents: 45,
        providerCostSource: 'CHAIN_RATE_SNAPSHOT',
      },
      {
        id: 'ord_refunded_5',
        totalCents: 500, // $5.00
        currency: 'USD',
        paymentStatus: 'REFUNDED',
        fulfillmentStatus: 'COMPLETED',
        immutableProviderCostCents: 45,
        providerCostSource: 'CHAIN_RATE_SNAPSHOT',
      },
      {
        id: 'ord_free_0',
        totalCents: 0, // $0.00
        currency: 'USD',
        paymentStatus: 'COMPLETED',
        fulfillmentStatus: 'COMPLETED',
        immutableProviderCostCents: 25,
        providerCostSource: 'CHAIN_RATE_SNAPSHOT',
      },
      {
        id: 'ord_unpaid_0',
        totalCents: 0,
        currency: 'USD',
        paymentStatus: 'PENDING',
        fulfillmentStatus: 'NOT_DISPATCHED',
      },
    ];

    const totals = calculateFinancialTotals(ordersDataset, costConfigs);

    // Payment side:
    // Order 1 fee: 500 * 0.089 + 100 = 44.5 + 100 = 144.5 -> 145 cents ($1.45)
    // Order 2 fee: 500 * 0.089 + 100 = 44.5 + 100 = 144.5 -> 145 cents ($1.45)
    // Order 3 & 4 fee: $0
    // Total Fees = 290 cents = $2.90

    expect(totals.grossSalesCents).toBe(1000); // $10.00 Gross Sales
    expect(totals.netRevenueCents).toBe(500); // $5.00 Net Revenue
    expect(totals.refundsCents).toBe(500); // $5.00 Refunds
    expect(totals.perfectPayFeesCents).toBe(290); // $2.90 PerfectPay Fees
    expect(totals.aovCents).toBe(500); // $5.00 AOV
    expect(totals.refundRatePercent).toBe('50.0'); // 50% Refund Rate (1 paid, 1 refunded out of 2 sales)

    // Fulfillment side:
    // Total provider costs = 45 + 45 + 25 = 115 cents ($1.15)
    expect(totals.providerCostsCents).toBe(115);

    // Net profit:
    // Net Revenue ($5.00) - PerfectPay Fees ($2.90) - Provider Costs ($1.15) = $0.95 (95 cents)
    expect(totals.netProfitCents).toBe(500 - 290 - 115); // 95 cents
  });

  // =========================================================================
  // MULTIPLE CHARGED ATTEMPTS AGGREGATION (Section 6)
  // =========================================================================
  it('Multiple charged provider attempts aggregate net provider cost correctly', () => {
    const multiAttemptOrder = { id: 'ord_multi', quantity: 1000, platform: 'instagram', service: 'followers' };
    const multiFulfillments: FulfillmentOrderRecord[] = [
      {
        id: 'ful_1',
        orderId: 'ord_multi',
        status: 'PARTIAL',
        externalOrderId: '80339010',
        externalServiceId: '31832',
        providerTier: 'primary',
        providerCostCents: 45, // First attempt charged 45 cents
        providerCostSource: 'CHAIN_RATE_SNAPSHOT',
      },
      {
        id: 'ful_2',
        orderId: 'ord_multi',
        status: 'COMPLETED',
        externalOrderId: '80339011',
        externalServiceId: '31849',
        providerTier: 'fallback1',
        providerCostCents: 70, // Second attempt charged 70 cents
        providerCostSource: 'CHAIN_RATE_SNAPSHOT',
      },
    ];

    const resolution = resolveOrderFulfillmentCost(multiAttemptOrder, multiFulfillments, costConfigs);
    // Sum of both charged attempts: 45 + 70 = 115 cents ($1.15)
    expect(resolution.providerCostCents).toBe(115);
    expect(resolution.chargedAttemptsCount).toBe(2);
  });
});
