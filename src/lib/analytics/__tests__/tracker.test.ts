import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackAnalyticsEvent } from '../tracker';
import { getAnonymousVisitorId, getAnonymousSessionId, captureSessionAttribution } from '../identity';

describe('Analytics Client Tracker & Identity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates and persists first-party visitorId and sessionId', () => {
    const vid1 = getAnonymousVisitorId();
    const vid2 = getAnonymousVisitorId();
    expect(vid1).toBeDefined();
    expect(vid1.length).toBeGreaterThan(10);
    expect(vid1).toBe(vid2); // Idempotent

    const sid1 = getAnonymousSessionId();
    const sid2 = getAnonymousSessionId();
    expect(sid1).toBeDefined();
    expect(sid1).toBe(sid2);
  });

  it('trackAnalyticsEvent is fail-open and never throws even when fetch fails', () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    expect(() => {
      trackAnalyticsEvent('page_view', { platform: 'instagram', service: 'followers' });
    }).not.toThrow();

    global.fetch = originalFetch;
  });

  it('trackAnalyticsEvent deduplicates one-shot events per session', () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    global.fetch = fetchMock;

    trackAnalyticsEvent('pricing_viewed', { platform: 'instagram', service: 'followers' });
    trackAnalyticsEvent('pricing_viewed', { platform: 'instagram', service: 'followers' });

    // Only one should be emitted due to dedup
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('captures UTM attribution first-party from URL', () => {
    const attr = captureSessionAttribution();
    expect(attr).toBeDefined();
    expect(typeof attr).toBe('object');
  });
});
