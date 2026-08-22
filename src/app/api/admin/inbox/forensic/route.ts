import { NextResponse } from 'next/server';
import { db } from '@/db';
import { emailThreads, emailMessages } from '@/db/schema';
import { syncGmailInbox } from '@/services/email/inbox.service';
import { ImapFlow } from 'imapflow';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (key !== 'forensic_check_2026') {
      return NextResponse.json({ success: false, error: 'Unauthorized key' }, { status: 401 });
    }

    const report: Record<string, any> = {};

    // 1. Inspect IMAP directly
    const gmailUser = process.env.GMAIL_USER!;
    const gmailPass = process.env.GMAIL_APP_PASSWORD!;

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

    // Fetch all messages in inbox
    const allMessages: any[] = [];
    if (mailbox.exists > 0) {
      for await (const msg of client.fetch('1:*', { envelope: true, uid: true, internalDate: true })) {
        allMessages.push({
          uid: msg.uid,
          from: msg.envelope.from?.[0]?.address,
          to: msg.envelope.to?.[0]?.address,
          subject: msg.envelope.subject,
          date: msg.internalDate,
        });
      }
    }
    report.allImapMessages = allMessages;
    await client.logout();

    // 2. Perform Sync Now
    const syncRes = await syncGmailInbox({ limit: 50 });
    report.syncResult = syncRes;

    // 3. Check DB email threads & messages
    const threads = await db.select().from(emailThreads);
    const messages = await db.select().from(emailMessages);

    report.dbThreads = threads;
     report.dbMessages = messages;

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