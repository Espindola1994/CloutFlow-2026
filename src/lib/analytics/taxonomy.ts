/**
 * Analytics Taxonomy & Allowed Event Names for CloutFlow Phase B.
 * Strict closed allowlist.
 */

export const ALLOWED_FUNNEL_EVENTS = [
  'page_view',
  'platform_selected',
  'service_selected',
  'identifier_started',
  'identifier_completed',
  'email_started',
  'email_completed',
  'analyze_clicked',
  'analysis_completed',
  'analysis_failed',
  'result_viewed',
  'search_again_clicked',
  'profile_confirmed',
  'pricing_viewed',
  'plan_card_viewed',
  'plan_selected',
  'plan_cta_clicked',
  'checkout_started_linked',
] as const;

export type FunnelEventName = (typeof ALLOWED_FUNNEL_EVENTS)[number];

export function isAllowedFunnelEvent(event: string): event is FunnelEventName {
  return (ALLOWED_FUNNEL_EVENTS as readonly string[]).includes(event);
}

export type DeviceCategory = 'mobile' | 'tablet' | 'desktop';
export type BrowserFamily = 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Other';
export type ViewportBucket = 'small' | 'medium' | 'large';

export interface FunnelEventMetadata {
  platform?: string;
  service?: string;
  targetType?: string;
  planId?: string;
  planName?: string;
  packageQuantity?: number;
  errorCategory?: string;
  deviceCategory?: DeviceCategory;
  browserFamily?: BrowserFamily;
  viewportBucket?: ViewportBucket;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  src?: string;
  sck?: string;
  referrer?: string;
  landingPage?: string;
  checkoutContextId?: string;
}

export interface FunnelEventPayload {
  eventName: FunnelEventName;
  visitorId: string;
  sessionId: string;
  occurredAt?: string;
  page?: string;
  platform?: string;
  service?: string;
  planId?: string;
  metadata?: FunnelEventMetadata;
}
