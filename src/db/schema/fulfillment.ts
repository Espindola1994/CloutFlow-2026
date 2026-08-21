import { pgTable, text, timestamp, varchar, integer, jsonb, boolean } from 'drizzle-orm/pg-core';
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
