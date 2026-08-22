import { pgTable, text, timestamp, varchar, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { orders } from './orders';
import { customers } from './customers';

export const emailThreads = pgTable('email_threads', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  customerId: text('customer_id').references(() => customers.id),
  status: varchar('status', { length: 50 }).notNull().default('NEEDS_REPLY'), // NEEDS_REPLY, WAITING_CUSTOMER, RESOLVED
  subject: text('subject').notNull(),
  relatedOrderId: text('related_order_id').references(() => orders.id),
  latestMessageAt: timestamp('latest_message_at', { withTimezone: true }).defaultNow().notNull(),
  unreadCount: integer('unread_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    customerEmailIdx: index('email_threads_customer_email_idx').on(table.customerEmail),
    statusIdx: index('email_threads_status_idx').on(table.status),
    latestMessageAtIdx: index('email_threads_latest_message_at_idx').on(table.latestMessageAt),
    relatedOrderIdx: index('email_threads_related_order_idx').on(table.relatedOrderId),
  };
});

export const emailMessages = pgTable('email_messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  threadId: text('thread_id').references(() => emailThreads.id, { onDelete: 'cascade' }).notNull(),
  direction: varchar('direction', { length: 20 }).notNull(), // INBOUND, OUTBOUND
  provider: varchar('provider', { length: 50 }).notNull().default('GMAIL'), // GMAIL, RESEND
  providerMessageId: varchar('provider_message_id', { length: 255 }),
  messageId: varchar('message_id', { length: 500 }), // RFC 2822 Message-ID header
  inReplyTo: varchar('in_reply_to', { length: 500 }),
  references: text('references'),
  fromEmail: varchar('from_email', { length: 255 }).notNull(),
  toEmail: varchar('to_email', { length: 255 }).notNull(),
  subject: text('subject').notNull(),
  textBody: text('text_body'),
  sanitizedHtmlBody: text('sanitized_html_body'),
  receivedAt: timestamp('received_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  readAt: timestamp('read_at', { withTimezone: true }),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    threadIdIdx: index('email_messages_thread_id_idx').on(table.threadId),
    messageIdIdx: index('email_messages_message_id_idx').on(table.messageId),
    providerMessageIdIdx: index('email_messages_provider_message_id_idx').on(table.providerMessageId),
    fromEmailIdx: index('email_messages_from_email_idx').on(table.fromEmail),
    toEmailIdx: index('email_messages_to_email_idx').on(table.toEmail),
  };
});
