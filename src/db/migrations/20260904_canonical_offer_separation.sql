-- Migration: 20260904_canonical_offer_separation.sql
-- Description: Adds canonical_offer_id to checkout_contexts and orders with indices.
-- Non-destructive and idempotent.

ALTER TABLE "checkout_contexts" ADD COLUMN IF NOT EXISTS "canonical_offer_id" varchar(100);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "canonical_offer_id" varchar(100);

CREATE INDEX IF NOT EXISTS "idx_checkout_contexts_canonical_offer_id" ON "checkout_contexts" ("canonical_offer_id");
CREATE INDEX IF NOT EXISTS "idx_orders_canonical_offer_id" ON "orders" ("canonical_offer_id");
