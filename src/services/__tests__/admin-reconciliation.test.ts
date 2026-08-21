import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminReconcileRefund } from '@/services/admin-reconciliation.service';
import { POST } from '@/app/api/admin/reconciliation/refund/route';
import * as auth from '@/lib/auth';

interface MockOrder {
  id: string;
  publicId: string;
  externalOrderId: string;
  paymentStatus: string;
  status: string;
  fulfillmentStatus?: string;
  totalCents?: number;
}

interface MockOrderEvent {
  orderId: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

interface MockFulfillmentOrder {
  id: string;
  orderId: string;
  provider: string;
  externalOrderId?: string;
  providerCostCents?: number;
  providerCostSource?: string;
  status: string;
}

let mockOrdersTable: MockOrder[] = [];
let mockOrderEventsTable: MockOrderEvent[] = [];
let mockFulfillmentOrdersTable: MockFulfillmentOrder[] = [];

const mockTx = {
  query: {
    orders: {
      findMany: vi.fn(async () => {
        return mockOrdersTable;
      }),
    },
    fulfillmentOrders: {
      findMany: vi.fn(async () => {
        return mockFulfillmentOrdersTable;
      }),
    },
  },
  update: vi.fn(() => ({
    set: vi.fn((updateValues: Partial<MockOrder>) => ({
      where: vi.fn(async () => {
        if (mockOrdersTable.length > 0) {
          mockOrdersTable[0] = { ...mockOrdersTable[0], ...updateValues };
        }
      }),
    })),
  })),
  insert: vi.fn(() => ({
    values: vi.fn(async (values: MockOrderEvent) => {
      mockOrderEventsTable.push(values);
      return [values];
    }),
  })),
};

// Mock DB
vi.mock('@/db', () => {
  return {
    db: {
      transaction: vi.fn(async (cb: (tx: typeof mockTx) => Promise<unknown>) => {
        return await cb(mockTx);
      }),
    },
  };
});

// Mock Auth
vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn(),
}));

describe('Admin Refund Reconciliation Service & API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrdersTable = [];
    mockOrderEventsTable = [];
    mockFulfillmentOrdersTable = [];
    vi.mocked(auth.requireAdmin).mockResolvedValue({
      id: 'admin_root',
      name: 'Administrator',
      email: 'admin@cloutflow.co',
      role: 'SUPER_ADMIN',
    });
  });

  // Test A: PAID -> REFUNDED administrative reconciliation
  it('A. PAID -> REFUNDED administrative reconciliation transitions paymentStatus to REFUNDED and status to CANCELLED', async () => {
    mockOrdersTable = [
      {
        id: 'ord_123',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: 'PPCPMTB5HJ0CL88GIH',
        paymentStatus: 'PAID',
        status: 'PROCESSING',
        fulfillmentStatus: 'COMPLETED',
        totalCents: 500,
      },
    ];

    const result = await adminReconcileRefund({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'PPCPMTB5HJ0CL88GIH',
      confirmationPhrase: 'RECONCILE REFUND',
      adminId: 'admin_root',
    });

    expect(result.success).toBe(true);
    expect(result.code).toBe('SUCCESS');
    expect(mockOrdersTable[0].paymentStatus).toBe('REFUNDED');
    expect(mockOrdersTable[0].status).toBe('CANCELLED');
  });

  // Test B: fulfillment COMPLETED remains COMPLETED
  it('B. fulfillment COMPLETED remains COMPLETED and fulfillment fields are untouched', async () => {
    mockOrdersTable = [
      {
        id: 'ord_123',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: 'PPCPMTB5HJ0CL88GIH',
        paymentStatus: 'PAID',
        status: 'PROCESSING',
        fulfillmentStatus: 'COMPLETED',
      },
    ];

    const result = await adminReconcileRefund({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'PPCPMTB5HJ0CL88GIH',
      confirmationPhrase: 'RECONCILE REFUND',
      adminId: 'admin_root',
    });

    expect(result.success).toBe(true);
    expect(mockOrdersTable[0].fulfillmentStatus).toBe('COMPLETED');
    expect(mockOrderEventsTable[0].fulfillmentStatus).toBe('COMPLETED');
  });

  // Test C: provider cost snapshot remains untouched
  it('C. provider cost snapshot and fulfillment orders remain untouched', async () => {
    mockOrdersTable = [
      {
        id: 'ord_123',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: 'PPCPMTB5HJ0CL88GIH',
        paymentStatus: 'PAID',
        status: 'PROCESSING',
        fulfillmentStatus: 'COMPLETED',
      },
    ];

    mockFulfillmentOrdersTable = [
      {
        id: 'ful_123',
        orderId: 'ord_123',
        provider: 'peakerr',
        externalOrderId: 'ext_999',
        providerCostCents: 120,
        providerCostSource: 'ACTUAL_PROVIDER_CHARGE',
        status: 'COMPLETED',
      },
    ];

    const result = await adminReconcileRefund({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'PPCPMTB5HJ0CL88GIH',
      confirmationPhrase: 'RECONCILE REFUND',
      adminId: 'admin_root',
    });

    expect(result.success).toBe(true);
    // Ensure mockFulfillmentOrdersTable is completely unchanged
    expect(mockFulfillmentOrdersTable[0].providerCostCents).toBe(120);
    expect(mockFulfillmentOrdersTable[0].providerCostSource).toBe('ACTUAL_PROVIDER_CHARGE');
    expect(mockFulfillmentOrdersTable[0].externalOrderId).toBe('ext_999');
  });

  // Test D: already REFUNDED -> idempotent no-op
  it('D. already REFUNDED -> idempotent no-op returning ALREADY_RECONCILED without duplicate order_events', async () => {
    mockOrdersTable = [
      {
        id: 'ord_123',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: 'PPCPMTB5HJ0CL88GIH',
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED',
        fulfillmentStatus: 'COMPLETED',
      },
    ];

    const result = await adminReconcileRefund({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'PPCPMTB5HJ0CL88GIH',
      confirmationPhrase: 'RECONCILE REFUND',
      adminId: 'admin_root',
    });

    expect(result.success).toBe(true);
    expect(result.code).toBe('ALREADY_RECONCILED');
    expect(mockOrderEventsTable.length).toBe(0); // No event duplicated
  });

  // Test E: wrong PerfectPay sale code -> reject
  it('E. wrong PerfectPay sale code -> reject with WRONG_SALE_CODE', async () => {
    mockOrdersTable = [
      {
        id: 'ord_123',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: 'PPCPMTB5HJ0CL88GIH',
        paymentStatus: 'PAID',
        status: 'PROCESSING',
      },
    ];

    const result = await adminReconcileRefund({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'WRONG_CODE_XYZ',
      confirmationPhrase: 'RECONCILE REFUND',
      adminId: 'admin_root',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('WRONG_SALE_CODE');
    expect(mockOrdersTable[0].paymentStatus).toBe('PAID');
    expect(mockOrderEventsTable.length).toBe(0);
  });

  // Test F: missing confirmation -> reject
  it('F. missing confirmation -> reject with MISSING_CONFIRMATION', async () => {
    mockOrdersTable = [
      {
        id: 'ord_123',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: 'PPCPMTB5HJ0CL88GIH',
        paymentStatus: 'PAID',
        status: 'PROCESSING',
      },
    ];

    const result = await adminReconcileRefund({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'PPCPMTB5HJ0CL88GIH',
      confirmationPhrase: 'SOMETHING ELSE',
      adminId: 'admin_root',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('MISSING_CONFIRMATION');
    expect(mockOrdersTable[0].paymentStatus).toBe('PAID');
    expect(mockOrderEventsTable.length).toBe(0);
  });

  // Test G: unauthorized user -> reject
  it('G. unauthorized user -> reject with 401 when calling API endpoint', async () => {
    vi.mocked(auth.requireAdmin).mockRejectedValueOnce(new Error('Unauthorized'));

    const req = new Request('http://localhost/api/admin/reconciliation/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicId: 'CF-8602GA6TIJ',
        perfectPaySaleCode: 'PPCPMTB5HJ0CL88GIH',
        targetPaymentStatus: 'REFUNDED',
        confirmationPhrase: 'RECONCILE REFUND',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  // Test H: order_events audit row created exactly once with sanitized metadata
  it('H. order_events audit row created exactly once with required sanitized audit metadata', async () => {
    mockOrdersTable = [
      {
        id: 'ord_123',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: 'PPCPMTB5HJ0CL88GIH',
        paymentStatus: 'PAID',
        status: 'PROCESSING',
        fulfillmentStatus: 'COMPLETED',
      },
    ];

    const result = await adminReconcileRefund({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'PPCPMTB5HJ0CL88GIH',
      confirmationPhrase: 'RECONCILE REFUND',
      adminId: 'admin_root',
    });

    expect(result.success).toBe(true);
    expect(mockOrderEventsTable.length).toBe(1);

    const event = mockOrderEventsTable[0];
    expect(event.orderId).toBe('ord_123');
    expect(event.status).toBe('CANCELLED');
    expect(event.paymentStatus).toBe('REFUNDED');
    expect(event.fulfillmentStatus).toBe('COMPLETED');
    expect(event.metadata).toBeDefined();
    expect(event.metadata).toMatchObject({
      source: 'ADMIN_RECONCILIATION',
      gateway: 'perfectpay',
      perfectPaySaleCode: 'PPCPMTB5HJ0CL88GIH',
      previousPaymentStatus: 'PAID',
      newPaymentStatus: 'REFUNDED',
      reason: 'MISSING_GATEWAY_REFUND_WEBHOOK',
    });
    expect(event.metadata?.reconciledAt).toBeDefined();
    expect(event.metadata?.reconciledBy).toBe('admin_root');

    // Ensure no secrets are leaked
    expect(event.metadata?.secret).toBeUndefined();
    expect(event.metadata?.token).toBeUndefined();
  });
});
