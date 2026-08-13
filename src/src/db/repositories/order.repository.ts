import { db } from '@/db';
import { orders, orderItems, payments, orderEvents, customers } from '@/db/schema';
import { eq } from 'drizzle-orm';

function generateOrderId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'ORD-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createOrder(data: {
  customerEmail: string;
  customerName?: string;
  platformId: string;
  serviceId: string;
  planId: string;
  username?: string;
  profileUrl?: string;
  targetUrl?: string;
  nicheId?: string;
  customNiche?: string;
  quantity: number;
  currency: string;
  subtotalCents: number;
  totalCents: number;
  serviceName: string;
  planName: string;
}) {
  return await db.transaction(async (tx) => {
    // Find or create customer
    let [customer] = await tx.query.customers.findMany({
      where: eq(customers.email, data.customerEmail),
      limit: 1
    });

    if (!customer) {
      const [newCustomer] = await tx.insert(customers).values({
        email: data.customerEmail,
        name: data.customerName,
      }).returning();
      customer = newCustomer;
    }

    const publicId = generateOrderId();

    // Create order
    const [order] = await tx.insert(orders).values({
      publicId,
      customerId: customer.id,
      platformId: data.platformId,
      serviceId: data.serviceId,
      planId: data.planId,
      username: data.username,
      profileUrl: data.profileUrl,
      targetUrl: data.targetUrl,
      nicheId: data.nicheId,
      customNiche: data.customNiche,
      quantity: data.quantity,
      currency: data.currency,
      subtotalCents: data.subtotalCents,
      totalCents: data.totalCents,
      status: 'PENDING_PAYMENT',
      paymentStatus: 'PENDING',
      fulfillmentStatus: 'PENDING',
    }).returning();

    // Create order item
    await tx.insert(orderItems).values({
      orderId: order.id,
      serviceName: data.serviceName,
      planName: data.planName,
      quantity: data.quantity,
      unitPriceCents: Math.floor(data.totalCents / data.quantity), // Simplification
      totalPriceCents: data.totalCents,
      currency: data.currency,
    });

    // Create initial payment record
    const [payment] = await tx.insert(payments).values({
      orderId: order.id,
      provider: process.env.PAYMENT_PROVIDER || 'centerpag',
      amountCents: data.totalCents,
      currency: data.currency,
      status: 'PENDING',
    }).returning();

    // Create event
    await tx.insert(orderEvents).values({
      orderId: order.id,
      status: 'PENDING_PAYMENT',
      description: 'Order created, awaiting payment',
    });

    return { order, payment, customer };
  });
}

export async function getOrderByPublicId(publicId: string) {
  const [order] = await db.query.orders.findMany({
    where: eq(orders.publicId, publicId),
    limit: 1,
  });
  
  if (!order) return null;
  
  const [customer] = await db.query.customers.findMany({
    where: eq(customers.id, order.customerId),
    limit: 1
  });
  
  const items = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, order.id)
  });
  
  return { ...order, customer, items };
}
