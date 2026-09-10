import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as collectorHandler } from '@/app/api/analytics/event/route';
import { getAdminAnalyticsData } from '@/services/admin-analytics.service';
import { db } from '@/db';

// Mock DB to verify that no DDL (execute / CREATE TABLE / CREATE INDEX) is ever called
vi.mock('@/db', () => ({
  db: {
    execute: vi.fn().mockResolvedValue([]),
    insert: vi.fn(() => ({
      values: vi.fn().mockResolvedValue([{ id: 'mock_event_1' }]),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => {
          const queryMock: any = Promise.resolve([]);
          queryMock.groupBy = vi.fn().mockResolvedValue([]);
          queryMock.limit = vi.fn().mockResolvedValue([]);
          return queryMock;
        }),
      })),
    })),
  },
}));

describe('C0 Hardening — Zero Runtime DDL & Fail-Open Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Collector POST /api/analytics/event records event without calling db.execute or any DDL', async () => {
    const req = new Request('http://localhost/api/analytics/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'x-forwarded-for': '203.0.113.195',
      },
      body: JSON.stringify({
        eventName: 'plan_selected',
        sessionId: 'sess_1234567890abcdef',
        visitorId: 'vis_1234567890abcdef',
        platform: 'instagram',
        service: 'followers',
        planId: 'canonical-instagram-followers-starter',
        metadata: { page: 'home' },
      }),
    });

    const res = await collectorHandler(req);
    expect(res.status).toBe(204);

    // CRITICAL: Must NOT execute raw DDL
    expect(db.execute).not.toHaveBeenCalled();
    // Must insert to funnelEvents
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it('2. Collector is fail-open: If db.insert fails, returns 204 without crashing or throwing', async () => {
    vi.mocked(db.insert).mockImplementationOnce(() => {
      throw new Error('Database connection pool timeout');
    });

    const req = new Request('http://localhost/api/analytics/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'x-forwarded-for': '203.0.113.196',
      },
      body: JSON.stringify({
        eventName: 'page_view',
        sessionId: 'sess_failopen_test_9999',
        metadata: { path: '/' },
      }),
    });

    const res = await collectorHandler(req);
    // Fail-open guarantee: Frontend request does not fail with 500 error
    expect(res.status).toBe(204);
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('3. Admin Analytics Service queries data strictly read-only without executing DDL', async () => {
    // getAdminAnalyticsData should only call db.select, never db.execute
    const result = await getAdminAnalyticsData('7d');

    expect(result).toBeDefined();
    expect(result.kpis).toBeDefined();
    expect(result.fullFunnel).toBeDefined();

    // Zero DDL calls in admin analytics path
    expect(db.execute).not.toHaveBeenCalled();
    expect(db.select).toHaveBeenCalled();
  });
});
