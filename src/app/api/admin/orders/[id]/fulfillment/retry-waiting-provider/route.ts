import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import {
  evaluateWaitingProviderRecovery,
  retryWaitingProviderOrder,
} from '@/services/fulfillment-auto-dispatch.service';

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

    const evaluation = await evaluateWaitingProviderRecovery(orderId);

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

    console.error('[AdminRecoveryPreviewAPI] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error evaluating recovery.' } },
      { status: 500 }
    );
  }
}

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

    const result = await retryWaitingProviderOrder(orderId);

    return NextResponse.json({
      success: result.success,
      data: result,
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

    console.error('[AdminRecoverySubmitAPI] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error executing recovery retry.' } },
      { status: 500 }
    );
  }
}
