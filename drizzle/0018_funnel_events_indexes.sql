-- Migration: 0018_funnel_events_indexes.sql
-- Description: Non-destructive, additive, idempotent migration ensuring funnel_events table and performance indexes.
-- Strictly preserves all existing data in funnel_events.

CREATE TABLE IF NOT EXISTS "funnel_events" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text,
	"event" varchar(100) NOT NULL,
	"platform_id" text REFERENCES "platforms"("id"),
	"service_id" text REFERENCES "services"("id"),
	"plan_id" text REFERENCES "plans"("id"),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_funnel_events_created_at" ON "funnel_events" ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_funnel_events_session_id" ON "funnel_events" ("session_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_funnel_events_event" ON "funnel_events" ("event");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_funnel_events_plan_id" ON "funnel_events" ("plan_id");
