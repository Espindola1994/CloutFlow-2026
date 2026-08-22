import { NextResponse } from 'next/server';
import { db } from '@/db';
import { emailThreads, emailMessages } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { getSupportEmailTransport } from '@/integrations/email/transport';
import { sanitizeHtml } from '@/lib/email/sanitize';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await props.params;
    const body = await request.json();
    const { textBody, htmlBody, status = 'WAITING_CUSTOMER' } = body;

    if (!textBody && !htmlBody) {
      return NextResponse.json(
        { success: false, error: 'Message body (textBody or htmlBody) is required.' },
        { status: 400 }
      );
    }

    // 1. Fetch Thread
    const [thread] = await db.query.emailThreads.findMany({
      where: eq(emailThreads.id, id),
      limit: 1,
    });

    if (!thread) {
      return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 });
    }

    // 2. Fetch Latest Inbound Message to preserve RFC threading headers (In-Reply-To, References, Subject)
    const [latestInbound] = await db.query.emailMessages.findMany({
      where: eq(emailMessages.threadId, id),
      orderBy: [desc(emailMessages.createdAt)],
      limit: 1,
    });

    const replySubject = thread.subject.toLowerCase().startsWith('re:')
      ? thread.subject
      : `Re: ${thread.subject}`;

    const inReplyTo = latestInbound?.messageId || undefined;
    const references = latestInbound?.references
      ? `${latestInbound.references} ${latestInbound.messageId || ''}`.trim()
      : latestInbound?.messageId || undefined;

    const fromEmail = process.env.GMAIL_USER || process.env.RESEND_FROM_EMAIL || 'support@cloutflow.com';
    const recipientEmail = thread.customerEmail.trim().toLowerCase();

    const plainContent = textBody || (htmlBody ? htmlBody.replace(/<[^>]+>/g, ' ') : '');
    const htmlContent = htmlBody || `<p>${plainContent.replace(/\n/g, '<br/>')}</p>`;

    // 3. Dispatch via Support Transport (Gmail SMTP)
    const transport = getSupportEmailTransport();
    const sendResult = await transport.send({
      to: recipientEmail,
      from: `CloutFlow Support <${fromEmail}>`,
      subject: replySubject,
      text: plainContent,
      html: htmlContent,
      inReplyTo,
      references,
      category: 'support',
    });

    if (!sendResult.success) {
      return NextResponse.json(
        { success: false, error: sendResult.error || 'Failed to dispatch reply via support transport' },
        { status: 502 }
      );
    }

    // 4. Record Outbound Message in Database
    const [insertedMsg] = await db.insert(emailMessages).values({
      threadId: thread.id,
      direction: 'OUTBOUND',
      provider: 'GMAIL',
      providerMessageId: sendResult.messageId || null,
      inReplyTo: inReplyTo || null,
      references: references || null,
      fromEmail,
      toEmail: recipientEmail,
      subject: replySubject,
      textBody: plainContent,
      sanitizedHtmlBody: sanitizeHtml(htmlContent),
      sentAt: new Date(),
      metadata: {
        adminId: session?.id || 'admin_root',
        adminName: session?.name || 'Admin',
      },
    }).returning({ id: emailMessages.id });

    // 5. Update Thread Status (default: WAITING_CUSTOMER) and latestMessageAt
    await db.update(emailThreads).set({
      status,
      latestMessageAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(emailThreads.id, thread.id));

    return NextResponse.json({
      success: true,
      data: {
        messageId: insertedMsg.id,
        threadId: thread.id,
        status,
        providerMessageId: sendResult.messageId,
      },
    });
  } catch (error) {
    console.error('[AdminThreadReplyAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to send reply' },
      { status: 500 }
    );
  }
}
