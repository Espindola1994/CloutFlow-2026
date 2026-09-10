import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { db } from '@/db';
import { adminSecurity, adminRecoveryCodes, adminActivityLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { encryptSecret, decryptSecret } from './crypto-encryption';

export const ADMIN_ROOT_ID = 'admin_root';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export interface TotpEnrollmentData {
  secret: string;
  otpauthUri: string;
  qrCodeDataUrl: string;
}

export interface AdminSecurityStatus {
  enabled: boolean;
  verifiedAt: Date | null;
  lockedUntil: Date | null;
  isLocked: boolean;
}

/**
 * Ensures the admin_security table and admin_recovery_codes tables exist (idempotent DDL).
 * This ensures zero runtime failure even if migrations have not run yet.
 */
export async function ensureSecurityTables() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS admin_security (
        id text PRIMARY KEY NOT NULL,
        admin_id varchar(255) NOT NULL UNIQUE,
        totp_secret_encrypted text,
        totp_enabled boolean DEFAULT false NOT NULL,
        totp_verified_at timestamp with time zone,
        last_totp_step integer,
        failed_mfa_attempts integer DEFAULT 0 NOT NULL,
        locked_until timestamp with time zone,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS admin_recovery_codes (
        id text PRIMARY KEY NOT NULL,
        admin_id varchar(255) NOT NULL,
        code_hash text NOT NULL UNIQUE,
        used_at timestamp with time zone,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_admin_recovery_codes_admin_id ON admin_recovery_codes (admin_id);
    `);
  } catch (err) {
    // If DB is offline or mock, continue gracefully
    console.warn('[AdminSecurity] Table check warning:', (err as Error).message);
  }
}

/**
 * Log admin security events in adminActivityLogs
 */
export async function logAdminSecurityEvent(
  action: string,
  metadata?: Record<string, unknown>,
  userId: string = ADMIN_ROOT_ID
) {
  try {
    await db.insert(adminActivityLogs).values({
      userId,
      action,
      entity: 'ADMIN_AUTH',
      entityId: userId,
      metadata: metadata || null,
    });
  } catch (err) {
    // Suppress DB insert errors for logging to avoid blocking core auth
    console.warn('[AdminSecurityLog] Failed to log security action:', action, (err as Error).message);
  }
}

/**
 * Get current 2FA status for admin_root
 */
export async function getAdminSecurityStatus(adminId = ADMIN_ROOT_ID): Promise<AdminSecurityStatus> {
  await ensureSecurityTables();

  try {
    const rows = await db
      .select()
      .from(adminSecurity)
      .where(eq(adminSecurity.adminId, adminId))
      .limit(1);

    if (rows.length === 0) {
      return {
        enabled: false,
        verifiedAt: null,
        lockedUntil: null,
        isLocked: false,
      };
    }

    const row = rows[0];
    const now = new Date();
    const isLocked = !!(row.lockedUntil && new Date(row.lockedUntil) > now);

    return {
      enabled: row.totpEnabled,
      verifiedAt: row.totpVerifiedAt,
      lockedUntil: row.lockedUntil,
      isLocked,
    };
  } catch (err) {
    console.error('[AdminSecurity] Error querying admin security status:', err);
    return {
      enabled: false,
      verifiedAt: null,
      lockedUntil: null,
      isLocked: false,
    };
  }
}

/**
 * Generates new TOTP enrollment material (Secret, URI, QR Code).
 * The secret is temporarily saved in encrypted form with totp_enabled = false.
 */
export async function generateTotpEnrollment(adminId = ADMIN_ROOT_ID): Promise<TotpEnrollmentData> {
  await ensureSecurityTables();

  // RFC 6238 Standard Secret
  const secret = generateSecret();
  const issuer = 'CloutFlow';
  const label = 'CloutFlow Admin';

  const otpauthUri = generateURI({
    issuer,
    label,
    secret,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 260,
    color: {
      dark: '#071D26',
      light: '#FFFFFF',
    },
  });

  const encryptedSecret = encryptSecret(secret);

  // Upsert enrollment record
  const existing = await db
    .select()
    .from(adminSecurity)
    .where(eq(adminSecurity.adminId, adminId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(adminSecurity)
      .set({
        totpSecretEncrypted: encryptedSecret,
        totpEnabled: false, // Must be confirmed by first successful code
        updatedAt: new Date(),
      })
      .where(eq(adminSecurity.adminId, adminId));
  } else {
    await db.insert(adminSecurity).values({
      adminId,
      totpSecretEncrypted: encryptedSecret,
      totpEnabled: false,
      failedMfaAttempts: 0,
    });
  }

  return {
    secret,
    otpauthUri,
    qrCodeDataUrl,
  };
}

/**
 * Generates 10 friendly recovery codes (e.g., ABCD-EFGH-IJKL).
 * Stored as SHA-256 hashes in the database.
 * Returns raw plaintext codes ONLY ONCE to present to the admin.
 */
export async function generateRecoveryCodes(adminId = ADMIN_ROOT_ID): Promise<string[]> {
  await ensureSecurityTables();

  // Invalidate any existing recovery codes for this admin
  await db
    .delete(adminRecoveryCodes)
    .where(eq(adminRecoveryCodes.adminId, adminId));

  const codes: string[] = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // unambiguous charset

  for (let i = 0; i < 10; i++) {
    let part1 = '';
    let part2 = '';
    let part3 = '';
    const bytes = crypto.randomBytes(12);
    for (let b = 0; b < 4; b++) part1 += chars[bytes[b] % chars.length];
    for (let b = 4; b < 8; b++) part2 += chars[bytes[b] % chars.length];
    for (let b = 8; b < 12; b++) part3 += chars[bytes[b] % chars.length];
    const code = `${part1}-${part2}-${part3}`;
    codes.push(code);

    const codeHash = hashRecoveryCode(code);
    await db.insert(adminRecoveryCodes).values({
      adminId,
      codeHash,
    });
  }

  await logAdminSecurityEvent('ADMIN_RECOVERY_CODES_REGENERATED', { count: 10 }, adminId);

  return codes;
}

export function hashRecoveryCode(code: string): string {
  const normalized = code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return crypto.createHash('sha256').update(`cloutflow-rec:${normalized}`).digest('hex');
}

/**
 * Records a failed MFA attempt, locks out after 5 failures for 15 minutes.
 */
export async function recordFailedMfaAttempt(adminId = ADMIN_ROOT_ID): Promise<{ isLocked: boolean; attemptsLeft: number }> {
  await ensureSecurityTables();

  const [row] = await db
    .select()
    .from(adminSecurity)
    .where(eq(adminSecurity.adminId, adminId))
    .limit(1);

  const attempts = (row?.failedMfaAttempts || 0) + 1;
  const isLocked = attempts >= MAX_FAILED_ATTEMPTS;
  const lockedUntil = isLocked ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null;

  if (row) {
    await db
      .update(adminSecurity)
      .set({
        failedMfaAttempts: attempts,
        lockedUntil: lockedUntil || row.lockedUntil,
        updatedAt: new Date(),
      })
      .where(eq(adminSecurity.adminId, adminId));
  }

  await logAdminSecurityEvent('ADMIN_MFA_FAILURE', { attempts, isLocked }, adminId);

  return {
    isLocked,
    attemptsLeft: Math.max(0, MAX_FAILED_ATTEMPTS - attempts),
  };
}

/**
 * Resets failed MFA attempts on successful authentication.
 */
export async function resetFailedMfaAttempts(adminId = ADMIN_ROOT_ID) {
  await ensureSecurityTables();

  await db
    .update(adminSecurity)
    .set({
      failedMfaAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(adminSecurity.adminId, adminId));
}

/**
 * Verifies a 6-digit TOTP token against the encrypted secret in DB.
 * Implements:
 * 1. Rate limiting / Lockout check.
 * 2. Exact 6-digit formatting.
 * 3. Window = 1 (small tolerance).
 * 4. Replay protection (compares time-step with lastTotpStep).
 */
export async function verifyTotpToken(
  token: string,
  adminId = ADMIN_ROOT_ID,
  isEnrollment = false
): Promise<{ success: boolean; error?: string; isLocked?: boolean }> {
  await ensureSecurityTables();

  // Clean and validate format
  const cleanToken = token.trim();
  if (!/^\d{6}$/.test(cleanToken)) {
    return { success: false, error: 'Invalid code format. Enter exactly 6 digits.' };
  }

  const [row] = await db
    .select()
    .from(adminSecurity)
    .where(eq(adminSecurity.adminId, adminId))
    .limit(1);

  if (!row || !row.totpSecretEncrypted) {
    return { success: false, error: 'Two-factor authentication is not initialized.' };
  }

  // Check lockout
  const now = new Date();
  if (row.lockedUntil && new Date(row.lockedUntil) > now) {
    const minutesLeft = Math.ceil((new Date(row.lockedUntil).getTime() - now.getTime()) / 60000);
    return {
      success: false,
      isLocked: true,
      error: `Too many failed attempts. Account temporarily locked for ${minutesLeft} minute(s).`,
    };
  }

  let plainSecret: string;
  try {
    plainSecret = decryptSecret(row.totpSecretEncrypted);
  } catch (err) {
    console.error('[AdminSecurity] Failed to decrypt TOTP secret:', err);
    return { success: false, error: 'Internal security configuration error.' };
  }

  // Verify using otplib with small tolerance (epochTolerance = 30s)
  const verification: any = verifySync({
    token: cleanToken,
    secret: plainSecret,
    epochTolerance: 30, // RFC 6238 tolerance of 1 period (±30s)
  });

  if (!verification || !verification.valid) {
    const { isLocked, attemptsLeft } = await recordFailedMfaAttempt(adminId);
    if (isLocked) {
      return {
        success: false,
        isLocked: true,
        error: `Too many failed attempts. Account temporarily locked for ${LOCKOUT_MINUTES} minutes.`,
      };
    }
    return {
      success: false,
      error: `Incorrect code. ${attemptsLeft} attempt(s) remaining before temporary lockout.`,
    };
  }

  // Replay Protection: ensure token timestep has not already been used
  const currentStep = typeof verification.timeStep === 'number' ? verification.timeStep : Math.floor(Date.now() / 30000);
  if (!isEnrollment && row.lastTotpStep && currentStep <= row.lastTotpStep) {
    await recordFailedMfaAttempt(adminId);
    return {
      success: false,
      error: 'This code was already used. Please wait for the next 30-second code.',
    };
  }

  // Success!
  await resetFailedMfaAttempts(adminId);

  // Update security record
  await db
    .update(adminSecurity)
    .set({
      totpEnabled: true,
      totpVerifiedAt: row.totpVerifiedAt || new Date(),
      lastTotpStep: currentStep,
      updatedAt: new Date(),
    })
    .where(eq(adminSecurity.adminId, adminId));

  const action = isEnrollment ? 'ADMIN_MFA_ENROLLED' : 'ADMIN_MFA_SUCCESS';
  await logAdminSecurityEvent(action, { timeStep: currentStep }, adminId);

  return { success: true };
}

/**
 * Validates a recovery code. Each code is single-use.
 */
export async function verifyRecoveryCode(
  rawCode: string,
  adminId = ADMIN_ROOT_ID
): Promise<{ success: boolean; error?: string; remainingCount?: number }> {
  await ensureSecurityTables();

  const codeHash = hashRecoveryCode(rawCode);

  const [matched] = await db
    .select()
    .from(adminRecoveryCodes)
    .where(eq(adminRecoveryCodes.codeHash, codeHash))
    .limit(1);

  if (!matched) {
    await recordFailedMfaAttempt(adminId);
    return { success: false, error: 'Invalid recovery code.' };
  }

  if (matched.usedAt) {
    await recordFailedMfaAttempt(adminId);
    return { success: false, error: 'This recovery code has already been used.' };
  }

  // Mark code as used
  await db
    .update(adminRecoveryCodes)
    .set({ usedAt: new Date() })
    .where(eq(adminRecoveryCodes.id, matched.id));

  await resetFailedMfaAttempts(adminId);
  await logAdminSecurityEvent('ADMIN_RECOVERY_CODE_USED', { codeId: matched.id }, adminId);

  // Count remaining
  const allCodes = await db
    .select()
    .from(adminRecoveryCodes)
    .where(eq(adminRecoveryCodes.adminId, adminId));

  const remaining = allCodes.filter((c) => !c.usedAt).length;

  return { success: true, remainingCount: remaining };
}

/**
 * Count active remaining recovery codes
 */
export async function getRemainingRecoveryCodesCount(adminId = ADMIN_ROOT_ID): Promise<number> {
  await ensureSecurityTables();
  try {
    const codes = await db
      .select()
      .from(adminRecoveryCodes)
      .where(eq(adminRecoveryCodes.adminId, adminId));
    return codes.filter((c) => !c.usedAt).length;
  } catch {
    return 0;
  }
}
