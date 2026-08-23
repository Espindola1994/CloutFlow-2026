CREATE TABLE "customer_offers" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"source_order_id" text,
	"source_journey_id" text,
	"campaign_type" varchar(50) NOT NULL,
	"discount_type" varchar(20) NOT NULL,
	"discount_value" integer NOT NULL,
	"status" varchar(50) DEFAULT 'CREATED' NOT NULL,
	"code" varchar(50) NOT NULL,
	"valid_from" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"redeemed_at" timestamp with time zone,
	"redeemed_order_id" text,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_offers_code_unique" UNIQUE("code")
);
