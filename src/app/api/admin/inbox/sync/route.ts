import { NextResponse } from 'next/server';
import { syncGmailInbox } from '@/services/email/inbox.service';
import { requireAdmin } from '@/lib/auth/session';

export async function POST() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await syncGmailInbox({
      limit: 50,
    });

    if (!result.success && result.status !== 'SYNC_ALREADY_RUNNING') {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Sync failed',
          data: {
            syncedCount: result.syncedCount,
            ignoredCount: result.ignoredCount,
            duplicateCount: result.duplicateCount,
            status: result.status,
            diagnostics: result.diagnostics,
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        syncedCount: result.syncedCount,
        ignoredCount: result.ignoredCount,
        duplicateCount: result.duplicateCount,
        status: result.status,
        diagnostics: result.diagnostics,
      },
    });
  } catch (error) {
    console.error('[AdminInboxSyncAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const cursorRecords = await db.select({ updatedAt: settings.updatedAt }).from(settings).where(eq(settings.key, 'inbox_sync_cursor')).limit(1);
    const cursorRecord = cursorRecords[0];

    const lockRecords = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, 'inbox_sync_lock')).limit(1);
    const lockRecord = lockRecords[0];

    let lastSyncAt = null;
    let isLocked = false;

    if (cursorRecord && cursorRecord.updatedAt) {
      lastSyncAt = cursorRecord.updatedAt.toISOString();
    }

    if (lockRecord && lockRecord.value) {
      const lockData = lockRecord.value as { lockedAt: string };
      const lockedAt = new Date(lockData.lockedAt);
      if (new Date().getTime() - lockedAt.getTime() < 5 * 60 * 1000) {
        isLocked = true;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        lastSyncAt,
        isLocked,
        isError: false, // Could expand error tracking later
      }
    });
  } catch (error) {
    console.error('[AdminInboxSyncStatusAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
