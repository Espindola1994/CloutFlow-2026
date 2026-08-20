import { NextResponse } from 'next/server';
import { processPerfectPayWebhook } from '@/services/perfectpay.service';
import { autoDispatchOrder } from '@/services/fulfillment-auto-dispatch.service';

export async function POST(request: Request) {
  try {
    // 1. Parse JSON or Form Data payload safely
    let payload: Record<string, unknown> = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        payload[key] = value.toString();
      });
    } else {
      const text = await request.text();
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { rawBody: text };
      }
    }

    // 2. Process webhook event in transaction
    const result = await processPerfectPayWebhook(payload);

    // 3. FASE 4.3: Safe Automated Peakerr Dispatch (Outside Transaction)
    // Only dispatch if the payment was securely authenticated, validated, successfully committed, and represents an approved creation or update.
    if (
      result.success &&
      result.authenticated &&
      (result.action === 'ORDER_CREATED' || result.action === 'ORDER_UPDATED') &&
      result.orderId &&
      result.mode === 'VERIFIED'
    ) {
      // Background execution of auto-dispatch to ensure webhook response ACK is never blocked or delayed
      // and operational fulfillment failures do not rollback payment state.
      autoDispatchOrder(result.orderId)
        .then((dispatchResult) => {
          console.log('[PerfectPayAutoDispatch] Dispatch evaluated for order:', result.publicId, {
            orderId: result.orderId,
            success: dispatchResult.success,
            code: dispatchResult.code,
            providerOrderId: dispatchResult.providerOrderId,
          });
        })
        .catch((dispatchError) => {
          // Never impact the payment status even if the background dispatch catastrophically fails
          console.error('[PerfectPayAutoDispatch] Unhandled error during auto-dispatch for order:', result.publicId, dispatchError);
        });
    }

    return NextResponse.json({
      success: true,
      action: result.action,
      message: result.message || 'Webhook processed successfully',
    });
  } catch (error: unknown) {
    console.error('[PerfectPayWebhook] Error processing postback:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to process webhook event' } },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'operational',
    service: 'CloutFlow PerfectPay Webhook Handler',
    protocol: 'POST required',
  });
}
