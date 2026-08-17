import { pgTable, text, timestamp, varchar, bigint, jsonb, boolean } from 'drizzle-orm/pg-core';
import { orders } from './orders';

export const payments = pgTable('payments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').notNull().references(() => orders.id),
  provider: varchar('provider', { length: 50 }).notNull(), // perfectpay
  providerPaymentId: varchar('provider_payment_id', { length: 255 }),
  transactionId: varchar('transaction_id', { length: 255 }),
  amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'), // PENDING, PAID, FAILED, REFUNDED
  paymentMethod: varchar('payment_method', { length: 50 }),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
});

export const webhookEvents = pgTable('webhook_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  provider: varchar('provider', { length: 50 }).notNull().default('perfectpay'), // perfectpay
  externalEventId: varchar('external_event_id', { length: 255 }),
  deduplicationKey: varchar('deduplication_key', { length: 255 }),
  externalOrderId: varchar('external_order_id', { length: 255 }),
  externalPaymentId: varchar('external_payment_id', { length: 255 }),
  
  eventType: varchar('event_type', { length: 100 }).notNull(), // normalized: pre_checkout, pending, approved, rejected, cancelled, refunded, chargeback, completed, checkout_error, unknown
  rawEventType: varchar('raw_event_type', { length: 100 }),
  rawStatus: varchar('raw_status', { length: 100 }),
  normalizedStatus: varchar('normalized_status', { length: 50 }).notNull().default('unknown'),
  
  productId: varchar('product_id', { length: 255 }),
  planId: varchar('plan_id', { length: 255 }),
  
  customerEmail: varchar('customer_email', { length: 255 }),
  customerName: varchar('customer_name', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 100 }),
  
  amountCents: bigint('amount_cents', { mode: 'number' }),
  currency: varchar('currency', { length: 10 }).default('USD'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  
  utmSource: varchar('utm_source', { length: 255 }),
  utmMedium: varchar('utm_medium', { length: 255 }),
  utmCampaign: varchar('utm_campaign', { length: 255 }),
  utmContent: varchar('utm_content', { length: 255 }),
  utmTerm: varchar('utm_term', { length: 255 }),
  src: varchar('src', { length: 255 }),
  sck: varchar('sck', { length: 255 }),
  
  transactionId: varchar('transaction_id', { length: 255 }),
  orderId: varchar('order_id', { length: 255 }), // Internal CloutFlow order ID if correlated
  
  payload: jsonb('payload').notNull(),
  metadataSafe: jsonb('metadata_safe'),
  processed: boolean('processed').default(false).notNull(),
  processingStatus: varchar('processing_status', { length: 50 }).default('UNPROCESSED').notNull(), // UNPROCESSED, PROCESSED, FAILED, IGNORED
  errorMessage: text('error_message'),
  
  receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const paymentLeads = pgTable('payment_leads', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  provider: varchar('provider', { length: 50 }).notNull().default('perfectpay'),
  externalReference: varchar('external_reference', { length: 255 }),
  
  productId: varchar('product_id', { length: 255 }),
  planId: varchar('plan_id', { length: 255 }),
  
  customerEmail: varchar('customer_email', { length: 255 }),
  customerName: varchar('customer_name', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 100 }),
  
  rawStatus: varchar('raw_status', { length: 100 }),
  normalizedStatus: varchar('normalized_status', { length: 50 }).notNull().default('pre_checkout'), // pre_checkout, pending, rejected, checkout_error, possible_abandonment
  inferredStatus: varchar('inferred_status', { length: 50 }), // possible_abandonment, not_converted
  
  amountCents: bigint('amount_cents', { mode: 'number' }),
  currency: varchar('currency', { length: 10 }).default('USD'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  
  utmSource: varchar('utm_source', { length: 255 }),
  utmMedium: varchar('utm_medium', { length: 255 }),
  utmCampaign: varchar('utm_campaign', { length: 255 }),
  utmContent: varchar('utm_content', { length: 255 }),
  utmTerm: varchar('utm_term', { length: 255 }),
  src: varchar('src', { length: 255 }),
  sck: varchar('sck', { length: 255 }),
  
  convertedOrderId: text('converted_order_id').references(() => orders.id),
  convertedAt: timestamp('converted_at', { withTimezone: true }),
  
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
