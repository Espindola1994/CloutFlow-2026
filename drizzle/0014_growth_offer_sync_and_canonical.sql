-- Migration: 0014_growth_offer_sync_and_canonical.sql
-- Description: Adds sync_home and sync_offer_step3 columns to offers table if not exist, creates unique index for platform+service+plan identity.

ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "sync_home" boolean DEFAULT true NOT NULL;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "sync_offer_step3" boolean DEFAULT true NOT NULL;

-- Create unique index on platform, service, name (case-insensitive) for active identity uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS "idx_offers_platform_service_name_unique" 
ON "offers" (LOWER("platform"), LOWER("service"), LOWER("name"));
