import { pgTable, text, timestamp, varchar, jsonb, index } from 'drizzle-orm/pg-core';
import { platforms, services, plans } from './catalog';

export const funnelEvents = pgTable('funnel_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id'), // can be anonymous initially
  event: varchar('event', { length: 100 }).notNull(), // page_view, platform_selected, service_selected, profile_entered, plan_selected, checkout_started, etc
  platformId: text('platform_id').references(() => platforms.id),
  serviceId: text('service_id').references(() => services.id),
  planId: text('plan_id').references(() => plans.id),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    createdAtIdx: index('idx_funnel_events_created_at').on(table.createdAt),
    sessionIdIdx: index('idx_funnel_events_session_id').on(table.sessionId),
    eventIdx: index('idx_funnel_events_event').on(table.event),
    planIdIdx: index('idx_funnel_events_plan_id').on(table.planId),
  };
});

