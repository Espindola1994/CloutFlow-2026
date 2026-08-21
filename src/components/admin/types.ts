export type Platform = 'instagram' | 'tiktok' | 'twitter' | 'youtube';

export interface Order {
  id: string;
  publicId?: string;
  platform: Platform;
  target?: string;
  username: string;
  product?: string;
  email: string;
  service: string;
  plan: string;
  grossAmount?: number;
  amount: number;
  perfectPayFee?: number;
  providerCost?: number;
  netProfit?: number;
  status: 'delivered' | 'paid' | 'pending' | 'failed' | 'refunded' | 'chargeback';
  paymentStatus?: string;
  fulfillmentStatus?: string;
  date: string;
  gateway: string;
  providerStatus: string;
  utmSource?: string;
  utmCampaign?: string;
  utmMedium?: string;
  orderBump?: boolean;
  upsell?: boolean;
}

export interface MonitoredProfile {
  id: string;
  username: string;
  platform: Platform;
  startCount: number;
  currentCount: number;
  deliveredQty: number;
  dropQty: number;
  status: 'PROTECTED' | 'REFILLED' | 'ATTENTION';
  lastCheck: string;
  refillCount: number;
  autoRefillEnabled: boolean;
  lastAutoRefillTime?: string;
}

export interface EmailWorkflow {
  id: string;
  name: string;
  trigger: string;
  subject: string;
  active: boolean;
  sentCount: number;
  openRate: string;
}

export interface AbTestVariant {
  price: number;
  visitors: number;
  orders: number;
  revenue: number;
  cr: string;
}

export interface AbTest {
  id: string;
  name: string;
  platform: Platform;
  planName: string;
  variantA: AbTestVariant;
  variantB: AbTestVariant;
  status: 'RUNNING' | 'PAUSED' | 'CONCLUDED';
  winner?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: 'percent' | 'fixed';
  maxUses: number;
  usedCount: number;
  minOrder: number;
  expiresAt: string;
  active: boolean;
  notes?: string;
}

export interface JourneyStep {
  time: string;
  action: string;
  icon: 'globe' | 'search' | 'package' | 'sparkles' | 'mail' | 'cart' | 'alert';
  detail: string;
}

export interface AbandonedLead {
  id: string;
  platform: Platform;
  username: string;
  email: string;
  date: string;
  step: string;
  couponSent: boolean;
  lastCouponSent: string | null;
  utmSource?: string;
  utmCampaign?: string;
  score: 'hot' | 'warm' | 'cold';
  selectedPlan?: string;
  planAmount?: number;
  orderBumpSelected?: boolean;
  dropOffReason?: string;
  timeSpentSeconds?: number;
  journey?: JourneyStep[];
}

export interface InboxMessage {
  id: string;
  customer: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
  platform?: Platform;
}

export interface Plan {
  id: string;
  platform: Platform;
  service: string;
  name: string;
  slug?: string;
  quantity: number;
  bonus?: number;
  price: number;
  oldPrice?: number;
  currency?: string;
  tag?: string;
  popular?: boolean;
  checkoutUrl?: string;
  perfectpayProductId?: string;
  perfectpayPlanId?: string;
  active: boolean;
  sortOrder?: number;
  benefits?: string[];
  ctaText?: string;
}

export interface OrderBumpOffer {
  id: string;
  name: string;
  service: string;
  quantity: number;
  price: number;
  originalPrice: number;
  platform: Platform;
  active: boolean;
  takeRate?: number;
  revenueGenerated?: number;
}

export interface UpsellOffer {
  id: string;
  title: string;
  description: string;
  discount: number;
  bonus: number;
  price: number;
  platform: Platform;
  active: boolean;
  conversion?: number;
  revenueGenerated?: number;
}

export interface CostSettings {
  instagram: {
    followersCostPer1k: number;
    likesCostPer1k: number;
    viewsCostPer1k: number;
    gatewayFeePercent: number;
    gatewayFixedFee: number;
  };
  tiktok: {
    followersCostPer1k: number;
    likesCostPer1k: number;
    viewsCostPer1k: number;
    gatewayFeePercent: number;
    gatewayFixedFee: number;
  };
  twitter: {
    followersCostPer1k: number;
    likesCostPer1k: number;
    viewsCostPer1k: number;
    gatewayFeePercent: number;
    gatewayFixedFee: number;
  };
  youtube: {
    subscribersCostPer1k: number;
    viewsCostPer1k: number;
    likesCostPer1k: number;
    gatewayFeePercent: number;
    gatewayFixedFee: number;
  };
}

export interface IntegrationStatus {
  id: string;
  name: string;
  category: 'Social Data' | 'Authentication' | 'SMM Provider' | 'Payment Gateway' | 'Email Provider' | 'Database';
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'ATTENTION';
  details: string;
  lastChecked?: string;
}

export interface SmmProvider {
  id: string;
  name: string;
  priority: 'Primary' | 'Backup' | 'Inactive';
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  balance: number;
  latencyMs: number;
  active: boolean;
}

export interface WebhookLog {
  id: string;
  event: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  action: string;
  provider: string;
  payload?: Record<string, unknown>;
}

export interface BlacklistEntry {
  id: string;
  type: 'username' | 'email' | 'ip';
  value: string;
  reason: 'chargeback' | 'private_profile' | 'bot_spam' | 'refund_abuse' | 'manual';
  createdAt: string;
  addedBy: string;
}
