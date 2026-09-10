import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16; // 128 bits auth tag

/**
 * Derives a 32-byte key from ADMIN_2FA_ENCRYPTION_KEY or falls back safely to
 * ADMIN_SESSION_SECRET with HKDF/SHA-256 derivation so that server restarts
 * don't lose the encryption key if ADMIN_2FA_ENCRYPTION_KEY is temporarily omitted.
 */
export function getEncryptionKey(): Buffer {
  const envKey = process.env.ADMIN_2FA_ENCRYPTION_KEY;
  if (envKey && envKey.trim().length > 0) {
    const trimmed = envKey.trim();
    // If provided as 64-char hex string
    if (trimmed.length === 64 && /^[0-9a-fA-F]+$/.test(trimmed)) {
      return Buffer.from(trimmed, 'hex');
    }
    // If provided as raw string or base64, derive 32 bytes using sha256
    return crypto.createHash('sha256').update(trimmed).digest();
  }

  // Fallback to ADMIN_SESSION_SECRET derived key
  const fallback = process.env.ADMIN_SESSION_SECRET;
  if (fallback && fallback.trim().length > 0) {
    return crypto.createHash('sha256').update(`cloutflow-totp-key:${fallback.trim()}`).digest();
  }

  throw new Error('[Crypto] Neither ADMIN_2FA_ENCRYPTION_KEY nor ADMIN_SESSION_SECRET is configured.');
}

/**
 * Encrypts sensitive string using AES-256-GCM.
 * Output format: base64(iv:ciphertext:authTag)
 */
export function encryptSecret(plainText: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final()
  ]);

  const tag = cipher.getAuthTag();

  // Combine iv + tag + encrypted
  const combined = Buffer.concat([iv, tag, encrypted]);
  return combined.toString('base64url');
}

/**
 * Decrypts AES-256-GCM ciphertext.
 */
export function decryptSecret(cipherTextBase64: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(cipherTextBase64, 'base64url');

  if (combined.length < IV_LENGTH + TAG_LENGTH + 1) {
    throw new Error('Invalid ciphertext length');
  }

  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}
