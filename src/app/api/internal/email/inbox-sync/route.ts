import { NextResponse } from 'next/server';
import { syncGmailInbox } from '@/services/email/inbox.service';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Check authorization: Bearer CRON_SECRET or query ?secret=
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get('secret');

    const isAuthorized =
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (cronSecret && querySecret === cronSecret);

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Valid CRON_SECRET required.' },
        { status: 401 }
      );
    }

    const result = await syncGmailInbox({
      sinceMinutes: 1440, // Check last 24 hours
      limit: 50,
    });

    return NextResponse.json({
      success: result.success,
      data: {
        syncedCount: result.syncedCount,
        ignoredCount: result.ignoredCount,
        duplicateCount: result.duplicateCount,
        error: result.error,
      },
    });
  } catch (error) {
    console.error('[InboxSyncCronAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
