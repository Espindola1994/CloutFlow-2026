import { describe, it, expect } from 'vitest';
import proxy from '@/proxy';
import { NextRequest } from 'next/server';
import { createAdminToken } from '@/lib/auth';

describe('Admin Proxy & Route Protection with 2FA MFA', () => {
  const secret = 'test_session_secret_for_vitest_cloutflow_2026_super_secure';
  process.env.ADMIN_SESSION_SECRET = secret;

  it('redirects unauthenticated /admin/dashboard to /admin/login', () => {
    const req = new NextRequest('http://localhost/admin/dashboard');
    const res = proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/admin/login');
  });

  it('redirects unauthenticated /admin/orders to /admin/login', () => {
    const req = new NextRequest('http://localhost/admin/orders');
    const res = proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/admin/login');
  });

  it('allows access to /admin/login without redirection', () => {
    const req = new NextRequest('http://localhost/admin/login');
    const res = proxy(req);

    expect(res.status).toBe(200);
  });

  it('blocks /api/admin/orders with 401 when no session is present', async () => {
    const req = new NextRequest('http://localhost/api/admin/orders');
    const res = proxy(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.message).toContain('Unauthorized');
  });

  it('blocks /api/admin/dashboard with 401 when session has mfaVerified=false', async () => {
    const tokenObj = createAdminToken(7, false); // No MFA
    const req = new NextRequest('http://localhost/api/admin/dashboard', {
      headers: {
        cookie: `admin_session=${tokenObj?.token}`,
      },
    });
    const res = proxy(req);

    expect(res.status).toBe(401);
  });

  it('allows access to /api/admin/dashboard when session has mfaVerified=true', () => {
    const tokenObj = createAdminToken(7, true); // MFA verified!
    const req = new NextRequest('http://localhost/api/admin/dashboard', {
      headers: {
        cookie: `admin_session=${tokenObj?.token}`,
      },
    });
    const res = proxy(req);

    expect(res.status).toBe(200);
  });

  it('allows access to /admin/dashboard when session has mfaVerified=true', () => {
    const tokenObj = createAdminToken(7, true);
    const req = new NextRequest('http://localhost/admin/dashboard', {
      headers: {
        cookie: `admin_session=${tokenObj?.token}`,
      },
    });
    const res = proxy(req);

    expect(res.status).toBe(200);
  });
});
