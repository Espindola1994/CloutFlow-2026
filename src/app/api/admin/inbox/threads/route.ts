import { NextResponse } from 'next/server';
import { db } from '@/db';
import { emailThreads, emailMessages, orders, customers } from '@/db/schema';
import { eq, desc, and, or, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // ALL, NEEDS_REPLY, WAITING_CUSTOMER, RESOLVED, UNREAD
    const search = searchParams.get('search')?.trim().toLowerCase();

    // Query threads
    const threads = await db.query.emailThreads.findMany({
      orderBy: [desc(emailThreads.latestMessageAt)],
    });

    // Query customers, orders, and latest messages to enrich thread summary
    const allCustomers = await db.query.customers.findMany();
    const customerMap = new Map(allCustomers.map((c) => [c.email.toLowerCase(), c]));

    const allOrders = await db.query.orders.findMany({
      orderBy: [desc(orders.createdAt)],
    });
    const orderMap = new Map(allOrders.map((o) => [o.id, o]));
    const customerLatestOrderMap = new Map<string, typeof allOrders[0]>();
    for (const o of allOrders) {
      if (o.customerEmail && !customerLatestOrderMap.has(o.customerEmail.toLowerCase())) {
        customerLatestOrderMap.set(o.customerEmail.toLowerCase(), o);
      }
    }

    const threadList = await Promise.all(
      threads.map(async (t) => {
        const normalizedEmail = t.customerEmail.toLowerCase();
        const customer = customerMap.get(normalizedEmail);
        const relatedOrder = t.relatedOrderId
          ? orderMap.get(t.relatedOrderId)
          : customerLatestOrderMap.get(normalizedEmail);

        // Fetch latest message snippet
        const [latestMsg] = await db.query.emailMessages.findMany({
          where: eq(emailMessages.threadId, t.id),
          orderBy: [desc(emailMessages.createdAt)],
          limit: 1,
        });

        return {
          id: t.id,
          customerEmail: t.customerEmail,
          customerId: t.customerId || customer?.id || null,
          customerName: customer?.name || null,
          status: t.status,
          subject: t.subject,
          unreadCount: t.unreadCount,
          latestMessageAt: t.latestMessageAt,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          snippet: latestMsg?.textBody?.slice(0, 140) || latestMsg?.subject || '',
          latestMessageDirection: latestMsg?.direction || 'INBOUND',
          relatedOrder: relatedOrder
            ? {
                id: relatedOrder.id,
                publicId: relatedOrder.publicId || relatedOrder.id,
                paymentStatus: relatedOrder.paymentStatus,
                fulfillmentStatus: relatedOrder.fulfillmentStatus,
                targetHandle: relatedOrder.socialUsername || relatedOrder.targetUrl,
                platform: relatedOrder.platform,
                service: relatedOrder.service,
              }
            : null,
        };
      })
    );

    // Apply Filter
    let filtered = threadList;
    if (status && status !== 'ALL') {
      if (status === 'UNREAD') {
        filtered = filtered.filter((t) => t.unreadCount > 0);
      } else {
        filtered = filtered.filter((t) => t.status === status);
      }
    }

    // Apply Search
    if (search) {
      filtered = filtered.filter((t) =>
        t.customerEmail.toLowerCase().includes(search) ||
        t.subject.toLowerCase().includes(search) ||
        t.snippet.toLowerCase().includes(search) ||
        (t.customerName && t.customerName.toLowerCase().includes(search)) ||
        (t.relatedOrder?.publicId && t.relatedOrder.publicId.toLowerCase().includes(search)) ||
        (t.relatedOrder?.targetHandle && t.relatedOrder.targetHandle.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        threads: filtered,
        counts: {
          total: threadList.length,
          needsReply: threadList.filter((t) => t.status === 'NEEDS_REPLY').length,
          waitingCustomer: threadList.filter((t) => t.status === 'WAITING_CUSTOMER').length,
          resolved: threadList.filter((t) => t.status === 'RESOLVED').length,
          unread: threadList.filter((t) => t.unreadCount > 0).length,
        },
      },
    });
  } catch (error) {
    console.error('[AdminInboxAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inbox threads' },
      { status: 500 }
    );
  }
}
