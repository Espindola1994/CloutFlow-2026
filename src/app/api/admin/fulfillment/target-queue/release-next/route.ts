import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { releaseNextQueuedOrderForTarget, isTargetQueueAutoReleaseEnabled } from '@/services/fulfillment-target-queue.service';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { resolveCanonicalFulfillmentTarget } from '@/services/fulfillment.service';

/**
 * POST /api/admin/fulfillment/target-queue/release-next
 * Controlled Admin single-order release trigger.
 * Allows preview / manual release for a specific target queue.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json().catch(() => ({}));
    const { orderId, platform, canonicalTarget, forceRelease = false } = body;

    let targetPlatform = platform;
    let targetUrl = canonicalTarget;

    if (orderId && (!targetPlatform || !targetUrl)) {
      const [order] = await db.query.orders.findMany({
        where: or(eq(orders.id, orderId), eq(orders.publicId, orderId)),
        limit: 1,
      });

      if (!order) {
        return NextResponse.json({ success: false, code: 'ORDER_NOT_FOUND', error: { message: `Order "${orderId}" not found.` } }, { status: 404 });
      }

      targetPlatform = order.platform;
      const tRes = resolveCanonicalFulfillmentTarget(order);
      if (!tRes.success || !tRes.target) {
        return NextResponse.json({ success: false, code: 'INVALID_TARGET', error: { message: 'Could not resolve target for order.' } }, { status: 400 });
      }
      targetUrl = tRes.target;
    }

    if (!targetPlatform || !targetUrl) {
      return NextResponse.json({ success: false, code: 'INVALID_INPUT', error: { message: 'platform and canonicalTarget (or a valid orderId) are required.' } }, { status: 400 });
    }

    const result = await releaseNextQueuedOrderForTarget({
      platform: targetPlatform,
      canonicalTarget: targetUrl,
      triggeredBy: 'ADMIN_MANUAL_RELEASE',
      forceRelease: Boolean(forceRelease),
    });

    return NextResponse.json({
      success: result.success,
      data: result,
      autoReleaseConfig: {
        enabled: isTargetQueueAutoReleaseEnabled(),
      },
    });
  } catch (error: any) {
    if (error?.message === 'Unauthorized' || error?.message === 'Forbidden') {
      return NextResponse.json({ success: false, code: 'UNAUTHORIZED', error: { message: 'Unauthorized access.' } }, { status: 401 });
    }
    console.error('[AdminTargetQueueRelease] Unexpected error:', error);
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', error: { message: error?.message || 'Failed to execute queue release.' } }, { status: 500 });
  }
}
