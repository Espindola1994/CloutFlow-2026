import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as createOfferPost } from '@/app/api/admin/offers/route';
import { PATCH as updateOfferPatch } from '@/app/api/admin/offers/[id]/route';
import { POST as checkoutContextPost } from '@/app/api/checkout/context/route';

// Mock auth & DB
vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ id: 'admin-1', role: 'admin' }),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      offers: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'new-offer-1' }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'offer-1', platform: 'youtube', service: 'followers' }]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(true),
    }),
  },
}));

import { db } from '@/db';

describe('Admin & Checkout APIs - YouTube Followers Strict Blocking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. POST /api/admin/offers rejects creation of youtube + followers with 400', async () => {
    const req = new Request('http://localhost:3000/api/admin/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'youtube',
        service: 'followers',
        name: 'Starter',
        quantity: 1000,
        priceCents: 1490,
      }),
    });

    const res = await createOfferPost(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toContain("Service 'followers' is not permitted for platform 'youtube'");
  });

  it('2. PATCH /api/admin/offers/[id] rejects updating an offer to youtube + followers with 400', async () => {
    (db.query.offers.findMany as any).mockResolvedValueOnce([
      {
        id: 'offer-1',
        platform: 'youtube',
        service: 'likes',
        name: 'Starter',
        quantity: 1000,
        priceCents: 1490,
      },
    ]);

    const req = new Request('http://localhost:3000/api/admin/offers/offer-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: 'followers',
      }),
    });

    const res = await updateOfferPatch(req, { params: Promise.resolve({ id: 'offer-1' }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toContain("Service 'followers' is not permitted for platform 'youtube'");
  });

  it('3. POST /api/checkout/context rejects checkout creation for youtube + followers offer with 400', async () => {
    (db.query.offers.findMany as any).mockResolvedValueOnce([
      {
        id: 'invalid-yt-followers',
        platform: 'youtube',
        service: 'followers',
        name: 'Starter',
        priceCents: 1490,
        active: true,
        externalCheckoutUrl: 'https://pay.perfectpay.com.br/checkout/abc',
        perfectpayProductId: 'PPP123',
        perfectpayPlanId: 'PLN123',
      },
    ]);

    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerId: 'invalid-yt-followers',
        targetType: 'channel',
        targetValue: '@testchannel',
        email: 'test@example.com',
      }),
    });

    const res = await checkoutContextPost(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toContain("Service 'followers' is not available for platform 'youtube'");
  });
});
