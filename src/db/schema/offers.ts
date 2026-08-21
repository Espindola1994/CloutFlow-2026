import { pgTable, text, timestamp, boolean, varchar, integer, bigint, jsonb, decimal } from 'drizzle-orm/pg-core';

export const offers = pgTable('offers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  platform: varchar('platform', { length: 50 }).notNull(), // instagram, tiktok, twitter, youtube
  service: varchar('service', { length: 100 }).notNull(), // followers, likes, views, comments
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  quantity: integer('quantity').notNull(),
  bonusQuantity: integer('bonus_quantity').default(0).notNull(),
  priceCents: bigint('price_cents', { mode: 'number' }).notNull(),
  oldPriceCents: bigint('old_price_cents', { mode: 'number' }),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  badge: varchar('badge', { length: 100 }),
  isPopular: boolean('is_popular').default(false).notNull(),
  externalCheckoutUrl: varchar('external_checkout_url', { length: 2048 }),
  perfectpayProductId: varchar('perfectpay_product_id', { length: 255 }),
  perfectpayPlanId: varchar('perfectpay_plan_id', { length: 255 }),
  active: boolean('active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const adminCostSettings = pgTable('admin_cost_settings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  platform: varchar('platform', { length: 50 }).notNull(),
  service: varchar('service', { length: 100 }).notNull(),
  provider: varchar('provider', { length: 100 }).default('peakerr').notNull(),
  pricingModel: varchar('pricing_model', { length: 50 }).default('per_1000').notNull(), // per_1000, per_unit, fixed
  costValueCents: bigint('cost_value_cents', { mode: 'number' }).notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  gatewayPercentFee: decimal('gateway_percent_fee', { precision: 5, scale: 2 }).default('8.90').notNull(),
  gatewayFixedFeeCents: bigint('gateway_fixed_fee_cents', { mode: 'number' }).default(100).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
