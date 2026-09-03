import { cookies } from 'next/headers';
import crypto from 'crypto';

export const SESSION_COOKIE_NAME = 'admin_session';

export interface AdminSessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AdminSession {
  user: AdminSessionUser;
  expiresAt: Date;
}

function getAdminSessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    console.error('[AdminAuth] ADMIN_SESSION_SECRET is not configured.');
    return null;
  }
  return secret;
}

export function createAdminToken(ttlDays = 7): { token: string; expiresAt: Date } | null {
  const secret = getAdminSessionSecret();
  if (!secret) {
    return null;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);
  
  const payload = {
    role: 'SUPER_ADMIN',
    exp: expiresAt.getTime(),
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('base64url');

  return {
    token: `adm_${payloadBase64}.${signature}`,
    expiresAt,
  };
}

export function verifyAdminToken(token: string): boolean {
  if (!token || !token.startsWith('adm_')) return false;

  const secret = getAdminSessionSecret();
  if (!secret) return false;

  const raw = token.substring(4);
  const parts = raw.split('.');
  if (parts.length !== 2) return false;

  const [payloadBase64, providedSignature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('base64url');

  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function getSession(request?: Request): Promise<AdminSession | null> {
  let token: string | undefined;

  // 1. Try Cookie header
  try {
    const cookieStore = await cookies();
    token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  } catch {
    // Context without Next cookie store
  }

  // 2. Try Authorization: Bearer <token>
  if (!token && request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  // 3. Fallback: Check if internal search job secret matches x-admin-secret or Authorization header
  if (request) {
    const customSecret = request.headers.get('x-admin-key') || request.headers.get('x-admin-secret');
    const expectedJobSecret = process.env.SEARCH_JOB_SECRET;
    const expectedAdminPass = process.env.ADMIN_PASSWORD;

    if (customSecret && (
      (expectedJobSecret && customSecret === expectedJobSecret) ||
      (expectedAdminPass && customSecret === expectedAdminPass)
    )) {
      return {
        user: {
          id: 'admin_root',
          name: 'Administrator',
          email: 'admin@cloutflow.co',
          role: 'SUPER_ADMIN',
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
    }
  }

  if (!token) {
    return null;
  }
  
  const isValid = verifyAdminToken(token);
  if (!isValid) {
    return null;
  }

  return {
    user: {
      id: 'admin_root',
      name: 'Administrator',
      email: 'admin@cloutflow.co',
      role: 'SUPER_ADMIN',
    },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
}

export async function requireUser(request?: Request): Promise<AdminSessionUser> {
  const result = await getSession(request);
  if (!result) {
    throw new Error('Unauthorized');
  }
  return result.user;
}

export async function requireAdmin(request?: Request): Promise<AdminSessionUser> {
  const user = await requireUser(request);
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }
  return user;
}

export async function requireRole(roles: string[]): Promise<AdminSessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  return user;
}
