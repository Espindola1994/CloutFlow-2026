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
import { emailInboxSyncState } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const records = await db.select().from(emailInboxSyncState).where(eq(emailInboxSyncState.mailboxKey, 'gmail_default')).limit(1);
    const record = records[0];

    let lastSyncAt = null;
    let isLocked = false;

    if (record) {
      if (record.lastSuccessfulSyncAt) {
        lastSyncAt = record.lastSuccessfulSyncAt.toISOString();
      }
      if (record.lockExpiresAt && record.lockExpiresAt > new Date()) {
        isLocked = true;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        lastSyncAt,
        isLocked,
        isError: !!record?.lastError,
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
