import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as createCheckoutContext } from '@/app/api/checkout/context/route';

const mockOffers = [
  {
    id: 'off_ig_followers_2k',
    platform: 'instagram',
    service: 'followers',
    name: '2,000 Instagram Followers',
    externalCheckoutUrl: 'https://checkout.perfectpay.com.br/pay/PPA123?utm_source=default',
    perfectpayProductId: 'PPPBF6TP',
    perfectpayPlanId: 'PPLQQQ3F7',
    active: true,
  },
  {
    id: 'off_ig_likes_1k',
    platform: 'instagram',
    service: 'likes',
    name: '1,000 Instagram Likes',
    externalCheckoutUrl: 'https://checkout.perfectpay.com.br/pay/PPL456',
    perfectpayProductId: 'PPPBF6TP',
    perfectpayPlanId: 'PPLQQQ3LIKES',
    active: true,
  },
  {
    id: 'off_inactive',
    platform: 'instagram',
    service: 'followers',
    name: 'Inactive Offer',
    externalCheckoutUrl: 'https://checkout.perfectpay.com.br/pay/PPI789',
    perfectpayProductId: 'PPPBF6TP',
    perfectpayPlanId: 'PPLINACTIVE',
    active: false,
  },
  {
    id: 'off_youtube_views_5k',
    platform: 'youtube',
    service: 'views',
    name: '5,000 YouTube Views',
    externalCheckoutUrl: 'https://checkout.perfectpay.com.br/pay/PPY555',
    perfectpayProductId: 'PPPYOUTUBE',
    perfectpayPlanId: 'PPLYT5K',
    active: true,
  },
];

const mockContextsStore: any[] = [];

vi.mock('@/db', () => ({
  db: {
    query: {
      offers: {
        findMany: vi.fn().mockImplementation(() => {
          // Find offer by matching payload offerId if queried
          return Promise.resolve(mockOffers);
        }),
      },
    },
    insert: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation((val: any) => {
        mockContextsStore.push(val);
        return Promise.resolve();
      }),
    })),
  },
}));

describe('Checkout Context API - Target Validation & Security Gates', () => {
  beforeEach(() => {
    mockContextsStore.length = 0;
  });

  it('1. Generates opaque CFCTX_ context and appends src preserving existing query params for Instagram Followers', async () => {
    const payload = {
      offerId: 'off_ig_followers_2k',
      targetType: 'profile',
      socialUsername: '@julianabrizolaoficial',
      profileUrl: 'https://www.instagram.com/julianabrizolaoficial',
    };

    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await createCheckoutContext(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.contextId).toMatch(/^CFCTX_[0-9a-f]{24}$/);
    expect(json.data.contextId).not.toContain('julianabrizolaoficial'); // ZERO PII in contextId
    expect(json.data.checkoutUrl).toContain('utm_source=default'); // Preserves existing query params
    expect(json.data.checkoutUrl).toContain(`src=${json.data.contextId}`);

    expect(mockContextsStore.length).toBe(1);
    const stored = mockContextsStore[0];
    expect(stored.platform).toBe('instagram');
    expect(stored.service).toBe('followers');
    expect(stored.socialUsername).toBe('julianabrizolaoficial');
    expect(stored.perfectpayProductId).toBe('PPPBF6TP');
    expect(stored.perfectpayPlanId).toBe('PPLQQQ3F7');
  });

  it('2. Rejects Instagram Likes without targetUrl', async () => {
    const payload = {
      offerId: 'off_ig_likes_1k',
      targetType: 'post',
      socialUsername: 'some_user',
    };

    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await createCheckoutContext(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toContain('Content target URL is required');
  });

  it('3. Rejects Instagram Likes with invalid platform host URL (e.g. tiktok URL for instagram offer)', async () => {
    const payload = {
      offerId: 'off_ig_likes_1k',
      targetType: 'post',
      targetUrl: 'https://www.tiktok.com/@user/video/123456',
    };

    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await createCheckoutContext(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toContain('Invalid target URL for instagram');
  });

  it('4. Accepts YouTube Views with valid youtube.com video URL', async () => {
    const payload = {
      offerId: 'off_youtube_views_5k',
      targetType: 'video',
      targetUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    };

    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await createCheckoutContext(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.checkoutUrl).toContain(`src=${json.data.contextId}`);
  });

  it('5. Rejects SSRF / localhost / private IP URLs', async () => {
    const payload = {
      offerId: 'off_youtube_views_5k',
      targetType: 'video',
      targetUrl: 'http://localhost:3000/admin',
    };

    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await createCheckoutContext(req);
    expect(res.status).toBe(400);
  });

  it('6. Rejects Followers request when socialUsername is missing/empty', async () => {
    const payload = {
      offerId: 'off_ig_followers_2k',
      targetType: 'profile',
      socialUsername: '',
    };

    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await createCheckoutContext(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toContain('Social username is required for followers service');
  });

  it('7. Rejects Views request when targetUrl is missing', async () => {
    const payload = {
      offerId: 'off_youtube_views_5k',
      targetType: 'video',
    };

    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await createCheckoutContext(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toContain('Content target URL is required for views');
  });
});
