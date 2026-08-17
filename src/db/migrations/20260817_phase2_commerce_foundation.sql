-- Migration: Phase 2.1A - Self-Contained & Idempotent Commerce Foundation Schema for Supabase
-- Creates all base and extended tables in strictly correct dependency order.

-- 1. Customers Table (Base reference if not already created)
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  country VARCHAR(50),
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spent_cents BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- 2. Coupons Table (Base reference)
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type VARCHAR(20) NOT NULL,
  discount_value INTEGER NOT NULL,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Offers Table
CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(50) NOT NULL,
  service VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL,
  bonus_quantity INTEGER NOT NULL DEFAULT 0,
  price_cents BIGINT NOT NULL,
  old_price_cents BIGINT,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  badge VARCHAR(100),
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  external_checkout_url VARCHAR(2048),
  perfectpay_product_id VARCHAR(255),
  perfectpay_plan_id VARCHAR(255),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_platform ON offers(platform);
CREATE INDEX IF NOT EXISTS idx_offers_service ON offers(service);
CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(active);
CREATE INDEX IF NOT EXISTS idx_offers_perfectpay_product_id ON offers(perfectpay_product_id);
CREATE INDEX IF NOT EXISTS idx_offers_perfectpay_plan_id ON offers(perfectpay_plan_id);

-- 4. Admin Cost Settings Table
CREATE TABLE IF NOT EXISTS admin_cost_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(50) NOT NULL,
  service VARCHAR(100) NOT NULL,
  provider VARCHAR(100) NOT NULL DEFAULT 'peakerr',
  pricing_model VARCHAR(50) NOT NULL DEFAULT 'per_1000',
  cost_value_cents BIGINT NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  gateway_percent_fee DECIMAL(5, 2) NOT NULL DEFAULT 4.99,
  gateway_fixed_fee_cents BIGINT NOT NULL DEFAULT 30,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Orders Table (Base table self-contained creation + safe column extensions)
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id VARCHAR(50) NOT NULL UNIQUE,
  external_order_id VARCHAR(255),
  external_payment_id VARCHAR(255),
  payment_gateway VARCHAR(50) NOT NULL DEFAULT 'perfectpay',
  customer_id TEXT REFERENCES customers(id),
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(100),
  platform_id TEXT,
  platform VARCHAR(50),
  service_id TEXT,
  service VARCHAR(100),
  plan_id TEXT,
  offer_id TEXT,
  username VARCHAR(255),
  social_username VARCHAR(255),
  profile_url VARCHAR(1024),
  target_url VARCHAR(1024),
  niche_id TEXT,
  custom_niche VARCHAR(255),
  quantity INTEGER NOT NULL DEFAULT 1000,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  subtotal_cents BIGINT NOT NULL DEFAULT 0,
  discount_cents BIGINT NOT NULL DEFAULT 0,
  total_cents BIGINT NOT NULL DEFAULT 0,
  coupon_id TEXT REFERENCES coupons(id),
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING_PAYMENT',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  perfectpay_raw_status VARCHAR(100),
  fulfillment_status VARCHAR(50) NOT NULL DEFAULT 'NOT_DISPATCHED',
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_content VARCHAR(255),
  utm_term VARCHAR(255),
  src VARCHAR(255),
  sck VARCHAR(255),
  referrer VARCHAR(1024),
  landing_page VARCHAR(1024),
  checkout_reference VARCHAR(255),
  customer_notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  completedAt TIMESTAMP WITH TIME ZONE
);

-- Idempotent column additions in case orders table pre-existed with partial columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS public_id VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS external_order_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS external_payment_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50) NOT NULL DEFAULT 'perfectpay';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id TEXT REFERENCES customers(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS service VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS offer_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS username VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS social_username VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS perfectpay_raw_status VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'USD';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_cents BIGINT NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_cents BIGINT NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_cents BIGINT NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'PENDING_PAYMENT';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(50) NOT NULL DEFAULT 'NOT_DISPATCHED';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_content VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_term VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS src VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sck VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referrer VARCHAR(1024);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS landing_page VARCHAR(1024);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS checkout_reference VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_platform ON orders(platform);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_username ON orders(username);
CREATE INDEX IF NOT EXISTS idx_orders_public_id ON orders(public_id);

-- Strict Partial Unique Index on Orders: 1 Order per gateway transaction
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_gateway_external_order 
ON orders(payment_gateway, external_order_id) 
WHERE external_order_id IS NOT NULL;

-- 6. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  service_name VARCHAR(255) NOT NULL,
  plan_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_cents BIGINT NOT NULL,
  total_price_cents BIGINT NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 7. Order Events Table
CREATE TABLE IF NOT EXISTS order_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50),
  payment_status VARCHAR(50),
  fulfillment_status VARCHAR(50),
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);

-- 8. Payment Leads Table (Top/Mid Funnel - Pre Checkout / Abandonment)
CREATE TABLE IF NOT EXISTS payment_leads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL DEFAULT 'perfectpay',
  external_reference VARCHAR(255),
  product_id VARCHAR(255),
  plan_id VARCHAR(255),
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(100),
  raw_status VARCHAR(100),
  normalized_status VARCHAR(50) NOT NULL DEFAULT 'pre_checkout',
  inferred_status VARCHAR(50),
  amount_cents BIGINT,
  currency VARCHAR(10) DEFAULT 'USD',
  payment_method VARCHAR(50),
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_content VARCHAR(255),
  utm_term VARCHAR(255),
  src VARCHAR(255),
  sck VARCHAR(255),
  converted_order_id TEXT REFERENCES orders(id),
  converted_at TIMESTAMP WITH TIME ZONE,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_leads_email ON payment_leads(customer_email);
CREATE INDEX IF NOT EXISTS idx_payment_leads_status ON payment_leads(normalized_status);
CREATE INDEX IF NOT EXISTS idx_payment_leads_created_at ON payment_leads(created_at DESC);

-- 9. Webhook Events Table (Self-contained creation + safe extensions)
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL DEFAULT 'perfectpay',
  external_event_id VARCHAR(255),
  external_order_id VARCHAR(255),
  external_payment_id VARCHAR(255),
  deduplication_key VARCHAR(255),
  event_type VARCHAR(100) NOT NULL DEFAULT 'unknown',
  raw_event_type VARCHAR(100),
  raw_status VARCHAR(100),
  normalized_status VARCHAR(50) NOT NULL DEFAULT 'unknown',
  product_id VARCHAR(255),
  plan_id VARCHAR(255),
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(100),
  amount_cents BIGINT,
  currency VARCHAR(10) DEFAULT 'USD',
  payment_method VARCHAR(50),
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_content VARCHAR(255),
  utm_term VARCHAR(255),
  src VARCHAR(255),
  sck VARCHAR(255),
  transaction_id VARCHAR(255),
  order_id VARCHAR(255),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata_safe JSONB,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processing_status VARCHAR(50) NOT NULL DEFAULT 'UNPROCESSED',
  error_message TEXT,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Idempotent column additions for webhook_events in case it already existed
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS external_order_id VARCHAR(255);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS external_payment_id VARCHAR(255);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS deduplication_key VARCHAR(255);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS raw_event_type VARCHAR(100);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS raw_status VARCHAR(100);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS normalized_status VARCHAR(50) NOT NULL DEFAULT 'unknown';
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS product_id VARCHAR(255);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS plan_id VARCHAR(255);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(100);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS amount_cents BIGINT;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(255);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS utm_content VARCHAR(255);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS utm_term VARCHAR(255);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS src VARCHAR(255);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS sck VARCHAR(255);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS metadata_safe JSONB;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS processing_status VARCHAR(50) NOT NULL DEFAULT 'UNPROCESSED';
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

-- Strict Partial Unique Indexes on Webhooks
CREATE UNIQUE INDEX IF NOT EXISTS uq_webhook_events_provider_external_id 
ON webhook_events(provider, external_event_id) 
WHERE external_event_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_webhook_events_provider_dedup_key 
ON webhook_events(provider, deduplication_key) 
WHERE deduplication_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at DESC);

-- 10. Row Level Security (RLS) Policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_cost_settings ENABLE ROW LEVEL SECURITY;

-- Idempotent Public policy: Only active offers can be read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'offers' AND policyname = 'Public can view active offers'
  ) THEN
    CREATE POLICY "Public can view active offers" ON offers 
    FOR SELECT TO anon, authenticated USING (active = true);
  END IF;
END $$;
