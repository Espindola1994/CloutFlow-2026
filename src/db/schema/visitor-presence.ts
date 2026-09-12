import { pgTable, text, timestamp, varchar, numeric, index } from 'drizzle-orm/pg-core';

export const visitorPresence = pgTable('visitor_presence', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull().unique(),
  visitorId: text('visitor_id'),
  platform: varchar('platform', { length: 50 }),
  service: varchar('service', { length: 100 }),
  planId: varchar('plan_id', { length: 100 }),
  country: varchar('country', { length: 10 }),
  countryCode: varchar('country_code', { length: 10 }),
  region: varchar('region', { length: 100 }),
  city: varchar('city', { length: 100 }),
  latitude: numeric('latitude', { precision: 10, scale: 6 }),
  longitude: numeric('longitude', { precision: 10, scale: 6 }),
  deviceType: varchar('device_type', { length: 50 }),
  os: varchar('os', { length: 50 }),
  browser: varchar('browser', { length: 50 }),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    lastSeenAtIdx: index('idx_visitor_presence_last_seen_at').on(table.lastSeenAt),
    expiresAtIdx: index('idx_visitor_presence_expires_at').on(table.expiresAt),
  };
});

export type VisitorPresence = typeof visitorPresence.$inferSelect;
export type NewVisitorPresence = typeof visitorPresence.$inferInsert;
