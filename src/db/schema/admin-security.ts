import { pgTable, text, timestamp, boolean, integer, varchar } from 'drizzle-orm/pg-core';

export const adminSecurity = pgTable('admin_security', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  adminId: varchar('admin_id', { length: 255 }).notNull().unique(), // e.g. 'admin_root'
  totpSecretEncrypted: text('totp_secret_encrypted'),
  totpEnabled: boolean('totp_enabled').default(false).notNull(),
  totpVerifiedAt: timestamp('totp_verified_at', { withTimezone: true }),
  lastTotpStep: integer('last_totp_step'),
  failedMfaAttempts: integer('failed_mfa_attempts').default(0).notNull(),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const adminRecoveryCodes = pgTable('admin_recovery_codes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  adminId: varchar('admin_id', { length: 255 }).notNull(),
  codeHash: text('code_hash').notNull().unique(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
