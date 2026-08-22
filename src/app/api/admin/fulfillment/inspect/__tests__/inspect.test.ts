import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/admin/fulfillment/inspect/route';
import { db } from '@/db';

vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ id: 'admin_1', role: 'admin' }),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      orders: {
        findMany: vi.fn(),
      },
      fulfillmentOrders: {
        findMany: vi.fn(),
      },
      orderEvents: {
        findMany: vi.fn(),
      },
    },
  },
}));

vi.mock('@/services/fulfillment.service', () => ({
  resolveCanonicalFulfillmentTarget: vi.fn(),
}));

vi.mock('@/services/fulfillment-target-queue.service', () => ({
  inspectTargetDeliverySlot: vi.fn(),
}));

vi.mock('@/services/fulfillment-auto-dispatch.service', () => ({
  evaluateOrderForAutoDispatch: vi.fn(),
  evaluateWaitingProviderReconciliation: vi.fn(),
  evaluateWaitingProviderRecovery: vi.fn(),
}));

describe('Admin Operational Order Inspector API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // H. Admin Unauthorized
  it('Scenario H: Returns 401 when unauthorized', async () => {
    const { requireAdmin } = await import('@/lib/auth');
    (requireAdmin as any).mockRejectedValueOnce(new Error('Unauthorized'));

    const req = new Request('http://localhost/api/admin/fulfillment/inspect?status=FAILED');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });

  // I. Empty State
  it('Scenario I: Returns empty data array when no matching orders found', async () => {
    (db.query.orders.findMany as any).mockResolvedValueOnce([]);

    const req = new Request('http://localhost/api/admin/fulfillment/inspect?status=FAILED');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual([]);
  });

  // A. FAILED with provider order created
  it('Scenario A: FAILED with provider order created shows correct diagnosis & summary', async () => {
    (db.query.orders.findMany as any).mockResolvedValueOnce([
      { id: 'ord_1', publicId: 'CF-1001', fulfillmentStatus: 'FAILED', quantity: 100 }
    ]);
    (db.query.fulfillmentOrders.findMany as any).mockResolvedValueOnce([
      { externalOrderId: 'PRV-8888', providerCostCents: 50, providerCostSource: 'ACTUAL_PROVIDER_CHARGE', lastError: 'Provider sync failed' }
    ]);
    (db.query.orderEvents.findMany as any).mockResolvedValueOnce([]);

    const req = new Request('http://localhost/api/admin/fulfillment/inspect?status=FAILED');
    const res = await GET(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data[0].diagnosis.summary).toBe('Provider order exists but latest provider synchronization returned an error.');
    expect(json.data[0].diagnosis.details.hasProviderOrder).toBe(true);
    expect(json.data[0].diagnosis.details.isRetrySafe).toBe(false);
  });

  // B. FAILED before provider order created
  it('Scenario B: FAILED before provider order created allows safe retry/reconcile', async () => {
    (db.query.orders.findMany as any).mockResolvedValueOnce([
      { id: 'ord_2', publicId: 'CF-1002', fulfillmentStatus: 'FAILED', quantity: 100 }
    ]);
    (db.query.fulfillmentOrders.findMany as any).mockResolvedValueOnce([
      { externalOrderId: null, providerCostCents: 0, lastError: 'Connection timeout pre-dispatch' }
    ]);
    (db.query.orderEvents.findMany as any).mockResolvedValueOnce([]);

    const req = new Request('http://localhost/api/admin/fulfillment/inspect?status=FAILED');
    const res = await GET(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data[0].diagnosis.summary).toBe('Dispatch failed before a provider order was created.');
    expect(json.data[0].diagnosis.details.hasProviderOrder).toBe(false);
    expect(json.data[0].diagnosis.details.isRetrySafe).toBe(true);
    expect(json.data[0].diagnosis.actions).toContain('Reconcile');
  });

  // C. NOT_DISPATCHED by missing target
  it('Scenario C: NOT_DISPATCHED by missing target URL', async () => {
    (db.query.orders.findMany as any).mockResolvedValueOnce([
      { id: 'ord_3', publicId: 'CF-1003', fulfillmentStatus: 'NOT_DISPATCHED' }
    ]);
    (db.query.fulfillmentOrders.findMany as any).mockResolvedValueOnce([]);
    (db.query.orderEvents.findMany as any).mockResolvedValueOnce([]);

    const { evaluateOrderForAutoDispatch } = await import('@/services/fulfillment-auto-dispatch.service');
    (evaluateOrderForAutoDispatch as any).mockResolvedValueOnce({
      eligible: false,
      code: 'BLOCKED_MISSING_TARGET',
      reason: 'No target URL provided.',
    });

    const req = new Request('http://localhost/api/admin/fulfillment/inspect?status=NOT_DISPATCHED');
    const res = await GET(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data[0].diagnosis.summary).toBe('Order is missing a valid target URL for delivery.');
    expect(json.data[0].diagnosis.details.missingRequirement).toBe('TARGET');
  });

  // D. NOT_DISPATCHED by missing chain
  it('Scenario D: NOT_DISPATCHED by missing chain mapping', async () => {
    (db.query.orders.findMany as any).mockResolvedValueOnce([
      { id: 'ord_4', publicId: 'CF-1004', fulfillmentStatus: 'NOT_DISPATCHED' }
    ]);
    (db.query.fulfillmentOrders.findMany as any).mockResolvedValueOnce([]);
    (db.query.orderEvents.findMany as any).mockResolvedValueOnce([]);

    const { evaluateOrderForAutoDispatch } = await import('@/services/fulfillment-auto-dispatch.service');
    (evaluateOrderForAutoDispatch as any).mockResolvedValueOnce({
      eligible: false,
      code: 'BLOCKED_MISSING_CHAIN',
      reason: 'No matching active chain.',
    });

    const req = new Request('http://localhost/api/admin/fulfillment/inspect?status=NOT_DISPATCHED');
    const res = await GET(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data[0].diagnosis.summary).toBe('Order cannot dispatch because no active fulfillment chain matches this service.');
  });

  // E. WAITING_TARGET_SLOT Busy
  it('Scenario E: WAITING_TARGET_SLOT with busy slot', async () => {
    (db.query.orders.findMany as any).mockResolvedValueOnce([
      { id: 'ord_5', publicId: 'CF-1005', fulfillmentStatus: 'WAITING_TARGET_SLOT', platform: 'instagram' }
    ]);
    (db.query.fulfillmentOrders.findMany as any).mockResolvedValueOnce([]);
    (db.query.orderEvents.findMany as any).mockResolvedValueOnce([]);

    const { resolveCanonicalFulfillmentTarget } = await import('@/services/fulfillment.service');
    const { inspectTargetDeliverySlot } = await import('@/services/fulfillment-target-queue.service');
    (resolveCanonicalFulfillmentTarget as any).mockReturnValueOnce({
      success: true,
      target: 'cristiano'
    });
    (inspectTargetDeliverySlot as any).mockResolvedValueOnce({
      isSlotBusy: true,
      activeOrder: { id: 'active_ord_99' }
    });

    const req = new Request('http://localhost/api/admin/fulfillment/inspect?status=WAITING_TARGET_SLOT');
    const res = await GET(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data[0].diagnosis.summary).toBe('Waiting because another active delivery is using this instagram target.');
    expect(json.data[0].diagnosis.details.slotStatus).toBe('BUSY');
    expect(json.data[0].diagnosis.details.activeOrderOccupying).toBe('active_ord_99');
  });

  // F. WAITING_TARGET_SLOT Free
  it('Scenario F: WAITING_TARGET_SLOT with free slot', async () => {
    (db.query.orders.findMany as any).mockResolvedValueOnce([
      { id: 'ord_6', publicId: 'CF-1006', fulfillmentStatus: 'WAITING_TARGET_SLOT', platform: 'instagram' }
    ]);
    (db.query.fulfillmentOrders.findMany as any).mockResolvedValueOnce([]);
    (db.query.orderEvents.findMany as any).mockResolvedValueOnce([]);

    const { resolveCanonicalFulfillmentTarget } = await import('@/services/fulfillment.service');
    const { inspectTargetDeliverySlot } = await import('@/services/fulfillment-target-queue.service');
    (resolveCanonicalFulfillmentTarget as any).mockReturnValueOnce({
      success: true,
      target: 'cristiano'
    });
    (inspectTargetDeliverySlot as any).mockResolvedValueOnce({
      isSlotBusy: false,
      activeOrder: null
    });

    const req = new Request('http://localhost/api/admin/fulfillment/inspect?status=WAITING_TARGET_SLOT');
    const res = await GET(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data[0].diagnosis.summary).toBe('Target slot is free. Order should be dispatched in the next cycle.');
    expect(json.data[0].diagnosis.details.slotStatus).toBe('FREE');
  });

  // G. Provider Cost UNKNOWN
  it('Scenario G: Provider cost source is UNKNOWN or null', async () => {
    (db.query.orders.findMany as any).mockResolvedValueOnce([
      { id: 'ord_7', publicId: 'CF-1007', fulfillmentStatus: 'PROCESSING' }
    ]);
    (db.query.fulfillmentOrders.findMany as any).mockResolvedValueOnce([
      { externalOrderId: 'PRV-1111', providerCostCents: null, providerCostSource: null }
    ]);
    (db.query.orderEvents.findMany as any).mockResolvedValueOnce([]);

    const req = new Request('http://localhost/api/admin/fulfillment/inspect?status=PROCESSING');
    const res = await GET(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data[0].providerInfo.costCents).toBeNull();
    expect(json.data[0].providerInfo.costSource).toBeNull();
  });
});
