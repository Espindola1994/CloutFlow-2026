-- Migration: 20260904_safe_historical_backfill.sql
-- Description: Non-destructive backfill for canonical_offer_id in checkout_contexts and orders.
-- Evidence order '219a37e9-83de-4a0c-b8cc-9c4ef1453311' is protected and unmodified.

UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-followers-starter' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQ3F7';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-followers-boost' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQ3G4';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-followers-growth' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQ3G6';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-followers-pro' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQ3G7';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-followers-elite' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQ3G8';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-followers-max' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQ3GA';

UPDATE "orders" 
SET "canonical_offer_id" = 'canonical-instagram-followers-starter' 
WHERE "id" != '219a37e9-83de-4a0c-b8cc-9c4ef1453311' 
  AND "canonical_offer_id" IS NULL 
  AND "offer_id" = '2e9b6558-eb6d-4767-b6fc-77c245778653';
