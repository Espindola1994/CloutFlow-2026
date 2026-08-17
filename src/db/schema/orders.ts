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
  publicId: varchar('public_id', { length: 50 }).notNull().unique(), // CF-XXXXXXXX
  
  externalOrderId: varchar('external_order_id', { length: 255 }),
  externalPaymentId: varchar('external_payment_id', { length: 255 }),
  paymentGateway: varchar('payment_gateway', { length: 50 }).default('perfectpay').notNull(),
  
  customerId: text('customer_id').references(() => customers.id),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerName: varchar('customer_name', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 100 }),
  
  platformId: text('platform_id').references(() => platforms.id),
  platform: varchar('platform', { length: 50 }), // instagram, tiktok, twitter, youtube
  serviceId: text('service_id').references(() => services.id),
  service: varchar('service', { length: 100 }),
  planId: text('plan_id').references(() => plans.id),
  offerId: text('offer_id'),
  
  username: varchar('username', { length: 255 }),
  socialUsername: varchar('social_username', { length: 255 }),
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
  paymentStatus: varchar('payment_status', { length: 50 }).notNull().default('PENDING'), // pre_checkout, pending, approved, rejected, cancelled, refunded, chargeback, completed, checkout_error, unknown
  perfectpayRawStatus: varchar('perfectpay_raw_status', { length: 100 }),
  fulfillmentStatus: varchar('fulfillment_status', { length: 50 }).notNull().default('NOT_DISPATCHED'), // NOT_DISPATCHED, PENDING, SUBMITTING, PROCESSING, PARTIAL, COMPLETED, FAILED, CANCELED, REFILL_REQUESTED, REFILLING
  
  // UTM & Attribution tracking
  utmSource: varchar('utm_source', { length: 255 }),
  utmMedium: varchar('utm_medium', { length: 255 }),
  utmCampaign: varchar('utm_campaign', { length: 255 }),
  utmContent: varchar('utm_content', { length: 255 }),
  utmTerm: varchar('utm_term', { length: 255 }),
  src: varchar('src', { length: 255 }),
  sck: varchar('sck', { length: 255 }),
  referrer: varchar('referrer', { length: 1024 }),
  landingPage: varchar('landing_page', { length: 1024 }),
  checkoutReference: varchar('checkout_reference', { length: 255 }),
  
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
