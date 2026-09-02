import crypto from 'crypto';
import { db } from '@/db';
import { emailSuppressions, lifecycleAutomations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || process.env.AUTH_SECRET || 'cloutflow_unsubscribe_secret_default_k938';

export function generateUnsubscribeToken(email: string): string {
  const normalized = email.toLowerCase().trim();
  return crypto.createHmac('sha256', UNSUBSCRIBE_SECRET).update(normalized).digest('hex');
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!email || !token) return false;
  const expected = generateUnsubscribeToken(email);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token, 'hex'));
  } catch {
    return false;
  }
}

export function buildUnsubscribeUrl(email: string): string {
  const normalized = email.toLowerCase().trim();
  const token = generateUnsubscribeToken(normalized);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cloutflow.co';
  return `${baseUrl.replace(/\/$/, '')}/unsubscribe?email=${encodeURIComponent(normalized)}&token=${token}`;
}

export async function isEmailSuppressed(email: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  const existing = await db
    .select({ id: emailSuppressions.id })
    .from(emailSuppressions)
    .where(eq(emailSuppressions.customerEmail, normalized))
    .limit(1);
    
  return existing.length > 0;
}

export async function suppressEmail(email: string, reason: 'UNSUBSCRIBED' | 'MANUAL_BLOCK' = 'UNSUBSCRIBED', source: 'USER' | 'ADMIN' = 'USER') {
  const normalized = email.toLowerCase().trim();
  
  // Upsert or insert suppression
  const existing = await db
    .select({ id: emailSuppressions.id })
    .from(emailSuppressions)
    .where(eq(emailSuppressions.customerEmail, normalized))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(emailSuppressions).values({
      customerEmail: normalized,
      reason,
      source,
    });
  }

  // Cancel any pending marketing automations for this email
  await db
    .update(lifecycleAutomations)
    .set({
      status: 'SUPPRESSED',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(lifecycleAutomations.customerEmail, normalized),
        eq(lifecycleAutomations.status, 'PENDING')
      )
    );
}
