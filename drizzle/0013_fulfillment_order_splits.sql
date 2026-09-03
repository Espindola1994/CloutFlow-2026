-- Migration: 0013_fulfillment_order_splits.sql
-- Description: Creates fulfillment_order_splits table for safe parent/child order routing

CREATE TABLE IF NOT EXISTS "fulfillment_order_splits" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_fulfillment_order_id" text NOT NULL REFERENCES "fulfillment_orders"("id") ON DELETE CASCADE,
	"order_id" text NOT NULL REFERENCES "orders"("id"),
	"supplier_service_id" varchar(255) NOT NULL,
	"chunk_index" integer NOT NULL,
	"quantity" integer NOT NULL,
	"estimated_supplier_cost" varchar(50) NOT NULL,
	"actual_supplier_cost" varchar(50),
	"external_order_id" varchar(255),
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"error_code" varchar(100),
	"error_message" text,
	"request_payload" jsonb,
	"response_payload" jsonb,
	"submitted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "fulfillment_splits_parent_chunk_idx" ON "fulfillment_order_splits" ("parent_fulfillment_order_id", "chunk_index");
