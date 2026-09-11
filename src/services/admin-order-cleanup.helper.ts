/**
 * Production Launch Cleanup Filter and Order Validation Helpers
 *
 * Rules:
 * Category A: PRODUCTION_LAUNCH_CLEANUP explícito
 *    - Exact admin_notes: "Production launch cleanup — test order, never dispatch. Neutralized on 2026-09-10."
 *    - OU order_events metadata->>'action' = "PRODUCTION_LAUNCH_CLEANUP"
 *
 * Category B: Historical pre-go-live PerfectPay free test
 *    Exigir CUMULATIVAMENTE:
 *    - createdAt < COMMERCIAL_GO_LIVE_DATE
 *    - AND order_events metadata->>'payment_type_enum_key' = 'free_price'
 *    - AND order_events metadata->>'sale_status_detail' = 'free_recurrent_time'
 *
 * Security rules:
 * 1. NEVER use total_cents = 0 as a generic exclusion criteria.
 * 2. NEVER use fulfillment_status = 'CANCELED' as a generic exclusion criteria.
 * 3. NEVER use payment_type_enum_key = 'free_price' without temporal limit and cumulative signals.
 * 4. A PAID + CANCELED order without cleanup markers must remain treated with normal financial semantics.
 * 5. Centralized constants and helper functions for reusability.
 */

import { sql, SQL } from 'drizzle-orm';
import { orders, orderEvents } from '@/db/schema';

// Category A: Production Launch Cleanup Constants
export const PRODUCTION_LAUNCH_CLEANUP_EXACT_ADMIN_NOTES =
  'Production launch cleanup — test order, never dispatch. Neutralized on 2026-09-10.';

export const PRODUCTION_LAUNCH_CLEANUP_EVENT_ACTION =
  'PRODUCTION_LAUNCH_CLEANUP';

// Category B: Pre-Go-Live Historical PerfectPay Free Test Constants
export const COMMERCIAL_GO_LIVE_DATE = '2026-09-10T00:00:00.000Z';
export const PERFECTPAY_FREE_PRICE_PAYMENT_TYPE = 'free_price';
export const PERFECTPAY_FREE_RECURRENT_TIME_STATUS_DETAIL = 'free_recurrent_time';

/**
 * Returns a Drizzle SQL condition that evaluates to TRUE when an order is NOT a cleanup or historical test order.
 * Excludes Category A (PRODUCTION_LAUNCH_CLEANUP) and Category B (Historical pre-go-live PerfectPay free tests).
 */
export function getNonCleanupOrderSqlCondition(): SQL {
  return sql`(
    (${orders.adminNotes} IS NULL OR ${orders.adminNotes} != ${PRODUCTION_LAUNCH_CLEANUP_EXACT_ADMIN_NOTES})
    AND NOT EXISTS (
      SELECT 1 FROM ${orderEvents}
      WHERE ${orderEvents.orderId} = ${orders.id}
        AND ${orderEvents.metadata}->>'action' = ${PRODUCTION_LAUNCH_CLEANUP_EVENT_ACTION}
    )
    AND NOT (
      ${orders.createdAt} < ${COMMERCIAL_GO_LIVE_DATE}::timestamptz
      AND EXISTS (
        SELECT 1 FROM ${orderEvents}
        WHERE ${orderEvents.orderId} = ${orders.id}
          AND ${orderEvents.metadata}->>'payment_type_enum_key' = ${PERFECTPAY_FREE_PRICE_PAYMENT_TYPE}
          AND ${orderEvents.metadata}->>'sale_status_detail' = ${PERFECTPAY_FREE_RECURRENT_TIME_STATUS_DETAIL}
      )
    )
  )`;
}

/**
 * Returns a Drizzle SQL condition that evaluates to TRUE when an order IS an excluded test order (Category A or B).
 */
export function getCleanupOrderSqlCondition(): SQL {
  return sql`(
    ${orders.adminNotes} = ${PRODUCTION_LAUNCH_CLEANUP_EXACT_ADMIN_NOTES}
    OR EXISTS (
      SELECT 1 FROM ${orderEvents}
      WHERE ${orderEvents.orderId} = ${orders.id}
        AND ${orderEvents.metadata}->>'action' = ${PRODUCTION_LAUNCH_CLEANUP_EVENT_ACTION}
    )
    OR (
      ${orders.createdAt} < ${COMMERCIAL_GO_LIVE_DATE}::timestamptz
      AND EXISTS (
        SELECT 1 FROM ${orderEvents}
        WHERE ${orderEvents.orderId} = ${orders.id}
          AND ${orderEvents.metadata}->>'payment_type_enum_key' = ${PERFECTPAY_FREE_PRICE_PAYMENT_TYPE}
          AND ${orderEvents.metadata}->>'sale_status_detail' = ${PERFECTPAY_FREE_RECURRENT_TIME_STATUS_DETAIL}
      )
    )
  )`;
}

/**
 * In-memory predicate to check if an order object is a production launch cleanup test order (Category A).
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

/**
 * In-memory predicate to check if an order is a historical pre-go-live PerfectPay free test (Category B).
 * Exiges CUMULATIVELY:
 * 1. createdAt < COMMERCIAL_GO_LIVE_DATE
 * 2. paymentTypeEnumKey === 'free_price'
 * 3. saleStatusDetail === 'free_recurrent_time'
 */
export function isHistoricalPreGoLiveFreeTest(order: {
  createdAt?: Date | string | null;
  paymentTypeEnumKey?: string | null;
  saleStatusDetail?: string | null;
}): boolean {
  if (!order.createdAt || !order.paymentTypeEnumKey || !order.saleStatusDetail) {
    return false;
  }

  const orderDate = new Date(order.createdAt);
  const cutoffDate = new Date(COMMERCIAL_GO_LIVE_DATE);

  const isPreGoLive = orderDate.getTime() < cutoffDate.getTime();
  const isFreePrice = order.paymentTypeEnumKey === PERFECTPAY_FREE_PRICE_PAYMENT_TYPE;
  const isFreeRecurrent = order.saleStatusDetail === PERFECTPAY_FREE_RECURRENT_TIME_STATUS_DETAIL;

  return isPreGoLive && isFreePrice && isFreeRecurrent;
}

/**
 * Unified in-memory predicate to check if an order is excluded from commercial Analytics (Category A OR Category B).
 */
export function isExcludedFromCommercialAnalytics(order: {
  adminNotes?: string | null;
  hasCleanupEvent?: boolean;
  createdAt?: Date | string | null;
  paymentTypeEnumKey?: string | null;
  saleStatusDetail?: string | null;
}): boolean {
  return isProductionLaunchCleanupOrder(order) || isHistoricalPreGoLiveFreeTest(order);
}

