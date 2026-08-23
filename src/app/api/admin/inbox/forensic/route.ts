import { NextResponse } from 'next/server';
import { db } from '@/db';
import { emailThreads, emailMessages, emailInboxSyncState, customers, paymentLeads, lifecycleEvents, orders, checkoutContexts } from '@/db/schema';
import { syncGmailInbox } from '@/services/email/inbox.service';
import { ImapFlow } from 'imapflow';
import { sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (key !== 'forensic_check_2026') {
      return NextResponse.json({ success: false, error: 'Unauthorized key' }, { status: 401 });
    }

    const report: Record<string, any> = {};

    // 0. Auto-ensure tables exist if schema was partially pending
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "email_inbox_sync_state" (
          "id" text PRIMARY KEY NOT NULL,
          "mailbox_key" varchar(255) NOT NULL UNIQUE,
          "uid_validity" text,
          "last_processed_uid" bigint,
          "last_successful_sync_at" timestamp with time zone,
          "last_attempt_at" timestamp with time zone,
          "lock_token" text,
          "lock_expires_at" timestamp with time zone,
          "last_error" text,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );
      `);
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "email_threads" (
          "id" text PRIMARY KEY NOT NULL,
          "customer_email" varchar(255) NOT NULL,
          "customer_id" text REFERENCES "customers"("id"),
          "status" varchar(50) DEFAULT 'NEEDS_REPLY' NOT NULL,
          "subject" text NOT NULL,
          "related_order_id" text REFERENCES "orders"("id"),
          "latest_message_at" timestamp with time zone DEFAULT now() NOT NULL,
          "unread_count" integer DEFAULT 0 NOT NULL,
          "deleted_at" timestamp with time zone,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );
      `);

      await db.execute(sql`
        ALTER TABLE "email_threads" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "email_messages" (
          "id" text PRIMARY KEY NOT NULL,
          "thread_id" text NOT NULL REFERENCES "email_threads"("id") ON DELETE cascade,
          "direction" varchar(20) NOT NULL,
          "provider" varchar(50) DEFAULT 'GMAIL' NOT NULL,
          "provider_message_id" varchar(255),
          "message_id" varchar(500),
          "in_reply_to" varchar(500),
          "references" text,
          "from_email" varchar(255) NOT NULL,
          "to_email" varchar(255) NOT NULL,
          "subject" text NOT NULL,
          "text_body" text,
          "sanitized_html_body" text,
          "received_at" timestamp with time zone,
          "sent_at" timestamp with time zone,
          "read_at" timestamp with time zone,
          "metadata" jsonb DEFAULT '{}',
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
        );
      `);

      report.schema = "READY";
    } catch (e: any) {
      report.schema = "MIGRATION_FAILED";
      report.schemaError = e.message;
    }

    // 1. Inspect IMAP directly
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    report.gmailUserConfigured = !!gmailUser;
    report.gmailPassConfigured = !!gmailPass;

    if (gmailUser && gmailPass) {
      try {
        const client = new ImapFlow({
          host: 'imap.gmail.com',
          port: 993,
          secure: true,
          auth: { user: gmailUser, pass: gmailPass },
          logger: false,
        });

        await client.connect();
        const mailbox = await client.mailboxOpen('INBOX');
        report.mailbox = {
          exists: mailbox.exists,
          uidValidity: mailbox.uidValidity,
        };

        const allMessages: any[] = [];
        if (mailbox.exists > 0) {
          for await (const msg of client.fetch('1:*', { envelope: true, uid: true, internalDate: true })) {
            allMessages.push({
              uid: msg.uid,
              from: msg.envelope?.from?.[0]?.address,
              to: msg.envelope?.to?.[0]?.address,
              subject: msg.envelope?.subject,
              date: msg.internalDate,
            });
          }
        }
        report.allImapMessages = allMessages;
        await client.logout();
      } catch (imapErr: any) {
        report.imapError = imapErr.message;
      }
    }

    // 2. Perform Sync Now
    const syncRes = await syncGmailInbox({ limit: 50 });
    report.syncResult = syncRes;

    // 3. Check DB email threads & messages
    try {
      const threads = await db.select().from(emailThreads);
      const messages = await db.select().from(emailMessages);
      const syncStates = await db.select().from(emailInboxSyncState);

      report.dbThreads = threads;
      report.dbMessages = messages;
      
      // Map correctly to avoid BigInt serialization errors from IMAP flow uid properties
      // or other db fields
      report.dbSyncStates = syncStates.map((s) => ({
        ...s,
        lastProcessedUid: s.lastProcessedUid ? Number(s.lastProcessedUid) : null,
      }));
      
      if (report.mailbox && typeof report.mailbox.uidValidity === 'bigint') {
        report.mailbox.uidValidity = Number(report.mailbox.uidValidity);
      }
      
      if (report.allImapMessages) {
        report.allImapMessages = report.allImapMessages.map((msg: any) => ({
            ...msg,
            uid: typeof msg.uid === 'bigint' ? Number(msg.uid) : msg.uid
        }));
      }

    } catch (dbErr: any) {
      report.dbError = dbErr.message;
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      stack: err.stack,
    }, { status: 500 });
  }
}