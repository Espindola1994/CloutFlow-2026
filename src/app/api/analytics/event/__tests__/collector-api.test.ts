import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue({ rowCount: 1 }),
    }),
  },
}));

describe('Analytics Event Collector API (POST /api/analytics/event)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts allowed event with valid payload', async () => {
    const req = new Request('http://localhost:3000/api/analytics/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body: JSON.stringify({
        eventName: 'platform_selected',
        sessionId: 'test-session-123456789',
        visitorId: 'test-visitor-123456789',
        platform: 'instagram',
        service: 'followers',
        metadata: {
          deviceCategory: 'desktop',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(204);
  });

  it('rejects unknown/disallowed event', async () => {
    const req = new Request('http://localhost:3000/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'user_clicked_random_button',
        sessionId: 'test-session-123456789',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Unknown or disallowed event');
  });

  it('strips PII fields from metadata', async () => {
    const req = new Request('http://localhost:3000/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'identifier_completed',
        sessionId: 'test-session-123456789',
        metadata: {
          email: 'secret@gmail.com',
          username: 'real_username',
          targetValue: '@myuser',
          safeField: 'valid_val',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(204);
  });

  it('rejects oversized payload', async () => {
    const req = new Request('http://localhost:3000/api/analytics/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'content-length': '20000',
      },
      body: JSON.stringify({
        eventName: 'page_view',
        sessionId: 'test-session-123456789',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it('discards known bot user agents silently with 204', async () => {
    const req = new Request('http://localhost:3000/api/analytics/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
      body: JSON.stringify({
        eventName: 'page_view',
        sessionId: 'test-session-123456789',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(204);
  });

  it('rejects invalid or missing sessionId', async () => {
    const req = new Request('http://localhost:3000/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'page_view',
        sessionId: 'abc', // too short
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects malformed JSON', async () => {
    const req = new Request('http://localhost:3000/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json{',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
