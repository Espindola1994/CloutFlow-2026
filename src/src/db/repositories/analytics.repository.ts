import { db } from '@/db';
import { orders } from '@/db/schema';
import { sql, desc, gte, and, eq } from 'drizzle-orm';

export async function getDashboardStats() {
  const now = new Date();
  
  // Today start
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  
  // Month start
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Revenue queries
  const revenueTodayResult = await db
    .select({ total: sql<number>`COALESCE(SUM(${orders.totalCents}), 0)` })
    .from(orders)
    .where(
      and(
        eq(orders.paymentStatus, 'PAID'),
        gte(orders.paidAt, todayStart)
      )
    );
    
  const revenueMonthResult = await db
    .select({ total: sql<number>`COALESCE(SUM(${orders.totalCents}), 0)` })
    .from(orders)
    .where(
      and(
        eq(orders.paymentStatus, 'PAID'),
        gte(orders.paidAt, monthStart)
      )
    );

  // Order counts
  const ordersTodayResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(orders)
    .where(gte(orders.createdAt, todayStart));
    
  const ordersMonthResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(orders)
    .where(gte(orders.createdAt, monthStart));

  // Status counts (all time or active)
  const pendingPaymentsResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(orders)
    .where(eq(orders.paymentStatus, 'PENDING'));
    
  const processingFulfillmentsResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(orders)
    .where(
      and(
        eq(orders.paymentStatus, 'PAID'),
        eq(orders.fulfillmentStatus, 'PROCESSING')
      )
    );

  const completedOrdersResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(orders)
    .where(eq(orders.status, 'COMPLETED'));
    
  const recentOrders = await db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    limit: 5,
  });
  
  return {
    revenueToday: Number(revenueTodayResult[0]?.total || 0),
    revenueMonth: Number(revenueMonthResult[0]?.total || 0),
    ordersToday: Number(ordersTodayResult[0]?.count || 0),
    ordersMonth: Number(ordersMonthResult[0]?.count || 0),
    pendingPayments: Number(pendingPaymentsResult[0]?.count || 0),
    processingFulfillments: Number(processingFulfillmentsResult[0]?.count || 0),
    completedOrders: Number(completedOrdersResult[0]?.count || 0),
    recentOrders,
  };
}
