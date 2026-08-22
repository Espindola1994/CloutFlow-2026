import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { emailInboxSyncState } from '@/db/schema';
import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { syncGmailInbox } from '@/services/email/inbox.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (key !== 'forensic_check_2026') {
      return NextResponse.json({ success: false, error: 'Unauthorized key' }, { status: 401 });
    }

    const testResults: Record<string, any> = {};

    // 1. Test lock acquisition
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
    const token1 = 'test-token-1';
    
    await db.insert(emailInboxSyncState)
      .values({ 
        mailboxKey: 'test_mailbox', 
        lockToken: token1,
        lockExpiresAt: expiresAt,
        lastAttemptAt: now,
      })
      .onConflictDoUpdate({
        target: emailInboxSyncState.mailboxKey,
        set: { 
          lockToken: token1,
          lockExpiresAt: expiresAt,
          lastAttemptAt: now,
          updatedAt: now 
        }
      });
    testResults.lockAcquired = true;

    // 2. Test concurrent acquire (should detect lock is active)
    const existing = await db.select().from(emailInboxSyncState).where(eq(emailInboxSyncState.mailboxKey, 'test_mailbox')).limit(1);
    const isLocked = existing[0]?.lockExpiresAt && existing[0].lockExpiresAt > new Date();
    testResults.concurrentLockBlocked = isLocked;

    // 3. Test lock release
    await db.update(emailInboxSyncState)
      .set({ 
        lockToken: null,
        lockExpiresAt: null,
        updatedAt: new Date()
      })
      .where(and(
        eq(emailInboxSyncState.mailboxKey, 'test_mailbox'),
        eq(emailInboxSyncState.lockToken, token1)
      ));
    const afterRelease = await db.select().from(emailInboxSyncState).where(eq(emailInboxSyncState.mailboxKey, 'test_mailbox')).limit(1);
    testResults.lockReleased = afterRelease[0]?.lockToken === null;

    // 4. Test cursor write & read-back
    await db.insert(emailInboxSyncState)
      .values({ 
        mailboxKey: 'test_mailbox', 
        uidValidity: '12345',
        lastProcessedUid: 9999,
        lastSuccessfulSyncAt: new Date(),
      })
      .onConflictDoUpdate({
        target: emailInboxSyncState.mailboxKey,
        set: { 
          uidValidity: '12345',
          lastProcessedUid: 9999,
          lastSuccessfulSyncAt: new Date(),
          updatedAt: new Date() 
        }
      });

    const readCursor = await db.select().from(emailInboxSyncState).where(eq(emailInboxSyncState.mailboxKey, 'test_mailbox')).limit(1);
    testResults.cursorReadBack = {
      uidValidity: readCursor[0]?.uidValidity,
      lastProcessedUid: readCursor[0]?.lastProcessedUid,
      pass: readCursor[0]?.uidValidity === '12345' && Number(readCursor[0]?.lastProcessedUid) === 9999
    };

    // Clean up test mailbox
    await db.delete(emailInboxSyncState).where(eq(emailInboxSyncState.mailboxKey, 'test_mailbox'));

    // Run real Gmail Sync
    const syncRes = await syncGmailInbox({ limit: 10 });
    testResults.realGmailSync = syncRes;

    return NextResponse.json({
      success: true,
      testResults,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      stack: err.stack,
    }, { status: 500 });
  }
}