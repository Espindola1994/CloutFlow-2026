CREATE TABLE IF NOT EXISTS "admin_security" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" varchar(255) NOT NULL,
	"totp_secret_encrypted" text,
	"totp_enabled" boolean DEFAULT false NOT NULL,
	"totp_verified_at" timestamp with time zone,
	"last_totp_step" integer,
	"failed_mfa_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_security_admin_id_unique" UNIQUE("admin_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_recovery_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" varchar(255) NOT NULL,
	"code_hash" text NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_recovery_codes_code_hash_unique" UNIQUE("code_hash")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_admin_recovery_codes_admin_id" ON "admin_recovery_codes" ("admin_id");
