import { pgTable, text, timestamp, varchar, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { customers } from './customers';

export const lifecycleEvents = pgTable('lifecycle_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Canonical Identity
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  customerId: text('customer_id').references(() => customers.id),
  
  // Event Definition
  eventType: varchar('event_type', { length: 100 }).notNull(), // CHECKOUT_ABANDONED, PAYMENT_APPROVED, ORDER_COMPLETED, REPEAT_PURCHASE
  
  // Idempotency
  idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull().unique(), // e.g. "PAYMENT_APPROVED:CF-1234"
  
  // Context & Metadata
  payload: jsonb('payload').notNull().default('{}'), // Related objects, e.g. orderId, amount, cart items
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    customerEmailIdx: index('lifecycle_events_customer_email_idx').on(table.customerEmail),
    eventTypeIdx: index('lifecycle_events_event_type_idx').on(table.eventType),
  };
});

export const lifecycleAutomations = pgTable('lifecycle_automations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Link to the triggering event
  lifecycleEventId: text('lifecycle_event_id').references(() => lifecycleEvents.id).notNull(),
  
  // Canonical Identity (copied for fast lookup & suppression)
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  
  // Definition
  automationId: varchar('automation_id', { length: 100 }).notNull(), // e.g. "ABANDONED_CART_24H"
  actionType: varchar('action_type', { length: 50 }).notNull(), // e.g. "EMAIL_PROMO", "EMAIL_REMINDER"
  
  // Scheduling & Execution
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'), // PENDING, PROCESSING, COMPLETED, FAILED, CANCELED, SUPPRESSED
  
  // Concurrency & Locking
  claimedAt: timestamp('claimed_at', { withTimezone: true }),
  claimToken: varchar('claim_token', { length: 255 }), // A UUID assigned to the worker holding the lock
  
  // Retry & Audit
  attempts: integer('attempts').notNull().default(0),
  lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
  errorLog: jsonb('error_log').default('[]'),
  
  // Metadata (for dynamic rendering)
  contextData: jsonb('context_data').notNull().default('{}'), // the merged data necessary for the template (e.g. coupon_code, order_url)
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    statusIdx: index('lifecycle_automations_status_idx').on(table.status),
    scheduledForIdx: index('lifecycle_automations_scheduled_for_idx').on(table.scheduledFor),
    customerEmailIdx: index('lifecycle_automations_customer_email_idx').on(table.customerEmail),
  };
});
