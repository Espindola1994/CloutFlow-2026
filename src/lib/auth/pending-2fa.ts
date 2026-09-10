import crypto from 'crypto';

export const PENDING_2FA_COOKIE_NAME = 'admin_pending_2fa';
export const PENDING_2FA_TTL_SECONDS = 5 * 60; // 5 minutes

export interface Pending2faPayload {
  adminId: string;
  stage: 'TOTP_REQUIRED' | 'ENROLLMENT_REQUIRED';
  stepTime: number;
  exp: number;
}

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) {
    throw new Error('[Pending2FA] ADMIN_SESSION_SECRET is not configured.');
  }
  return s;
}

/**
 * Creates a signed, short-lived (5 minutes) ticket indicating the first factor (password) passed.
 * Format: p2fa_<base64url(payload)>.<signature>
 */
export function createPending2faToken(adminId = 'admin_root', stage: 'TOTP_REQUIRED' | 'ENROLLMENT_REQUIRED'): string {
  const secret = getSecret();
  const exp = Date.now() + PENDING_2FA_TTL_SECONDS * 1000;

  const payload: Pending2faPayload = {
    adminId,
    stage,
    stepTime: Date.now(),
    exp,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`p2fa:${payloadB64}`)
    .digest('base64url');

  return `p2fa_${payloadB64}.${signature}`;
}

/**
 * Verifies a pending 2FA token.
 */
export function verifyPending2faToken(token: string): Pending2faPayload | null {
  if (!token || !token.startsWith('p2fa_')) {
    return null;
  }

  try {
    const secret = getSecret();
    const raw = token.substring(5);
    const parts = raw.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`p2fa:${payloadB64}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload: Pending2faPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
