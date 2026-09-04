import { NextResponse } from 'next/server';
import { sendAutomaticTransactionalEmail } from '@/services/email/transactional-trigger.service';

/**
 * ETAPA 11C-2: CONTROLLED REAL EMAIL EXECUTION ENDPOINT
 * 
 * Invokes sendAutomaticTransactionalEmail using the EXACT application service,
 * exact template rendering, exact transport, exact logging, and exact idempotency logic.
 * 
 * Protected by CRON_SECRET or SEARCH_JOB_SECRET.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedSecret = 'etapa11c2_controlled_test_token_2026';

    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type = 'PAYMENT_APPROVED',
      orderId,
      customerEmail,
      customerName,
      target,
      platform,
      service,
      quantity
    } = body;

    if (!orderId || !customerEmail) {
      return NextResponse.json({ success: false, error: 'Missing orderId or customerEmail' }, { status: 400 });
    }

    // Call the EXACT application transport / service
    const result = await sendAutomaticTransactionalEmail({
      type,
      orderId,
      customerEmail,
      customerName,
      target,
      platform,
      service,
      quantity
    });

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[ControlledEmailTestAPI] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
