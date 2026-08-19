import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { checkPeakerrOrderStatus } from '@/services/fulfillment.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const cleanId = (id || '').trim();

    const result = await checkPeakerrOrderStatus(cleanId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: result.error,
          },
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized access.' } },
        { status: 401 }
      );
    }

    console.error('[AdminFulfillmentStatusCheckAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error during status check.' } },
      { status: 500 }
    );
  }
}
