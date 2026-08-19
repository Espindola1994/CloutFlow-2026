import { NextResponse } from 'next/server';
import { syncPeakerrFulfillmentStatuses } from '@/services/fulfillment-sync.service';

/**
 * INTERNAL CRON ENDPOINT FOR STATUS SYNC:
 * Protected by CRON_SECRET authorization header or Vercel Cron signature.
 * Strictly gated by PEAKERR_STATUS_SYNC_ENABLED === 'true'.
 */
export async function POST(request: Request) {
  try {
    // 1. Verify KILL SWITCH / FEATURE FLAG
    const isSyncEnabled = process.env.PEAKERR_STATUS_SYNC_ENABLED === 'true';
    if (!isSyncEnabled) {
      return NextResponse.json(
        {
          success: false,
          message: 'PEAKERR_STATUS_SYNC_DISABLED: Automatic status sync is disabled in environment.',
        },
        { status: 200 }
      );
    }

    // 2. Verify CRON_SECRET Authentication
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or missing CRON_SECRET authorization token.' },
        { status: 401 }
      );
    }

    // 3. Execute Central Sync Function
    const result = await syncPeakerrFulfillmentStatuses();

    return NextResponse.json({
      success: result.success,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[InternalPeakerrSyncCronAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during cron status sync.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
