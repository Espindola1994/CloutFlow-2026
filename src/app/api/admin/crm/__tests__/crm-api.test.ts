import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getContacts } from '@/app/api/admin/crm/contacts/route';
import { GET as getContactDetail } from '@/app/api/admin/crm/contacts/[identity]/route';
import { POST as sendEmail } from '@/app/api/admin/crm/send-email/route';
import { POST as addNote } from '@/app/api/admin/crm/notes/route';
import { POST as updateTags } from '@/app/api/admin/crm/tags/route';
import * as auth from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn()
}));

vi.mock('@/services/crm/crm.service', () => ({
  getCrmContactsList: vi.fn().mockResolvedValue([
    { email: 'user@example.com', ordersCount: 1, customerType: 'CUSTOMER' }
  ]),
  getCrmContactDetail: vi.fn().mockImplementation((email: string) => {
    if (email === 'notfound@example.com') return Promise.resolve(null);
    return Promise.resolve({
      email,
      name: 'User Example',
      ordersCount: 1,
      orders: [],
      lifecycleTimeline: [],
      emails: [],
      automations: [],
      notes: [],
      checkoutContexts: []
    });
  }),
  addCrmNote: vi.fn().mockResolvedValue({
    id: 'note-1',
    customerEmail: 'user@example.com',
    adminName: 'Admin',
    text: 'Note',
    createdAt: new Date().toISOString()
  }),
  updateCrmContactTags: vi.fn().mockResolvedValue(['VIP', 'NEEDS_TARGET'])
}));

vi.mock('@/services/crm/manual-email.service', () => ({
  sendManualEmail: vi.fn().mockResolvedValue({
    success: true,
    provider: 'RESEND',
    providerMessageId: 'msg-1',
    emailLogId: 'log-1',
    status: 'SENT'
  })
}));

describe('Phase D: Admin CRM Endpoints Security and Caching Matrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // K. Admin unauthorized => 401
  it('K. Returns 401 when requireAdmin fails (unauthorized)', async () => {
    vi.mocked(auth.requireAdmin).mockRejectedValueOnce(new Error('Unauthorized'));

    const req = new Request('http://localhost/api/admin/crm/contacts');
    const res = await getContacts(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toBe('Unauthorized');
  });

  // L. CRM API no-store
  it('L. Enforces no-store caching headers across CRM APIs', async () => {
    vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ id: 'admin-1' } as any);

    const req = new Request('http://localhost/api/admin/crm/contacts');
    const res = await getContacts(req);

    expect(res.status).toBe(200);
    const cacheHeader = res.headers.get('Cache-Control');
    expect(cacheHeader).toContain('no-store');
  });

  it('Returns 404 for unknown customer identity in detail route', async () => {
    vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ id: 'admin-1' } as any);

    const req = new Request('http://localhost/api/admin/crm/contacts/notfound%40example.com');
    const res = await getContactDetail(req, {
      params: Promise.resolve({ identity: 'notfound@example.com' })
    });

    expect(res.status).toBe(404);
  });

  it('Validates payload on manual send email endpoint', async () => {
    vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ id: 'admin-1' } as any);

    const req = new Request('http://localhost/api/admin/crm/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: 'invalid-email',
        category: 'support',
        subject: '',
        body: ''
      })
    });

    const res = await sendEmail(req);
    expect(res.status).toBe(400);
  });

  it('Successfully dispatches valid manual email through route', async () => {
    vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ id: 'admin-1' } as any);

    const req = new Request('http://localhost/api/admin/crm/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: 'valid@example.com',
        category: 'support',
        subject: 'Support Help',
        body: '<p>Hello!</p>'
      })
    });

    const res = await sendEmail(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('SENT');
  });
});
