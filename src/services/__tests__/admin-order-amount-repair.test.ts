import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  repairPerfectPayOrderAmount,
  REPAIR_AMOUNT_CONFIRMATION_PHRASE,
} from '@/services/admin-order-amount-repair.service';
import { POST } from '@/app/api/admin/reconciliation/repair-amount/route';
import * as auth from '@/lib/auth';

interface MockOrder {
  id: string;
  publicId: string;
  externalOrderId: string | null;
  paymentStatus: string;
  status: string;
  fulfillmentStatus?: string;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
}

interface MockOrderItem {
  id: string;
  orderId: string;
  unitPriceCents: number;
  totalPriceCents: number;
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
let mockOrderItemsTable: MockOrderItem[] = [];
let mockOrderEventsTable: MockOrderEvent[] = [];
let mockFulfillmentOrdersTable: MockFulfillmentOrder[] = [];

const mockTx = {
  query: {
    orders: {
      findMany: vi.fn(async () => {
        return mockOrdersTable;
      }),
    },
    orderItems: {
      findMany: vi.fn(async () => {
        return mockOrderItemsTable;
      }),
    },
    fulfillmentOrders: {
      findMany: vi.fn(async () => {
        return mockFulfillmentOrdersTable;
      }),
    },
  },
  update: vi.fn((table: unknown) => ({
    set: vi.fn((updateValues: Record<string, unknown>) => ({
      where: vi.fn(async () => {
        const tbl = table as { _?: { name?: string } };
        if (tbl._?.name === 'order_items' || mockOrderItemsTable.length > 0 && updateValues.unitPriceCents !== undefined) {
          for (const item of mockOrderItemsTable) {
            Object.assign(item, updateValues);
          }
        } else if (mockOrdersTable.length > 0) {
          Object.assign(mockOrdersTable[0], updateValues);
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

describe('Admin Historical Order Amount Repair Service & API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrdersTable = [];
    mockOrderItemsTable = [];
    mockOrderEventsTable = [];
    mockFulfillmentOrdersTable = [];
    vi.mocked(auth.requireAdmin).mockResolvedValue({
      id: 'admin_root',
      name: 'Administrator',
      email: 'admin@cloutflow.co',
      role: 'SUPER_ADMIN',
    });
  });

  // Test A: 0 -> 500 valid repair
  it('A. 0 -> 500 valid repair updates subtotal and total cents', async () => {
    mockOrdersTable = [
      {
        id: '97aafd7b-631a-4327-b41e-81493378790c',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: 'PPCPMTB5HJ3M1O9NJM',
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED',
        fulfillmentStatus: 'COMPLETED',
        subtotalCents: 0,
        discountCents: 0,
        totalCents: 0,
        currency: 'USD',
      },
    ];
    mockOrderItemsTable = [
      {
        id: 'item_1',
        orderId: '97aafd7b-631a-4327-b41e-81493378790c',
        unitPriceCents: 0,
        totalPriceCents: 0,
      },
    ];

    const result = await repairPerfectPayOrderAmount({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'PPCPMTB5HJ3M1O9NJM',
      expectedCurrentTotalCents: 0,
      authoritativeAmountCents: 500,
      currency: 'USD',
      confirmation: REPAIR_AMOUNT_CONFIRMATION_PHRASE,
      adminId: 'admin_root',
    });

    expect(result.success).toBe(true);
    expect(result.code).toBe('SUCCESS');
    expect(result.previousTotalCents).toBe(0);
    expect(result.newTotalCents).toBe(500);
    expect(result.previousSubtotalCents).toBe(0);
    expect(result.newSubtotalCents).toBe(500);

    expect(mockOrdersTable[0].subtotalCents).toBe(500);
    expect(mockOrdersTable[0].totalCents).toBe(500);
    expect(mockOrderItemsTable[0].unitPriceCents).toBe(500);
    expect(mockOrderItemsTable[0].totalPriceCents).toBe(500);
  });

  // Test B: already 500 => ALREADY_REPAIRED
  it('B. already 500 => ALREADY_REPAIRED without duplicate event', async () => {
    mockOrdersTable = [
      {
        id: '97aafd7b-631a-4327-b41e-81493378790c',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: 'PPCPMTB5HJ3M1O9NJM',
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED',
        fulfillmentStatus: 'COMPLETED',
        subtotalCents: 500,
        discountCents: 0,
        totalCents: 500,
        currency: 'USD',
      },
    ];

    const result = await repairPerfectPayOrderAmount({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'PPCPMTB5HJ3M1O9NJM',
      expectedCurrentTotalCents: 0,
      authoritativeAmountCents: 500,
      currency: 'USD',
      confirmation: REPAIR_AMOUNT_CONFIRMATION_PHRASE,
      adminId: 'admin_root',
    });

    expect(result.success).toBe(true);
    expect(result.code).toBe('ALREADY_REPAIRED');
    expect(mockOrderEventsTable).toHaveLength(0);
  });

  // Test C: external sale code mismatch => reject
  it('C. external sale code mismatch => rejects with EXTERNAL_ORDER_ID_MISMATCH', async () => {
    mockOrdersTable = [
      {
        id: '97aafd7b-631a-4327-b41e-81493378790c',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: 'PPCPMTB5HJ3M1O9NJM',
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED',
        fulfillmentStatus: 'COMPLETED',
        subtotalCents: 0,
        discountCents: 0,
        totalCents: 0,
        currency: 'USD',
      },
    ];

    const result = await repairPerfectPayOrderAmount({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'WRONG_SALE_CODE_123',
      expectedCurrentTotalCents: 0,
      authoritativeAmountCents: 500,
      currency: 'USD',
      confirmation: REPAIR_AMOUNT_CONFIRMATION_PHRASE,
      adminId: 'admin_root',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('EXTERNAL_ORDER_ID_MISMATCH');
    expect(mockOrdersTable[0].totalCents).toBe(0);
  });

  // Test D: unexpected current amount => AMOUNT_CONFLICT
  it('D. unexpected current amount => rejects with AMOUNT_CONFLICT', async () => {
    mockOrdersTable = [
      {
        id: '97aafd7b-631a-4327-b41e-81493378790c',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: 'PPCPMTB5HJ3M1O9NJM',
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED',
        fulfillmentStatus: 'COMPLETED',
        subtotalCents: 1490,
        discountCents: 0,
        totalCents: 1490,
        currency: 'USD',
      },
    ];

    const result = await repairPerfectPayOrderAmount({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'PPCPMTB5HJ3M1O9NJM',
      expectedCurrentTotalCents: 0,
      authoritativeAmountCents: 500,
      currency: 'USD',
      confirmation: REPAIR_AMOUNT_CONFIRMATION_PHRASE,
      adminId: 'admin_root',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('AMOUNT_CONFLICT');
    expect(mockOrdersTable[0].totalCents).toBe(1490);
  });

  // Test E: paymentStatus REFUNDED preserved
  it('E. paymentStatus REFUNDED preserved', async () => {
    mockOrdersTable = [
      {
        id: '97aafd7b-631a-4327-b41e-81493378790c',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: 'PPCPMTB5HJ3M1O9NJM',
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED',
        fulfillmentStatus: 'COMPLETED',
        subtotalCents: 0,
        discountCents: 0,
        totalCents: 0,
        currency: 'USD',
      },
    ];

    await repairPerfectPayOrderAmount({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'PPCPMTB5HJ3M1O9NJM',
      expectedCurrentTotalCents: 0,
      authoritativeAmountCents: 500,
      currency: 'USD',
      confirmation: REPAIR_AMOUNT_CONFIRMATION_PHRASE,
      adminId: 'admin_root',
    });

    expect(mockOrdersTable[0].paymentStatus).toBe('REFUNDED');
    expect(mockOrdersTable[0].status).toBe('CANCELLED');
  });

  // Test F: fulfillmentStatus COMPLETED preserved
  it('F. fulfillmentStatus COMPLETED preserved', async () => {
    mockOrdersTable = [
      {
        id: '97aafd7b-631a-4327-b41e-81493378790c',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: 'PPCPMTB5HJ3M1O9NJM',
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED',
        fulfillmentStatus: 'COMPLETED',
        subtotalCents: 0,
        discountCents: 0,
        totalCents: 0,
        currency: 'USD',
      },
    ];

    await repairPerfectPayOrderAmount({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'PPCPMTB5HJ3M1O9NJM',
      expectedCurrentTotalCents: 0,
      authoritativeAmountCents: 500,
      currency: 'USD',
      confirmation: REPAIR_AMOUNT_CONFIRMATION_PHRASE,
      adminId: 'admin_root',
    });

    expect(mockOrdersTable[0].fulfillmentStatus).toBe('COMPLETED');
  });

  // Test G: provider cost $1.46 (146 cents) preserved
  it('G. provider cost $1.46 (146 cents) preserved in fulfillment_orders', async () => {
    mockOrdersTable = [
      {
        id: '97aafd7b-631a-4327-b41e-81493378790c',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: 'PPCPMTB5HJ3M1O9NJM',
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED',
        fulfillmentStatus: 'COMPLETED',
        subtotalCents: 0,
        discountCents: 0,
        totalCents: 0,
        currency: 'USD',
      },
    ];
    mockFulfillmentOrdersTable = [
      {
        id: 'ful_1',
        orderId: '97aafd7b-631a-4327-b41e-81493378790c',
        provider: 'peakerr',
        status: 'COMPLETED',
        providerCostCents: 146,
      },
    ];

    await repairPerfectPayOrderAmount({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'PPCPMTB5HJ3M1O9NJM',
      expectedCurrentTotalCents: 0,
      authoritativeAmountCents: 500,
      currency: 'USD',
      confirmation: REPAIR_AMOUNT_CONFIRMATION_PHRASE,
      adminId: 'admin_root',
    });

    expect(mockFulfillmentOrdersTable[0].providerCostCents).toBe(146);
    expect(mockFulfillmentOrdersTable[0].status).toBe('COMPLETED');
  });

  // Test H: audit event inserted exactly once
  it('H. audit event inserted exactly once with all required fields', async () => {
    mockOrdersTable = [
      {
        id: '97aafd7b-631a-4327-b41e-81493378790c',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: 'PPCPMTB5HJ3M1O9NJM',
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED',
        fulfillmentStatus: 'COMPLETED',
        subtotalCents: 0,
        discountCents: 0,
        totalCents: 0,
        currency: 'USD',
      },
    ];

    const result = await repairPerfectPayOrderAmount({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'PPCPMTB5HJ3M1O9NJM',
      expectedCurrentTotalCents: 0,
      authoritativeAmountCents: 500,
      currency: 'USD',
      confirmation: REPAIR_AMOUNT_CONFIRMATION_PHRASE,
      adminId: 'admin_root',
    });

    expect(result.success).toBe(true);
    expect(mockOrderEventsTable).toHaveLength(1);

    const event = mockOrderEventsTable[0];
    expect(event.orderId).toBe('97aafd7b-631a-4327-b41e-81493378790c');
    expect(event.status).toBe('CANCELLED');
    expect(event.paymentStatus).toBe('REFUNDED');
    expect(event.fulfillmentStatus).toBe('COMPLETED');
    expect(event.metadata?.source).toBe('ADMIN_RECONCILIATION');
    expect(event.metadata?.action).toBe('PERFECTPAY_AMOUNT_REPAIR');
    expect(event.metadata?.perfectPaySaleCode).toBe('PPCPMTB5HJ3M1O9NJM');
    expect(event.metadata?.evidenceSource).toBe('PERFECTPAY_PERSISTED_WEBHOOK');
    expect(event.metadata?.authoritativeAmountCents).toBe(500);
    expect(event.metadata?.previousSubtotalCents).toBe(0);
    expect(event.metadata?.newSubtotalCents).toBe(500);
    expect(event.metadata?.previousTotalCents).toBe(0);
    expect(event.metadata?.newTotalCents).toBe(500);
    expect(event.metadata?.currency).toBe('USD');
    expect(event.metadata?.reason).toBe('HISTORICAL_PERFECTPAY_AMOUNT_INGESTION_DEFECT');
    expect(event.metadata?.repairedBy).toBe('admin_root');
    expect(event.metadata?.repairedAt).toBeDefined();
  });

  // Test J: subtotal != 0 conflict guard
  it('J. subtotalCents != 0 when expected is 0 => rejects with AMOUNT_CONFLICT', async () => {
    mockOrdersTable = [
      {
        id: '97aafd7b-631a-4327-b41e-81493378790c',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: 'PPCPMTB5HJ3M1O9NJM',
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED',
        fulfillmentStatus: 'COMPLETED',
        subtotalCents: 500, // already mutated or corrupted
        discountCents: 0,
        totalCents: 0,
        currency: 'USD',
      },
    ];

    const result = await repairPerfectPayOrderAmount({
      publicId: 'CF-8602GA6TIJ',
      perfectPaySaleCode: 'PPCPMTB5HJ3M1O9NJM',
      expectedCurrentTotalCents: 0,
      authoritativeAmountCents: 500,
      currency: 'USD',
      confirmation: REPAIR_AMOUNT_CONFIRMATION_PHRASE,
      adminId: 'admin_root',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('AMOUNT_CONFLICT');
  });

  // Test I: API Route guard tests
  it('I. API Route validates auth, body schema, and calls service', async () => {
    mockOrdersTable = [
      {
        id: '97aafd7b-631a-4327-b41e-81493378790c',
        publicId: 'CF-8602GA6TIJ',
        externalOrderId: 'PPCPMTB5HJ3M1O9NJM',
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED',
        fulfillmentStatus: 'COMPLETED',
        subtotalCents: 0,
        discountCents: 0,
        totalCents: 0,
        currency: 'USD',
      },
    ];

    const req = new Request('http://localhost:3000/api/admin/reconciliation/repair-amount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicId: 'CF-8602GA6TIJ',
        perfectPaySaleCode: 'PPCPMTB5HJ3M1O9NJM',
        expectedCurrentTotalCents: 0,
        authoritativeAmountCents: 500,
        currency: 'USD',
        confirmation: REPAIR_AMOUNT_CONFIRMATION_PHRASE,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.newTotalCents).toBe(500);
  });
});
