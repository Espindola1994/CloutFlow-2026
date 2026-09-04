import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { offers } from './offers';

export const checkoutContexts = pgTable('checkout_contexts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  contextId: varchar('context_id', { length: 64 }).notNull().unique(),
  platform: varchar('platform', { length: 50 }).notNull(),
  service: varchar('service', { length: 100 }).notNull(),
  targetType: varchar('target_type', { length: 50 }).default('profile').notNull(),
  targetValue: varchar('target_value', { length: 255 }),
  targetUrl: varchar('target_url', { length: 2048 }),
  socialUsername: varchar('social_username', { length: 255 }),
  profileUrl: varchar('profile_url', { length: 1024 }),
  customerEmail: varchar('customer_email', { length: 255 }),
  canonicalOfferId: varchar('canonical_offer_id', { length: 100 }),
  offerId: text('offer_id').references(() => offers.id, { onDelete: 'set null' }),
  appliedOfferCode: varchar('applied_offer_code', { length: 50 }),
  perfectpayProductId: varchar('perfectpay_product_id', { length: 255 }),
  perfectpayPlanId: varchar('perfectpay_plan_id', { length: 255 }),
  utmSource: varchar('utm_source', { length: 255 }),
  utmMedium: varchar('utm_medium', { length: 255 }),
  utmCampaign: varchar('utm_campaign', { length: 255 }),
  utmContent: varchar('utm_content', { length: 255 }),
  utmTerm: varchar('utm_term', { length: 255 }),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
