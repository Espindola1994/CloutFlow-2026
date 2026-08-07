import { db } from '../index';
import { users, sessions } from '../schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function createSession(userId: string, userAgent?: string, ipHash?: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  // 7 days expiration
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  const [session] = await db.insert(sessions).values({
    userId,
    tokenHash,
    expiresAt,
    userAgent,
    ipHash
  }).returning();
  
  return { session, token };
}

export async function validateSession(token: string) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  const [session] = await db.query.sessions.findMany({
    where: eq(sessions.tokenHash, tokenHash),
    limit: 1,
  });
  
  if (!session) {
    return null;
  }
  
  if (session.expiresAt < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, session.id));
    return null;
  }
  
  // Renew session if less than 3 days left
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  
  if (session.expiresAt < threeDaysFromNow) {
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);
    
    await db.update(sessions)
      .set({ expiresAt: newExpiresAt, lastSeenAt: new Date() })
      .where(eq(sessions.id, session.id));
  } else {
    // Just update last seen
    await db.update(sessions)
      .set({ lastSeenAt: new Date() })
      .where(eq(sessions.id, session.id));
  }
  
  const [user] = await db.query.users.findMany({
    where: eq(users.id, session.userId),
    limit: 1
  });
  
  if (!user || !user.active) {
    return null;
  }
  
  return { session, user };
}

export async function invalidateSession(token: string) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}
