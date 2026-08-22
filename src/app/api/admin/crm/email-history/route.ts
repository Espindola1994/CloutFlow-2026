import { NextResponse } from 'next/server';
import { db } from '@/db';
import { emailLogs, orders } from '@/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // transactional, support, marketing
    const origin = searchParams.get('origin'); // AUTOMATION, MANUAL
    const search = searchParams.get('search')?.trim().toLowerCase();
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const logs = await db.query.emailLogs.findMany({
      orderBy: [desc(emailLogs.createdAt)],
      limit: Math.min(limit, 200),
    });

    const allOrders = await db.query.orders.findMany();
    const orderMap = new Map(allOrders.map((o) => [o.id, o]));

    let items = logs.map((log) => {
      const orderId = (log.metadata as Record<string, unknown>)?.orderId as string | undefined;
      const order = orderId ? orderMap.get(orderId) : undefined;

      return {
        id: log.id,
        recipient: log.customerEmail,
        subject: log.subject || '(No Subject)',
        origin: log.sendOrigin,
        category: log.category,
        template: log.templateId || log.sequenceType || 'CUSTOM',
        provider: log.provider,
        providerMessageId: log.providerMessageId,
        status: log.status,
        stepNumber: log.stepNumber,
        sentAt: log.sentAt,
        createdAt: log.createdAt,
        metadata: log.metadata,
        relatedOrder: order
          ? {
              id: order.id,
              publicId: order.publicId || order.id,
              platform: order.platform,
              service: order.service,
              targetHandle: order.socialUsername || order.targetUrl,
              paymentStatus: order.paymentStatus,
              fulfillmentStatus: order.fulfillmentStatus,
            }
          : null,
      };
    });

    if (category && category !== 'ALL') {
      items = items.filter((i) => i.category.toLowerCase() === category.toLowerCase());
    }

    if (origin && origin !== 'ALL') {
      items = items.filter((i) => i.origin.toUpperCase() === origin.toUpperCase());
    }

    if (search) {
      items = items.filter(
        (i) =>
          i.recipient.toLowerCase().includes(search) ||
          i.subject.toLowerCase().includes(search) ||
          (i.relatedOrder?.publicId && i.relatedOrder.publicId.toLowerCase().includes(search)) ||
          (i.relatedOrder?.targetHandle && i.relatedOrder.targetHandle.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        items,
        counts: {
          total: logs.length,
          sent: logs.filter((l) => l.status === 'SENT').length,
          failed: logs.filter((l) => l.status === 'FAILED').length,
          suppressed: logs.filter((l) => l.status === 'SUPPRESSED').length,
        },
      },
    });
  } catch (error) {
    console.error('[AdminEmailHistoryAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch email history' },
      { status: 500 }
    );
  }
}
