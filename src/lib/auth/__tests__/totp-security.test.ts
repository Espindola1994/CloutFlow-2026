import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAdminToken, verifyAdminToken } from '@/lib/auth';
import { createPending2faToken, verifyPending2faToken } from '@/lib/auth/pending-2fa';
import { encryptSecret, decryptSecret } from '@/lib/auth/crypto-encryption';
import { hashRecoveryCode } from '@/lib/auth/totp-service';

describe('Admin 2FA & TOTP Core Security', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ADMIN_SESSION_SECRET: 'test_session_secret_for_vitest_cloutflow_2026_super_secure',
      ADMIN_2FA_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      ADMIN_PASSWORD: 'test_admin_password_123',
    };
  });

  describe('AES-256-GCM Secret Encryption & Decryption', () => {
    it('encrypts and decrypts secret correctly without loss', () => {
      const plainSecret = 'JBSWY3DPEHPK3PXP';
      const encrypted = encryptSecret(plainSecret);

      expect(encrypted).not.toBe(plainSecret);
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(30);

      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toBe(plainSecret);
    });

    it('uses different IVs for each encryption call (probabilistic encryption)', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const enc1 = encryptSecret(secret);
      const enc2 = encryptSecret(secret);

      expect(enc1).not.toBe(enc2);
      expect(decryptSecret(enc1)).toBe(secret);
      expect(decryptSecret(enc2)).toBe(secret);
    });
  });

  describe('Pending 2FA Intermediate Ticket', () => {
    it('creates and verifies valid pending 2FA token', () => {
      const token = createPending2faToken('admin_root', 'TOTP_REQUIRED');
      expect(token.startsWith('p2fa_')).toBe(true);

      const payload = verifyPending2faToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.adminId).toBe('admin_root');
      expect(payload?.stage).toBe('TOTP_REQUIRED');
    });

    it('rejects tampered pending 2FA token', () => {
      const token = createPending2faToken('admin_root', 'TOTP_REQUIRED');
      const tampered = token.slice(0, -4) + 'abcd';

      const payload = verifyPending2faToken(tampered);
      expect(payload).toBeNull();
    });

    it('rejects expired pending 2FA token', () => {
      vi.useFakeTimers();
      try {
        const token = createPending2faToken('admin_root', 'TOTP_REQUIRED');
        
        // Fast forward 6 minutes (TTL is 5 minutes)
        vi.advanceTimersByTime(6 * 60 * 1000);

        const payload = verifyPending2faToken(token);
        expect(payload).toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('Full Admin Session Token (MFA Enforcement)', () => {
    it('accepts tokens created with mfaVerified=true', () => {
      const res = createAdminToken(7, true);
      expect(res).not.toBeNull();
      if (!res) return;

      const isValid = verifyAdminToken(res.token);
      expect(isValid).toBe(true);
    });

    it('REJECTS tokens created with mfaVerified=false', () => {
      const res = createAdminToken(7, false);
      expect(res).not.toBeNull();
      if (!res) return;

      const isValid = verifyAdminToken(res.token);
      expect(isValid).toBe(false);
    });

    it('rejects tampered session tokens', () => {
      const res = createAdminToken(7, true);
      if (!res) return;

      const tampered = res.token.slice(0, -4) + 'xyz0';
      expect(verifyAdminToken(tampered)).toBe(false);
    });
  });

  describe('Recovery Code Hashing', () => {
    it('hashes recovery codes with SHA-256 and normalization', () => {
      const code1 = 'ABCD-EFGH-IJKL';
      const code2 = 'abcd-efgh-ijkl';
      const code3 = 'ABCDEFGHIJKL';

      const hash1 = hashRecoveryCode(code1);
      const hash2 = hashRecoveryCode(code2);
      const hash3 = hashRecoveryCode(code3);

      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
      expect(hash1.length).toBe(64);
    });
  });
});
