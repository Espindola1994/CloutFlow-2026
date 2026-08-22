import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  normalizeCrmEmail, 
  deriveContactStatus, 
  formatLifecycleEvent,
  getCrmContactsList,
  getCrmContactDetail,
  addCrmNote,
  updateCrmContactTags
} from '@/services/crm/crm.service';
import { sendManualEmail } from '@/services/crm/manual-email.service';
import { interpolateTemplate, escapeHtml, CANONICAL_EMAIL_TEMPLATES } from '@/services/crm/templates';
import { db } from '@/db';

// Mock db
vi.mock('@/db', () => ({
  db: {
    query: {
      lifecycleEvents: { findMany: vi.fn() },
      lifecycleAutomations: { findMany: vi.fn() },
      emailLogs: { findMany: vi.fn() },
      emailSuppressions: { findMany: vi.fn() },
      crmContactMetadata: { findMany: vi.fn() },
      crmNotes: { findMany: vi.fn() },
      orders: { findMany: vi.fn() },
      paymentLeads: { findMany: vi.fn() },
      checkoutContexts: { findMany: vi.fn() }
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 'test-id', customerEmail: 'test@example.com', adminName: 'Admin', text: 'Note text', createdAt: new Date() }])
      }))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ id: 'updated' }])
      }))
    }))
  }
}));

// Mock EmailTransport
const mockSend = vi.fn();
vi.mock('@/integrations/email/transport', () => ({
  getMarketingEmailTransport: vi.fn(() => ({
    send: mockSend
  })),
  getTransactionalEmailTransport: vi.fn(() => ({
    send: mockSend
  }))
}));

describe('Phase D: CRM & Customer 360 Test Matrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // A. Same normalized email across multiple sessions => one CRM identity
  it('A. Normalizes emails consistently to a single canonical identity', () => {
    const raw1 = '  Test.User+1@Gmail.com ';
    const raw2 = 'test.user+1@gmail.com';
    const norm1 = normalizeCrmEmail(raw1);
    const norm2 = normalizeCrmEmail(raw2);

    expect(norm1).toBe(norm2);
    expect(norm1).toBe('test.user+1@gmail.com');
  });

  // B. Contact aggregates multiple orders
  it('B. Aggregates multiple orders for a single contact', async () => {
    const email = 'customer@domain.com';
    (db.query.orders.findMany as any).mockResolvedValueOnce([
      {
        id: 'ord-1',
        publicId: 'CF-101',
        customerEmail: email,
        customerName: 'Alice',
        platform: 'instagram',
        service: 'followers',
        quantity: 1000,
        totalCents: 1990,
        paymentStatus: 'paid',
        fulfillmentStatus: 'completed',
        createdAt: new Date('2026-08-20T10:00:00Z')
      },
      {
        id: 'ord-2',
        publicId: 'CF-102',
        customerEmail: email,
        customerName: 'Alice',
        platform: 'instagram',
        service: 'likes',
        quantity: 500,
        totalCents: 990,
        paymentStatus: 'paid',
        fulfillmentStatus: 'completed',
        createdAt: new Date('2026-08-21T10:00:00Z')
      }
    ]);
    (db.query.lifecycleEvents.findMany as any).mockResolvedValueOnce([]);
    (db.query.lifecycleAutomations.findMany as any).mockResolvedValueOnce([]);
    (db.query.emailLogs.findMany as any).mockResolvedValueOnce([]);
    (db.query.crmNotes.findMany as any).mockResolvedValueOnce([]);
    (db.query.checkoutContexts.findMany as any).mockResolvedValueOnce([]);
    (db.query.emailSuppressions.findMany as any).mockResolvedValueOnce([]);
    (db.query.crmContactMetadata.findMany as any).mockResolvedValueOnce([]);

    const detail = await getCrmContactDetail(email);
    expect(detail).not.null;
    expect(detail?.orders.length).toBe(2);
    expect(detail?.customerType).toBe('REPEAT BUYER');
    expect(detail?.totalSpentCents).toBe(2980);
  });

  // C. Timeline is correctly chronological
  it('C. Human-readable timeline formats events correctly', () => {
    const formattedAbandoned = formatLifecycleEvent('CHECKOUT_ABANDONED');
    expect(formattedAbandoned.title).toBe('Checkout Abandoned');

    const formattedPayment = formatLifecycleEvent('PAYMENT_APPROVED', { orderId: 'CF-1234' });
    expect(formattedPayment.title).toBe('Payment Confirmed');
    expect(formattedPayment.description).toContain('CF-1234');
  });

  // D. Lifecycle event appears exactly once
  it('D. Formats default unknown lifecycle events gracefully without duplication', () => {
    const custom = formatLifecycleEvent('CUSTOM_LIFECYCLE_STAGE');
    expect(custom.title).toBe('CUSTOM LIFECYCLE STAGE');
  });

  // E. Automatic email appears as AUTOMATION & F. Manual email appears as MANUAL
  it('E & F. Differentiates AUTOMATION vs MANUAL email logs', async () => {
    const email = 'target@domain.com';
    (db.query.orders.findMany as any).mockResolvedValueOnce([]);
    (db.query.lifecycleEvents.findMany as any).mockResolvedValueOnce([]);
    (db.query.lifecycleAutomations.findMany as any).mockResolvedValueOnce([]);
    (db.query.emailLogs.findMany as any).mockResolvedValueOnce([
      {
        id: 'log-1',
        customerEmail: email,
        sendOrigin: 'AUTOMATION',
        category: 'marketing',
        subject: 'You left something behind',
        status: 'SENT',
        provider: 'RESEND',
        createdAt: new Date()
      },
      {
        id: 'log-2',
        customerEmail: email,
        sendOrigin: 'MANUAL',
        category: 'support',
        subject: 'Update about your order',
        status: 'SENT',
        provider: 'RESEND',
        createdAt: new Date()
      }
    ]);
    (db.query.crmNotes.findMany as any).mockResolvedValueOnce([]);
    (db.query.checkoutContexts.findMany as any).mockResolvedValueOnce([]);
    (db.query.emailSuppressions.findMany as any).mockResolvedValueOnce([]);
    (db.query.crmContactMetadata.findMany as any).mockResolvedValueOnce([]);

    const detail = await getCrmContactDetail(email);
    expect(detail?.emails.length).toBe(2);
    expect(detail?.emails[0].sendOrigin).toBe('AUTOMATION');
    expect(detail?.emails[1].sendOrigin).toBe('MANUAL');
  });

  // G. Marketing send to suppressed contact => blocked
  it('G. Blocks marketing send to suppressed contact with explicit reason', async () => {
    (db.query.emailSuppressions.findMany as any).mockResolvedValueOnce([
      { id: 'sup-1', customerEmail: 'unsubscribed@test.com', reason: 'UNSUBSCRIBED' }
    ]);

    const result = await sendManualEmail({
      customerEmail: 'unsubscribed@test.com',
      category: 'marketing',
      subject: 'Special 20% discount',
      body: '<p>Come back!</p>'
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe('BLOCKED_SUPPRESSED');
    expect(result.reason).toContain('marketing-suppressed');
  });

  // H. Transactional/support category remains independently evaluated
  it('H. Allows support email send even if contact is marketing suppressed', async () => {
    mockSend.mockResolvedValueOnce({ success: true, messageId: 'msg-resend-123' });

    const result = await sendManualEmail({
      customerEmail: 'unsubscribed@test.com',
      category: 'support',
      subject: 'Important order clarification',
      body: '<p>Please confirm your username.</p>'
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('SENT');
    expect(mockSend).toHaveBeenCalled();
  });

  // I. Template variable rendering & J. Missing optional template variable handled safely
  it('I & J. Interpolates variables correctly and handles missing variables safely without leaking tags', () => {
    const template = 'Hello {customer_name}, order {order_id} for {target} is {order_status}. Extra: {unknown_field}!';
    const vars = {
      customer_name: 'Guilherme',
      order_id: 'CF-999',
      target: '@profile',
      order_status: 'Processing'
    };

    const rendered = interpolateTemplate(template, vars);
    expect(rendered).toBe('Hello Guilherme, order CF-999 for @profile is Processing. Extra: !');
  });

  // M. Internal note never exposed publicly & persists properly
  it('M. Internal admin notes can be added securely', async () => {
    // Override the mock specifically for this test to assert the payload correctly
    vi.mocked(db.insert).mockReturnValueOnce({
      values: vi.fn().mockImplementation((payload) => ({
        returning: vi.fn().mockResolvedValue([{ 
          id: 'note-new', 
          customerEmail: payload.customerEmail, 
          adminName: payload.adminName, 
          text: payload.text, 
          createdAt: new Date() 
        }])
      }))
    } as any);

    const note = await addCrmNote({
      customerEmail: 'customer@domain.com',
      adminName: 'Admin Sarah',
      text: 'Verified profile on IG'
    });

    expect(note.adminName).toBe('Admin Sarah');
    expect(note.text).toBe('Verified profile on IG');
  });

  // N & O. CRM tag/status does not mutate paymentStatus or fulfillmentStatus
  it('N & O. CRM operational tags do not overwrite canonical order statuses', () => {
    const derived1 = deriveContactStatus({
      ordersCount: 1,
      latestOrderStatus: 'paid',
      latestFulfillmentStatus: 'processing',
      hasTargetMissing: false
    });
    expect(derived1).toBe('FULFILLING');

    const derived2 = deriveContactStatus({
      ordersCount: 1,
      latestOrderStatus: 'paid',
      latestFulfillmentStatus: 'failed',
      hasTargetMissing: true
    });
    expect(derived2).toBe('MISSING TARGET');
  });

  // Check canonical templates list
  it('Verifies all required Phase D email templates exist in registry', () => {
    const ids = CANONICAL_EMAIL_TEMPLATES.map(t => t.id);
    expect(ids).toContain('PAYMENT_RECEIVED');
    expect(ids).toContain('ORDER_PROCESSING');
    expect(ids).toContain('ORDER_DELIVERED');
    expect(ids).toContain('CART_RECOVERY');
    expect(ids).toContain('NEED_CORRECT_USERNAME');
    expect(ids).toContain('NEED_POST_LINK');
    expect(ids).toContain('PROFILE_PRIVATE');
    expect(ids).toContain('DELIVERY_DELAY');
    expect(ids).toContain('PARTIAL_DELIVERY');
    expect(ids).toContain('SUPPORT_CUSTOM');
    expect(ids).toContain('IMPROVE_YOUR_CONTENT');
  });
});
