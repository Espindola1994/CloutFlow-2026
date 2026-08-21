import { NextResponse } from 'next/server';
import { syncStatusesAndReleaseQueues } from '@/services/fulfillment-sync.service';

/**
 * INTERNAL SYNC & AUTO RELEASE ENDPOINT
 * 
 * Invoked by external authorized schedulers (e.g. GitHub Actions schedule, authenticated webhook, external cron worker).
 * Authentication: Bearer token matching CRON_SECRET or INTERNAL_SYNC_SECRET.
 * 
 * Flow:
 * 1. Validates Authorization secret.
 * 2. Calls syncStatusesAndReleaseQueues().
 * 3. Returns structured execution metrics.
 */
export async function POST(request: Request) {
  try {
    // 1. Verify Authentication (CRON_SECRET or INTERNAL_SYNC_SECRET)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || process.env.INTERNAL_SYNC_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or missing authorization token.' },
        { status: 401 }
      );
    }

    // 2. Check PEAKERR_STATUS_SYNC_ENABLED
    const isSyncEnabled = process.env.PEAKERR_STATUS_SYNC_ENABLED === 'true';
    if (!isSyncEnabled) {
      return NextResponse.json(
        {
          success: false,
          code: 'STATUS_SYNC_DISABLED',
          message: 'PEAKERR_STATUS_SYNC_DISABLED: Automatic status sync is disabled in environment.',
        },
        { status: 200 }
      );
    }

    // 3. Execute Orchestrator
    const result = await syncStatusesAndReleaseQueues();

    return NextResponse.json({
      success: result.success,
      checked: result.checked,
      updated: result.updated,
      completed: result.completed,
      partial: result.partial,
      canceled: result.canceled,
      unchanged: result.unchanged,
      queueReleaseAttempts: result.queueReleaseAttempts,
      queueReleaseSuccess: result.queueReleaseSuccess,
      queueReleaseBlocked: result.queueReleaseBlocked,
      errors: result.errors,
      releasedOrders: result.releasedOrders,
      details: result.details,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[InternalSyncAndReleaseAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during sync and queue release execution.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
