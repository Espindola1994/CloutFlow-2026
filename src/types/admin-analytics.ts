export type AnalyticsDateRange = 'today' | '7d' | '30d' | '90d';

export interface AnalyticsKpiSummary {
  checkoutsStarted: number;
  checkoutsAbandoned: number;
  paidOrders: number;
  checkoutConversionRate: number; // percentage, e.g. 15.5
  abandonmentRate: number;        // percentage, e.g. 84.5
  revenue: number;                // in dollars, e.g. 1240.50
  averageOrderValue: number;      // in dollars, e.g. 29.90
}

export interface AnalyticsFunnelStep {
  label: string;
  count: number;
  percentage: number;
}

export interface AnalyticsFunnel {
  started: number;
  converted: {
    count: number;
    rate: number; // percentage
  };
  abandoned: {
    count: number;
    rate: number; // percentage
  };
}

export interface AnalyticsTimeSeriesPoint {
  date: string; // YYYY-MM-DD
  started: number;
  paid: number;
  abandoned: number;
}

export interface AnalyticsNetworkPerformance {
  network: string;
  platformKey: string;
  paidOrders: number;
  revenue: number;
  revenueShare: number; // percentage
  aov: number;
  quantitySold: number;
}

export interface AnalyticsServicePerformance {
  service: string;
  serviceKey: string;
  paidOrders: number;
  revenue: number;
  revenueShare: number; // percentage
  aov: number;
  quantitySold: number;
}

export interface AnalyticsTopPlan {
  planId: string;
  planName: string;
  network: string;
  service: string;
  quantity: number;
  paidOrders: number;
  revenue: number;
  revenueShare: number; // percentage
  aov: number;
}

export interface AnalyticsRankingSummary {
  bestSellingPlan: {
    name: string;
    network: string;
    service: string;
    revenue: number;
    paidOrders: number;
  } | null;
  topNetwork: {
    network: string;
    revenue: number;
    share: number;
  } | null;
  topService: {
    service: string;
    revenue: number;
    share: number;
  } | null;
}

export interface AnalyticsAbandonmentMetrics {
  started: number;
  abandoned: number;
  paid: number;
  abandonmentRate: number;
  conversionRate: number;
  // If reliably recoverable journeys are tracked:
  abandonedCartValueEstimated: number; // sum of priceCents/100 from abandoned leads
  recoveredOrders: number;
  recoveredRevenue: number;
}

export interface AnalyticsAttributionSummary {
  topSource: string;
  topCampaign: string;
  attributedPaidOrders: number;
  attributedRevenue: number;
}

export interface AnalyticsResponseData {
  range: AnalyticsDateRange;
  rangeStart: string; // ISO date
  rangeEnd: string;   // ISO date
  kpis: AnalyticsKpiSummary;
  funnel: AnalyticsFunnel;
  performanceOverTime: AnalyticsTimeSeriesPoint[];
  networkPerformance: AnalyticsNetworkPerformance[];
  servicePerformance: AnalyticsServicePerformance[];
  topPlans: AnalyticsTopPlan[];
  rankings: AnalyticsRankingSummary;
  abandonment: AnalyticsAbandonmentMetrics;
  attributionCompact: AnalyticsAttributionSummary;
}
