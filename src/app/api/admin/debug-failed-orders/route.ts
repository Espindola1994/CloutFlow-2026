import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { orders, fulfillmentOrders, orderEvents } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    await requireAdmin();

    const failedOrders = await db.query.orders.findMany({
      where: eq(orders.fulfillmentStatus, 'FAILED')
    });

    const result = [];

    for (const fo of failedOrders) {
      const fOrders = await db.query.fulfillmentOrders.findMany({
        where: eq(fulfillmentOrders.orderId, fo.id)
      });
      const events = await db.query.orderEvents.findMany({
        where: eq(orderEvents.orderId, fo.id)
      });

      result.push({
        order: {
          id: fo.id,
          publicId: fo.publicId,
          paymentStatus: fo.paymentStatus,
          fulfillmentStatus: fo.fulfillmentStatus,
          platform: fo.platform,
          service: fo.service,
          quantity: fo.quantity,
          targetUrl: fo.targetUrl,
          createdAt: fo.createdAt,
          updatedAt: fo.updatedAt,
        },
        fulfillmentOrders: fOrders,
        orderEvents: events,
      });
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
    return NextResponse.json(
      { success: false, error: { message: 'Internal error' } },
      { status: 500 }
    );
  }
}
