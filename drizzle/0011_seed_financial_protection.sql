-- Migration: 0011_seed_financial_protection.sql
-- Idempotent Financial Protection & Final Commercial Pricing update for offers and plans

-- 1. Instagram Followers: margin 45%, min profit $5.00 (500 cents), ceiling enabled, manual review enabled
UPDATE "offers"
SET 
  "minimum_gross_margin_percent" = 45,
  "minimum_gross_profit_cents" = 500,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE LOWER("platform") = 'instagram' AND LOWER("service") = 'followers';

UPDATE "plans"
SET 
  "minimum_gross_margin_percent" = 45,
  "minimum_gross_profit_cents" = 500,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE "slug" LIKE 'instagram-followers%';

-- 2. Instagram Likes: margin 70%, min profit $3.00 (300 cents)
UPDATE "offers"
SET 
  "minimum_gross_margin_percent" = 70,
  "minimum_gross_profit_cents" = 300,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE LOWER("platform") = 'instagram' AND LOWER("service") = 'likes';

UPDATE "plans"
SET 
  "minimum_gross_margin_percent" = 70,
  "minimum_gross_profit_cents" = 300,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE "slug" LIKE 'instagram-likes%';

-- 3. Instagram Views: margin 75%, min profit $3.00 (300 cents)
UPDATE "offers"
SET 
  "minimum_gross_margin_percent" = 75,
  "minimum_gross_profit_cents" = 300,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE LOWER("platform") = 'instagram' AND LOWER("service") = 'views';

UPDATE "plans"
SET 
  "minimum_gross_margin_percent" = 75,
  "minimum_gross_profit_cents" = 300,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE "slug" LIKE 'instagram-views%';

-- 4. TikTok Followers: margin 35%, min profit $5.00 (500 cents)
UPDATE "offers"
SET 
  "minimum_gross_margin_percent" = 35,
  "minimum_gross_profit_cents" = 500,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE LOWER("platform") = 'tiktok' AND LOWER("service") = 'followers';

UPDATE "plans"
SET 
  "minimum_gross_margin_percent" = 35,
  "minimum_gross_profit_cents" = 500,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE "slug" LIKE 'tiktok-followers%';

-- 5. TikTok Likes: margin 70%, min profit $3.00 (300 cents)
UPDATE "offers"
SET 
  "minimum_gross_margin_percent" = 70,
  "minimum_gross_profit_cents" = 300,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE LOWER("platform") = 'tiktok' AND LOWER("service") = 'likes';

UPDATE "plans"
SET 
  "minimum_gross_margin_percent" = 70,
  "minimum_gross_profit_cents" = 300,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE "slug" LIKE 'tiktok-likes%';

-- 6. TikTok Views: margin 70%, min profit $3.00 (300 cents)
UPDATE "offers"
SET 
  "minimum_gross_margin_percent" = 70,
  "minimum_gross_profit_cents" = 300,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE LOWER("platform") = 'tiktok' AND LOWER("service") = 'views';

UPDATE "plans"
SET 
  "minimum_gross_margin_percent" = 70,
  "minimum_gross_profit_cents" = 300,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE "slug" LIKE 'tiktok-views%';

-- 7. X (Twitter) Followers: margin 20%, min profit $8.00 (800 cents)
UPDATE "offers"
SET 
  "minimum_gross_margin_percent" = 20,
  "minimum_gross_profit_cents" = 800,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') AND LOWER("service") = 'followers';

UPDATE "plans"
SET 
  "minimum_gross_margin_percent" = 20,
  "minimum_gross_profit_cents" = 800,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE "slug" LIKE 'twitter-followers%' OR "slug" LIKE 'x-followers%';

-- 8. X (Twitter) Likes: margin 40%, min profit $4.00 (400 cents)
UPDATE "offers"
SET 
  "minimum_gross_margin_percent" = 40,
  "minimum_gross_profit_cents" = 400,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') AND LOWER("service") = 'likes';

UPDATE "plans"
SET 
  "minimum_gross_margin_percent" = 40,
  "minimum_gross_profit_cents" = 400,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE "slug" LIKE 'twitter-likes%' OR "slug" LIKE 'x-likes%';

-- 9. X (Twitter) Views: margin 70%, min profit $3.00 (300 cents)
UPDATE "offers"
SET 
  "minimum_gross_margin_percent" = 70,
  "minimum_gross_profit_cents" = 300,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') AND LOWER("service") = 'views';

UPDATE "plans"
SET 
  "minimum_gross_margin_percent" = 70,
  "minimum_gross_profit_cents" = 300,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE "slug" LIKE 'twitter-views%' OR "slug" LIKE 'x-views%';

-- 10. YouTube Likes: margin 45%, min profit $4.00 (400 cents)
UPDATE "offers"
SET 
  "minimum_gross_margin_percent" = 45,
  "minimum_gross_profit_cents" = 400,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE LOWER("platform") = 'youtube' AND LOWER("service") = 'likes';

UPDATE "plans"
SET 
  "minimum_gross_margin_percent" = 45,
  "minimum_gross_profit_cents" = 400,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE "slug" LIKE 'youtube-likes%';

-- 11. YouTube Views: margin 25%, min profit $6.00 (600 cents)
UPDATE "offers"
SET 
  "minimum_gross_margin_percent" = 25,
  "minimum_gross_profit_cents" = 600,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE LOWER("platform") = 'youtube' AND LOWER("service") = 'views';

UPDATE "plans"
SET 
  "minimum_gross_margin_percent" = 25,
  "minimum_gross_profit_cents" = 600,
  "cost_ceiling_enabled" = true,
  "manual_review_enabled" = true,
  "updated_at" = NOW()
WHERE "slug" LIKE 'youtube-views%';

-- ====================================================================
-- FINAL COMMERCIAL CATALOG PRICES & QUANTITIES UPDATES (IDEMPOTENT)
-- ====================================================================

-- Instagram Followers
UPDATE "offers" SET "quantity" = 2000, "price_cents" = 1490 WHERE LOWER("platform") = 'instagram' AND LOWER("service") = 'followers' AND LOWER("name") = 'starter';
UPDATE "offers" SET "quantity" = 6200, "price_cents" = 2990 WHERE LOWER("platform") = 'instagram' AND LOWER("service") = 'followers' AND LOWER("name") = 'boost';
UPDATE "offers" SET "quantity" = 10500, "price_cents" = 3990 WHERE LOWER("platform") = 'instagram' AND LOWER("service") = 'followers' AND LOWER("name") = 'growth';
UPDATE "offers" SET "quantity" = 21000, "price_cents" = 6990 WHERE LOWER("platform") = 'instagram' AND LOWER("service") = 'followers' AND LOWER("name") = 'pro';
UPDATE "offers" SET "quantity" = 42000, "price_cents" = 11990 WHERE LOWER("platform") = 'instagram' AND LOWER("service") = 'followers' AND LOWER("name") = 'elite';
UPDATE "offers" SET "quantity" = 100000, "price_cents" = 19990 WHERE LOWER("platform") = 'instagram' AND LOWER("service") = 'followers' AND LOWER("name") = 'max';

-- Instagram Likes
UPDATE "offers" SET "quantity" = 2500, "price_cents" = 590 WHERE LOWER("platform") = 'instagram' AND LOWER("service") = 'likes' AND LOWER("name") = 'starter';
UPDATE "offers" SET "quantity" = 5000, "price_cents" = 890 WHERE LOWER("platform") = 'instagram' AND LOWER("service") = 'likes' AND LOWER("name") = 'boost';
UPDATE "offers" SET "quantity" = 10000, "price_cents" = 1490 WHERE LOWER("platform") = 'instagram' AND LOWER("service") = 'likes' AND LOWER("name") = 'growth';
UPDATE "offers" SET "quantity" = 20000, "price_cents" = 2490 WHERE LOWER("platform") = 'instagram' AND LOWER("service") = 'likes' AND LOWER("name") = 'pro';
UPDATE "offers" SET "quantity" = 30000, "price_cents" = 4990 WHERE LOWER("platform") = 'instagram' AND LOWER("service") = 'likes' AND LOWER("name") = 'elite';
UPDATE "offers" SET "quantity" = 50000, "price_cents" = 7990 WHERE LOWER("platform") = 'instagram' AND LOWER("service") = 'likes' AND LOWER("name") = 'max';

-- Instagram Views
UPDATE "offers" SET "quantity" = 10000, "price_cents" = 590 WHERE LOWER("platform") = 'instagram' AND LOWER("service") = 'views' AND LOWER("name") = 'starter';
UPDATE "offers" SET "quantity" = 25000, "price_cents" = 990 WHERE LOWER("platform") = 'instagram' AND LOWER("service") = 'views' AND LOWER("name") = 'boost';
UPDATE "offers" SET "quantity" = 50000, "price_cents" = 1490 WHERE LOWER("platform") = 'instagram' AND LOWER("service") = 'views' AND LOWER("name") = 'growth';
UPDATE "offers" SET "quantity" = 100000, "price_cents" = 2490 WHERE LOWER("platform") = 'instagram' AND LOWER("service") = 'views' AND LOWER("name") = 'pro';
UPDATE "offers" SET "quantity" = 150000, "price_cents" = 3490 WHERE LOWER("platform") = 'instagram' AND LOWER("service") = 'views' AND LOWER("name") = 'elite';
UPDATE "offers" SET "quantity" = 250000, "price_cents" = 4490 WHERE LOWER("platform") = 'instagram' AND LOWER("service") = 'views' AND LOWER("name") = 'max';

-- TikTok Followers
UPDATE "offers" SET "quantity" = 2000, "price_cents" = 1490 WHERE LOWER("platform") = 'tiktok' AND LOWER("service") = 'followers' AND LOWER("name") = 'starter';
UPDATE "offers" SET "quantity" = 5000, "price_cents" = 2990 WHERE LOWER("platform") = 'tiktok' AND LOWER("service") = 'followers' AND LOWER("name") = 'boost';
UPDATE "offers" SET "quantity" = 10000, "price_cents" = 4990 WHERE LOWER("platform") = 'tiktok' AND LOWER("service") = 'followers' AND LOWER("name") = 'growth';
UPDATE "offers" SET "quantity" = 25000, "price_cents" = 9990 WHERE LOWER("platform") = 'tiktok' AND LOWER("service") = 'followers' AND LOWER("name") = 'pro';
UPDATE "offers" SET "quantity" = 50000, "price_cents" = 17990 WHERE LOWER("platform") = 'tiktok' AND LOWER("service") = 'followers' AND LOWER("name") = 'elite';
UPDATE "offers" SET "quantity" = 100000, "price_cents" = 32990 WHERE LOWER("platform") = 'tiktok' AND LOWER("service") = 'followers' AND LOWER("name") = 'max';

-- TikTok Likes
UPDATE "offers" SET "quantity" = 2500, "price_cents" = 590 WHERE LOWER("platform") = 'tiktok' AND LOWER("service") = 'likes' AND LOWER("name") = 'starter';
UPDATE "offers" SET "quantity" = 5000, "price_cents" = 890 WHERE LOWER("platform") = 'tiktok' AND LOWER("service") = 'likes' AND LOWER("name") = 'boost';
UPDATE "offers" SET "quantity" = 10000, "price_cents" = 1490 WHERE LOWER("platform") = 'tiktok' AND LOWER("service") = 'likes' AND LOWER("name") = 'growth';
UPDATE "offers" SET "quantity" = 20000, "price_cents" = 2490 WHERE LOWER("platform") = 'tiktok' AND LOWER("service") = 'likes' AND LOWER("name") = 'pro';
UPDATE "offers" SET "quantity" = 30000, "price_cents" = 4990 WHERE LOWER("platform") = 'tiktok' AND LOWER("service") = 'likes' AND LOWER("name") = 'elite';
UPDATE "offers" SET "quantity" = 50000, "price_cents" = 8490 WHERE LOWER("platform") = 'tiktok' AND LOWER("service") = 'likes' AND LOWER("name") = 'max';

-- TikTok Views
UPDATE "offers" SET "quantity" = 10000, "price_cents" = 590 WHERE LOWER("platform") = 'tiktok' AND LOWER("service") = 'views' AND LOWER("name") = 'starter';
UPDATE "offers" SET "quantity" = 25000, "price_cents" = 1290 WHERE LOWER("platform") = 'tiktok' AND LOWER("service") = 'views' AND LOWER("name") = 'boost';
UPDATE "offers" SET "quantity" = 50000, "price_cents" = 1990 WHERE LOWER("platform") = 'tiktok' AND LOWER("service") = 'views' AND LOWER("name") = 'growth';
UPDATE "offers" SET "quantity" = 100000, "price_cents" = 3490 WHERE LOWER("platform") = 'tiktok' AND LOWER("service") = 'views' AND LOWER("name") = 'pro';
UPDATE "offers" SET "quantity" = 150000, "price_cents" = 4990 WHERE LOWER("platform") = 'tiktok' AND LOWER("service") = 'views' AND LOWER("name") = 'elite';
UPDATE "offers" SET "quantity" = 250000, "price_cents" = 6990 WHERE LOWER("platform") = 'tiktok' AND LOWER("service") = 'views' AND LOWER("name") = 'max';

-- X (Twitter) Followers
UPDATE "offers" SET "quantity" = 2000, "price_cents" = 2990 WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') AND LOWER("service") = 'followers' AND LOWER("name") = 'starter';
UPDATE "offers" SET "quantity" = 5000, "price_cents" = 5990 WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') AND LOWER("service") = 'followers' AND LOWER("name") = 'boost';
UPDATE "offers" SET "quantity" = 10000, "price_cents" = 9990 WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') AND LOWER("service") = 'followers' AND LOWER("name") = 'growth';
UPDATE "offers" SET "quantity" = 25000, "price_cents" = 21990 WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') AND LOWER("service") = 'followers' AND LOWER("name") = 'pro';
UPDATE "offers" SET "quantity" = 50000, "price_cents" = 39990 WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') AND LOWER("service") = 'followers' AND LOWER("name") = 'elite';
UPDATE "offers" SET "quantity" = 100000, "price_cents" = 74990 WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') AND LOWER("service") = 'followers' AND LOWER("name") = 'max';

-- X (Twitter) Likes
UPDATE "offers" SET "quantity" = 1000, "price_cents" = 790 WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') AND LOWER("service") = 'likes' AND LOWER("name") = 'starter';
UPDATE "offers" SET "quantity" = 2500, "price_cents" = 1490 WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') AND LOWER("service") = 'likes' AND LOWER("name") = 'boost';
UPDATE "offers" SET "quantity" = 5000, "price_cents" = 2490 WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') AND LOWER("service") = 'likes' AND LOWER("name") = 'growth';
UPDATE "offers" SET "quantity" = 10000, "price_cents" = 4490 WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') AND LOWER("service") = 'likes' AND LOWER("name") = 'pro';
UPDATE "offers" SET "quantity" = 15000, "price_cents" = 6490 WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') AND LOWER("service") = 'likes' AND LOWER("name") = 'elite';
UPDATE "offers" SET "quantity" = 20000, "price_cents" = 7990 WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') AND LOWER("service") = 'likes' AND LOWER("name") = 'max';

-- X (Twitter) Views
UPDATE "offers" SET "quantity" = 10000, "price_cents" = 590 WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') AND LOWER("service") = 'views' AND LOWER("name") = 'starter';
UPDATE "offers" SET "quantity" = 25000, "price_cents" = 990 WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') AND LOWER("service") = 'views' AND LOWER("name") = 'boost';
UPDATE "offers" SET "quantity" = 50000, "price_cents" = 1490 WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') AND LOWER("service") = 'views' AND LOWER("name") = 'growth';
UPDATE "offers" SET "quantity" = 100000, "price_cents" = 2490 WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') AND LOWER("service") = 'views' AND LOWER("name") = 'pro';
UPDATE "offers" SET "quantity" = 150000, "price_cents" = 3490 WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') AND LOWER("service") = 'views' AND LOWER("name") = 'elite';
UPDATE "offers" SET "quantity" = 250000, "price_cents" = 4990 WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') AND LOWER("service") = 'views' AND LOWER("name") = 'max';

-- YouTube Likes
UPDATE "offers" SET "quantity" = 1000, "price_cents" = 790 WHERE LOWER("platform") = 'youtube' AND LOWER("service") = 'likes' AND LOWER("name") = 'starter';
UPDATE "offers" SET "quantity" = 2500, "price_cents" = 1490 WHERE LOWER("platform") = 'youtube' AND LOWER("service") = 'likes' AND LOWER("name") = 'boost';
UPDATE "offers" SET "quantity" = 5000, "price_cents" = 2490 WHERE LOWER("platform") = 'youtube' AND LOWER("service") = 'likes' AND LOWER("name") = 'growth';
UPDATE "offers" SET "quantity" = 10000, "price_cents" = 4490 WHERE LOWER("platform") = 'youtube' AND LOWER("service") = 'likes' AND LOWER("name") = 'pro';
UPDATE "offers" SET "quantity" = 25000, "price_cents" = 9990 WHERE LOWER("platform") = 'youtube' AND LOWER("service") = 'likes' AND LOWER("name") = 'elite';
UPDATE "offers" SET "quantity" = 50000, "price_cents" = 17990 WHERE LOWER("platform") = 'youtube' AND LOWER("service") = 'likes' AND LOWER("name") = 'max';

-- YouTube Views
UPDATE "offers" SET "quantity" = 5000, "price_cents" = 1490 WHERE LOWER("platform") = 'youtube' AND LOWER("service") = 'views' AND LOWER("name") = 'starter';
UPDATE "offers" SET "quantity" = 10000, "price_cents" = 2490 WHERE LOWER("platform") = 'youtube' AND LOWER("service") = 'views' AND LOWER("name") = 'boost';
UPDATE "offers" SET "quantity" = 25000, "price_cents" = 4990 WHERE LOWER("platform") = 'youtube' AND LOWER("service") = 'views' AND LOWER("name") = 'growth';
UPDATE "offers" SET "quantity" = 50000, "price_cents" = 8990 WHERE LOWER("platform") = 'youtube' AND LOWER("service") = 'views' AND LOWER("name") = 'pro';
UPDATE "offers" SET "quantity" = 100000, "price_cents" = 16990 WHERE LOWER("platform") = 'youtube' AND LOWER("service") = 'views' AND LOWER("name") = 'elite';
UPDATE "offers" SET "quantity" = 250000, "price_cents" = 39990 WHERE LOWER("platform") = 'youtube' AND LOWER("service") = 'views' AND LOWER("name") = 'max';

-- CRITICAL CARD OVERRIDES:
-- X Followers Max ($749.90 selling price -> maxSupplierCostAbsolute = $560.00 / 56000 cents)
UPDATE "offers"
SET "max_supplier_cost_absolute_cents" = 56000
WHERE (LOWER("platform") = 'twitter' OR LOWER("platform") = 'x') 
  AND LOWER("service") = 'followers' 
  AND (LOWER("name") = 'max' OR "slug" LIKE '%-max' OR "price_cents" >= 70000);

UPDATE "plans"
SET "max_supplier_cost_absolute_cents" = 56000
WHERE ("slug" LIKE 'twitter-followers%max%' OR "slug" LIKE 'x-followers%max%' OR "regular_price_cents" >= 70000);

-- YouTube Views Max ($399.90 selling price -> maxSupplierCostAbsolute = $260.00 / 26000 cents)
UPDATE "offers"
SET "max_supplier_cost_absolute_cents" = 26000
WHERE LOWER("platform") = 'youtube' 
  AND LOWER("service") = 'views' 
  AND (LOWER("name") = 'max' OR "slug" LIKE '%-max' OR "price_cents" >= 35000);

UPDATE "plans"
SET "max_supplier_cost_absolute_cents" = 26000
WHERE ("slug" LIKE 'youtube-views%max%' OR "regular_price_cents" >= 35000);
