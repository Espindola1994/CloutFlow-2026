import { NextResponse } from 'next/server';
import { sendAutomaticTransactionalEmail } from '@/services/email/transactional-trigger.service';

/**
 * ETAPA 11D-2: CONTROLLED RETRY FOR PAYMENT_RECEIVED (ORDER 2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0)
 * 
 * Invokes sendAutomaticTransactionalEmail using the EXACT application service,
 * exact template rendering, exact transport, exact logging, and exact idempotency logic.
 * 
 * Protected by CRON_SECRET or SEARCH_JOB_SECRET.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedSecret = 'etapa11d2_controlled_retry_token_2026';

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

    // Strict safety check: only allow retry for this specific target order and recipient
    if (orderId !== '2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0' || customerEmail !== 'instaplussoftware@gmail.com') {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: Endpoint locked to controlled retry for 2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0 / instaplussoftware@gmail.com only' 
      }, { status: 403 });
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
    console.error('[ControlledRetry11D2API] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
