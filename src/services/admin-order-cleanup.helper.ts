/**
 * Production Launch Cleanup Filter and Order Validation Helpers
 *
 * Rules:
 * 1. Exclude orders matching EITHER:
 *    - Exact admin_notes: "Production launch cleanup — test order, never dispatch. Neutralized on 2026-09-10."
 *    - order_events metadata->>'action' = "PRODUCTION_LAUNCH_CLEANUP"
 * 2. NEVER use fulfillment_status = 'CANCELED' as a generic exclusion criteria.
 *    A PAID + CANCELED order without the cleanup marker must remain treated with normal financial semantics.
 * 3. Centralized constants and helper functions for reusability.
 */

import { sql, SQL, or, eq } from 'drizzle-orm';
import { orders, orderEvents } from '@/db/schema';

export const PRODUCTION_LAUNCH_CLEANUP_EXACT_ADMIN_NOTES =
  'Production launch cleanup — test order, never dispatch. Neutralized on 2026-09-10.';

export const PRODUCTION_LAUNCH_CLEANUP_EVENT_ACTION =
  'PRODUCTION_LAUNCH_CLEANUP';

/**
 * Returns a Drizzle SQL condition that evaluates to TRUE when an order is NOT a cleanup test order.
 * Uses order.adminNotes and an EXISTS subquery on order_events.
 */
export function getNonCleanupOrderSqlCondition(): SQL {
  return sql`(
    (${orders.adminNotes} IS NULL OR ${orders.adminNotes} != ${PRODUCTION_LAUNCH_CLEANUP_EXACT_ADMIN_NOTES})
    AND NOT EXISTS (
      SELECT 1 FROM ${orderEvents}
      WHERE ${orderEvents.orderId} = ${orders.id}
        AND ${orderEvents.metadata}->>'action' = ${PRODUCTION_LAUNCH_CLEANUP_EVENT_ACTION}
    )
  )`;
}

/**
 * Returns a Drizzle SQL condition that evaluates to TRUE when an order IS a cleanup test order.
 */
export function getCleanupOrderSqlCondition(): SQL {
  return sql`(
    ${orders.adminNotes} = ${PRODUCTION_LAUNCH_CLEANUP_EXACT_ADMIN_NOTES}
    OR EXISTS (
      SELECT 1 FROM ${orderEvents}
      WHERE ${orderEvents.orderId} = ${orders.id}
        AND ${orderEvents.metadata}->>'action' = ${PRODUCTION_LAUNCH_CLEANUP_EVENT_ACTION}
    )
  )`;
}

/**
 * In-memory predicate to check if an order object is a production launch cleanup test order.
 */
export function isProductionLaunchCleanupOrder(order: {
  adminNotes?: string | null;
  hasCleanupEvent?: boolean;
}): boolean {
  if (order.adminNotes === PRODUCTION_LAUNCH_CLEANUP_EXACT_ADMIN_NOTES) {
    return true;
  }
  if (order.hasCleanupEvent === true) {
    return true;
  }
  return false;
}
