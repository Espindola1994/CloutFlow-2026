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
  stage: string;
  label: string;
  count: number;
  conversionFromPrevious: number; // percentage e.g. 82.5
  conversionFromVisitor: number;  // percentage e.g. 100.0
  lostSessions: number;           // drop-off count
  dropOffRate: number;            // percentage e.g. 17.5
}

export interface FullFunnelData {
  trackingActive: boolean;
  activationDate: string; // ISO date
  hasHistoricalWarning: boolean;
  steps: AnalyticsFunnelStep[];
  biggestDropOff: {
    fromStage: string;
    toStage: string;
    lostSessions: number;
    dropOffRate: number;
  } | null;
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

export interface PreCheckoutNetworkInterest {
  network: string;
  platformKey: string;
  selectedSessions: number;
  checkoutSessions: number;
  paidOrders: number;
  conversionRate: number; // percentage paid / selected
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

export interface PreCheckoutServiceInterest {
  service: string;
  serviceKey: string;
  selectedSessions: number;
  analyzedSessions: number;
  checkoutSessions: number;
  paidOrders: number;
  conversionRate: number;
}

export interface PreCheckoutPlanInterest {
  planId: string;
  planName: string;
  network: string;
  service: string;
  viewedSessions: number;
  selectedSessions: number;
  ctaClickedSessions: number;
  checkoutSessions: number;
  paidOrders: number;
}

export interface AnalyzePerformanceSummary {
  totalAttempts: number;
  successful: number;
  failed: number;
  successRate: number; // percentage
  byNetwork: Array<{
    network: string;
    platformKey: string;
    attempts: number;
    successful: number;
    failed: number;
    successRate: number;
  }>;
}

export interface TrafficSourceItem {
  source: string;
  sessions: number;
  share: number; // percentage
  paidOrders: number;
}

export interface DeviceBreakdownItem {
  device: string;
  sessions: number;
  share: number;
}

export interface BrowserBreakdownItem {
  browser: string;
  sessions: number;
  share: number;
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
  abandonedCartValueEstimated: number;
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
  fullFunnel: FullFunnelData; // Phase B Full Funnel
  preCheckoutNetworkInterest: PreCheckoutNetworkInterest[];
  preCheckoutServiceInterest: PreCheckoutServiceInterest[];
  preCheckoutPlanInterest: PreCheckoutPlanInterest[];
  analyzePerformance: AnalyzePerformanceSummary;
  trafficSources: TrafficSourceItem[];
  deviceBreakdown: DeviceBreakdownItem[];
  browserBreakdown: BrowserBreakdownItem[];
  performanceOverTime: AnalyticsTimeSeriesPoint[];
  networkPerformance: AnalyticsNetworkPerformance[];
  servicePerformance: AnalyticsServicePerformance[];
  topPlans: AnalyticsTopPlan[];
  rankings: AnalyticsRankingSummary;
  abandonment: AnalyticsAbandonmentMetrics;
  attributionCompact: AnalyticsAttributionSummary;
}
