import { pgTable, text, timestamp, boolean, varchar, integer, bigint } from 'drizzle-orm/pg-core';

export const platforms = pgTable('platforms', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  icon: varchar('icon', { length: 255 }),
  logoUrl: varchar('logo_url', { length: 1024 }),
  description: text('description'),
  enabled: boolean('enabled').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const services = pgTable('services', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  platformId: text('platform_id').notNull().references(() => platforms.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  shortDescription: text('short_description'),
  description: text('description'),
  badge: varchar('badge', { length: 255 }),
  icon: varchar('icon', { length: 255 }),
  requiresProfile: boolean('requires_profile').default(true).notNull(),
  requiresNiche: boolean('requires_niche').default(false).notNull(),
  requiresMedia: boolean('requires_media').default(false).notNull(),
  deliveryEstimate: varchar('delivery_estimate', { length: 255 }),
  featured: boolean('featured').default(false).notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const serviceBenefits = pgTable('service_benefits', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  serviceId: text('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 255 }),
  enabled: boolean('enabled').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const plans = pgTable('plans', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  serviceId: text('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  regularPriceCents: bigint('regular_price_cents', { mode: 'number' }).notNull(),
  salePriceCents: bigint('sale_price_cents', { mode: 'number' }),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  badge: varchar('badge', { length: 255 }),
  description: text('description'),
  deliveryEstimate: varchar('delivery_estimate', { length: 255 }),
  popular: boolean('popular').default(false).notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const niches = pgTable('niches', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }).notNull().unique(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  enabled: boolean('enabled').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});
