import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { db } from '@/db';

// Mock DB
vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
    insert: vi.fn(),
  },
}));

describe('POST /api/analytics/presence (Phase 1.1 Foundation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. presence does NOT execute DDL (no db.execute, no CREATE/ALTER)', async () => {
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
      },
      body: JSON.stringify({
        sessionId: 'cf_sess_test_12345',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    // db.execute should NEVER be called (zero runtime DDL)
    expect(db.execute).not.toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it('2. Rejects missing or invalid sessionId with 400', async () => {
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

  it('3. Discards bot User-Agents with 204 No Content', async () => {
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

  it('4. DB presence absent or throwing => heartbeat fail-open (HTTP 200, ok: false)', async () => {
    vi.mocked(db.insert).mockImplementation(() => {
      throw new Error('relation "visitor_presence" does not exist');
    });

    const req = new Request('http://localhost:3000/api/analytics/presence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: 'cf_sess_failopen_test',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(false);
    // Crucial: no DDL attempt on error!
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('5. ACTIVE vs EXPIRATION: expires_at is ~now + 3 minutes (180s), lastSeenAt is now', async () => {
    let capturedValues: any = null;
    const mockOnConflictDoUpdate = vi.fn().mockImplementation((arg) => {
      return Promise.resolve(undefined);
    });
    const mockValues = vi.fn().mockImplementation((val) => {
      capturedValues = val;
      return {
        onConflictDoUpdate: mockOnConflictDoUpdate,
      };
    });
    vi.mocked(db.insert).mockReturnValue({
      values: mockValues,
    } as any);

    const beforeCall = Date.now();
    const req = new Request('http://localhost:3000/api/analytics/presence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: 'cf_sess_time_test_123',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(capturedValues).toBeDefined();
    const lastSeenAtTime = capturedValues.lastSeenAt.getTime();
    const expiresAtTime = capturedValues.expiresAt.getTime();

    // lastSeenAt is roughly now
    expect(lastSeenAtTime).toBeGreaterThanOrEqual(beforeCall - 100);
    expect(lastSeenAtTime).toBeLessThanOrEqual(Date.now() + 100);

    // expires_at is approx 180,000 ms (3 minutes) ahead of lastSeenAt, NOT 90s!
    const diffMs = expiresAtTime - lastSeenAtTime;
    expect(diffMs).toBe(180 * 1000); // exactly 180 seconds (3 minutes)
  });

  it('6. Subsequent heartbeat maintains same sessionId and updates onConflict', async () => {
    let onConflictPayload: any = null;
    const mockOnConflictDoUpdate = vi.fn().mockImplementation((config) => {
      onConflictPayload = config;
      return Promise.resolve(undefined);
    });
    const mockValues = vi.fn().mockReturnValue({
      onConflictDoUpdate: mockOnConflictDoUpdate,
    });
    vi.mocked(db.insert).mockReturnValue({
      values: mockValues,
    } as any);

    const req = new Request('http://localhost:3000/api/analytics/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'cf_sess_repeat_44444',
        visitorId: 'cf_vis_repeat_55555',
        platform: 'instagram',
        service: 'followers',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'cf_sess_repeat_44444',
        visitorId: 'cf_vis_repeat_55555',
      })
    );
    expect(onConflictPayload).toBeDefined();
    expect(onConflictPayload.set).toBeDefined();
    expect(onConflictPayload.set.visitorId).toBe('cf_vis_repeat_55555');
  });

  it('7. Invalid/arbitrary platform, service, and planId sanitized to null silently without error', async () => {
    let capturedValues: any = null;
    const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const mockValues = vi.fn().mockImplementation((val) => {
      capturedValues = val;
      return { onConflictDoUpdate: mockOnConflictDoUpdate };
    });
    vi.mocked(db.insert).mockReturnValue({
      values: mockValues,
    } as any);

    const req = new Request('http://localhost:3000/api/analytics/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'cf_sess_invalid_inputs_123',
        platform: '<script>alert(1)</script>',
        service: 'DROP TABLE visitor_presence;',
        planId: 'hacked-plan-arbitrary-string',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);

    expect(capturedValues.platform).toBeNull();
    expect(capturedValues.service).toBeNull();
    expect(capturedValues.planId).toBeNull();
  });

  it('8. YouTube Followers (unsupported combo) sanitized service to null', async () => {
    let capturedValues: any = null;
    const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const mockValues = vi.fn().mockImplementation((val) => {
      capturedValues = val;
      return { onConflictDoUpdate: mockOnConflictDoUpdate };
    });
    vi.mocked(db.insert).mockReturnValue({
      values: mockValues,
    } as any);

    const req = new Request('http://localhost:3000/api/analytics/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'cf_sess_yt_followers_123',
        platform: 'youtube',
        service: 'followers', // not supported on YouTube
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(capturedValues.platform).toBe('youtube');
    expect(capturedValues.service).toBeNull();
  });

  it('9. Canonical platform, service, and planId are preserved when valid', async () => {
    let capturedValues: any = null;
    const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const mockValues = vi.fn().mockImplementation((val) => {
      capturedValues = val;
      return { onConflictDoUpdate: mockOnConflictDoUpdate };
    });
    vi.mocked(db.insert).mockReturnValue({
      values: mockValues,
    } as any);

    const req = new Request('http://localhost:3000/api/analytics/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'cf_sess_canonical_valid',
        platform: 'tiktok',
        service: 'likes',
        planId: 'canonical-tiktok-likes-growth',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(capturedValues.platform).toBe('tiktok');
    expect(capturedValues.service).toBe('likes');
    expect(capturedValues.planId).toBe('canonical-tiktok-likes-growth');
  });

  it('10. Zero PII stored: no email, username, url, phone, IP in presence record', async () => {
    let capturedValues: any = null;
    const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const mockValues = vi.fn().mockImplementation((val) => {
      capturedValues = val;
      return { onConflictDoUpdate: mockOnConflictDoUpdate };
    });
    vi.mocked(db.insert).mockReturnValue({
      values: mockValues,
    } as any);

    const req = new Request('http://localhost:3000/api/analytics/presence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.195',
      },
      body: JSON.stringify({
        sessionId: 'cf_sess_no_pii_here',
        email: 'attacker@example.com',
        username: 'victim_user',
        phone: '+15551234567',
        targetUrl: 'https://instagram.com/victim_user',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    // Verify none of the PII fields exist in the values passed to insert
    expect(capturedValues.email).toBeUndefined();
    expect(capturedValues.username).toBeUndefined();
    expect(capturedValues.phone).toBeUndefined();
    expect(capturedValues.targetUrl).toBeUndefined();
    expect(capturedValues.ip).toBeUndefined();
  });

  it('11. Global-First: absence of geo headers records null without defaulting to Brazil/SP', async () => {
    let capturedValues: any = null;
    const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const mockValues = vi.fn().mockImplementation((val) => {
      capturedValues = val;
      return { onConflictDoUpdate: mockOnConflictDoUpdate };
    });
    vi.mocked(db.insert).mockReturnValue({
      values: mockValues,
    } as any);

    const req = new Request('http://localhost:3000/api/analytics/presence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: 'cf_sess_no_geo_global',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(capturedValues.country).toBeNull();
    expect(capturedValues.countryCode).toBeNull();
    expect(capturedValues.region).toBeNull();
    expect(capturedValues.city).toBeNull();
    expect(capturedValues.latitude).toBeNull();
    expect(capturedValues.longitude).toBeNull();
  });

  it('12. Device detection: Desktop, iOS, Android detected accurately', async () => {
    const uaTests = [
      {
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0',
        deviceType: 'desktop',
        os: 'Windows',
        browser: 'Chrome',
      },
      {
        ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
        deviceType: 'mobile',
        os: 'iOS',
        browser: 'Safari',
      },
      {
        ua: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 Chrome/122.0 Mobile Safari/537.36',
        deviceType: 'mobile',
        os: 'Android',
        browser: 'Chrome',
      },
    ];

    for (const t of uaTests) {
      let capturedValues: any = null;
      const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
      const mockValues = vi.fn().mockImplementation((val) => {
        capturedValues = val;
        return { onConflictDoUpdate: mockOnConflictDoUpdate };
      });
      vi.mocked(db.insert).mockReturnValue({
        values: mockValues,
      } as any);

      const req = new Request('http://localhost:3000/api/analytics/presence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-agent': t.ua,
        },
        body: JSON.stringify({
          sessionId: 'cf_sess_device_test_' + t.os,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(capturedValues.deviceType).toBe(t.deviceType);
      expect(capturedValues.os).toBe(t.os);
      expect(capturedValues.browser).toBe(t.browser);
    }
  });
});
