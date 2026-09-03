import { pgTable, text, timestamp, varchar, integer, jsonb, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { orders } from './orders';
import { services, plans } from './catalog';

export const providerServiceMappings = pgTable('provider_service_mappings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  provider: varchar('provider', { length: 50 }).notNull(), // peakerr, manual
  serviceId: text('service_id').notNull().references(() => services.id),
  planId: text('plan_id').references(() => plans.id), // If null, applies to all plans of the service
  externalServiceId: varchar('external_service_id', { length: 255 }).notNull(),
  minQuantity: integer('min_quantity'),
  maxQuantity: integer('max_quantity'),
  enabled: boolean('enabled').default(true).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const fulfillmentOrders = pgTable('fulfillment_orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').notNull().references(() => orders.id),
  provider: varchar('provider', { length: 50 }).notNull(),
  externalOrderId: varchar('external_order_id', { length: 255 }),
  externalServiceId: varchar('external_service_id', { length: 255 }),
  providerTier: varchar('provider_tier', { length: 50 }), // 'primary', 'fallback1', 'fallback2', etc.
  providerCostCents: integer('provider_cost_cents'), // Cost in integer USD cents
  providerCostCurrency: varchar('provider_cost_currency', { length: 10 }).default('USD').notNull(),
  providerCostSource: varchar('provider_cost_source', { length: 50 }), // 'ACTUAL_PROVIDER_CHARGE', 'CHAIN_RATE_SNAPSHOT', 'ADMIN_COST_ESTIMATE', 'UNKNOWN'
  providerRateSnapshot: varchar('provider_rate_snapshot', { length: 50 }), // Rate per 1000 at dispatch time
  providerCostCapturedAt: timestamp('provider_cost_captured_at', { withTimezone: true }),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'), // PENDING, SUBMITTING, PROCESSING, PARTIAL, COMPLETED, FAILED, CANCELED
  requestPayload: jsonb('request_payload'),
  responsePayload: jsonb('response_payload'),
  lastError: text('last_error'),
  attemptCount: integer('attempt_count').default(0).notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const fulfillmentOrderSplits = pgTable('fulfillment_order_splits', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  parentFulfillmentOrderId: text('parent_fulfillment_order_id').notNull().references(() => fulfillmentOrders.id, { onDelete: 'cascade' }),
  orderId: text('order_id').notNull().references(() => orders.id),
  supplierServiceId: varchar('supplier_service_id', { length: 255 }).notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  quantity: integer('quantity').notNull(),
  estimatedSupplierCost: varchar('estimated_supplier_cost', { length: 50 }).notNull(), // string dollar formatted e.g. "4.2000"
  actualSupplierCost: varchar('actual_supplier_cost', { length: 50 }),
  externalOrderId: varchar('external_order_id', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'), // PENDING, SUBMITTING, PROCESSING, PARTIAL, COMPLETED, FAILED, CANCELED
  attemptCount: integer('attempt_count').default(0).notNull(),
  errorCode: varchar('error_code', { length: 100 }),
  errorMessage: text('error_message'),
  requestPayload: jsonb('request_payload'),
  responsePayload: jsonb('response_payload'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    parentChunkIdx: uniqueIndex('fulfillment_splits_parent_chunk_idx').on(table.parentFulfillmentOrderId, table.chunkIndex),
  };
});
