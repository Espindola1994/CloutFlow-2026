export * from './types';
export * from './resend.transport';
export * from './gmail.transport';
export * from './disabled.transport';

import { EmailTransport } from './types';
import { ResendEmailTransport } from './resend.transport';
import { GmailSmtpEmailTransport } from './gmail.transport';
import { DisabledEmailTransport } from './disabled.transport';

/**
 * Checks if a specific recipient email is allowed under LIFECYCLE_EMAIL_ALLOWLIST.
 * When LIFECYCLE_EMAILS_ENABLED=false, allowlisted addresses can still receive emails
 * for controlled production testing.
 */
export function isEmailInAllowlist(email: string): boolean {
  const allowlistRaw = process.env.LIFECYCLE_EMAIL_ALLOWLIST || '';
  if (!allowlistRaw.trim()) return false;

  const normalized = email.trim().toLowerCase();
  const allowlist = allowlistRaw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return allowlist.includes(normalized);
}

/**
 * Evaluates whether marketing/lifecycle email can be sent to this recipient.
 * Returns true if globally enabled OR if the email is on the controlled allowlist.
 */
export function isMarketingSendAllowedForRecipient(email: string): boolean {
  const isGlobalEnabled = process.env.LIFECYCLE_EMAILS_ENABLED === 'true';
  if (isGlobalEnabled) return true;
  return isEmailInAllowlist(email);
}

export function getMarketingEmailTransport(recipientEmail?: string): EmailTransport {
  const isGlobalEnabled = process.env.LIFECYCLE_EMAILS_ENABLED === 'true';
  const isAllowlisted = recipientEmail ? isEmailInAllowlist(recipientEmail) : false;

  if (!isGlobalEnabled && !isAllowlisted) {
    return new DisabledEmailTransport('BLOCKED_SEND_DISABLED');
  }

  return new ResendEmailTransport();
}

export function getTransactionalEmailTransport(): EmailTransport {
  // Transactional emails (order confirmation, payment received, fulfillment status) use Resend
  return new ResendEmailTransport();
}

export function getSupportEmailTransport(): EmailTransport {
  // Support replies & manual support communication use authenticated Gmail SMTP
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return new GmailSmtpEmailTransport();
  }
  // Fallback to Resend if Gmail is not configured
  return new ResendEmailTransport();
}


