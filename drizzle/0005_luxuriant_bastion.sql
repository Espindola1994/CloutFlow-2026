CREATE TABLE "email_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"direction" varchar(20) NOT NULL,
	"provider" varchar(50) DEFAULT 'GMAIL' NOT NULL,
	"provider_message_id" varchar(255),
	"message_id" varchar(500),
	"in_reply_to" varchar(500),
	"references" text,
	"from_email" varchar(255) NOT NULL,
	"to_email" varchar(255) NOT NULL,
	"subject" text NOT NULL,
	"text_body" text,
	"sanitized_html_body" text,
	"received_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_threads" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"customer_id" text,
	"status" varchar(50) DEFAULT 'NEEDS_REPLY' NOT NULL,
	"subject" text NOT NULL,
	"related_order_id" text,
	"latest_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "checkout_contexts" ADD COLUMN "customer_email" varchar(255);--> statement-breakpoint
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_thread_id_email_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."email_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_related_order_id_orders_id_fk" FOREIGN KEY ("related_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_messages_thread_id_idx" ON "email_messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "email_messages_message_id_idx" ON "email_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "email_messages_provider_message_id_idx" ON "email_messages" USING btree ("provider_message_id");--> statement-breakpoint
CREATE INDEX "email_messages_from_email_idx" ON "email_messages" USING btree ("from_email");--> statement-breakpoint
CREATE INDEX "email_messages_to_email_idx" ON "email_messages" USING btree ("to_email");--> statement-breakpoint
CREATE INDEX "email_threads_customer_email_idx" ON "email_threads" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "email_threads_status_idx" ON "email_threads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_threads_latest_message_at_idx" ON "email_threads" USING btree ("latest_message_at");--> statement-breakpoint
CREATE INDEX "email_threads_related_order_idx" ON "email_threads" USING btree ("related_order_id");