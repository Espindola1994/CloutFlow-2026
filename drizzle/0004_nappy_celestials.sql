CREATE TABLE "crm_contact_metadata" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"tags" varchar(1024) DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crm_contact_metadata_customer_email_unique" UNIQUE("customer_email")
);
--> statement-breakpoint
CREATE TABLE "crm_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"admin_id" text,
	"admin_name" varchar(255) DEFAULT 'Admin' NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_logs" ADD COLUMN "send_origin" varchar(50) DEFAULT 'AUTOMATION' NOT NULL;--> statement-breakpoint
ALTER TABLE "email_logs" ADD COLUMN "category" varchar(50) DEFAULT 'marketing' NOT NULL;--> statement-breakpoint
ALTER TABLE "email_logs" ADD COLUMN "template_id" varchar(100);