import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendAutomaticTransactionalEmail } from '@/services/email/transactional-trigger.service';
import { db } from '@/db';
import * as transportModule from '@/integrations/email/transport';

// In-memory mock store for rigorous testing of simple idempotency flow
interface MockEmailLog {
  id: string;
  customerEmail: string;
  templateId: string;
  status: string;
  providerMessageId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

let emailLogsStore: MockEmailLog[] = [];

vi.mock('@/db', () => {
  return {
    db: {
      query: {
        emailLogs: {
          findMany: vi.fn((opts?: any) => {
            let filtered = [...emailLogsStore];
            filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            return Promise.resolve(filtered);
          }),
        },
      },
      insert: vi.fn((table: any) => ({
        values: vi.fn((vals: any) => {
          const record: MockEmailLog = {
            id: `log-${Date.now()}-${Math.random()}`,
            customerEmail: vals.customerEmail,
            templateId: vals.templateId,
            status: vals.status,
            providerMessageId: vals.providerMessageId || null,
            metadata: vals.metadata || {},
            createdAt: vals.sentAt || new Date(),
          };
          emailLogsStore.push(record);
          return Promise.resolve([record]);
        }),
      })),
    },
  };
});

describe('Etapa 11D-3/Rollback: Strict Transactional Email Idempotency (Simple Flow without Lock)', () => {
  let mockSend: any;

  beforeEach(() => {
    vi.clearAllMocks();
    emailLogsStore = [];
    mockSend = vi.fn().mockImplementation(async () => {
      return { success: true, messageId: `resend-${Date.now()}-${Math.random()}` };
    });
    vi.spyOn(transportModule, 'getTransactionalEmailTransport').mockReturnValue({
      send: mockSend,
    });
  });

  it('A) Primeira chamada -> 1 provider send -> SENT', async () => {
    const result = await sendAutomaticTransactionalEmail({
      type: 'PAYMENT_APPROVED',
      orderId: '2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0',
      customerEmail: 'instaplussoftware@gmail.com',
      customerName: 'Guilherme',
      target: 'guilhermeterraaa',
      platform: 'instagram',
      service: 'followers',
      quantity: 2000,
    });

    expect(result.success).toBe(true);
    expect(result.isDuplicate).toBeUndefined();
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(emailLogsStore).toHaveLength(1);
    expect(emailLogsStore[0].status).toBe('SENT');
    expect(emailLogsStore[0].metadata.orderId).toBe('2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0');
  });

  it('B) Segunda chamada mesma order/template -> provider call 0 -> duplicate true', async () => {
    // 1st call
    const res1 = await sendAutomaticTransactionalEmail({
      type: 'PAYMENT_APPROVED',
      orderId: '2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0',
      customerEmail: 'instaplussoftware@gmail.com',
    });
    expect(res1.success).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(1);

    // 2nd call (same order & template)
    const res2 = await sendAutomaticTransactionalEmail({
      type: 'PAYMENT_APPROVED',
      orderId: '2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0',
      customerEmail: 'instaplussoftware@gmail.com',
    });
    expect(res2.success).toBe(true);
    expect(res2.isDuplicate).toBe(true);
    // Provider calls must remain exactly 1
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('C) Mesmo email, order diferente -> permitido', async () => {
    // 1st order
    await sendAutomaticTransactionalEmail({
      type: 'PAYMENT_APPROVED',
      orderId: 'order-alpha-111',
      customerEmail: 'instaplussoftware@gmail.com',
    });
    expect(mockSend).toHaveBeenCalledTimes(1);

    // 2nd order for same customer email
    const resDifferentOrder = await sendAutomaticTransactionalEmail({
      type: 'PAYMENT_APPROVED',
      orderId: 'order-beta-222',
      customerEmail: 'instaplussoftware@gmail.com',
    });
    expect(resDifferentOrder.success).toBe(true);
    expect(resDifferentOrder.isDuplicate).toBeUndefined();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('D) Mesmo order, template diferente -> permitido', async () => {
    // PAYMENT_APPROVED trigger (PAYMENT_RECEIVED template)
    await sendAutomaticTransactionalEmail({
      type: 'PAYMENT_APPROVED',
      orderId: '2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0',
      customerEmail: 'instaplussoftware@gmail.com',
    });
    expect(mockSend).toHaveBeenCalledTimes(1);

    // ORDER_PROCESSING trigger (ORDER_PROCESSING template) for same order
    const resProcessing = await sendAutomaticTransactionalEmail({
      type: 'ORDER_PROCESSING',
      orderId: '2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0',
      customerEmail: 'instaplussoftware@gmail.com',
    });
    expect(resProcessing.success).toBe(true);
    expect(resProcessing.isDuplicate).toBeUndefined();
    expect(mockSend).toHaveBeenCalledTimes(2);

    // ORDER_COMPLETED trigger (ORDER_DELIVERED template) for same order
    const resDelivered = await sendAutomaticTransactionalEmail({
      type: 'ORDER_COMPLETED',
      orderId: '2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0',
      customerEmail: 'instaplussoftware@gmail.com',
    });
    expect(resDelivered.success).toBe(true);
    expect(resDelivered.isDuplicate).toBeUndefined();
    expect(mockSend).toHaveBeenCalledTimes(3);
  });

  it('E) FAILED anterior + nenhuma SENT -> retry permitido', async () => {
    // Seed an initial failed log
    emailLogsStore.push({
      id: 'log-failed-initial',
      customerEmail: 'instaplussoftware@gmail.com',
      templateId: 'PAYMENT_RECEIVED',
      status: 'FAILED',
      providerMessageId: null,
      metadata: {
        orderId: '2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0',
        idempotencyKey: 'AUTO_TX:PAYMENT_APPROVED:2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0',
        error: 'Network connection timeout',
      },
      createdAt: new Date(Date.now() - 60000),
    });

    // Attempt retry
    const retryResult = await sendAutomaticTransactionalEmail({
      type: 'PAYMENT_APPROVED',
      orderId: '2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0',
      customerEmail: 'instaplussoftware@gmail.com',
    });

    expect(retryResult.success).toBe(true);
    expect(retryResult.isDuplicate).toBeUndefined();
    expect(mockSend).toHaveBeenCalledTimes(1);
    const sentLogs = emailLogsStore.filter(l => l.status === 'SENT');
    expect(sentLogs).toHaveLength(1);
  });

  it('F) FAILED + SENT posterior -> novo retry bloqueado', async () => {
    // Seed 1 FAILED and 1 SENT log for the order (exact production state of 2a12d168)
    emailLogsStore.push({
      id: 'log-failed-1',
      customerEmail: 'instaplussoftware@gmail.com',
      templateId: 'PAYMENT_RECEIVED',
      status: 'FAILED',
      providerMessageId: null,
      metadata: {
        orderId: '2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0',
        idempotencyKey: 'AUTO_TX:PAYMENT_APPROVED:2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0',
      },
      createdAt: new Date(Date.now() - 120000),
    });

    emailLogsStore.push({
      id: 'log-sent-retry-1',
      customerEmail: 'instaplussoftware@gmail.com',
      templateId: 'PAYMENT_RECEIVED',
      status: 'SENT',
      providerMessageId: '3fec3868-9984-481a-a16b-92aa6132fdcd',
      metadata: {
        orderId: '2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0',
        idempotencyKey: 'AUTO_TX:PAYMENT_APPROVED:2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0',
      },
      createdAt: new Date(Date.now() - 60000),
    });

    // Try a new retry: must be strictly blocked
    const result = await sendAutomaticTransactionalEmail({
      type: 'PAYMENT_APPROVED',
      orderId: '2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0',
      customerEmail: 'instaplussoftware@gmail.com',
    });

    expect(result.success).toBe(true);
    expect(result.isDuplicate).toBe(true);
    expect(result.messageId).toBe('3fec3868-9984-481a-a16b-92aa6132fdcd');
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('G) Duas chamadas sequenciais depois do primeiro SENT -> segunda bloqueada', async () => {
    // 1st call executes send
    const res1 = await sendAutomaticTransactionalEmail({
      type: 'PAYMENT_APPROVED',
      orderId: 'seq-order-xyz',
      customerEmail: 'instaplussoftware@gmail.com',
    });
    expect(res1.success).toBe(true);
    expect(res1.isDuplicate).toBeUndefined();
    expect(mockSend).toHaveBeenCalledTimes(1);

    // 2nd call sequential after SENT is in emailLogs -> must be blocked
    const res2 = await sendAutomaticTransactionalEmail({
      type: 'PAYMENT_APPROVED',
      orderId: 'seq-order-xyz',
      customerEmail: 'instaplussoftware@gmail.com',
    });
    expect(res2.success).toBe(true);
    expect(res2.isDuplicate).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('H) TEST-EMAIL-11C-2 não interfere com ordem real', async () => {
    // Seed TEST-EMAIL-11C-2 in emailLogs (the exact culprit from 11D-2)
    emailLogsStore.push({
      id: 'log-test-11c-2',
      customerEmail: 'instaplussoftware@gmail.com',
      templateId: 'PAYMENT_RECEIVED',
      status: 'SENT',
      providerMessageId: 'a9819743-a55e-473a-87da-c4ced9772e54',
      metadata: {
        orderId: 'TEST-EMAIL-11C-2',
        idempotencyKey: 'AUTO_TX:PAYMENT_APPROVED:TEST-EMAIL-11C-2',
        triggerType: 'PAYMENT_APPROVED',
      },
      createdAt: new Date('2026-09-04T21:07:55.249Z'),
    });

    // Now execute for the real order 2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0
    // It must NOT match TEST-EMAIL-11C-2
    const result = await sendAutomaticTransactionalEmail({
      type: 'PAYMENT_APPROVED',
      orderId: '2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0',
      customerEmail: 'instaplussoftware@gmail.com',
    });

    expect(result.success).toBe(true);
    expect(result.isDuplicate).toBeUndefined();
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(emailLogsStore).toHaveLength(2);
  });
});
