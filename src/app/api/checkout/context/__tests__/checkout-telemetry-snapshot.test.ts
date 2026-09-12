import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as checkoutContextPost } from '../route';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn(),
    query: {
      offers: {
        findMany: vi.fn(),
      },
      customers: {
        findMany: vi.fn(),
      },
      customerOffers: {
        findMany: vi.fn(),
      },
    },
  },
}));

vi.mock('@/services/lifecycle/event.service', () => ({
  emitLifecycleEvent: vi.fn().mockResolvedValue(undefined),
}));

describe('Checkout Context Telemetry Snapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Captures server-side geo, device and client session in checkoutContexts insert', async () => {
    const insertedValues: any[] = [];
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockImplementation((val) => {
        insertedValues.push(val);
        return Promise.resolve(undefined);
      }),
    } as any);

    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15',
        'x-vercel-ip-country': 'US',
        'x-vercel-ip-country-region': 'CA',
        'x-vercel-ip-city': 'San%20Francisco',
        'x-vercel-ip-latitude': '37.7749',
        'x-vercel-ip-longitude': '-122.4194',
      },
      body: JSON.stringify({
        offerId: 'canonical-instagram-followers-starter',
        targetType: 'profile',
        socialUsername: 'test_creator',
        sessionId: 'cf_asid_test_sess',
        visitorId: 'cf_aid_test_vis',
      }),
    });

    const res = await checkoutContextPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    const ccInsert = insertedValues[0];
    expect(ccInsert).toBeDefined();
    expect(ccInsert.sessionId).toBe('cf_asid_test_sess');
    expect(ccInsert.visitorId).toBe('cf_aid_test_vis');
    expect(ccInsert.country).toBe('US');
    expect(ccInsert.countryCode).toBe('US');
    expect(ccInsert.region).toBe('CA');
    expect(ccInsert.city).toBe('San Francisco');
    expect(ccInsert.latitude).toBe('37.774900');
    expect(ccInsert.longitude).toBe('-122.419400');
    expect(ccInsert.deviceType).toBe('mobile');
    expect(ccInsert.os).toBe('iOS');
    expect(ccInsert.browser).toBe('Safari');
  });

  it('2. When geo headers are absent, checkout context insert proceeds without blocking and saves null geo', async () => {
    const insertedValues: any[] = [];
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockImplementation((val) => {
        insertedValues.push(val);
        return Promise.resolve(undefined);
      }),
    } as any);

    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        offerId: 'canonical-instagram-followers-starter',
        targetType: 'profile',
        socialUsername: 'test_creator2',
      }),
    });

    const res = await checkoutContextPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    const ccInsert = insertedValues[0];
    expect(ccInsert.country).toBeNull();
    expect(ccInsert.latitude).toBeNull();
    expect(ccInsert.longitude).toBeNull();
  });
});
