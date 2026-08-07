import { pgTable, text, timestamp, varchar, boolean, jsonb, integer } from 'drizzle-orm/pg-core';

export const settings = pgTable('settings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: jsonb('value').notNull(),
  description: text('description'),
  isPublic: boolean('is_public').default(false).notNull(),
  updatedBy: text('updated_by'), // Could reference users.id, keeping flexible
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const faq = pgTable('faq', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const testimonials = pgTable('testimonials', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }).notNull(),
  username: varchar('username', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 1024 }),
  content: text('content').notNull(),
  rating: integer('rating').default(5).notNull(),
  platform: varchar('platform', { length: 50 }),
  enabled: boolean('enabled').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});