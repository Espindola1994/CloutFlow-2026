CREATE TABLE "email_inbox_sync_state" (
	"id" text PRIMARY KEY NOT NULL,
	"mailbox_key" varchar(255) NOT NULL,
	"uid_validity" text,
	"last_processed_uid" bigint,
	"last_successful_sync_at" timestamp with time zone,
	"last_attempt_at" timestamp with time zone,
	"lock_token" text,
	"lock_expires_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_inbox_sync_state_mailbox_key_unique" UNIQUE("mailbox_key")
);
