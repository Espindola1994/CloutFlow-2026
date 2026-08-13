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
  status: varchar('status', { length: 50 }).notNull().default('PENDING'), // PENDING, SUBMITTING, PROCESSING, PARTIAL, COMPLETED, FAILED, CANCELED
  requestPayload: jsonb('request_payload'),
  responsePayload: jsonb('response_payload'),
  lastError: text('last_error'),
  attemptCount: integer('attempt_count').default(0).notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
