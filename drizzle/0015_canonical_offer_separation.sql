-- Migration: 0015_canonical_offer_separation.sql
-- Description: Adds canonical_offer_id to checkout_contexts and orders with appropriate non-destructive indices.
-- Preserves existing offer_id as optional physical override foreign key.

-- 1. Add canonical_offer_id column to checkout_contexts (nullable for historical safe backfill)
ALTER TABLE "checkout_contexts" ADD COLUMN IF NOT EXISTS "canonical_offer_id" varchar(100);

-- 2. Add canonical_offer_id column to orders (nullable for historical safe backfill)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "canonical_offer_id" varchar(100);

-- 3. Create non-destructive indices
CREATE INDEX IF NOT EXISTS "idx_checkout_contexts_canonical_offer_id" ON "checkout_contexts" ("canonical_offer_id");
CREATE INDEX IF NOT EXISTS "idx_orders_canonical_offer_id" ON "orders" ("canonical_offer_id");
