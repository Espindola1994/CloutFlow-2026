CREATE TABLE "email_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"lifecycle_automation_id" text,
	"sequence_type" varchar(100),
	"step_number" integer,
	"provider" varchar(50) DEFAULT 'RESEND' NOT NULL,
	"provider_message_id" varchar(255),
	"status" varchar(50) NOT NULL,
	"subject" text,
	"metadata" jsonb DEFAULT '{}',
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_suppressions" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"reason" varchar(100) NOT NULL,
	"source" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_suppressions_customer_email_unique" UNIQUE("customer_email")
);
--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_lifecycle_automation_id_lifecycle_automations_id_fk" FOREIGN KEY ("lifecycle_automation_id") REFERENCES "public"."lifecycle_automations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_logs_customer_email_idx" ON "email_logs" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "email_logs_automation_id_idx" ON "email_logs" USING btree ("lifecycle_automation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "email_logs_automation_step_unique_idx" ON "email_logs" USING btree ("lifecycle_automation_id","step_number");