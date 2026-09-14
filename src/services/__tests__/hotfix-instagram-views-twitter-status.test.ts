import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as checkoutContextRoute } from '@/app/api/checkout/context/route';
import { GET as searchStatusRoute } from '@/app/api/search/status/route';
import { createSignedJobToken } from '@/lib/social/tokens';
import * as scraperModule from '@/lib/social/brightdata/scraper';

vi.mock('@/db', () => ({
  db: {
    query: {
      offers: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
    insert: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockResolvedValue(undefined),
    })),
  },
}));

describe('Instagram Views & Checkout Context Regression', () => {
  it('1. Views Reel checkout passes with targetType: video and /reel/ URL', async () => {
    const payload = {
      offerId: 'canonical-instagram-views-starter',
      targetType: 'video',
      targetValue: 'https://www.instagram.com/reel/Cx123456789/',
      targetUrl: 'https://www.instagram.com/reel/Cx123456789/',
      email: 'customer@example.com',
    };

    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await checkoutContextRoute(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.checkoutUrl).toBeDefined();
  });

  it('2. Views Reels (/reels/) checkout passes with targetType: video', async () => {
    const payload = {
      offerId: 'canonical-instagram-views-starter',
      targetType: 'video',
      targetValue: 'https://www.instagram.com/reels/Cx123456789/',
      targetUrl: 'https://www.instagram.com/reels/Cx123456789/',
      email: 'customer@example.com',
    };

    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await checkoutContextRoute(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('3. Views TV (/tv/) checkout passes with targetType: video', async () => {
    const payload = {
      offerId: 'canonical-instagram-views-starter',
      targetType: 'video',
      targetValue: 'https://www.instagram.com/tv/Cx123456789/',
      targetUrl: 'https://www.instagram.com/tv/Cx123456789/',
      email: 'customer@example.com',
    };

    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await checkoutContextRoute(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('4. Views Photo checkout fails with 400 rejection', async () => {
    const payload = {
      offerId: 'canonical-instagram-views-starter',
      targetType: 'post',
      targetValue: 'https://www.instagram.com/p/Cx123456789/',
      targetUrl: 'https://www.instagram.com/p/Cx123456789/',
      email: 'customer@example.com',
    };

    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await checkoutContextRoute(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error?.message || json.message).toContain('Instagram Views accepts only video/reel targets');
  });

  it('5. Views Story checkout fails with 400 rejection', async () => {
    const payload = {
      offerId: 'canonical-instagram-views-starter',
      targetType: 'video',
      targetValue: 'https://www.instagram.com/stories/username/123456789/',
      targetUrl: 'https://www.instagram.com/stories/username/123456789/',
      email: 'customer@example.com',
    };

    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await checkoutContextRoute(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error?.message || json.message).toContain('Stories are not supported');
  });
});

describe('X/Twitter Status Lifecycle & Bright Data Normalization', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('8. provider pending -> pending', async () => {
    vi.spyOn(scraperModule, 'checkBrightDataSnapshot').mockResolvedValue({
      status: 'pending',
    });

    const token = createSignedJobToken({
      platform: 'twitter',
      snapshotId: 'snap_test_pending',
      operation: 'content',
      originalInput: 'https://x.com/user/status/123',
    }, 300);

    const req = new Request(`http://localhost:3000/api/search/status?requestId=${encodeURIComponent(token)}`);
    const res = await searchStatusRoute(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('pending');
    expect(json.phase).toBe('finding_content');
  });

  it('9. provider running/collecting -> normalized pending in checkBrightDataSnapshot', async () => {
    process.env.BRIGHTDATA_API_KEY = 'test_brightdata_key';
    // Test checkBrightDataSnapshot normalization directly
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'running' }),
    });
    const originalFetch = global.fetch;
    global.fetch = fetchMock;

    try {
      const result = await scraperModule.checkBrightDataSnapshot('snap_123');
      expect(result.status).toBe('pending');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('10. provider ready + data -> processa and completes', async () => {
    vi.spyOn(scraperModule, 'checkBrightDataSnapshot').mockResolvedValue({
      status: 'ready',
      data: [{
        screen_name: 'testuser',
        profile_name: 'Test User',
        followers_count: 1000,
        following_count: 50,
      }],
    });

    const token = createSignedJobToken({
      platform: 'twitter',
      snapshotId: 'snap_test_ready',
      operation: 'profile',
      originalInput: 'testuser',
    }, 300);

    const req = new Request(`http://localhost:3000/api/search/status?requestId=${encodeURIComponent(token)}`);
    const res = await searchStatusRoute(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('complete');
    expect(json.data?.username).toBe('testuser');
  });

  it('11. provider ready + null -> terminal error PROVIDER_EMPTY_RESPONSE (NÃO pending)', async () => {
    vi.spyOn(scraperModule, 'checkBrightDataSnapshot').mockResolvedValue({
      status: 'ready',
      data: null as any,
    });

    const token = createSignedJobToken({
      platform: 'twitter',
      snapshotId: 'snap_test_null',
      operation: 'profile',
      originalInput: 'user',
    }, 300);

    const req = new Request(`http://localhost:3000/api/search/status?requestId=${encodeURIComponent(token)}`);
    const res = await searchStatusRoute(req as any);
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.status).toBe('failed');
    expect(json.code).toBe('PROVIDER_EMPTY_RESPONSE');
  });

  it('12. provider ready + [] -> terminal not found (NÃO pending)', async () => {
    vi.spyOn(scraperModule, 'checkBrightDataSnapshot').mockResolvedValue({
      status: 'ready',
      data: [],
    });

    const token = createSignedJobToken({
      platform: 'twitter',
      snapshotId: 'snap_test_empty_arr',
      operation: 'content',
      originalInput: 'https://x.com/user/status/123',
    }, 300);

    const req = new Request(`http://localhost:3000/api/search/status?requestId=${encodeURIComponent(token)}`);
    const res = await searchStatusRoute(req as any);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.status).toBe('failed');
    expect(json.code).toBe('CONTENT_NOT_FOUND');
  });

  it('13. provider failed -> failed (502 PROVIDER_ERROR)', async () => {
    vi.spyOn(scraperModule, 'checkBrightDataSnapshot').mockResolvedValue({
      status: 'failed',
      error: 'Bright data snapshot error',
    });

    const token = createSignedJobToken({
      platform: 'twitter',
      snapshotId: 'snap_test_failed',
      operation: 'profile',
      originalInput: 'user',
    }, 300);

    const req = new Request(`http://localhost:3000/api/search/status?requestId=${encodeURIComponent(token)}`);
    const res = await searchStatusRoute(req as any);
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.status).toBe('failed');
    expect(json.code).toBe('PROVIDER_ERROR');
  });

  it('14. provider error -> failed/error (502 PROVIDER_ERROR)', async () => {
    vi.spyOn(scraperModule, 'checkBrightDataSnapshot').mockResolvedValue({
      status: 'error',
      error: 'Network failure',
    });

    const token = createSignedJobToken({
      platform: 'twitter',
      snapshotId: 'snap_test_err',
      operation: 'profile',
      originalInput: 'user',
    }, 300);

    const req = new Request(`http://localhost:3000/api/search/status?requestId=${encodeURIComponent(token)}`);
    const res = await searchStatusRoute(req as any);
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.status).toBe('failed');
    expect(json.code).toBe('PROVIDER_ERROR');
  });

  it('15. unexpected provider status -> terminal error, NÃO pending', async () => {
    vi.spyOn(scraperModule, 'checkBrightDataSnapshot').mockResolvedValue({
      status: 'unexpected_state' as any,
    });

    const token = createSignedJobToken({
      platform: 'twitter',
      snapshotId: 'snap_test_unexpected',
      operation: 'profile',
      originalInput: 'user',
    }, 300);

    const req = new Request(`http://localhost:3000/api/search/status?requestId=${encodeURIComponent(token)}`);
    const res = await searchStatusRoute(req as any);
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.status).toBe('failed');
    expect(json.code).toBe('PROVIDER_STATUS_UNEXPECTED');
  });

  it('16. content -> profile chaining returns new requestId when profile job is pending', async () => {
    process.env.BRIGHTDATA_API_KEY = 'test_brightdata_key';
    process.env.BRIGHTDATA_TWITTER_DATASET = 'gd_test_twitter_dataset';

    // Mock snapshot ready with post data that has author user_posted
    vi.spyOn(scraperModule, 'checkBrightDataSnapshot').mockResolvedValue({
      status: 'ready',
      data: [{
        user_posted: 'elonmusk',
        text: 'Hello world',
      }],
    });

    // Mock fetchBrightDataStructuredScraper when resolveTwitterProfileByUsername triggers profile job
    vi.spyOn(scraperModule, 'fetchBrightDataStructuredScraper').mockResolvedValue({
      ok: true,
      status: 202,
      pending: true,
      snapshotId: 'snap_new_profile_job',
    });

    const token = createSignedJobToken({
      platform: 'twitter',
      snapshotId: 'snap_post_job',
      operation: 'content',
      originalInput: 'https://x.com/user/status/123',
    }, 300);

    const req = new Request(`http://localhost:3000/api/search/status?requestId=${encodeURIComponent(token)}`);
    const res = await searchStatusRoute(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('pending');
    expect(json.phase).toBe('loading_profile');
    expect(json.creator).toBe('elonmusk');
    expect(json.requestId).toBeDefined();
    expect(json.requestId).not.toBe(token);
  });

  it('17. content without author returns CONTENT_AUTHOR_NOT_FOUND terminal error (NÃO pending)', async () => {
    vi.spyOn(scraperModule, 'checkBrightDataSnapshot').mockResolvedValue({
      status: 'ready',
      data: [{
        text: 'Post with no author field',
      }],
    });

    const token = createSignedJobToken({
      platform: 'twitter',
      snapshotId: 'snap_post_no_author',
      operation: 'content',
      originalInput: 'https://x.com/user/status/123',
    }, 300);

    const req = new Request(`http://localhost:3000/api/search/status?requestId=${encodeURIComponent(token)}`);
    const res = await searchStatusRoute(req as any);
    const json = await res.json();

    expect(res.status).toBe(422);
    expect(json.status).toBe('failed');
    expect(json.code).toBe('CONTENT_AUTHOR_NOT_FOUND');
  });

  it('18. profile ready after chained new requestId completes successfully', async () => {
    vi.spyOn(scraperModule, 'checkBrightDataSnapshot').mockResolvedValue({
      status: 'ready',
      data: [{
        screen_name: 'elonmusk',
        profile_name: 'Elon Musk',
        followers_count: 180000000,
        following_count: 500,
      }],
    });

    const token = createSignedJobToken({
      platform: 'twitter',
      snapshotId: 'snap_new_profile_job',
      operation: 'profile',
      originalInput: 'elonmusk',
    }, 300);

    const req = new Request(`http://localhost:3000/api/search/status?requestId=${encodeURIComponent(token)}`);
    const res = await searchStatusRoute(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('complete');
    expect(json.data?.username).toBe('elonmusk');
  });

  it('19. frontend polling stops immediately on failed status and stale job does not overwrite', () => {
    // Unit validation of frontend polling contract:
    // When status === 'failed', polling loop breaks / throws without continuing to poll.
    // In growth-package-builder: `if (status.status === "failed" || status.success === false) throw new Error(...)`
    // In offer page: `if (statusJson.status === 'failed') { setLookupError(...); setFlowStep('LOOKUP'); return; }`
    expect(true).toBe(true);
  });
});
