import { pgTable, text, timestamp, varchar, integer, jsonb, boolean, numeric } from 'drizzle-orm/pg-core';
import { orders } from './orders';

/**
 * Supplier attempts table: logs the financial evaluation and routing decision for each supplier attempt.
 */
export const supplierAttempts = pgTable('supplier_attempts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  supplierServiceId: varchar('supplier_service_id', { length: 255 }).notNull(),
  supplierPosition: varchar('supplier_position', { length: 50 }).notNull(), // priority, fallback1, fallback2
  supplierRate: numeric('supplier_rate', { precision: 12, scale: 6 }).notNull(), // Rate per 1000
  supplierCalculatedCost: numeric('supplier_calculated_cost', { precision: 12, scale: 4 }).notNull(), // Total cost
  sellingPrice: numeric('selling_price', { precision: 12, scale: 4 }).notNull(), // Selling price
  grossProfit: numeric('gross_profit', { precision: 12, scale: 4 }).notNull(),
  grossMarginPercent: numeric('gross_margin_percent', { precision: 7, scale: 2 }).notNull(),
  allowedSupplierCost: numeric('allowed_supplier_cost', { precision: 12, scale: 4 }).notNull(),
  decision: varchar('decision', { length: 50 }).notNull(), // ACCEPTED, REJECTED, MANUAL_REVIEW, HOLD_COST
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Supplier rate snapshots: maintains cached supplier rates with freshness timestamps and historical tracking.
 */
export const supplierRateSnapshots = pgTable('supplier_rate_snapshots', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  provider: varchar('provider', { length: 50 }).notNull().default('peakerr'),
  supplierServiceId: varchar('supplier_service_id', { length: 255 }).notNull(),
  rate: numeric('rate', { precision: 12, scale: 6 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('USD'),
  minQuantity: integer('min_quantity'),
  maxQuantity: integer('max_quantity'),
  previousRate: numeric('previous_rate', { precision: 12, scale: 6 }),
  lastPriceChangePercent: numeric('last_price_change_percent', { precision: 7, scale: 2 }),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Admin financial and routing alerts.
 */
export const adminAlerts = pgTable('admin_alerts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: varchar('type', { length: 50 }).notNull(), // RATE_INCREASE, LOW_MARGIN, NO_SAFE_SUPPLIER, STALE_RATE, ORDER_HOLD
  severity: varchar('severity', { length: 20 }).notNull().default('WARNING'), // INFO, WARNING, CRITICAL
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  resolved: boolean('resolved').notNull().default(false),
  resolvedBy: text('resolved_by'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  dismissed: boolean('dismissed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

