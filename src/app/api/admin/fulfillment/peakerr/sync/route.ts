import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { syncPeakerrFulfillmentStatuses } from '@/services/fulfillment-sync.service';

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const result = await syncPeakerrFulfillmentStatuses();

    return NextResponse.json({
      success: result.success,
      data: result,
      enabled: process.env.PEAKERR_STATUS_SYNC_ENABLED === 'true',
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
