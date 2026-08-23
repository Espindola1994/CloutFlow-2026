import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCrmContactsList, getCrmContactDetail } from '../crm.service';
import { db } from '@/db';

// Mock DB
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
      checkoutContexts: { findMany: vi.fn() },
      customerOffers: { findMany: vi.fn() },
      emailThreads: { findMany: vi.fn().mockResolvedValue([]) },
      emailMessages: { findMany: vi.fn().mockResolvedValue([]) },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([]),
      })),
    })),
  },
}));

describe('Phase F Regression Audit & Safety Matrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('A. Existing CRM records remain visible when they have NO customerOffer', async () => {
    const email = 'lead_no_offer@example.com';

    (db.query.lifecycleEvents.findMany as any).mockResolvedValueOnce([]);
    (db.query.orders.findMany as any).mockResolvedValueOnce([]);
    (db.query.paymentLeads.findMany as any).mockResolvedValueOnce([
      {
        id: 'lead-1',
        customerEmail: email,
        customerName: 'Test Lead',
        createdAt: new Date(),
      },
    ]);
    (db.query.emailSuppressions.findMany as any).mockResolvedValueOnce([]);
    (db.query.crmContactMetadata.findMany as any).mockResolvedValueOnce([]);
    (db.query.lifecycleAutomations.findMany as any).mockResolvedValueOnce([]);
    (db.query.customerOffers.findMany as any).mockResolvedValueOnce([]); // No offers

    const contacts = await getCrmContactsList();

    expect(contacts.length).toBe(1);
    expect(contacts[0].email).toBe(email);
    expect(contacts[0].customerType).toBe('LEAD');
    expect(contacts[0].activeOffersCount).toBe(0);
  });

  it('B. Failure in customerOffers query does not crash CRM population (graceful degradation)', async () => {
    const email = 'buyer@example.com';

    (db.query.lifecycleEvents.findMany as any).mockResolvedValueOnce([]);
    (db.query.orders.findMany as any).mockResolvedValueOnce([
      {
        id: 'ord-1',
        customerEmail: email,
        customerName: 'Buyer',
        paymentStatus: 'paid',
        fulfillmentStatus: 'completed',
        totalCents: 2000,
        createdAt: new Date(),
      },
    ]);
    (db.query.paymentLeads.findMany as any).mockResolvedValueOnce([]);
    (db.query.emailSuppressions.findMany as any).mockResolvedValueOnce([]);
    (db.query.crmContactMetadata.findMany as any).mockResolvedValueOnce([]);
    (db.query.lifecycleAutomations.findMany as any).mockResolvedValueOnce([]);
    
    // Simulate database query rejection for customerOffers
    (db.query.customerOffers.findMany as any).mockRejectedValueOnce(new Error('relation "customer_offers" does not exist'));

    const contacts = await getCrmContactsList();

    expect(contacts.length).toBe(1);
    expect(contacts[0].email).toBe(email);
    expect(contacts[0].customerType).toBe('CUSTOMER');
    expect(contacts[0].activeOffersCount).toBe(0);
  });

  it('C. Adding customerOffers does not alter base CRM population', async () => {
    const email = 'repeat@example.com';

    (db.query.lifecycleEvents.findMany as any).mockResolvedValueOnce([]);
    (db.query.orders.findMany as any).mockResolvedValueOnce([
      {
        id: 'ord-1',
        customerEmail: email,
        customerName: 'Repeat Buyer',
        paymentStatus: 'paid',
        fulfillmentStatus: 'completed',
        totalCents: 5000,
        createdAt: new Date(),
      },
      {
        id: 'ord-2',
        customerEmail: email,
        customerName: 'Repeat Buyer',
        paymentStatus: 'paid',
        fulfillmentStatus: 'completed',
        totalCents: 5000,
        createdAt: new Date(),
      },
    ]);
    (db.query.paymentLeads.findMany as any).mockResolvedValueOnce([]);
    (db.query.emailSuppressions.findMany as any).mockResolvedValueOnce([]);
    (db.query.crmContactMetadata.findMany as any).mockResolvedValueOnce([]);
    (db.query.lifecycleAutomations.findMany as any).mockResolvedValueOnce([]);
    (db.query.customerOffers.findMany as any).mockResolvedValueOnce([
      {
        id: 'off-1',
        customerEmail: email,
        code: 'TEST25',
        campaignType: 'POST_PURCHASE_25_OFF',
        discountType: 'PERCENTAGE',
        discountValue: 25,
        status: 'SENT',
        expiresAt: new Date(Date.now() + 86400000),
        redeemedAt: null,
        createdAt: new Date(),
      },
    ]);

    const contacts = await getCrmContactsList();

    expect(contacts.length).toBe(1);
    expect(contacts[0].customerType).toBe('REPEAT BUYER');
    expect(contacts[0].activeOffersCount).toBe(1);
  });

  it('E. Phase F Offers remain additive in getCrmContactDetail', async () => {
    const email = 'detail@example.com';

    (db.query.orders.findMany as any).mockResolvedValueOnce([]);
    (db.query.lifecycleEvents.findMany as any).mockResolvedValueOnce([]);
    (db.query.lifecycleAutomations.findMany as any).mockResolvedValueOnce([]);
    (db.query.emailLogs.findMany as any).mockResolvedValueOnce([]);
    (db.query.crmNotes.findMany as any).mockResolvedValueOnce([]);
    (db.query.checkoutContexts.findMany as any).mockResolvedValueOnce([]);
    (db.query.emailSuppressions.findMany as any).mockResolvedValueOnce([]);
    (db.query.crmContactMetadata.findMany as any).mockResolvedValueOnce([]);
    (db.query.emailThreads.findMany as any).mockResolvedValueOnce([]);
    (db.query.customerOffers.findMany as any).mockResolvedValueOnce([
      {
        id: 'off-1',
        customerEmail: email,
        code: 'SPECIAL25',
        campaignType: 'POST_PURCHASE_25_OFF',
        discountType: 'PERCENTAGE',
        discountValue: 25,
        status: 'CREATED',
        expiresAt: new Date(),
        redeemedAt: null,
        createdAt: new Date(),
      },
    ]);

    const detail = await getCrmContactDetail(email);

    expect(detail).not.toBeNull();
    expect(detail?.offers?.length).toBe(1);
    expect(detail?.offers?.[0].code).toBe('SPECIAL25');
  });
});
