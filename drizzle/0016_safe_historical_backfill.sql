-- Migration: 0016_safe_historical_backfill.sql
-- Description: Non-destructive, idempotent backfill for checkout_contexts and orders.
-- Strictly avoids guessing:
-- 1. Updates records matching exact PerfectPay Product Code + Plan Code from official 66 dataset.
-- 2. Preserves the historical evidence order '219a37e9-83de-4a0c-b8cc-9c4ef1453311' completely untouched.

-- A) Backfill checkout_contexts where perfectpay_product_id and perfectpay_plan_id unequivocally match official dataset
-- Instagram Followers
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-followers-starter' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQ3F7';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-followers-boost' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQ3G4';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-followers-growth' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQ3G6';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-followers-pro' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQ3G7';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-followers-elite' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQ3G8';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-followers-max' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQ3GA';

-- Instagram Likes
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-likes-starter' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQ3N7';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-likes-boost' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQ3N8';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-likes-growth' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQ3N9';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-likes-pro' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQ3NA';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-likes-elite' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQ3NB';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-likes-max' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQ3ND';

-- Instagram Views
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-views-starter' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQ3NF';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-views-boost' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQ3GB';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-views-growth' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQ3NE';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-views-pro' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD2F';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-views-elite' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD0F';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-instagram-views-max' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD0H';

-- TikTok Followers
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-tiktok-followers-starter' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD0I';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-tiktok-followers-boost' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD0J';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-tiktok-followers-growth' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD0K';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-tiktok-followers-pro' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD0L';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-tiktok-followers-elite' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD0M';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-tiktok-followers-max' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD0N';

-- TikTok Likes
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-tiktok-likes-starter' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD0O';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-tiktok-likes-boost' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD0P';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-tiktok-likes-growth' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD0Q';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-tiktok-likes-pro' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD0R';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-tiktok-likes-elite' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1B';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-tiktok-likes-max' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD0S';

-- TikTok Views
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-tiktok-views-starter' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD0U';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-tiktok-views-boost' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD0V';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-tiktok-views-growth' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD10';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-tiktok-views-pro' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD11';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-tiktok-views-elite' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD12';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-tiktok-views-max' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD13';

-- Twitter / X Followers
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-twitter-followers-starter' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD14';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-twitter-followers-boost' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD15';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-twitter-followers-growth' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD16';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-twitter-followers-pro' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD17';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-twitter-followers-elite' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD18';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-twitter-followers-max' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD19';

-- Twitter / X Likes
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-twitter-likes-starter' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1A';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-twitter-likes-boost' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1C';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-twitter-likes-growth' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1D';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-twitter-likes-pro' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1E';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-twitter-likes-elite' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1F';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-twitter-likes-max' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1G';

-- Twitter / X Views
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-twitter-views-starter' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1H';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-twitter-views-boost' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1I';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-twitter-views-growth' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1J';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-twitter-views-pro' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1K';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-twitter-views-elite' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1L';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-twitter-views-max' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1M';

-- YouTube Likes
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-youtube-likes-starter' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1N';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-youtube-likes-boost' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1O';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-youtube-likes-growth' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1P';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-youtube-likes-pro' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1Q';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-youtube-likes-elite' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1R';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-youtube-likes-max' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1S';

-- YouTube Views
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-youtube-views-starter' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1T';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-youtube-views-boost' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1U';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-youtube-views-growth' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1V';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-youtube-views-pro' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1W';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-youtube-views-elite' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1X';
UPDATE "checkout_contexts" SET "canonical_offer_id" = 'canonical-youtube-views-max' WHERE "canonical_offer_id" IS NULL AND "perfectpay_product_id" = 'PPPBF6TP' AND "perfectpay_plan_id" = 'PPLQQQD1Y';

-- B) Safe backfill for orders strictly excluding the protected historical evidence order
-- Match orders where offer_id points to physical offer 2e9b6558-eb6d-4767-b6fc-77c245778653 (Instagram Followers Starter)
UPDATE "orders" 
SET "canonical_offer_id" = 'canonical-instagram-followers-starter' 
WHERE "id" != '219a37e9-83de-4a0c-b8cc-9c4ef1453311' 
  AND "canonical_offer_id" IS NULL 
  AND "offer_id" = '2e9b6558-eb6d-4767-b6fc-77c245778653';
