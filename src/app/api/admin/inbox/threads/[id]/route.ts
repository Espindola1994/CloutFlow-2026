import { NextResponse } from 'next/server';
import { db } from '@/db';
import { emailThreads, emailMessages, orders, customers } from '@/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await props.params;

    const [thread] = await db.query.emailThreads.findMany({
      where: eq(emailThreads.id, id),
      limit: 1,
    });

    if (!thread) {
      return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 });
    }

    // Mark unread count as 0 when thread is opened
    if (thread.unreadCount > 0) {
      await db.update(emailThreads).set({
        unreadCount: 0,
        updatedAt: new Date(),
      }).where(eq(emailThreads.id, id));
    }

    // Fetch messages for thread
    const messages = await db.query.emailMessages.findMany({
      where: eq(emailMessages.threadId, id),
      orderBy: [asc(emailMessages.createdAt)],
    });

    // Customer & Order Context
    const normalizedEmail = thread.customerEmail.toLowerCase();
    const [customer] = await db.query.customers.findMany({
      where: eq(customers.email, normalizedEmail),
      limit: 1,
    });

    const customerOrders = await db.query.orders.findMany({
      where: eq(orders.customerEmail, normalizedEmail),
      orderBy: [desc(orders.createdAt)],
    });

    return NextResponse.json({
      success: true,
      data: {
        thread: {
          ...thread,
          unreadCount: 0,
        },
        customer: customer || { email: thread.customerEmail },
        orders: customerOrders.map((o) => ({
          id: o.id,
          publicId: o.publicId || o.id,
          platform: o.platform,
          service: o.service,
          quantity: o.quantity,
          amountCents: o.totalCents || 0,
          paymentStatus: o.paymentStatus,
          fulfillmentStatus: o.fulfillmentStatus,
          targetHandle: o.socialUsername || o.targetUrl,
          createdAt: o.createdAt,
        })),
        messages: messages.map((m) => ({
          id: m.id,
          direction: m.direction,
          provider: m.provider,
          fromEmail: m.fromEmail,
          toEmail: m.toEmail,
          subject: m.subject,
          textBody: m.textBody,
          sanitizedHtmlBody: m.sanitizedHtmlBody,
          receivedAt: m.receivedAt,
          sentAt: m.sentAt,
          createdAt: m.createdAt,
          messageId: m.messageId,
          inReplyTo: m.inReplyTo,
          references: m.references,
        })),
      },
    });
  } catch (error) {
    console.error('[AdminThreadDetailAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch thread detail' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await props.params;
    const body = await request.json();
    const { status, relatedOrderId, unreadCount, deletedAt } = body;

    // Validate allowed support states
    const ALLOWED_STATUSES = ['NEEDS_REPLY', 'WAITING_CUSTOMER', 'RESOLVED'];
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (status) updates.status = status;
    if (relatedOrderId !== undefined) updates.relatedOrderId = relatedOrderId || null;
    if (unreadCount !== undefined) updates.unreadCount = typeof unreadCount === 'number' ? unreadCount : 1;
    if (deletedAt !== undefined) updates.deletedAt = deletedAt ? new Date(deletedAt) : null;

    const [updated] = await db.update(emailThreads)
      .set(updates)
      .where(eq(emailThreads.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('[AdminThreadStatusAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update thread status' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await props.params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent) {
      // Permanent delete: only delete email_messages and email_thread
      // Cascade delete handles email_messages via FK, but we explicitly delete to be ultra-safe
      await db.delete(emailMessages).where(eq(emailMessages.threadId, id));
      await db.delete(emailThreads).where(eq(emailThreads.id, id));
      return NextResponse.json({ success: true, message: 'Thread permanently deleted' });
    } else {
      // Soft delete: set deletedAt
      const [updated] = await db.update(emailThreads)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(emailThreads.id, id))
        .returning();
      return NextResponse.json({ success: true, data: updated, message: 'Thread moved to trash' });
    }
  } catch (error) {
    console.error('[AdminThreadDeleteAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete thread' },
      { status: 500 }
    );
  }
}
