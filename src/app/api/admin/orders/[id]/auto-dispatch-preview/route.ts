import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { evaluateOrderForAutoDispatch } from '@/services/fulfillment-auto-dispatch.service';

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

    const evaluation = await evaluateOrderForAutoDispatch(orderId);

    return NextResponse.json({
      success: true,
      data: evaluation,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized access.' } },
        { status: 401 }
      );
    }

    console.error('[AdminAutoDispatchPreviewAPI] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error during auto-dispatch preview.' } },
      { status: 500 }
    );
  }
}
