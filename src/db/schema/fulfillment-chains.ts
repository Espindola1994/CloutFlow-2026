import { pgTable, text, timestamp, varchar, integer, jsonb, boolean, uniqueIndex } from 'drizzle-orm/pg-core';

export const fulfillmentChains = pgTable('fulfillment_chains', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  platform: varchar('platform', { length: 50 }).notNull(), // instagram, tiktok, twitter, youtube
  service: varchar('service', { length: 100 }).notNull(), // followers, likes, views, comments
  variant: varchar('variant', { length: 50 }).default('standard').notNull(), // standard, premium, refill, high_quality
  name: varchar('name', { length: 255 }).notNull(),
  active: boolean('active').default(true).notNull(),
  autoFallback: boolean('auto_fallback').default(true).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return [
    uniqueIndex('idx_fulfillment_chains_platform_service_variant').on(
      table.platform,
      table.service,
      table.variant
    ),
  ];
});

export const fulfillmentChainServices = pgTable('fulfillment_chain_services', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  chainId: text('chain_id').notNull().references(() => fulfillmentChains.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).default('peakerr').notNull(),
  providerServiceId: varchar('provider_service_id', { length: 255 }).notNull(),
  priority: integer('priority').notNull(), // 1 = primary, 2 = fallback 1, 3 = fallback 2
  active: boolean('active').default(true).notNull(),
  minQuantity: integer('min_quantity').default(10).notNull(),
  maxQuantity: integer('max_quantity').default(1000000).notNull(),
  refill: boolean('refill').default(false).notNull(),
  rate: varchar('rate', { length: 50 }), // Provider rate per 1000 units (e.g. "0.001")
  lastCheckOk: boolean('last_check_ok').default(true),
  lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return [
    uniqueIndex('idx_fulfillment_chain_services_chain_priority').on(
      table.chainId,
      table.priority
    ),
    uniqueIndex('idx_fulfillment_chain_services_chain_provider_service').on(
      table.chainId,
      table.providerServiceId
    ),
  ];
});
