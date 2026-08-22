import { NextResponse } from 'next/server';
import { runLifecycleWorker } from '@/services/lifecycle/worker.service';

/**
 * INTERNAL LIFECYCLE WORKER ENDPOINT
 * 
 * Invoked by external authorized schedulers (e.g. GitHub Actions schedule, authenticated webhook, external cron worker).
 * Authentication: Bearer token matching CRON_SECRET or INTERNAL_SYNC_SECRET.
 */
export async function POST(request: Request) {
  try {
    // 1. Verify Authentication
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || process.env.INTERNAL_SYNC_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or missing authorization token.' },
        { status: 401 }
      );
    }

    // 2. Run Worker
    const result = await runLifecycleWorker();

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('[InternalLifecycleWorkerAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during lifecycle worker execution.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
