import { pgTable, text, timestamp, varchar, bigint, jsonb, boolean } from 'drizzle-orm/pg-core';
import { orders } from './orders';

export const payments = pgTable('payments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').notNull().references(() => orders.id),
  provider: varchar('provider', { length: 50 }).notNull(), // centerpag
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
  provider: varchar('provider', { length: 50 }).notNull(),
  externalEventId: varchar('external_event_id', { length: 255 }).notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  transactionId: varchar('transaction_id', { length: 255 }),
  orderId: varchar('order_id', { length: 255 }), // can be public_id depending on provider
  payload: jsonb('payload').notNull(),
  processed: boolean('processed').default(false).notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
