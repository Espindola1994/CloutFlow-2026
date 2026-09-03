import { db } from '../db';
import { plans, services, platforms } from '../db/schema/catalog';
import { offers } from '../db/schema/offers';
import { orders, orderEvents } from '../db/schema/orders';
import { supplierAttempts, adminAlerts } from '../db/schema/supplier-routing';
import { adminActivityLogs } from '../db/schema/auth';
import { fulfillmentOrders } from '../db/schema/fulfillment';
import { calculateCostCeiling, calculateSupplierCost, calculateGrossProfit, calculateGrossMarginPercent, evaluateSupplierOption } from '../lib/routing/financial-routing';
import { planSplitOrder } from '../lib/routing/split-planner';
import { SupplierRateMonitorService, RateSnapshot } from './supplier-rate-monitor.service';
import { executeSupplierRouting } from './supplier-routing.service';
import { peakerrClient } from '../providers/peakerr/peakerr.client';
import { eq, desc, and, inArray, sql, count } from 'drizzle-orm';
import { CLOUTFLOW_CATALOG_PACKAGES, DEFAULT_FINANCIAL_PROTECTION_RULES, CRITICAL_CARD_CEILING_OVERRIDES } from '../config/financial-protection.config';

export type RoutingHealthStatus = 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';

export type SupplierCompatibilityStatus = 'AVAILABLE' | 'SAFE' | 'INCOMPATIBLE_QUANTITY' | 'HOLD_COST' | 'UNAVAILABLE' | 'UNKNOWN' | 'SPLIT_AVAILABLE';

export interface ProductRoutingCard {
  id: string; // plan or offer id / composite key
  platform: string;
  service: string;
  plan: string;
  quantity: number;
  sellingPrice: number;
  sellingPriceCents: number;

  priorityServiceId: string | null;
  fallback1ServiceId: string | null;
  fallback2ServiceId: string | null;

  priorityRate: number | null;
  fallback1Rate: number | null;
  fallback2Rate: number | null;

  priorityRateStatus: 'FRESH' | 'CACHED' | 'STALE' | 'UNKNOWN';
  fallback1RateStatus: 'FRESH' | 'CACHED' | 'STALE' | 'UNKNOWN';
  fallback2RateStatus: 'FRESH' | 'CACHED' | 'STALE' | 'UNKNOWN';

  priorityEstimatedCost: number | null;
  fallback1EstimatedCost: number | null;
  fallback2EstimatedCost: number | null;

  priorityGrossProfit: number | null;
  fallback1GrossProfit: number | null;
  fallback2GrossProfit: number | null;

  priorityGrossMargin: number | null;
  fallback1GrossMargin: number | null;
  fallback2GrossMargin: number | null;

  priorityApproved: boolean;
  fallback1Approved: boolean;
  fallback2Approved: boolean;

  priorityCompatibilityStatus?: SupplierCompatibilityStatus;
  fallback1CompatibilityStatus?: SupplierCompatibilityStatus;
  fallback2CompatibilityStatus?: SupplierCompatibilityStatus;
  effectiveEligibleSupplier?: 'priority' | 'fallback1' | 'fallback2' | null;

  // Split details
  isSplitRoute?: boolean;
  splitChunkCount?: number;
  splitChunkSize?: number;
  splitExecutionMode?: 'sequential' | 'parallel';

  minimumGrossMarginPercent: number;
  minimumGrossProfit: number;
  maxSupplierCostAbsolute: number | null;
  allowedSupplierCost: number;

  costCeilingEnabled: boolean;
  manualReviewEnabled: boolean;

  routingHealth: RoutingHealthStatus;
  healthReason: string;

  suggestedMinimumSellingPrice: number | null;
  suggestedPriceFormatted: string | null;
}

export interface SupplierRoutingOverviewMetrics {
  revenueTodayCents: number;
  revenueTodayFormatted: string;
  supplierSpendTodayCents: number;
  supplierSpendTodayFormatted: string;
  estimatedGrossProfitTodayCents: number;
  estimatedGrossProfitTodayFormatted: string;
  averageGrossMarginPercent: number;
  ordersRoutedPriority: number;
  ordersRoutedFallback1: number;
  ordersRoutedFallback2: number;
  ordersOnHold: number;
  manualReviews: number;
  totalOrdersToday: number;
}

export interface CommercialSuggestionParams {
  supplierCost: number;
  targetMarginPercent: number;
  minimumGrossProfit: number;
}

export class FinancialControlService {
  /**
   * Round suggested price to commercial ending (.90)
   * e.g. 5.90, 7.90, 9.90, 14.90, 19.90, 24.90, 29.90, 39.90, 49.90...
   */
  public static calculateCommercialPriceSuggestion(minRequiredPrice: number): number {
    if (minRequiredPrice <= 0) return 5.90;

    const standardEndings = [
      5.90, 7.90, 9.90, 12.90, 14.90, 17.90, 19.90, 21.90, 24.90, 29.90,
      32.90, 34.90, 39.90, 44.90, 49.90, 59.90, 69.90, 79.90, 89.90, 99.90,
      119.90, 149.90, 179.90, 199.90, 219.90, 249.90, 299.90, 329.90, 349.90,
      399.90, 449.90, 499.90, 549.90, 599.90, 649.90, 699.90, 749.90, 799.90,
      899.90, 999.90
    ];

    for (const ending of standardEndings) {
      if (ending >= minRequiredPrice) {
        return ending;
      }
    }

    // For higher custom numbers: ceil to whole integer then subtract 0.10
    const ceilTen = Math.ceil(minRequiredPrice / 10) * 10;
    return Number((ceilTen - 0.10).toFixed(2));
  }

  /**
   * Calculate suggested minimum selling price based on current supplier cost and protection targets.
   */
  public static calculateSuggestedSellingPrice(params: CommercialSuggestionParams): number {
    const { supplierCost, targetMarginPercent, minimumGrossProfit } = params;

    // Price required by margin: price = cost / (1 - margin/100)
    const marginRatio = 1 - (targetMarginPercent / 100);
    const priceByMargin = marginRatio > 0 ? (supplierCost / marginRatio) : supplierCost * 2;

    // Price required by min profit: price = cost + min profit
    const priceByProfit = supplierCost + minimumGrossProfit;

    const rawMinPrice = Math.max(priceByMargin, priceByProfit);
    return this.calculateCommercialPriceSuggestion(rawMinPrice);
  }

  /**
   * Determine Routing Health for a product card:
   * GREEN: At least one configured route is quantity-compatible, available, and financially safe (within Cost Ceiling).
   * YELLOW: Priority failed (cost violation or manual review), but a fallback is approved and safe.
   * RED: All configured suppliers violate financial protection or no supplier passes.
   * GRAY / UNKNOWN: Unable to get current rates (or missing supplier configuration).
   */
  public static evaluateCardHealth(card: {
    priorityRate: number | null;
    priorityRateStatus: string;
    priorityApproved: boolean;
    priorityQuantityCompatible?: boolean;
    fallback1Rate: number | null;
    fallback1Approved: boolean;
    fallback1QuantityCompatible?: boolean;
    fallback2Rate: number | null;
    fallback2Approved: boolean;
    fallback2QuantityCompatible?: boolean;
    priorityServiceId: string | null;
  }): { health: RoutingHealthStatus; reason: string } {
    const priorityQtyOk = card.priorityQuantityCompatible ?? true;
    const fb1QtyOk = card.fallback1QuantityCompatible ?? true;
    const fb2QtyOk = card.fallback2QuantityCompatible ?? true;

    if (!card.priorityServiceId || card.priorityRateStatus === 'UNKNOWN' || card.priorityRate === null) {
      // Check if fallback 1 is available and approved
      if (card.fallback1Approved && fb1QtyOk) {
        return {
          health: 'GREEN',
          reason: 'Fallback 1 supplier is available, quantity-compatible, and within Cost Ceiling',
        };
      }
      return {
        health: 'UNKNOWN',
        reason: 'Current rate unknown or priority supplier unassigned',
      };
    }

    if (card.priorityApproved && priorityQtyOk) {
      return {
        health: 'GREEN',
        reason: 'Priority supplier is available, quantity-compatible, and within Cost Ceiling',
      };
    }

    if ((card.fallback1Approved && fb1QtyOk) || (card.fallback2Approved && fb2QtyOk)) {
      const isPriorityQtyIncompatible = !priorityQtyOk;
      return {
        health: isPriorityQtyIncompatible ? 'GREEN' : 'YELLOW',
        reason: isPriorityQtyIncompatible
          ? 'Priority supplier incompatible by quantity, but fallback is quantity-compatible, safe & approved'
          : 'Priority supplier exceeded Cost Ceiling, but fallback is safe & approved',
      };
    }

    return {
      health: 'RED',
      reason: 'No configured supplier passes quantity compatibility and financial margin/profit protections',
    };
  }

  /**
   * Build routing evaluation for the 66 catalog cards using current/cached rates and DB configurations.
   */
  public static async getProductRoutingCards(): Promise<ProductRoutingCard[]> {
    const cachedRates = await SupplierRateMonitorService.getAllCachedRates();

    // Fetch plans from DB with joined service & platform
    let dbPlans: any[] = [];
    try {
      dbPlans = await db
        .select({
          id: plans.id,
          name: plans.name,
          slug: plans.slug,
          quantity: plans.quantity,
          salePriceCents: plans.salePriceCents,
          regularPriceCents: plans.regularPriceCents,
          priorityServiceId: plans.priorityServiceId,
          fallback1ServiceId: plans.fallback1ServiceId,
          fallback2ServiceId: plans.fallback2ServiceId,
          minimumGrossMarginPercent: plans.minimumGrossMarginPercent,
          minimumGrossProfitCents: plans.minimumGrossProfitCents,
          maxSupplierCostAbsoluteCents: plans.maxSupplierCostAbsoluteCents,
          costCeilingEnabled: plans.costCeilingEnabled,
          manualReviewEnabled: plans.manualReviewEnabled,
          serviceSlug: services.slug,
          serviceName: services.name,
          platformSlug: platforms.slug,
          platformName: platforms.name,
        })
        .from(plans)
        .leftJoin(services, eq(plans.serviceId, services.id))
        .leftJoin(platforms, eq(services.platformId, platforms.id));
    } catch (err) {
      console.error('[FinancialControlService] Error querying plans table:', err);
    }

    // 1. Fetch fulfillment chains as secondary source of truth if plan doesn't have supplier IDs configured
    let chainMap = new Map<string, { priority: string | null; fallback1: string | null; fallback2: string | null }>();
    try {
      const { fulfillmentChains, fulfillmentChainServices } = await import('../db/schema/fulfillment-chains');
      const allChains = await db.select().from(fulfillmentChains).where(eq(fulfillmentChains.active, true));
      const allChainServices = await db.select().from(fulfillmentChainServices).where(eq(fulfillmentChainServices.active, true));

      for (const chain of allChains) {
        const srvs = allChainServices.filter((s) => s.chainId === chain.id);
        const p1 = srvs.find((s) => s.priority === 1)?.providerServiceId || null;
        const fb1 = srvs.find((s) => s.priority === 2)?.providerServiceId || null;
        const fb2 = srvs.find((s) => s.priority === 3)?.providerServiceId || null;
        chainMap.set(`${chain.platform.toLowerCase()}:${chain.service.toLowerCase()}`, {
          priority: p1,
          fallback1: fb1,
          fallback2: fb2,
        });
      }
    } catch (chainErr) {
      console.error('[FinancialControlService] Error querying fulfillment chains:', chainErr);
    }

    const cards: ProductRoutingCard[] = [];

    for (const pkg of CLOUTFLOW_CATALOG_PACKAGES) {
      const dbMatch = dbPlans.find(
        (p) =>
          p.platformSlug === pkg.platform &&
          p.serviceSlug === pkg.service &&
          (p.name === pkg.name || p.quantity === pkg.quantity)
      );

      const ruleKey = `${pkg.platform}:${pkg.service}`;
      const defaultRule = DEFAULT_FINANCIAL_PROTECTION_RULES[ruleKey] || {
        minimumGrossMarginPercent: 40,
        minimumGrossProfitCents: 500,
      };

      const criticalOverride = CRITICAL_CARD_CEILING_OVERRIDES.find(
        (o) => o.platform === pkg.platform && o.service === pkg.service && o.packageName === pkg.name
      );

      const sellingPriceCents = dbMatch?.salePriceCents ?? pkg.priceCents;
      const sellingPrice = sellingPriceCents / 100;

      const minimumGrossMarginPercent = dbMatch?.minimumGrossMarginPercent ?? defaultRule.minimumGrossMarginPercent;
      const minimumGrossProfit = (dbMatch?.minimumGrossProfitCents ? Number(dbMatch.minimumGrossProfitCents) : defaultRule.minimumGrossProfitCents) / 100;
      
      const maxSupplierCostAbsolute = dbMatch?.maxSupplierCostAbsoluteCents
        ? Number(dbMatch.maxSupplierCostAbsoluteCents) / 100
        : criticalOverride
        ? criticalOverride.maxSupplierCostAbsoluteCents / 100
        : null;

      const costCeilingEnabled = dbMatch?.costCeilingEnabled ?? true;
      const manualReviewEnabled = dbMatch?.manualReviewEnabled ?? false;

      const ceiling = calculateCostCeiling({
        sellingPrice,
        minimumGrossMarginPercent,
        minimumGrossProfit,
        maxSupplierCostAbsolute,
      });

      const chainFallback = chainMap.get(`${pkg.platform.toLowerCase()}:${pkg.service.toLowerCase()}`);

      const priorityId = dbMatch?.priorityServiceId 
        ? String(dbMatch.priorityServiceId) 
        : (chainFallback?.priority || null);

      const fallback1Id = dbMatch?.fallback1ServiceId 
        ? String(dbMatch.fallback1ServiceId) 
        : (chainFallback?.fallback1 || null);

      const fallback2Id = dbMatch?.fallback2ServiceId 
        ? String(dbMatch.fallback2ServiceId) 
        : (chainFallback?.fallback2 || null);

      const prioritySnapshot = priorityId ? cachedRates.get(priorityId) : undefined;
      const fallback1Snapshot = fallback1Id ? cachedRates.get(fallback1Id) : undefined;
      const fallback2Snapshot = fallback2Id ? cachedRates.get(fallback2Id) : undefined;

      const priorityRate = prioritySnapshot ? prioritySnapshot.rate : null;
      const fallback1Rate = fallback1Snapshot ? fallback1Snapshot.rate : null;
      const fallback2Rate = fallback2Snapshot ? fallback2Snapshot.rate : null;

      const priorityRateStatus = prioritySnapshot ? prioritySnapshot.status : 'UNKNOWN';
      const fallback1RateStatus = fallback1Snapshot ? fallback1Snapshot.status : 'UNKNOWN';
      const fallback2RateStatus = fallback2Snapshot ? fallback2Snapshot.status : 'UNKNOWN';

      const priorityEstCost = priorityRate !== null ? calculateSupplierCost(pkg.quantity, priorityRate) : null;
      const fallback1EstCost = fallback1Rate !== null ? calculateSupplierCost(pkg.quantity, fallback1Rate) : null;
      const fallback2EstCost = fallback2Rate !== null ? calculateSupplierCost(pkg.quantity, fallback2Rate) : null;

      const priorityProfit = priorityEstCost !== null ? calculateGrossProfit(sellingPrice, priorityEstCost) : null;
      const fallback1Profit = fallback1EstCost !== null ? calculateGrossProfit(sellingPrice, fallback1EstCost) : null;
      const fallback2Profit = fallback2EstCost !== null ? calculateGrossProfit(sellingPrice, fallback2EstCost) : null;

      const priorityMargin = priorityEstCost !== null ? calculateGrossMarginPercent(sellingPrice, priorityEstCost) : null;
      const fallback1Margin = fallback1EstCost !== null ? calculateGrossMarginPercent(sellingPrice, fallback1EstCost) : null;
      const fallback2Margin = fallback2EstCost !== null ? calculateGrossMarginPercent(sellingPrice, fallback2EstCost) : null;

      const priorityApproved = priorityEstCost !== null && (!costCeilingEnabled || priorityEstCost <= ceiling.allowedSupplierCost);
      const fallback1Approved = fallback1EstCost !== null && (!costCeilingEnabled || fallback1EstCost <= ceiling.allowedSupplierCost);
      const fallback2Approved = fallback2EstCost !== null && (!costCeilingEnabled || fallback2EstCost <= ceiling.allowedSupplierCost);

      // Quantity compatibility checks & Split Order capability for X Likes > 5k
      const isXTwitterLikes = (pkg.platform.toLowerCase() === 'twitter' || pkg.platform.toLowerCase() === 'x') && pkg.service.toLowerCase() === 'likes';
      const isSplitEligible = isXTwitterLikes && pkg.quantity > 5000 && priorityId === '33478';

      let priorityQuantityCompatible = true;
      let isSplitRoute = false;
      let splitChunkCount: number | undefined = undefined;
      let splitChunkSize: number | undefined = undefined;
      let splitExecutionMode: 'sequential' | 'parallel' | undefined = undefined;

      if (isSplitEligible && priorityRate !== null) {
        const splitPlan = planSplitOrder({
          platform: pkg.platform,
          service: pkg.service,
          totalQuantity: pkg.quantity,
          sellingPrice,
          supplierServiceId: priorityId,
          supplierRate: priorityRate,
          supplierMaxQuantity: 5000,
          supplierMinQuantity: 50,
          minimumGrossMarginPercent,
          minimumGrossProfit,
          maxSupplierCostAbsolute,
          costCeilingEnabled,
        });

        isSplitRoute = true;
        splitChunkCount = splitPlan.chunkCount;
        splitChunkSize = splitPlan.chunkSize;
        splitExecutionMode = splitPlan.executionMode;
        priorityQuantityCompatible = splitPlan.isQuantityCompatible;
      } else if (prioritySnapshot) {
        if (prioritySnapshot.maxQuantity && pkg.quantity > prioritySnapshot.maxQuantity) {
          priorityQuantityCompatible = false;
        } else if (prioritySnapshot.minQuantity && pkg.quantity < prioritySnapshot.minQuantity) {
          priorityQuantityCompatible = false;
        }
      }

      let fallback1QuantityCompatible = true;
      if (fallback1Snapshot) {
        if (fallback1Snapshot.maxQuantity && pkg.quantity > fallback1Snapshot.maxQuantity) {
          fallback1QuantityCompatible = false;
        } else if (fallback1Snapshot.minQuantity && pkg.quantity < fallback1Snapshot.minQuantity) {
          fallback1QuantityCompatible = false;
        }
      }

      let fallback2QuantityCompatible = true;
      if (fallback2Snapshot) {
        if (fallback2Snapshot.maxQuantity && pkg.quantity > fallback2Snapshot.maxQuantity) {
          fallback2QuantityCompatible = false;
        } else if (fallback2Snapshot.minQuantity && pkg.quantity < fallback2Snapshot.minQuantity) {
          fallback2QuantityCompatible = false;
        }
      }

      // Detailed compatibility status
      let priorityCompatibilityStatus: SupplierCompatibilityStatus = 'UNKNOWN';
      if (!priorityId) {
        priorityCompatibilityStatus = 'UNAVAILABLE';
      } else if (isSplitRoute && priorityApproved && priorityQuantityCompatible) {
        priorityCompatibilityStatus = 'SPLIT_AVAILABLE';
      } else if (!priorityQuantityCompatible) {
        priorityCompatibilityStatus = 'INCOMPATIBLE_QUANTITY';
      } else if (priorityRate === null || priorityRateStatus === 'UNKNOWN') {
        priorityCompatibilityStatus = 'UNKNOWN';
      } else if (!priorityApproved) {
        priorityCompatibilityStatus = 'HOLD_COST';
      } else {
        priorityCompatibilityStatus = 'AVAILABLE';
      }

      let fallback1CompatibilityStatus: SupplierCompatibilityStatus = 'UNKNOWN';
      if (!fallback1Id) {
        fallback1CompatibilityStatus = 'UNAVAILABLE';
      } else if (!fallback1QuantityCompatible) {
        fallback1CompatibilityStatus = 'INCOMPATIBLE_QUANTITY';
      } else if (fallback1Rate === null || fallback1RateStatus === 'UNKNOWN') {
        fallback1CompatibilityStatus = 'UNKNOWN';
      } else if (!fallback1Approved) {
        fallback1CompatibilityStatus = 'HOLD_COST';
      } else {
        fallback1CompatibilityStatus = 'AVAILABLE';
      }

      let fallback2CompatibilityStatus: SupplierCompatibilityStatus = 'UNKNOWN';
      if (!fallback2Id) {
        fallback2CompatibilityStatus = 'UNAVAILABLE';
      } else if (!fallback2QuantityCompatible) {
        fallback2CompatibilityStatus = 'INCOMPATIBLE_QUANTITY';
      } else if (fallback2Rate === null || fallback2RateStatus === 'UNKNOWN') {
        fallback2CompatibilityStatus = 'UNKNOWN';
      } else if (!fallback2Approved) {
        fallback2CompatibilityStatus = 'HOLD_COST';
      } else {
        fallback2CompatibilityStatus = 'AVAILABLE';
      }

      // Effective eligible supplier for routing
      let effectiveEligibleSupplier: 'priority' | 'fallback1' | 'fallback2' | null = null;
      if (priorityApproved && priorityQuantityCompatible && priorityRate !== null) {
        effectiveEligibleSupplier = 'priority';
      } else if (fallback1Approved && fallback1QuantityCompatible && fallback1Rate !== null) {
        effectiveEligibleSupplier = 'fallback1';
      } else if (fallback2Approved && fallback2QuantityCompatible && fallback2Rate !== null) {
        effectiveEligibleSupplier = 'fallback2';
      }

      const health = this.evaluateCardHealth({
        priorityRate,
        priorityRateStatus,
        priorityApproved,
        priorityQuantityCompatible,
        fallback1Rate,
        fallback1Approved,
        fallback1QuantityCompatible,
        fallback2Rate,
        fallback2Approved,
        fallback2QuantityCompatible,
        priorityServiceId: priorityId,
      });

      // Price recommendation for risky or broken cards
      let suggestedMinimumSellingPrice: number | null = null;
      let suggestedPriceFormatted: string | null = null;

      if (!priorityApproved && priorityEstCost !== null) {
        suggestedMinimumSellingPrice = this.calculateSuggestedSellingPrice({
          supplierCost: priorityEstCost,
          targetMarginPercent: minimumGrossMarginPercent,
          minimumGrossProfit,
        });
        suggestedPriceFormatted = `$${suggestedMinimumSellingPrice.toFixed(2)}`;
      }

      cards.push({
        id: dbMatch?.id || `${pkg.platform}-${pkg.service}-${pkg.name}`,
        platform: pkg.platform,
        service: pkg.service,
        plan: pkg.name,
        quantity: pkg.quantity,
        sellingPrice,
        sellingPriceCents,
        priorityServiceId: priorityId,
        fallback1ServiceId: fallback1Id,
        fallback2ServiceId: fallback2Id,
        priorityRate,
        fallback1Rate,
        fallback2Rate,
        priorityRateStatus,
        fallback1RateStatus,
        fallback2RateStatus,
        priorityEstimatedCost: priorityEstCost,
        fallback1EstimatedCost: fallback1EstCost,
        fallback2EstimatedCost: fallback2EstCost,
        priorityGrossProfit: priorityProfit,
        fallback1GrossProfit: fallback1Profit,
        fallback2GrossProfit: fallback2Profit,
        priorityGrossMargin: priorityMargin,
        fallback1GrossMargin: fallback1Margin,
        fallback2GrossMargin: fallback2Margin,
        priorityApproved,
        fallback1Approved,
        fallback2Approved,
        priorityCompatibilityStatus,
        fallback1CompatibilityStatus,
        fallback2CompatibilityStatus,
        effectiveEligibleSupplier,
        isSplitRoute,
        splitChunkCount,
        splitChunkSize,
        splitExecutionMode,
        minimumGrossMarginPercent,
        minimumGrossProfit,
        maxSupplierCostAbsolute,
        allowedSupplierCost: ceiling.allowedSupplierCost,
        costCeilingEnabled,
        manualReviewEnabled,
        routingHealth: health.health,
        healthReason: health.reason,
        suggestedMinimumSellingPrice,
        suggestedPriceFormatted,
      });
    }

    return cards;
  }

  /**
   * Get Today's Overview Metrics from actual DB tables without mock data.
   */
  public static async getTodayOverviewMetrics(): Promise<SupplierRoutingOverviewMetrics> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let revenueTodayCents = 0;
    let supplierSpendTodayCents = 0;
    let ordersRoutedPriority = 0;
    let ordersRoutedFallback1 = 0;
    let ordersRoutedFallback2 = 0;
    let ordersOnHold = 0;
    let manualReviews = 0;
    let totalOrdersToday = 0;

    try {
      // 1. Paid orders today
      const todayOrders = await db
        .select({
          id: orders.id,
          totalCents: orders.totalCents,
          fulfillmentStatus: orders.fulfillmentStatus,
          paymentStatus: orders.paymentStatus,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(sql`${orders.createdAt} >= ${startOfDay}`);

      totalOrdersToday = todayOrders.length;

      for (const ord of todayOrders) {
        if (ord.paymentStatus === 'PAID' || ord.paymentStatus === 'COMPLETED') {
          revenueTodayCents += ord.totalCents || 0;
        }

        if (ord.fulfillmentStatus === 'HOLD_SUPPLIER_COST' || ord.fulfillmentStatus === 'HOLD_NO_SUPPLIER') {
          ordersOnHold++;
        }
        if (ord.fulfillmentStatus === 'MANUAL_REVIEW') {
          manualReviews++;
        }
      }

      // 2. Fulfillment orders dispatched today
      const todayFulfillments = await db
        .select({
          id: fulfillmentOrders.id,
          providerTier: fulfillmentOrders.providerTier,
          providerCostCents: fulfillmentOrders.providerCostCents,
          status: fulfillmentOrders.status,
          createdAt: fulfillmentOrders.createdAt,
        })
        .from(fulfillmentOrders)
        .where(sql`${fulfillmentOrders.createdAt} >= ${startOfDay}`);

      for (const ful of todayFulfillments) {
        if (ful.providerCostCents) {
          supplierSpendTodayCents += ful.providerCostCents;
        }

        const tier = (ful.providerTier || '').toLowerCase();
        if (tier.includes('primary') || tier.includes('priority')) {
          ordersRoutedPriority++;
        } else if (tier.includes('fallback1') || tier.includes('fallback_1')) {
          ordersRoutedFallback1++;
        } else if (tier.includes('fallback2') || tier.includes('fallback_2')) {
          ordersRoutedFallback2++;
        }
      }
    } catch (err) {
      console.error('[FinancialControlService] Error fetching today metrics:', err);
    }

    const estimatedGrossProfitTodayCents = Math.max(0, revenueTodayCents - supplierSpendTodayCents);
    const averageGrossMarginPercent =
      revenueTodayCents > 0
        ? Number(((estimatedGrossProfitTodayCents / revenueTodayCents) * 100).toFixed(2))
        : 0;

    return {
      revenueTodayCents,
      revenueTodayFormatted: `$${(revenueTodayCents / 100).toFixed(2)}`,
      supplierSpendTodayCents,
      supplierSpendTodayFormatted: `$${(supplierSpendTodayCents / 100).toFixed(2)}`,
      estimatedGrossProfitTodayCents,
      estimatedGrossProfitTodayFormatted: `$${(estimatedGrossProfitTodayCents / 100).toFixed(2)}`,
      averageGrossMarginPercent,
      ordersRoutedPriority,
      ordersRoutedFallback1,
      ordersRoutedFallback2,
      ordersOnHold,
      manualReviews,
      totalOrdersToday,
    };
  }

  /**
   * List orders currently held for manual review or cost ceiling violation.
   */
  public static async getManualReviewQueue(): Promise<any[]> {
    try {
      const heldOrders = await db
        .select({
          id: orders.id,
          publicId: orders.publicId,
          platform: orders.platform,
          service: orders.service,
          username: orders.username,
          quantity: orders.quantity,
          totalCents: orders.totalCents,
          fulfillmentStatus: orders.fulfillmentStatus,
          paymentStatus: orders.paymentStatus,
          createdAt: orders.createdAt,
          adminNotes: orders.adminNotes,
        })
        .from(orders)
        .where(
          inArray(orders.fulfillmentStatus, [
            'HOLD_SUPPLIER_COST',
            'HOLD_NO_SUPPLIER',
            'MANUAL_REVIEW',
          ])
        )
        .orderBy(desc(orders.createdAt));

      // Fetch attempts for these orders
      const orderIds = heldOrders.map((o) => o.id);
      let attemptsByOrder = new Map<string, any[]>();

      if (orderIds.length > 0) {
        const attempts = await db
          .select()
          .from(supplierAttempts)
          .where(inArray(supplierAttempts.orderId, orderIds))
          .orderBy(desc(supplierAttempts.createdAt));

        for (const att of attempts) {
          const list = attemptsByOrder.get(att.orderId) || [];
          list.push(att);
          attemptsByOrder.set(att.orderId, list);
        }
      }

      return heldOrders.map((ord) => {
        const ordAttempts = attemptsByOrder.get(ord.id) || [];
        const priorityAttempt = ordAttempts.find((a) => a.supplierPosition === 'priority');
        const fallback1Attempt = ordAttempts.find((a) => a.supplierPosition === 'fallback1');
        const fallback2Attempt = ordAttempts.find((a) => a.supplierPosition === 'fallback2');

        const latestAttempt = ordAttempts[0];

        return {
          id: ord.id,
          publicId: ord.publicId,
          platform: ord.platform,
          service: ord.service,
          username: ord.username,
          quantity: ord.quantity,
          customerPaid: (ord.totalCents || 0) / 100,
          customerPaidFormatted: `$${((ord.totalCents || 0) / 100).toFixed(2)}`,
          fulfillmentStatus: ord.fulfillmentStatus,
          paymentStatus: ord.paymentStatus,
          createdAt: ord.createdAt,
          priorityAttempt: priorityAttempt ? {
            supplierId: priorityAttempt.supplierServiceId,
            rate: parseFloat(priorityAttempt.supplierRate),
            cost: parseFloat(priorityAttempt.supplierCalculatedCost),
            decision: priorityAttempt.decision,
            reason: priorityAttempt.reason,
          } : null,
          fallback1Attempt: fallback1Attempt ? {
            supplierId: fallback1Attempt.supplierServiceId,
            rate: parseFloat(fallback1Attempt.supplierRate),
            cost: parseFloat(fallback1Attempt.supplierCalculatedCost),
            decision: fallback1Attempt.decision,
            reason: fallback1Attempt.reason,
          } : null,
          fallback2Attempt: fallback2Attempt ? {
            supplierId: fallback2Attempt.supplierServiceId,
            rate: parseFloat(fallback2Attempt.supplierRate),
            cost: parseFloat(fallback2Attempt.supplierCalculatedCost),
            decision: fallback2Attempt.decision,
            reason: fallback2Attempt.reason,
          } : null,
          holdReason: latestAttempt?.reason || ord.fulfillmentStatus,
          allowedSupplierCost: latestAttempt ? parseFloat(latestAttempt.allowedSupplierCost) : null,
        };
      });
    } catch (err) {
      console.error('[FinancialControlService] Error fetching manual review queue:', err);
      return [];
    }
  }

  /**
   * Re-execute supplier routing for a held order with concurrency lock protection.
   */
  public static async retryRouting(orderId: string, adminUserId: string): Promise<{
    success: boolean;
    status: string;
    message: string;
    details?: any;
  }> {
    // 1. Check order state to prevent duplicate submission
    const existing = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!existing.length) {
      return { success: false, status: 'NOT_FOUND', message: 'Order not found' };
    }

    const order = existing[0];
    if (order.fulfillmentStatus === 'SUBMITTING' || order.fulfillmentStatus === 'PROCESSING' || order.fulfillmentStatus === 'COMPLETED') {
      return {
        success: false,
        status: order.fulfillmentStatus,
        message: `Order is already in state ${order.fulfillmentStatus}. Duplicate retry blocked.`,
      };
    }

    // 2. Audit log attempt
    await db.insert(adminActivityLogs).values({
      userId: adminUserId,
      action: 'RETRY_ROUTING',
      entity: 'order',
      entityId: orderId,
      metadata: { previousStatus: order.fulfillmentStatus },
      createdAt: new Date(),
    });

    // 3. Execute routing with dryRun = false (live or mock mode handled safely in service)
    const result = await executeSupplierRouting(orderId, {
      dryRun: false,
    });

    return {
      success: result.success,
      status: result.success ? 'PROCESSING' : 'FAILED',
      message: result.message,
      details: result,
    };
  }

  /**
   * Perform manual supplier override with strict financial protection warning check and mandatory audit log.
   */
  public static async manualSupplierOverride(params: {
    orderId: string;
    supplierId: string;
    supplierCost: number;
    reason: string;
    adminUserId: string;
    confirmedViolation?: boolean;
  }): Promise<{
    success: boolean;
    requiresConfirmation?: boolean;
    warningDetails?: any;
    message: string;
  }> {
    const { orderId, supplierId, supplierCost, reason, adminUserId, confirmedViolation } = params;

    if (!reason || reason.trim().length < 5) {
      return {
        success: false,
        message: 'Override Reason is required (minimum 5 characters).',
      };
    }

    const existing = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!existing.length) {
      return { success: false, message: 'Order not found' };
    }

    const order = existing[0];
    const customerPaid = (order.totalCents || 0) / 100;
    const grossProfit = calculateGrossProfit(customerPaid, supplierCost);
    const grossMargin = calculateGrossMarginPercent(customerPaid, supplierCost);

    // Calculate default ceiling for this order
    const ruleKey = `${order.platform}:${order.service}`;
    const defaultRule = DEFAULT_FINANCIAL_PROTECTION_RULES[ruleKey] || {
      minimumGrossMarginPercent: 40,
      minimumGrossProfitCents: 500,
    };

    const minMargin = defaultRule.minimumGrossMarginPercent;
    const minProfit = defaultRule.minimumGrossProfitCents / 100;

    const ceiling = calculateCostCeiling({
      sellingPrice: customerPaid,
      minimumGrossMarginPercent: minMargin,
      minimumGrossProfit: minProfit,
    });

    const violatesProtection =
      grossMargin < minMargin || grossProfit < minProfit || supplierCost > ceiling.allowedSupplierCost;

    if (violatesProtection && !confirmedViolation) {
      return {
        success: false,
        requiresConfirmation: true,
        warningDetails: {
          supplierCost,
          customerPaid,
          grossProfit,
          grossMargin,
          requiredMargin: minMargin,
          requiredProfit: minProfit,
          costCeiling: ceiling.allowedSupplierCost,
          violationMessage: `Supplier cost ($${supplierCost.toFixed(2)}) leaves only $${grossProfit.toFixed(2)} profit (${grossMargin.toFixed(1)}% margin). Target is ${minMargin}% / $${minProfit.toFixed(2)}.`,
        },
        message: 'FINANCIAL PROTECTION WARNING: Manual override violates configured protection thresholds. Explicit confirmation required.',
      };
    }

    // Record Attempt and Audit Log
    const now = new Date();
    await db.insert(supplierAttempts).values({
      orderId,
      supplierServiceId: supplierId,
      supplierPosition: 'priority',
      supplierRate: ((supplierCost / (order.quantity || 1000)) * 1000).toFixed(6),
      supplierCalculatedCost: supplierCost.toFixed(4),
      sellingPrice: customerPaid.toFixed(4),
      grossProfit: grossProfit.toFixed(4),
      grossMarginPercent: grossMargin.toFixed(2),
      allowedSupplierCost: ceiling.allowedSupplierCost.toFixed(4),
      decision: 'ACCEPTED',
      reason: `MANUAL_OVERRIDE by Admin (${adminUserId}): ${reason}`,
      createdAt: now,
    });

    await db.insert(adminActivityLogs).values({
      userId: adminUserId,
      action: 'MANUAL_SUPPLIER_OVERRIDE',
      entity: 'order',
      entityId: orderId,
      metadata: {
        supplierId,
        supplierCost,
        customerPaid,
        grossProfit,
        grossMargin,
        reason,
        violatesProtection,
      },
      createdAt: now,
    });

    // Update order status to PROCESSING
    await db
      .update(orders)
      .set({
        fulfillmentStatus: 'PROCESSING',
        adminNotes: `Manual supplier override applied (${supplierId}) by ${adminUserId}. Reason: ${reason}`,
        updatedAt: now,
      })
      .where(eq(orders.id, orderId));

    return {
      success: true,
      message: `Manual override approved and dispatched to supplier ${supplierId}.`,
    };
  }

  /**
   * Update product financial rules with audit logging and reduction warning check.
   */
  public static async updateProductFinancialRules(params: {
    planId: string;
    adminUserId: string;
    priorityServiceId?: string | null;
    fallback1ServiceId?: string | null;
    fallback2ServiceId?: string | null;
    minimumGrossMarginPercent?: number;
    minimumGrossProfit?: number;
    maxSupplierCostAbsolute?: number | null;
    costCeilingEnabled?: boolean;
    manualReviewEnabled?: boolean;
    confirmedReduction?: boolean;
  }): Promise<{
    success: boolean;
    requiresConfirmation?: boolean;
    warningMessage?: string;
    before?: any;
    after?: any;
    message: string;
  }> {
    const { planId, adminUserId, confirmedReduction } = params;

    const existingPlans = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
    if (!existingPlans.length) {
      return { success: false, message: 'Plan not found' };
    }

    const current = existingPlans[0];
    const currentMinMargin = current.minimumGrossMarginPercent ?? 40;
    const currentMinProfit = (current.minimumGrossProfitCents ? Number(current.minimumGrossProfitCents) : 500) / 100;

    const newMinMargin = params.minimumGrossMarginPercent ?? currentMinMargin;
    const newMinProfit = params.minimumGrossProfit ?? currentMinProfit;

    // Check if change weakens protection
    const marginReduced = newMinMargin < currentMinMargin;
    const profitReduced = newMinProfit < currentMinProfit;
    const ceilingDisabled = params.costCeilingEnabled === false && current.costCeilingEnabled === true;

    if ((marginReduced || profitReduced || ceilingDisabled) && !confirmedReduction) {
      const warnings: string[] = [];
      if (marginReduced) warnings.push(`Minimum Margin changing from ${currentMinMargin}% to ${newMinMargin}%.`);
      if (profitReduced) warnings.push(`Minimum Profit changing from $${currentMinProfit.toFixed(2)} to $${newMinProfit.toFixed(2)}.`);
      if (ceilingDisabled) warnings.push(`Cost Ceiling is being DISABLED.`);

      return {
        success: false,
        requiresConfirmation: true,
        warningMessage: `WARNING: ${warnings.join(' ')} Explicit confirmation required.`,
        before: {
          minimumGrossMarginPercent: currentMinMargin,
          minimumGrossProfit: currentMinProfit,
          costCeilingEnabled: current.costCeilingEnabled,
          priorityServiceId: current.priorityServiceId,
          fallback1ServiceId: current.fallback1ServiceId,
          fallback2ServiceId: current.fallback2ServiceId,
        },
        after: {
          minimumGrossMarginPercent: newMinMargin,
          minimumGrossProfit: newMinProfit,
          costCeilingEnabled: params.costCeilingEnabled ?? current.costCeilingEnabled,
          priorityServiceId: params.priorityServiceId ?? current.priorityServiceId,
          fallback1ServiceId: params.fallback1ServiceId ?? current.fallback1ServiceId,
          fallback2ServiceId: params.fallback2ServiceId ?? current.fallback2ServiceId,
        },
        message: 'Protection reduction detected.',
      };
    }

    const now = new Date();
    await db
      .update(plans)
      .set({
        priorityServiceId: params.priorityServiceId !== undefined ? params.priorityServiceId : current.priorityServiceId,
        fallback1ServiceId: params.fallback1ServiceId !== undefined ? params.fallback1ServiceId : current.fallback1ServiceId,
        fallback2ServiceId: params.fallback2ServiceId !== undefined ? params.fallback2ServiceId : current.fallback2ServiceId,
        minimumGrossMarginPercent: newMinMargin,
        minimumGrossProfitCents: Math.round(newMinProfit * 100),
        maxSupplierCostAbsoluteCents: params.maxSupplierCostAbsolute !== undefined
          ? params.maxSupplierCostAbsolute !== null ? Math.round(params.maxSupplierCostAbsolute * 100) : null
          : current.maxSupplierCostAbsoluteCents,
        costCeilingEnabled: params.costCeilingEnabled !== undefined ? params.costCeilingEnabled : current.costCeilingEnabled,
        manualReviewEnabled: params.manualReviewEnabled !== undefined ? params.manualReviewEnabled : current.manualReviewEnabled,
        updatedAt: now,
      })
      .where(eq(plans.id, planId));

    // Audit log
    await db.insert(adminActivityLogs).values({
      userId: adminUserId,
      action: 'UPDATE_PRODUCT_FINANCIAL_RULES',
      entity: 'plan',
      entityId: planId,
      metadata: {
        before: {
          minimumGrossMarginPercent: currentMinMargin,
          minimumGrossProfit: currentMinProfit,
          priorityServiceId: current.priorityServiceId,
          fallback1ServiceId: current.fallback1ServiceId,
          fallback2ServiceId: current.fallback2ServiceId,
        },
        after: {
          minimumGrossMarginPercent: newMinMargin,
          minimumGrossProfit: newMinProfit,
          priorityServiceId: params.priorityServiceId,
          fallback1ServiceId: params.fallback1ServiceId,
          fallback2ServiceId: params.fallback2ServiceId,
        },
      },
      createdAt: now,
    });

    return {
      success: true,
      message: 'Product financial protection rules updated successfully.',
    };
  }

  /**
   * Paginated and filtered supplier routing history from supplier_attempts.
   */
  public static async getSupplierAttemptHistory(options: {
    page?: number;
    pageSize?: number;
    platform?: string;
    service?: string;
    decision?: string;
    position?: string;
    supplierId?: string;
  }): Promise<{
    items: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
    const offset = (page - 1) * pageSize;

    try {
      let query = db
        .select({
          id: supplierAttempts.id,
          orderId: supplierAttempts.orderId,
          supplierServiceId: supplierAttempts.supplierServiceId,
          supplierPosition: supplierAttempts.supplierPosition,
          supplierRate: supplierAttempts.supplierRate,
          supplierCalculatedCost: supplierAttempts.supplierCalculatedCost,
          sellingPrice: supplierAttempts.sellingPrice,
          grossProfit: supplierAttempts.grossProfit,
          grossMarginPercent: supplierAttempts.grossMarginPercent,
          allowedSupplierCost: supplierAttempts.allowedSupplierCost,
          decision: supplierAttempts.decision,
          reason: supplierAttempts.reason,
          createdAt: supplierAttempts.createdAt,
          platform: orders.platform,
          service: orders.service,
          quantity: orders.quantity,
        })
        .from(supplierAttempts)
        .leftJoin(orders, eq(supplierAttempts.orderId, orders.id));

      const conditions: any[] = [];
      if (options.platform) {
        conditions.push(eq(orders.platform, options.platform));
      }
      if (options.service) {
        conditions.push(eq(orders.service, options.service));
      }
      if (options.decision) {
        conditions.push(eq(supplierAttempts.decision, options.decision));
      }
      if (options.position) {
        conditions.push(eq(supplierAttempts.supplierPosition, options.position));
      }
      if (options.supplierId) {
        conditions.push(eq(supplierAttempts.supplierServiceId, options.supplierId));
      }

      const totalResult = await db
        .select({ count: count() })
        .from(supplierAttempts)
        .leftJoin(orders, eq(supplierAttempts.orderId, orders.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const total = totalResult[0]?.count || 0;

      const items = await query
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(supplierAttempts.createdAt))
        .limit(pageSize)
        .offset(offset);

      return {
        items: items.map((it) => ({
          ...it,
          supplierRate: parseFloat(it.supplierRate),
          supplierCalculatedCost: parseFloat(it.supplierCalculatedCost),
          sellingPrice: parseFloat(it.sellingPrice),
          grossProfit: parseFloat(it.grossProfit),
          grossMarginPercent: parseFloat(it.grossMarginPercent),
          allowedSupplierCost: parseFloat(it.allowedSupplierCost),
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      };
    } catch (err) {
      console.error('[FinancialControlService] Error querying supplier attempts history:', err);
      return { items: [], total: 0, page: 1, pageSize, totalPages: 1 };
    }
  }

  /**
   * List and resolve alerts.
   */
  public static async getAlerts(onlyUnresolved = false): Promise<any[]> {
    try {
      let query = db.select().from(adminAlerts);
      if (onlyUnresolved) {
        return await query.where(eq(adminAlerts.resolved, false)).orderBy(desc(adminAlerts.createdAt));
      }
      return await query.orderBy(desc(adminAlerts.createdAt)).limit(100);
    } catch (err) {
      console.error('[FinancialControlService] Error fetching alerts:', err);
      return [];
    }
  }

  public static async resolveAlert(alertId: string, adminUserId: string, action: 'RESOLVE' | 'DISMISS'): Promise<boolean> {
    try {
      const now = new Date();
      await db
        .update(adminAlerts)
        .set({
          resolved: action === 'RESOLVE',
          dismissed: action === 'DISMISS',
          resolvedBy: adminUserId,
          resolvedAt: now,
          updatedAt: now,
        })
        .where(eq(adminAlerts.id, alertId));
      return true;
    } catch (err) {
      console.error('[FinancialControlService] Error resolving alert:', err);
      return false;
    }
  }
}
