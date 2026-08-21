import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { syncStatusesAndReleaseQueues, syncPeakerrFulfillmentStatuses } from '@/services/fulfillment-sync.service';

export async function POST(request: Request) {
  try {
    await requireAdmin();

    // If PEAKERR_STATUS_SYNC_ENABLED is true, use the full orchestrator
    // Otherwise, allow manual sync with syncPeakerrFulfillmentStatuses() directly
    const isSyncEnabled = process.env.PEAKERR_STATUS_SYNC_ENABLED === 'true';
    const result = isSyncEnabled
      ? await syncStatusesAndReleaseQueues()
      : await syncPeakerrFulfillmentStatuses();

    return NextResponse.json({
      success: result.success,
      data: result,
      enabled: isSyncEnabled,
      targetQueueAutoReleaseEnabled: process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED === 'true',
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized access.' } },
        { status: 401 }
      );
    }

    console.error('[AdminPeakerrSyncAPI] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error during status sync.' } },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({
      success: true,
      enabled: process.env.PEAKERR_STATUS_SYNC_ENABLED === 'true',
      targetQueueAutoReleaseEnabled: process.env.PEAKERR_TARGET_QUEUE_AUTO_RELEASE_ENABLED === 'true',
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized access.' } },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error.' } },
      { status: 500 }
    );
  }
}

