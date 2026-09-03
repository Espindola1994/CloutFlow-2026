-- Migration: 0012_supplier_rate_snapshots_and_alerts.sql
-- Idempotent creation of supplier_rate_snapshots and admin_alerts tables for Supplier Routing Control Center

CREATE TABLE IF NOT EXISTS "supplier_rate_snapshots" (
  "id" text PRIMARY KEY NOT NULL,
  "provider" varchar(50) DEFAULT 'peakerr' NOT NULL,
  "supplier_service_id" varchar(255) NOT NULL,
  "rate" numeric(12, 6) NOT NULL,
  "currency" varchar(10) DEFAULT 'USD' NOT NULL,
  "min_quantity" integer,
  "max_quantity" integer,
  "previous_rate" numeric(12, 6),
  "last_price_change_percent" numeric(7, 2),
  "fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_supplier_rate_snapshots_provider_service" 
ON "supplier_rate_snapshots" ("provider", "supplier_service_id");

CREATE TABLE IF NOT EXISTS "admin_alerts" (
  "id" text PRIMARY KEY NOT NULL,
  "type" varchar(50) NOT NULL,
  "severity" varchar(20) DEFAULT 'WARNING' NOT NULL,
  "title" varchar(255) NOT NULL,
  "message" text NOT NULL,
  "metadata" jsonb,
  "resolved" boolean DEFAULT false NOT NULL,
  "resolved_by" text,
  "resolved_at" timestamp with time zone,
  "dismissed" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
