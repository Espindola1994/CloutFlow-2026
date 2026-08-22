import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { customers } from './customers';

export const crmNotes = pgTable('crm_notes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  adminId: text('admin_id'),
  adminName: varchar('admin_name', { length: 255 }).default('Admin').notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const crmContactMetadata = pgTable('crm_contact_metadata', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerEmail: varchar('customer_email', { length: 255 }).notNull().unique(),
  tags: varchar('tags', { length: 1024 }).default(''), // comma separated
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
