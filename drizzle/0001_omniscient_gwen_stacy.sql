CREATE TABLE "payment_leads" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" varchar(50) DEFAULT 'perfectpay' NOT NULL,
	"external_reference" varchar(255),
	"product_id" varchar(255),
	"plan_id" varchar(255),
	"customer_email" varchar(255),
	"customer_name" varchar(255),
	"customer_phone" varchar(100),
	"raw_status" varchar(100),
	"normalized_status" varchar(50) DEFAULT 'pre_checkout' NOT NULL,
	"inferred_status" varchar(50),
	"amount_cents" bigint,
	"currency" varchar(10) DEFAULT 'USD',
	"payment_method" varchar(50),
	"utm_source" varchar(255),
	"utm_medium" varchar(255),
	"utm_campaign" varchar(255),
	"utm_content" varchar(255),
	"utm_term" varchar(255),
	"src" varchar(255),
	"sck" varchar(255),
	"converted_order_id" text,
	"converted_at" timestamp with time zone,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_cost_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"platform" varchar(50) NOT NULL,
	"service" varchar(100) NOT NULL,
	"provider" varchar(100) DEFAULT 'peakerr' NOT NULL,
	"pricing_model" varchar(50) DEFAULT 'per_1000' NOT NULL,
	"cost_value_cents" bigint NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"gateway_percent_fee" numeric(5, 2) DEFAULT '8.90' NOT NULL,
	"gateway_fixed_fee_cents" bigint DEFAULT 100 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" text PRIMARY KEY NOT NULL,
	"platform" varchar(50) NOT NULL,
	"service" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"quantity" integer NOT NULL,
	"bonus_quantity" integer DEFAULT 0 NOT NULL,
	"price_cents" bigint NOT NULL,
	"old_price_cents" bigint,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"badge" varchar(100),
	"is_popular" boolean DEFAULT false NOT NULL,
	"external_checkout_url" varchar(2048),
	"perfectpay_product_id" varchar(255),
	"perfectpay_plan_id" varchar(255),
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkout_contexts" (
	"id" text PRIMARY KEY NOT NULL,
	"context_id" varchar(64) NOT NULL,
	"platform" varchar(50) NOT NULL,
	"service" varchar(100) NOT NULL,
	"target_type" varchar(50) DEFAULT 'profile' NOT NULL,
	"target_value" varchar(255),
	"target_url" varchar(2048),
	"social_username" varchar(255),
	"profile_url" varchar(1024),
	"offer_id" text,
	"perfectpay_product_id" varchar(255),
	"perfectpay_plan_id" varchar(255),
	"utm_source" varchar(255),
	"utm_medium" varchar(255),
	"utm_campaign" varchar(255),
	"utm_content" varchar(255),
	"utm_term" varchar(255),
	"consumed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkout_contexts_context_id_unique" UNIQUE("context_id")
);
--> statement-breakpoint
CREATE TABLE "fulfillment_chain_services" (
	"id" text PRIMARY KEY NOT NULL,
	"chain_id" text NOT NULL,
	"provider" varchar(50) DEFAULT 'peakerr' NOT NULL,
	"provider_service_id" varchar(255) NOT NULL,
	"priority" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"min_quantity" integer DEFAULT 10 NOT NULL,
	"max_quantity" integer DEFAULT 1000000 NOT NULL,
	"refill" boolean DEFAULT false NOT NULL,
	"rate" varchar(50),
	"last_check_ok" boolean DEFAULT true,
	"last_checked_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fulfillment_chains" (
	"id" text PRIMARY KEY NOT NULL,
	"platform" varchar(50) NOT NULL,
	"service" varchar(100) NOT NULL,
	"variant" varchar(50) DEFAULT 'standard' NOT NULL,
	"name" varchar(255) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"auto_fallback" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "customer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "fulfillment_status" SET DEFAULT 'NOT_DISPATCHED';--> statement-breakpoint
ALTER TABLE "webhook_events" ALTER COLUMN "provider" SET DEFAULT 'perfectpay';--> statement-breakpoint
ALTER TABLE "webhook_events" ALTER COLUMN "external_event_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "external_order_id" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "external_payment_id" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_gateway" varchar(50) DEFAULT 'perfectpay' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_email" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_name" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_phone" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "platform" varchar(50);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "service" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "offer_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "social_username" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "perfectpay_raw_status" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "utm_source" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "utm_medium" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "utm_campaign" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "utm_content" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "utm_term" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "src" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "sck" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "referrer" varchar(1024);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "landing_page" varchar(1024);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "checkout_reference" varchar(255);--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "deduplication_key" varchar(255);--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "external_order_id" varchar(255);--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "external_payment_id" varchar(255);--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "raw_event_type" varchar(100);--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "raw_status" varchar(100);--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "normalized_status" varchar(50) DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "product_id" varchar(255);--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "plan_id" varchar(255);--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "customer_email" varchar(255);--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "customer_name" varchar(255);--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "customer_phone" varchar(100);--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "amount_cents" bigint;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "currency" varchar(10) DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "payment_method" varchar(50);--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "utm_source" varchar(255);--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "utm_medium" varchar(255);--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "utm_campaign" varchar(255);--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "utm_content" varchar(255);--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "utm_term" varchar(255);--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "src" varchar(255);--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "sck" varchar(255);--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "metadata_safe" jsonb;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "processing_status" varchar(50) DEFAULT 'UNPROCESSED' NOT NULL;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "error_message" text;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "received_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "fulfillment_orders" ADD COLUMN "provider_tier" varchar(50);--> statement-breakpoint
ALTER TABLE "fulfillment_orders" ADD COLUMN "provider_cost_cents" integer;--> statement-breakpoint
ALTER TABLE "fulfillment_orders" ADD COLUMN "provider_cost_currency" varchar(10) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "fulfillment_orders" ADD COLUMN "provider_cost_source" varchar(50);--> statement-breakpoint
ALTER TABLE "fulfillment_orders" ADD COLUMN "provider_rate_snapshot" varchar(50);--> statement-breakpoint
ALTER TABLE "fulfillment_orders" ADD COLUMN "provider_cost_captured_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payment_leads" ADD CONSTRAINT "payment_leads_converted_order_id_orders_id_fk" FOREIGN KEY ("converted_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_contexts" ADD CONSTRAINT "checkout_contexts_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fulfillment_chain_services" ADD CONSTRAINT "fulfillment_chain_services_chain_id_fulfillment_chains_id_fk" FOREIGN KEY ("chain_id") REFERENCES "public"."fulfillment_chains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fulfillment_chain_services_chain_priority" ON "fulfillment_chain_services" USING btree ("chain_id","priority");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fulfillment_chain_services_chain_provider_service" ON "fulfillment_chain_services" USING btree ("chain_id","provider_service_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fulfillment_chains_platform_service_variant" ON "fulfillment_chains" USING btree ("platform","service","variant");