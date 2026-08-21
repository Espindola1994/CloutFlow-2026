import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { listTargetQueues, getTargetQueueOverview } from '@/services/fulfillment-target-queue.service';

/**
 * GET /api/admin/fulfillment/target-queue
 * Read-only inspector endpoint for target-aware queues.
 */
export async function GET() {
  try {
    await requireAdmin();

    const overview = await getTargetQueueOverview();
    const groups = await listTargetQueues();

    return NextResponse.json({
      success: true,
      data: {
        overview,
        groups,
      },
    });
  } catch (error: any) {
    if (error?.message === 'Unauthorized' || error?.message === 'Forbidden') {
      return NextResponse.json({ success: false, code: 'UNAUTHORIZED', error: { message: 'Unauthorized access.' } }, { status: 401 });
    }
    console.error('[AdminTargetQueueGet] Error:', error);
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', error: { message: error?.message || 'Failed to list target queues.' } }, { status: 500 });
  }
}
