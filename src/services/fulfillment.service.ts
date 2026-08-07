import { db } from '@/db';
import { orders, fulfillmentOrders, providerServiceMappings, orderEvents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function processFulfillment(orderId: string) {
  return await db.transaction(async (tx) => {
    // 1. Get order
    const [order] = await tx.query.orders.findMany({
      where: eq(orders.id, orderId),
      limit: 1
    });
    
    if (!order) throw new Error('Order not found');
    if (order.paymentStatus !== 'PAID') throw new Error('Order not paid');
    if (order.fulfillmentStatus === 'COMPLETED' || order.fulfillmentStatus === 'SUBMITTING' || order.fulfillmentStatus === 'PROCESSING') {
      return { success: true, message: 'Fulfillment already in progress or completed' };
    }
    
    // 2. Find provider mapping
    const [mapping] = await tx.query.providerServiceMappings.findMany({
      where: and(
        eq(providerServiceMappings.serviceId, order.serviceId!),
        eq(providerServiceMappings.provider, process.env.FULFILLMENT_PROVIDER || 'peakerr')
      ),
      limit: 1
    });
    
    if (!mapping) {
      // Fallback to manual if no mapping
      await tx.update(orders)
        .set({ fulfillmentStatus: 'PENDING', adminNotes: (order.adminNotes || '') + '\nNo provider mapping found, manual fulfillment required.' })
        .where(eq(orders.id, order.id));
        
      await tx.insert(orderEvents).values({
        orderId: order.id,
        fulfillmentStatus: 'PENDING',
        description: 'Requires manual fulfillment (no mapping found)',
      });
      
      return { success: false, reason: 'no_mapping' };
    }
    
    // 3. Mark as submitting to prevent duplicates
    await tx.update(orders)
      .set({ fulfillmentStatus: 'SUBMITTING' })
      .where(eq(orders.id, order.id));
      
    const [fulfillment] = await tx.insert(fulfillmentOrders).values({
      orderId: order.id,
      provider: mapping.provider,
      externalServiceId: mapping.externalServiceId,
      status: 'SUBMITTING',
      submittedAt: new Date(),
    }).returning();
    
    // In a real scenario, the actual HTTP call to Peakerr would happen here or in a background worker
    // If it fails, we update the fulfillment status to FAILED and order fulfillmentStatus to FAILED (but payment remains PAID)
    // If it succeeds, we save the external order ID and update statuses
    
    // Simulating successful dispatch for now
    await tx.update(fulfillmentOrders)
      .set({ status: 'PROCESSING', externalOrderId: 'PEAK-' + Math.floor(Math.random() * 1000000) })
      .where(eq(fulfillmentOrders.id, fulfillment.id));
      
    await tx.update(orders)
      .set({ fulfillmentStatus: 'PROCESSING' })
      .where(eq(orders.id, order.id));
      
    await tx.insert(orderEvents).values({
      orderId: order.id,
      fulfillmentStatus: 'PROCESSING',
      description: `Order submitted to ${mapping.provider}`,
    });
    
    return { success: true };
  });
}
