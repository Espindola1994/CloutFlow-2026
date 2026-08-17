import { NextResponse } from 'next/server';
import { processPerfectPayWebhook } from '@/services/perfectpay.service';

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
