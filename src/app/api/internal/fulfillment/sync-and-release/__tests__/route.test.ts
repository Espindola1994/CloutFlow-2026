import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/internal/fulfillment/sync-and-release/route';
import * as syncService from '@/services/fulfillment-sync.service';

vi.mock('@/services/fulfillment-sync.service', () => ({
  syncStatusesAndReleaseQueues: vi.fn(),
}));

describe('POST /api/internal/fulfillment/sync-and-release Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test_cron_secret_123';
    process.env.PEAKERR_STATUS_SYNC_ENABLED = 'true';
  });

  it('1. Returns 401 when Authorization header is missing', async () => {
    const req = new Request('http://localhost:3000/api/internal/fulfillment/sync-and-release', {
      method: 'POST',
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error).toContain('Unauthorized');
  });

  it('2. Returns 401 when Authorization header is incorrect', async () => {
    const req = new Request('http://localhost:3000/api/internal/fulfillment/sync-and-release', {
      method: 'POST',
      headers: {
        authorization: 'Bearer wrong_secret',
      },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('3. Returns 200 with code STATUS_SYNC_DISABLED when flag is false', async () => {
    process.env.PEAKERR_STATUS_SYNC_ENABLED = 'false';

    const req = new Request('http://localhost:3000/api/internal/fulfillment/sync-and-release', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test_cron_secret_123',
      },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(false);
    expect(json.code).toBe('STATUS_SYNC_DISABLED');
  });

  it('4. Executes syncStatusesAndReleaseQueues and returns sanitized metrics on valid auth', async () => {
    vi.mocked(syncService.syncStatusesAndReleaseQueues).mockResolvedValue({
      success: true,
      statusSyncEnabled: true,
      targetQueueAutoReleaseEnabled: true,
      autoDispatchEnabled: true,
      liveFulfillmentEnabled: true,
      checked: 1,
      updated: 1,
      completed: 1,
      partial: 0,
      canceled: 0,
      unchanged: 0,
      queueReleaseAttempts: 1,
      queueReleaseSuccess: 1,
      queueReleaseBlocked: 0,
      errors: 0,
      releasedOrders: [
        {
          orderId: 'ord_8602',
          publicId: 'CF-8602GA6T1J',
          target: 'https://instagram.com/guilhermeterraaa',
          status: 'PROCESSING',
        },
      ],
      details: ['Target queue released next order CF-8602GA6T1J'],
    });

    const req = new Request('http://localhost:3000/api/internal/fulfillment/sync-and-release', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test_cron_secret_123',
      },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.checked).toBe(1);
    expect(json.completed).toBe(1);
    expect(json.queueReleaseSuccess).toBe(1);
    expect(json.releasedOrders).toHaveLength(1);
    expect(syncService.syncStatusesAndReleaseQueues).toHaveBeenCalledTimes(1);
  });

  it('5. GET delegates to POST handler', async () => {
    const req = new Request('http://localhost:3000/api/internal/fulfillment/sync-and-release', {
      method: 'GET',
      headers: {
        authorization: 'Bearer test_cron_secret_123',
      },
    });

    vi.mocked(syncService.syncStatusesAndReleaseQueues).mockResolvedValue({
      success: true,
      statusSyncEnabled: true,
      targetQueueAutoReleaseEnabled: true,
      autoDispatchEnabled: true,
      liveFulfillmentEnabled: true,
      checked: 0,
      updated: 0,
      completed: 0,
      partial: 0,
      canceled: 0,
      unchanged: 0,
      queueReleaseAttempts: 0,
      queueReleaseSuccess: 0,
      queueReleaseBlocked: 0,
      errors: 0,
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
