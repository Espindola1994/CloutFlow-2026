import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { db } from '@/db';

// Mock DB
vi.mock('@/db', () => ({
  db: {
    execute: vi.fn().mockResolvedValue([]),
    insert: vi.fn(),
  },
}));


describe('POST /api/analytics/presence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Rejects missing or invalid sessionId with 400', async () => {
    const req = new Request('http://localhost:3000/api/analytics/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Valid sessionId required');
  });

  it('2. Discards bot User-Agents with 204 No Content', async () => {
    const req = new Request('http://localhost:3000/api/analytics/presence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)',
      },
      body: JSON.stringify({ sessionId: 'session-12345678' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(204);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('3. Accepts valid heartbeat, extracts geo and device, and executes upsert', async () => {
    const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const mockValues = vi.fn().mockReturnValue({
      onConflictDoUpdate: mockOnConflictDoUpdate,
    });
    vi.mocked(db.insert).mockReturnValue({
      values: mockValues,
    } as any);

    const req = new Request('http://localhost:3000/api/analytics/presence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'x-vercel-ip-country': 'BR',
        'x-vercel-ip-country-region': 'SP',
        'x-vercel-ip-city': 'S%C3%A3o%20Paulo',
        'x-vercel-ip-latitude': '-23.5505',
        'x-vercel-ip-longitude': '-46.6333',
      },
      body: JSON.stringify({
        sessionId: 'cf_sess_test_12345',
        visitorId: 'cf_vis_test_67890',
        platform: 'instagram',
        service: 'followers',
        planId: 'canonical-instagram-followers-starter',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);

    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'cf_sess_test_12345',
        visitorId: 'cf_vis_test_67890',
        platform: 'instagram',
        service: 'followers',
        planId: 'canonical-instagram-followers-starter',
        country: 'BR',
        countryCode: 'BR',
        region: 'SP',
        city: 'São Paulo',
        latitude: '-23.550500',
        longitude: '-46.633300',
        deviceType: 'desktop',
        os: 'Windows',
        browser: 'Chrome',
      })
    );
  });

  it('4. Global-First: absence of geo headers records null without error or fallback to fake location', async () => {
    const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const mockValues = vi.fn().mockReturnValue({
      onConflictDoUpdate: mockOnConflictDoUpdate,
    });
    vi.mocked(db.insert).mockReturnValue({
      values: mockValues,
    } as any);

    const req = new Request('http://localhost:3000/api/analytics/presence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15',
      },
      body: JSON.stringify({
        sessionId: 'cf_sess_no_geo_9999',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'cf_sess_no_geo_9999',
        country: null,
        countryCode: null,
        region: null,
        city: null,
        latitude: null,
        longitude: null,
        deviceType: 'mobile',
        os: 'iOS',
        browser: 'Safari',
      })
    );
  });
});
