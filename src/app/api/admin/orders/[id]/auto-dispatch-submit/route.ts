import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { autoDispatchOrder } from '@/services/fulfillment-auto-dispatch.service';

export async function POST(
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

    const result = await autoDispatchOrder(orderId);

    // Filter out API keys or other secrets (though autoDispatchOrder already filters them)
    // and format response according to instructions
    return NextResponse.json({
      success: result.success,
      publicId: result.publicId,
      orderId: result.orderId,
      provider: result.success ? 'peakerr' : undefined,
      providerOrderId: result.providerOrderId,
      fulfillmentStatus: result.status,
      // We also return error details if failed
      ...(result.success ? {} : { error: result.error, code: result.code }),
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized access.' } },
        { status: 401 }
      );
    }

    console.error('[AdminAutoDispatchSubmitAPI] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error during auto-dispatch execution.' } },
      { status: 500 }
    );
  }
}
