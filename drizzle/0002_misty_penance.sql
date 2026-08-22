CREATE TABLE "lifecycle_automations" (
	"id" text PRIMARY KEY NOT NULL,
	"lifecycle_event_id" text NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"automation_id" varchar(100) NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"claimed_at" timestamp with time zone,
	"claim_token" varchar(255),
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"error_log" jsonb DEFAULT '[]',
	"context_data" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lifecycle_events" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"customer_id" text,
	"event_type" varchar(100) NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"payload" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lifecycle_events_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "lifecycle_automations" ADD CONSTRAINT "lifecycle_automations_lifecycle_event_id_lifecycle_events_id_fk" FOREIGN KEY ("lifecycle_event_id") REFERENCES "public"."lifecycle_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lifecycle_events" ADD CONSTRAINT "lifecycle_events_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lifecycle_automations_status_idx" ON "lifecycle_automations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lifecycle_automations_scheduled_for_idx" ON "lifecycle_automations" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "lifecycle_automations_customer_email_idx" ON "lifecycle_automations" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "lifecycle_events_customer_email_idx" ON "lifecycle_events" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "lifecycle_events_event_type_idx" ON "lifecycle_events" USING btree ("event_type");