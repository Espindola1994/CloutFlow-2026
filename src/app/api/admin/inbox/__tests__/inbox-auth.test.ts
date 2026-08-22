import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as threadsGet } from '@/app/api/admin/inbox/threads/route';
import { POST as replyPost } from '@/app/api/admin/inbox/threads/[id]/reply/route';
import { POST as inboxSyncCronPost } from '@/app/api/internal/email/inbox-sync/route';
import * as authModule from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn(),
}));

describe('Inbox Security & Auth Enforcement (Requirements U, V)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Requirement U: blocks unauthorized admin from accessing Inbox threads', async () => {
    (authModule.requireAdmin as any).mockRejectedValueOnce(new Error('Unauthorized'));

    const req = new Request('http://localhost:3000/api/admin/inbox/threads');
    const res = await threadsGet(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('Requirement U: blocks unauthorized admin from sending conversation reply', async () => {
    (authModule.requireAdmin as any).mockRejectedValueOnce(new Error('Unauthorized'));

    const req = new Request('http://localhost:3000/api/admin/inbox/threads/thread-123/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textBody: 'Unauthorized reply' }),
    });

    const res = await replyPost(req, { params: Promise.resolve({ id: 'thread-123' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('Requirement V: rejects unauthorized cron request with 401 when CRON_SECRET is missing/invalid', async () => {
    process.env.CRON_SECRET = 'secret_cron_key_999';

    const req = new Request('http://localhost:3000/api/internal/email/inbox-sync', {
      method: 'POST',
      headers: { Authorization: 'Bearer invalid_secret' },
    });

    const res = await inboxSyncCronPost(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error).toContain('Valid CRON_SECRET required');
  });
});
