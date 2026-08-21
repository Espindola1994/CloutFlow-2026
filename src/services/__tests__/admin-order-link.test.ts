import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  repairPerfectPayOrderLink,
  REPAIR_CONFIRMATION_PHRASE,
} from '@/services/admin-order-link.service';
import { POST } from '@/app/api/admin/reconciliation/repair-link/route';
import * as auth from '@/lib/auth';

interface MockOrder {
  id: string;
  publicId: string;
  externalOrderId: string | null;
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
  status: string;
  providerCostCents?: number;
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

describe('Admin PerfectPay Order Link Repair Service & API', () => {
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

  // Test A: null externalOrderId + unique proven match => link allowed
  it('A. null externalOrderId + unique proven match => successfully links and populates externalOrderId', async () => {
    mockOrdersTable = [
      {
        id: 'ord_cf8602_uuid',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: null,
        paymentStatus: 'PAID',
        status: 'PROCESSING',
        fulfillmentStatus: 'NOT_DISPATCHED',
      },
    ];

    // Query mock implementation to differentiate first call (find order) vs second call (uniqueness check)
    let findCalls = 0;
    mockTx.query.orders.findMany.mockImplementation(async () => {
      findCalls++;
      if (findCalls === 1) {
        return [mockOrdersTable[0]]; // Target order
      }
      return []; // No conflicting orders
    });

    const result = await repairPerfectPayOrderLink({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'PPCPMTB5HJ0CL88GIH',
      confirmation: REPAIR_CONFIRMATION_PHRASE,
      adminId: 'admin_root',
    });

    expect(result.success).toBe(true);
    expect(result.code).toBe('SUCCESS');
    expect(result.orderId).toBe('ord_cf8602_uuid');
    expect(result.newExternalOrderId).toBe('PPCPMTB5HJ0CL88GIH');
    expect(result.previousExternalOrderId).toBeNull();
    expect(mockOrdersTable[0].externalOrderId).toBe('PPCPMTB5HJ0CL88GIH');
  });

  // Test B: already same sale code => ALREADY_LINKED
  it('B. already same sale code => returns ALREADY_LINKED idempotently without error', async () => {
    mockOrdersTable = [
      {
        id: 'ord_cf8602_uuid',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: 'PPCPMTB5HJ0CL88GIH',
        paymentStatus: 'PAID',
        status: 'PROCESSING',
      },
    ];

    mockTx.query.orders.findMany.mockResolvedValue([mockOrdersTable[0]]);

    const result = await repairPerfectPayOrderLink({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'PPCPMTB5HJ0CL88GIH',
      confirmation: REPAIR_CONFIRMATION_PHRASE,
      adminId: 'admin_root',
    });

    expect(result.success).toBe(true);
    expect(result.code).toBe('ALREADY_LINKED');
    expect(result.newExternalOrderId).toBe('PPCPMTB5HJ0CL88GIH');
    expect(mockOrderEventsTable).toHaveLength(0); // No extra mutation or event
  });

  // Test C: different existing sale code => conflict/reject
  it('C. different existing sale code => rejects with EXTERNAL_ORDER_ID_CONFLICT', async () => {
    mockOrdersTable = [
      {
        id: 'ord_cf8602_uuid',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: 'PP_DIFFERENT_CODE_999',
        paymentStatus: 'PAID',
        status: 'PROCESSING',
      },
    ];

    mockTx.query.orders.findMany.mockResolvedValue([mockOrdersTable[0]]);

    const result = await repairPerfectPayOrderLink({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'PPCPMTB5HJ0CL88GIH',
      confirmation: REPAIR_CONFIRMATION_PHRASE,
      adminId: 'admin_root',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('EXTERNAL_ORDER_ID_CONFLICT');
    expect(mockOrdersTable[0].externalOrderId).toBe('PP_DIFFERENT_CODE_999'); // Untouched
  });

  // Test D: sale code already belongs to another order => reject
  it('D. sale code already belongs to another order => rejects with SALE_CODE_ALREADY_IN_USE', async () => {
    const targetOrder = {
      id: 'ord_cf8602_uuid',
      publicId: 'CF-8602GA6TIJ',
      externalOrderId: null,
      paymentStatus: 'PAID',
      status: 'PROCESSING',
    };
    const conflictingOrder = {
      id: 'ord_other_uuid',
      publicId: 'CF-9999OTHER',
      externalOrderId: 'PPCPMTB5HJ0CL88GIH',
      paymentStatus: 'PAID',
      status: 'PROCESSING',
    };

    let findCalls = 0;
    mockTx.query.orders.findMany.mockImplementation(async () => {
      findCalls++;
      if (findCalls === 1) {
        return [targetOrder];
      }
      return [conflictingOrder]; // Uniqueness conflict found
    });

    const result = await repairPerfectPayOrderLink({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'PPCPMTB5HJ0CL88GIH',
      confirmation: REPAIR_CONFIRMATION_PHRASE,
      adminId: 'admin_root',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('SALE_CODE_ALREADY_IN_USE');
    expect(targetOrder.externalOrderId).toBeNull(); // Untouched
  });

  // Test E: ambiguous evidence / missing identifiers => reject
  it('E. ambiguous evidence / empty identifiers => rejects with AMBIGUOUS_LINK', async () => {
    const result = await repairPerfectPayOrderLink({
      publicId: '',
      perfectPaySaleCode: 'PPCPMTB5HJ0CL88GIH',
      confirmation: REPAIR_CONFIRMATION_PHRASE,
      adminId: 'admin_root',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('AMBIGUOUS_LINK');
  });

  // Test F: unauthorized => reject at API route
  it('F. unauthorized access => rejects with 401 UNAUTHORIZED', async () => {
    vi.mocked(auth.requireAdmin).mockRejectedValueOnce(new Error('Unauthorized'));

    const req = new Request('http://localhost:3000/api/admin/reconciliation/repair-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicId: 'CF-8602GA6TIJ',
        perfectPaySaleCode: 'PPCPMTB5HJ0CL88GIH',
        confirmation: REPAIR_CONFIRMATION_PHRASE,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  // Test G: wrong confirmation phrase => reject
  it('G. wrong confirmation phrase => rejects with MISSING_CONFIRMATION', async () => {
    const result = await repairPerfectPayOrderLink({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'PPCPMTB5HJ0CL88GIH',
      confirmation: 'YES I WANT TO LINK',
      adminId: 'admin_root',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('MISSING_CONFIRMATION');
  });

  // Test H: audit event inserted exactly once
  it('H. audit event inserted exactly once with source, action, and metadata', async () => {
    mockOrdersTable = [
      {
        id: 'ord_cf8602_uuid',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: null,
        paymentStatus: 'PAID',
        status: 'PROCESSING',
        fulfillmentStatus: 'NOT_DISPATCHED',
      },
    ];

    let findCalls = 0;
    mockTx.query.orders.findMany.mockImplementation(async () => {
      findCalls++;
      if (findCalls === 1) return [mockOrdersTable[0]];
      return [];
    });

    const result = await repairPerfectPayOrderLink({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'PPCPMTB5HJ0CL88GIH',
      confirmation: REPAIR_CONFIRMATION_PHRASE,
      adminId: 'admin_root',
    });

    expect(result.success).toBe(true);
    expect(mockOrderEventsTable).toHaveLength(1);

    const event = mockOrderEventsTable[0];
    expect(event.orderId).toBe('ord_cf8602_uuid');
    expect(event.status).toBe('PROCESSING');
    expect(event.paymentStatus).toBe('PAID');
    expect(event.fulfillmentStatus).toBe('NOT_DISPATCHED');
    expect(event.metadata?.source).toBe('ADMIN_RECONCILIATION');
    expect(event.metadata?.action).toBe('PERFECTPAY_LINK_REPAIR');
    expect(event.metadata?.perfectPaySaleCode).toBe('PPCPMTB5HJ0CL88GIH');
    expect(event.metadata?.previousExternalOrderId).toBeNull();
    expect(event.metadata?.newExternalOrderId).toBe('PPCPMTB5HJ0CL88GIH');
    expect(event.metadata?.reason).toBe('HISTORICAL_INGESTION_MISSING_EXTERNAL_ID');
    expect(event.metadata?.repairedBy).toBe('admin_root');
    expect(event.metadata?.repairedAt).toBeDefined();
  });

  // Test I: fulfillment and provider cost untouched
  it('I. fulfillment status, provider costs, and financial amounts are untouched', async () => {
    mockOrdersTable = [
      {
        id: 'ord_cf8602_uuid',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: null,
        paymentStatus: 'PAID',
        status: 'PROCESSING',
        fulfillmentStatus: 'WAITING_TARGET_SLOT',
        totalCents: 1490,
      },
    ];
    mockFulfillmentOrdersTable = [
      {
        id: 'ful_123',
        orderId: 'ord_cf8602_uuid',
        provider: 'peakerr',
        status: 'QUEUED',
        providerCostCents: 85,
      },
    ];

    let findCalls = 0;
    mockTx.query.orders.findMany.mockImplementation(async () => {
      findCalls++;
      if (findCalls === 1) return [mockOrdersTable[0]];
      return [];
    });

    const result = await repairPerfectPayOrderLink({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'PPCPMTB5HJ0CL88GIH',
      confirmation: REPAIR_CONFIRMATION_PHRASE,
      adminId: 'admin_root',
    });

    expect(result.success).toBe(true);
    expect(mockOrdersTable[0].fulfillmentStatus).toBe('WAITING_TARGET_SLOT');
    expect(mockOrdersTable[0].paymentStatus).toBe('PAID');
    expect(mockOrdersTable[0].totalCents).toBe(1490);
    expect(mockFulfillmentOrdersTable[0].providerCostCents).toBe(85);
    expect(mockFulfillmentOrdersTable[0].status).toBe('QUEUED');
  });
});
