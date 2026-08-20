import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getFulfillmentOverview, getAutoDispatchOverview } from '@/services/fulfillment-auto-dispatch.service';

export async function GET() {
  try {
    await requireAdmin();

    const [fulfillmentStats, autoDispatchStats] = await Promise.all([
      getFulfillmentOverview(),
      getAutoDispatchOverview(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        fulfillment: fulfillmentStats,
        autoDispatch: autoDispatchStats,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized access.' } },
        { status: 401 }
      );
    }

    console.error('[AdminFulfillmentOverviewAPI] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error fetching fulfillment overview.' } },
      { status: 500 }
    );
  }
}
