import { NextResponse } from 'next/server';
import { processPerfectPayWebhook } from '@/services/perfectpay.service';
import { autoDispatchOrder } from '@/services/fulfillment-auto-dispatch.service';
import { emitLifecycleEvent } from '@/services/lifecycle/event.service';

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

    // 3. FASE A+B: Emit Lifecycle Events Extracted from PerfectPay processing
    // Awaited immediately, before returning ACK. Must be short and idempotent.
    // Errors are swallowed safely to prevent transactional rollback.
    if (result.success && result.authenticated && result.mode === 'VERIFIED') {
      try {
        if (result.action === 'LEAD_RECORDED' && payload.customer_email) {
          await emitLifecycleEvent({
            customerEmail: String(payload.customer_email),
            eventType: 'LEAD_CAPTURED',
            idempotencyKey: `LEAD_CAPTURED:${result.leadId || Date.now()}`,
            payload: {
              product: payload.product_name,
              plan: payload.plan_name,
              amount: payload.sale_amount,
              capturedAt: new Date().toISOString()
            }
          });
        } else if ((result.action === 'ORDER_CREATED' || result.action === 'ORDER_UPDATED') && payload.customer_email) {
          const rawStatus = String(payload.sale_status_enum || payload.sale_status || '').toLowerCase();
          if (rawStatus === '2' || rawStatus === 'approved') {
            await emitLifecycleEvent({
              customerEmail: String(payload.customer_email),
              eventType: 'PAYMENT_APPROVED',
              idempotencyKey: `PAYMENT_APPROVED:ORDER:${result.orderId}`,
              payload: { orderId: result.orderId, amount: payload.sale_amount }
            });
            // Also evaluate repeat purchase logic if we have customer email
            const { evaluateRepeatPurchase } = await import('@/services/lifecycle/event.service');
            await evaluateRepeatPurchase(String(payload.customer_email), result.orderId!, payload.sale_amount as string);
          } else if (rawStatus === '10' || rawStatus === 'refunded') {
             await emitLifecycleEvent({
                customerEmail: String(payload.customer_email),
                eventType: 'ORDER_REFUNDED',
                idempotencyKey: `ORDER_REFUNDED:ORDER:${result.orderId}`,
                payload: { orderId: result.orderId, amount: payload.sale_amount }
             });
          }
        }
      } catch (err) {
        console.error('[PerfectPayWebhook] Error emitting lifecycle event:', err);
      }
    }

    // 4. FASE 4.3: Safe Automated Peakerr Dispatch (Outside Transaction)
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
