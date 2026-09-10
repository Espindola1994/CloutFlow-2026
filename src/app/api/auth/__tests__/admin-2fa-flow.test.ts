import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { GET as enrollHandler } from '@/app/api/auth/2fa/enroll/route';
import { POST as verifyHandler } from '@/app/api/auth/2fa/verify/route';
import { POST as recoveryHandler } from '@/app/api/auth/2fa/recovery/route';
import { POST as logoutHandler } from '@/app/api/auth/logout/route';
import { generateSync, generateSecret } from 'otplib';

// Mock cookies
const cookieStorage = new Map<string, any>();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => (cookieStorage.has(name) ? { name, value: cookieStorage.get(name) } : undefined),
    set: (name: string, value: string, options?: any) => {
      cookieStorage.set(name, value);
    },
    delete: (name: string) => {
      cookieStorage.delete(name);
    },
  })),
}));

// In-memory mock database for adminSecurity & adminRecoveryCodes
const mockSecurityState: {
  adminSecurity: Map<string, any>;
  adminRecoveryCodes: Map<string, any>;
} = {
  adminSecurity: new Map(),
  adminRecoveryCodes: new Map(),
};

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn().mockResolvedValue([]),
    insert: vi.fn((table: any) => ({
      values: vi.fn(async (val: any) => {
        if (val.adminId && 'totpSecretEncrypted' in val) {
          mockSecurityState.adminSecurity.set(val.adminId, { ...val, id: 'sec_1' });
        } else if (val.codeHash) {
          const id = 'rec_' + Math.random().toString(36).substring(7);
          mockSecurityState.adminRecoveryCodes.set(val.codeHash, { ...val, id });
        }
        return [val];
      }),
    })),
    select: vi.fn(() => ({
      from: vi.fn((table: any) => ({
        where: vi.fn((clause: any) => ({
          limit: vi.fn(async () => {
            const row = mockSecurityState.adminSecurity.get('admin_root');
            return row ? [row] : [];
          }),
        })),
      })),
    })),
    update: vi.fn((table: any) => ({
      set: vi.fn((vals: any) => ({
        where: vi.fn(async (clause: any) => {
          const current = mockSecurityState.adminSecurity.get('admin_root') || {};
          mockSecurityState.adminSecurity.set('admin_root', { ...current, ...vals });
          return [vals];
        }),
      })),
    })),
    delete: vi.fn((table: any) => ({
      where: vi.fn(async (clause: any) => {
        mockSecurityState.adminRecoveryCodes.clear();
        return [];
      }),
    })),
  },
}));

describe('Admin 2FA Authentication Flow E2E Endpoints', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    cookieStorage.clear();
    mockSecurityState.adminSecurity.clear();
    mockSecurityState.adminRecoveryCodes.clear();

    process.env = {
      ...originalEnv,
      ADMIN_PASSWORD: 'secure_admin_password_2026',
      ADMIN_SESSION_SECRET: 'session_secret_for_cloutflow_testing_2fa',
      ADMIN_2FA_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    };
  });

  it('1. Wrong password returns 401 and does not set any cookies', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong_password' }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);

    expect(cookieStorage.has('admin_session')).toBe(false);
    expect(cookieStorage.has('admin_pending_2fa')).toBe(false);
  });

  it('2. Correct password sets admin_pending_2fa cookie and returns requires2fa=true WITHOUT full session', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'secure_admin_password_2026' }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data.requires2fa).toBe(true);
    expect(body.data.stage).toBe('ENROLLMENT_REQUIRED');

    // Crucial check: admin_session MUST NOT be present!
    expect(cookieStorage.has('admin_session')).toBe(false);
    // pending 2fa cookie MUST be set
    expect(cookieStorage.has('admin_pending_2fa')).toBe(true);
  });

  it('3. Enrollment endpoint rejects requests without pending 2fa cookie', async () => {
    cookieStorage.clear();
    const res = await enrollHandler();
    expect(res.status).toBe(401);
  });

  it('4. TOTP verify endpoint rejects requests without pending 2fa cookie', async () => {
    cookieStorage.clear();
    const req = new Request('http://localhost/api/auth/2fa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: '123456' }),
    });
    const res = await verifyHandler(req);
    expect(res.status).toBe(401);
  });

  it('5. Complete Flow: Login -> Enroll -> Verify TOTP -> Full Session Issued -> Logout', async () => {
    // A. First factor: Login
    const loginReq = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'secure_admin_password_2026' }),
    });
    const loginRes = await loginHandler(loginReq);
    expect(loginRes.status).toBe(200);
    expect(cookieStorage.has('admin_pending_2fa')).toBe(true);

    // B. Enroll
    const enrollRes = await enrollHandler();
    expect(enrollRes.status).toBe(200);
    const enrollData = await enrollRes.json();
    expect(enrollData.success).toBe(true);
    expect(enrollData.data.qrCode).toContain('data:image/png;base64');
    expect(enrollData.data.manualKey).toBeDefined();

    const secret = enrollData.data.manualKey;

    // C. Verify with WRONG 6-digit code
    const wrongVerifyReq = new Request('http://localhost/api/auth/2fa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: '000000', isEnrollment: true }),
    });
    const wrongRes = await verifyHandler(wrongVerifyReq);
    expect(wrongRes.status).toBe(401);
    expect(cookieStorage.has('admin_session')).toBe(false);

    // D. Verify with CORRECT 6-digit code generated from secret
    const validCode = generateSync({ secret });
    const correctVerifyReq = new Request('http://localhost/api/auth/2fa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: validCode, isEnrollment: true }),
    });
    const correctRes = await verifyHandler(correctVerifyReq);
    expect(correctRes.status).toBe(200);
    const correctData = await correctRes.json();
    expect(correctData.success).toBe(true);
    expect(correctData.data.recoveryCodes).toHaveLength(10);

    // After success: pending cookie removed, full session cookie created
    expect(cookieStorage.has('admin_pending_2fa')).toBe(false);
    expect(cookieStorage.has('admin_session')).toBe(true);
    expect(cookieStorage.get('admin_session')).toMatch(/^adm_/);

    // E. Logout
    const logoutRes = await logoutHandler();
    expect(logoutRes.status).toBe(200);
    expect(cookieStorage.has('admin_session')).toBe(false);
    expect(cookieStorage.has('admin_pending_2fa')).toBe(false);
  });
});
