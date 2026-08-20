import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { inspectTargetFulfillmentActivity } from '@/services/fulfillment-auto-dispatch.service';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const params = await props.params;
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: { message: 'Order ID is required.' } },
        { status: 400 }
      );
    }

    const result = await inspectTargetFulfillmentActivity(orderId);

    if ('error' in result) {
      return NextResponse.json(
        { success: false, error: { message: result.error, code: result.code } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized access.' } },
        { status: 401 }
      );
    }

    console.error('[AdminCheckTargetAvailabilityAPI] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error evaluating target availability.' } },
      { status: 500 }
    );
  }
}
