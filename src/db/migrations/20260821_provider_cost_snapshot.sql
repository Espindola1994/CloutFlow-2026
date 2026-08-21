-- ADDITIVE MIGRATION: Provider Cost Snapshot for fulfillment_orders
-- Purpose: Immutable provider cost tracking per actual executed service
-- NO DESTRUCTIVE CHANGES. ALL NEW COLUMNS ARE NULLABLE.

-- 1. Add provider cost snapshot columns to fulfillment_orders
ALTER TABLE fulfillment_orders ADD COLUMN IF NOT EXISTS provider_tier varchar(50);
ALTER TABLE fulfillment_orders ADD COLUMN IF NOT EXISTS provider_cost_cents integer;
ALTER TABLE fulfillment_orders ADD COLUMN IF NOT EXISTS provider_cost_currency varchar(10) DEFAULT 'USD' NOT NULL;
ALTER TABLE fulfillment_orders ADD COLUMN IF NOT EXISTS provider_cost_source varchar(50);
ALTER TABLE fulfillment_orders ADD COLUMN IF NOT EXISTS provider_rate_snapshot varchar(50);
ALTER TABLE fulfillment_orders ADD COLUMN IF NOT EXISTS provider_cost_captured_at timestamptz;

-- 2. Add rate column to fulfillment_chain_services (currently accessed via metadata/cast)
ALTER TABLE fulfillment_chain_services ADD COLUMN IF NOT EXISTS rate varchar(50);

-- NOTES:
-- provider_tier: 'primary', 'fallback1', 'fallback2'
-- provider_cost_source: 'ACTUAL_PROVIDER_CHARGE', 'CHAIN_RATE_SNAPSHOT', 'ADMIN_COST_ESTIMATE', 'UNKNOWN'
-- provider_rate_snapshot: Rate per 1000 at dispatch time (e.g. '0.50' meaning $0.50/1000)
-- provider_cost_cents: Integer cents (immutable after capture)
-- provider_cost_captured_at: Timestamp when cost was first captured (immutable)
