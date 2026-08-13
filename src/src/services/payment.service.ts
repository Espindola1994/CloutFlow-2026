import { db } from '@/db';
import { orders, payments, orderEvents, webhookEvents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

export async function processCenterPagWebhook(payload: Record<string, unknown>) {
  // Check token (if centerpag uses token in header or body)
  
  const externalEventId = String(payload.id || crypto.randomUUID()); // Fallback if CenterPag doesn't send unique ID
  const payloadMetadata = payload.metadata as Record<string, unknown> | undefined;
  const orderPublicId = String(payload.reference_id || payloadMetadata?.order_id || '');
  const status = String(payload.status || ''); // e.g. 'paid', 'approved'
  const transactionId = String(payload.transaction_id || payload.id || '');
  
  if (!orderPublicId) {
    throw new Error('No order reference found in webhook');
  }
  
  return await db.transaction(async (tx) => {
    // 1. Check for duplicate webhook
    const [existingEvent] = await tx.query.webhookEvents.findMany({
      where: and(
        eq(webhookEvents.provider, 'centerpag'),
        eq(webhookEvents.externalEventId, externalEventId)
      ),
      limit: 1
    });
    
    if (existingEvent) {
      console.log('Webhook already processed', externalEventId);
      return { success: true, message: 'Already processed' };
    }
    
    // 2. Log webhook event
    await tx.insert(webhookEvents).values({
      provider: 'centerpag',
      externalEventId,
      eventType: String(payload.type || 'payment.updated'),
      transactionId,
      orderId: orderPublicId,
      payload,
      processed: true,
      processedAt: new Date()
    });
    
    if (status !== 'paid' && status !== 'approved') {
      return { success: true, message: `Ignored status: ${status}` };
    }
    
    // 3. Find order
    const [order] = await tx.query.orders.findMany({
      where: eq(orders.publicId, orderPublicId),
      limit: 1
    });
    
    if (!order) {
      throw new Error(`Order not found: ${orderPublicId}`);
    }
    
    if (order.paymentStatus === 'PAID') {
      return { success: true, message: 'Order already paid' };
    }
    
    // 4. Update order and payment
    await tx.update(orders)
      .set({ 
        status: 'PROCESSING',
        paymentStatus: 'PAID',
        paidAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(orders.id, order.id));
      
    await tx.update(payments)
      .set({
        status: 'PAID',
        providerPaymentId: transactionId,
        transactionId: transactionId,
        paidAt: new Date(),
        updatedAt: new Date(),
        payload: payload
      })
      .where(eq(payments.orderId, order.id));
      
    // 5. Add order event
    await tx.insert(orderEvents).values({
      orderId: order.id,
      status: 'PROCESSING',
      paymentStatus: 'PAID',
      description: 'Payment confirmed via CenterPag',
    });
    
    return { success: true, orderId: order.id, publicId: order.publicId };
  });
}
