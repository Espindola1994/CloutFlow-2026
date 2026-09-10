/**
 * Fail-Open Client-Side Analytics Tracker for CloutFlow Phase B.
 * 
 * Strict Guarantees:
 * - NEVER throws or returns a rejected promise to caller.
 * - NEVER blocks the UI or main thread.
 * - Uses navigator.sendBeacon or fetch with keepalive: true.
 * - Enforces client-side deduplication for one-shot events.
 * - Zero PII collection.
 * - No heatmaps, no session replay, no mousemove listeners.
 */

import {
  FunnelEventName,
  FunnelEventMetadata,
  DeviceCategory,
  BrowserFamily,
  ViewportBucket,
  isAllowedFunnelEvent,
} from './taxonomy';
import {
  getAnonymousVisitorId,
  getAnonymousSessionId,
  captureSessionAttribution,
} from './identity';

// In-memory deduplication set per session lifecycle
const emittedEvents = new Set<string>();

/**
 * Resolve client device category from viewport and user-agent hints.
 * Privacy-safe: Simple bucket, no fingerprinting.
 */
function getDeviceCategory(): DeviceCategory {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width <= 1024) return 'tablet';
  return 'desktop';
}

function getViewportBucket(): ViewportBucket {
  if (typeof window === 'undefined') return 'large';
  const width = window.innerWidth;
  if (width < 640) return 'small';
  if (width < 1024) return 'medium';
  return 'large';
}

function getBrowserFamily(): BrowserFamily {
  if (typeof navigator === 'undefined') return 'Other';
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Chrome\//i.test(ua) && !/Chromium|Edg/i.test(ua)) return 'Chrome';
  if (/Safari\//i.test(ua) && !/Chrome|Chromium|Edg/i.test(ua)) return 'Safari';
  return 'Other';
}

export interface TrackOptions {
  platform?: string;
  service?: string;
  planId?: string;
  metadata?: FunnelEventMetadata;
  dedupKey?: string; // Optional custom deduplication key
}

/**
 * Main fire-and-forget event tracking function.
 * Guaranteed fail-open, never rejects, never throws.
 */
export function trackAnalyticsEvent(
  eventName: FunnelEventName,
  options: TrackOptions = {}
): void {
  try {
    if (typeof window === 'undefined') return;

    // Do not track admin or internal API routes
    const pathname = window.location.pathname;
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return;
    }

    if (!isAllowedFunnelEvent(eventName)) {
      return;
    }

    // Deduplication logic
    const sessionId = getAnonymousSessionId();
    const visitorId = getAnonymousVisitorId();

    // Check custom or standard deduplication
    let dedupKey: string | null = null;
    if (options.dedupKey) {
      dedupKey = `${eventName}:${options.dedupKey}`;
    } else if (
      eventName === 'page_view' ||
      eventName === 'identifier_started' ||
      eventName === 'email_started' ||
      eventName === 'pricing_viewed'
    ) {
      dedupKey = `${eventName}:${sessionId}`;
    } else if (eventName === 'plan_card_viewed' && options.planId) {
      dedupKey = `plan_card_viewed:${sessionId}:${options.planId}`;
    }

    if (dedupKey) {
      if (emittedEvents.has(dedupKey)) {
        return; // Already emitted for this session/key
      }
      emittedEvents.add(dedupKey);
    }

    const attribution = captureSessionAttribution();

    // Construct privacy-safe clean metadata
    const cleanMetadata: FunnelEventMetadata = {
      platform: options.platform || options.metadata?.platform,
      service: options.service || options.metadata?.service,
      targetType: options.metadata?.targetType,
      planId: options.planId || options.metadata?.planId,
      planName: options.metadata?.planName,
      packageQuantity: options.metadata?.packageQuantity,
      errorCategory: options.metadata?.errorCategory,
      deviceCategory: getDeviceCategory(),
      browserFamily: getBrowserFamily(),
      viewportBucket: getViewportBucket(),
      utm_source: attribution.utmSource,
      utm_medium: attribution.utmMedium,
      utm_campaign: attribution.utmCampaign,
      utm_content: attribution.utmContent,
      utm_term: attribution.utmTerm,
      src: attribution.src,
      sck: attribution.sck,
      referrer: attribution.referrer,
      landingPage: attribution.landingPage,
      checkoutContextId: options.metadata?.checkoutContextId,
    };

    const payload = {
      eventName,
      visitorId,
      sessionId,
      occurredAt: new Date().toISOString(),
      page: pathname.slice(0, 150),
      platform: cleanMetadata.platform,
      service: cleanMetadata.service,
      planId: cleanMetadata.planId,
      metadata: cleanMetadata,
    };

    const bodyString = JSON.stringify(payload);

    // Prefer fetch with keepalive: true and short timeout, fail-open
    if (typeof fetch === 'function') {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;

      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyString,
        keepalive: true,
        signal: controller ? controller.signal : undefined,
      }).catch(() => {
        // Silently fail-open
      }).finally(() => {
        if (timeoutId) clearTimeout(timeoutId);
      });
    } else if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/event', bodyString);
    }
  } catch {
    // Fail-open: Never disrupt application flow
  }
}
