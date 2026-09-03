-- Migration: 0010_supplier_routing_and_cost_ceiling.sql
-- Adds supplier routing & cost ceiling fields to plans and offers tables, and creates supplier_attempts table

ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "priority_service_id" varchar(255);
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "fallback1_service_id" varchar(255);
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "fallback2_service_id" varchar(255);
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "minimum_gross_margin_percent" integer DEFAULT 40;
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "minimum_gross_profit_cents" bigint DEFAULT 500;
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "max_supplier_cost_absolute_cents" bigint;
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "cost_ceiling_enabled" boolean DEFAULT true NOT NULL;
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "manual_review_enabled" boolean DEFAULT false NOT NULL;

ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "priority_service_id" varchar(255);
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "fallback1_service_id" varchar(255);
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "fallback2_service_id" varchar(255);
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "minimum_gross_margin_percent" integer DEFAULT 40;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "minimum_gross_profit_cents" bigint DEFAULT 500;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "max_supplier_cost_absolute_cents" bigint;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "cost_ceiling_enabled" boolean DEFAULT true NOT NULL;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "manual_review_enabled" boolean DEFAULT false NOT NULL;

CREATE TABLE IF NOT EXISTS "supplier_attempts" (
  "id" text PRIMARY KEY NOT NULL,
  "order_id" text NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "supplier_service_id" varchar(255) NOT NULL,
  "supplier_position" varchar(50) NOT NULL,
  "supplier_rate" numeric(12, 6) NOT NULL,
  "supplier_calculated_cost" numeric(12, 4) NOT NULL,
  "selling_price" numeric(12, 4) NOT NULL,
  "gross_profit" numeric(12, 4) NOT NULL,
  "gross_margin_percent" numeric(7, 2) NOT NULL,
  "allowed_supplier_cost" numeric(12, 4) NOT NULL,
  "decision" varchar(50) NOT NULL,
  "reason" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_supplier_attempts_order_id" ON "supplier_attempts" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_supplier_attempts_created_at" ON "supplier_attempts" ("created_at");
