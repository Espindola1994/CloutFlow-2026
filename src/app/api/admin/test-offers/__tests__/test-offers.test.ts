import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '../route';
import { DELETE, PATCH } from '../[id]/route';

// Mock DB
vi.mock('@/db', () => ({
  db: {
    query: {
      customers: { findFirst: vi.fn() },
      orders: { findFirst: vi.fn() },
      paymentLeads: { findFirst: vi.fn() },
      customerOffers: { findMany: vi.fn() }
    },
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'mock-offer-123' }]) }) }),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'mock-offer-123', status: 'EXPIRED' }]) }) }) }),
    delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(true) })
  }
}));

// Mock Auth
vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn().mockResolvedValue(true)
}));

// Mock email transport
vi.mock('@/integrations/email/transport', () => ({
  getMarketingEmailTransport: vi.fn().mockReturnValue({
    send: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-123' })
  })
}));

import { db } from '@/db';

describe('Admin Test Offers API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/admin/test-offers', () => {
    it('requires an existing CRM contact', async () => {
      // Setup mock to return null for customer
      (db.query.customers.findFirst as any).mockResolvedValueOnce(null);
      (db.query.orders.findFirst as any).mockResolvedValueOnce(null);
      (db.query.paymentLeads.findFirst as any).mockResolvedValueOnce(null);

      const request = new Request('http://localhost/api/admin/test-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: 'unknown@example.com' })
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
      
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toContain('Select an existing');
    });

    it('prevents multiple active test offers for the same contact', async () => {
      // Setup mock to return customer
      (db.query.customers.findFirst as any).mockResolvedValueOnce({ id: '1', email: 'test@example.com' });
      // Setup mock to return active test offer
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      (db.query.customerOffers.findMany as any).mockResolvedValueOnce([
        { id: 'off-1', status: 'ACTIVE', expiresAt: futureDate }
      ]);

      const request = new Request('http://localhost/api/admin/test-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: 'test@example.com' })
      });

      const response = await POST(request);
      expect(response.status).toBe(409);
      
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toContain('already has an active Test Offer');
    });

    it('creates a test offer if valid', async () => {
      (db.query.customers.findFirst as any).mockResolvedValueOnce({ id: '1', email: 'test@example.com' });
      (db.query.customerOffers.findMany as any).mockResolvedValueOnce([]); // No active offers

      const request = new Request('http://localhost/api/admin/test-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: 'test@example.com', sendEmail: false })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      const json = await response.json();
      expect(json.success).toBe(true);
      
      // Verify db.insert was called
      expect(db.insert).toHaveBeenCalled();
    });

    it('creates a test offer with default validity of 48 hours', async () => {
      (db.query.customers.findFirst as any).mockResolvedValueOnce({ id: '1', email: 'test@example.com' });
      (db.query.customerOffers.findMany as any).mockResolvedValueOnce([]); // No active offers

      const mockNow = new Date('2026-08-23T10:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(mockNow);

      const request = new Request('http://localhost/api/admin/test-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: 'test@example.com' })
      });

      await POST(request);
      
      const insertCall = (db.insert as any).mock.results[0].value.values.mock.calls[0][0];
      const expiresAt = insertCall.expiresAt;
      
      const expectedExpiresAt = new Date(mockNow.getTime() + 48 * 60 * 60 * 1000);
      expect(expiresAt.getTime()).toBe(expectedExpiresAt.getTime());

      vi.useRealTimers();
    });

    it('creates a test offer with exactly 5 minutes validity when validHours is 0.08333333333333333', async () => {
      (db.query.customers.findFirst as any).mockResolvedValueOnce({ id: '1', email: 'test@example.com' });
      (db.query.customerOffers.findMany as any).mockResolvedValueOnce([]);

      const mockNow = new Date('2026-08-23T10:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(mockNow);

      const request = new Request('http://localhost/api/admin/test-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: 'test@example.com', validHours: 0.08333333333333333 })
      });

      await POST(request);
      
      const insertCall = (db.insert as any).mock.results[0].value.values.mock.calls[0][0];
      const expiresAt = insertCall.expiresAt;
      
      const expectedExpiresAt = new Date(mockNow.getTime() + 5 * 60 * 1000);
      
      // Allow 1ms tolerance for float math
      expect(Math.abs(expiresAt.getTime() - expectedExpiresAt.getTime())).toBeLessThan(2);

      vi.useRealTimers();
    });

    it('creates a test offer with exactly 24 hours validity when validHours is 24', async () => {
      (db.query.customers.findFirst as any).mockResolvedValueOnce({ id: '1', email: 'test@example.com' });
      (db.query.customerOffers.findMany as any).mockResolvedValueOnce([]);

      const mockNow = new Date('2026-08-23T10:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(mockNow);

      const request = new Request('http://localhost/api/admin/test-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: 'test@example.com', validHours: 24 })
      });

      await POST(request);
      
      const insertCall = (db.insert as any).mock.results[0].value.values.mock.calls[0][0];
      const expiresAt = insertCall.expiresAt;
      
      const expectedExpiresAt = new Date(mockNow.getTime() + 24 * 60 * 60 * 1000);
      expect(expiresAt.getTime()).toBe(expectedExpiresAt.getTime());

      vi.useRealTimers();
    });
  });

  describe('PATCH /api/admin/test-offers/[id]', () => {
    it('expires a test offer', async () => {
      (db.query.customerOffers.findMany as any).mockResolvedValueOnce([
        { id: '1', sourceOrderId: 'ADMIN_TEST', status: 'ACTIVE' }
      ]);

      const request = new Request('http://localhost/api/admin/test-offers/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'expire' })
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
      expect(response.status).toBe(200);
      
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(db.update).toHaveBeenCalled();
    });

    it('blocks expiring a genuine production offer', async () => {
      (db.query.customerOffers.findMany as any).mockResolvedValueOnce([
        { id: '1', sourceOrderId: 'order-123', status: 'ACTIVE' } // Not ADMIN_TEST
      ]);

      const request = new Request('http://localhost/api/admin/test-offers/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'expire' })
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/admin/test-offers/[id]', () => {
    it('deletes an unredeemed test offer', async () => {
      (db.query.customerOffers.findMany as any).mockResolvedValueOnce([
        { id: '1', sourceOrderId: 'ADMIN_TEST', status: 'EXPIRED' }
      ]);

      const request = new Request('http://localhost/api/admin/test-offers/1', { method: 'DELETE' });

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      expect(response.status).toBe(200);
      expect(db.delete).toHaveBeenCalled();
    });

    it('blocks deleting a genuine production offer', async () => {
      (db.query.customerOffers.findMany as any).mockResolvedValueOnce([
        { id: '1', sourceOrderId: 'order-123', status: 'ACTIVE' }
      ]);

      const request = new Request('http://localhost/api/admin/test-offers/1', { method: 'DELETE' });

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      expect(response.status).toBe(403);
    });
  });
});
