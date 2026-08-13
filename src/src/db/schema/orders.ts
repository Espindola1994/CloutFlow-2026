import { pgTable, text, timestamp, varchar, integer, bigint, jsonb } from 'drizzle-orm/pg-core';
import { customers } from './customers';
import { platforms, services, plans } from './catalog';

export const coupons = pgTable('coupons', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: varchar('code', { length: 50 }).notNull().unique(),
  discountType: varchar('discount_type', { length: 20 }).notNull(), // PERCENTAGE, FIXED
  discountValue: integer('discount_value').notNull(),
  maxUses: integer('max_uses'),
  usedCount: integer('used_count').default(0).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

import { boolean } from 'drizzle-orm/pg-core'; // Re-import missing boolean

export const orders = pgTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  publicId: varchar('public_id', { length: 50 }).notNull().unique(),
  
  customerId: text('customer_id').notNull().references(() => customers.id),
  platformId: text('platform_id').references(() => platforms.id),
  serviceId: text('service_id').references(() => services.id),
  planId: text('plan_id').references(() => plans.id),
  
  username: varchar('username', { length: 255 }),
  profileUrl: varchar('profile_url', { length: 1024 }),
  targetUrl: varchar('target_url', { length: 1024 }),
  
  nicheId: text('niche_id'),
  customNiche: varchar('custom_niche', { length: 255 }),
  
  quantity: integer('quantity').notNull(),
  
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  subtotalCents: bigint('subtotal_cents', { mode: 'number' }).notNull(),
  discountCents: bigint('discount_cents', { mode: 'number' }).default(0).notNull(),
  totalCents: bigint('total_cents', { mode: 'number' }).notNull(),
  
  couponId: text('coupon_id').references(() => coupons.id),
  
  status: varchar('status', { length: 50 }).notNull().default('PENDING_PAYMENT'), // PENDING_PAYMENT, PAID, PROCESSING, COMPLETED, PARTIAL, CANCELED, FAILED, REFUNDED
  paymentStatus: varchar('payment_status', { length: 50 }).notNull().default('PENDING'), // PENDING, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED
  fulfillmentStatus: varchar('fulfillment_status', { length: 50 }).notNull().default('PENDING'), // PENDING, SUBMITTING, PROCESSING, PARTIAL, COMPLETED, FAILED, CANCELED, REFILL_REQUESTED, REFILLING
  
  customerNotes: text('customer_notes'),
  adminNotes: text('admin_notes'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  serviceName: varchar('service_name', { length: 255 }).notNull(),
  planName: varchar('plan_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  unitPriceCents: bigint('unit_price_cents', { mode: 'number' }).notNull(),
  totalPriceCents: bigint('total_price_cents', { mode: 'number' }).notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  metadata: jsonb('metadata'),
});

export const orderEvents = pgTable('order_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }),
  paymentStatus: varchar('payment_status', { length: 50 }),
  fulfillmentStatus: varchar('fulfillment_status', { length: 50 }),
  description: text('description').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
