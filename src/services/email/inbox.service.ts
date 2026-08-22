import { db } from '@/db';
import {
  customers,
  paymentLeads,
  lifecycleEvents,
  orders,
  checkoutContexts,
  emailThreads,
  emailMessages,
} from '@/db/schema';
import { eq, or, and, sql, desc } from 'drizzle-orm';
import { sanitizeHtml } from '@/lib/email/sanitize';
import { ImapFlow } from 'imapflow';

export interface InboundEmailPayload {
  messageId: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  textBody?: string;
  htmlBody?: string;
  inReplyTo?: string;
  references?: string;
  receivedAt: Date;
  providerMessageId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Checks whether sender email matches any canonical CloutFlow identity:
 * - customers
 * - paymentLeads
 * - lifecycleEvents
 * - orders (customerEmail)
 * - checkoutContexts (customerEmail)
 */
export async function isRecognizedSender(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  // 1. Check customers table
  const [cust] = await db.query.customers.findMany({
    where: eq(customers.email, normalized),
    limit: 1,
  });
  if (cust) return true;

  // 2. Check paymentLeads table
  const [lead] = await db.query.paymentLeads.findMany({
    where: eq(paymentLeads.customerEmail, normalized),
    limit: 1,
  });
  if (lead) return true;

  // 3. Check lifecycleEvents table
  const [event] = await db.query.lifecycleEvents.findMany({
    where: eq(lifecycleEvents.customerEmail, normalized),
    limit: 1,
  });
  if (event) return true;

  // 4. Check orders table
  const [order] = await db.query.orders.findMany({
    where: eq(orders.customerEmail, normalized),
    limit: 1,
  });
  if (order) return true;

  // 5. Check checkoutContexts table
  const [ctx] = await db.query.checkoutContexts.findMany({
    where: eq(checkoutContexts.customerEmail, normalized),
    limit: 1,
  });
  if (ctx) return true;

  return false;
}

/**
 * Attempts to associate an inbound email with a customer and an existing order if found.
 */
export async function correlateCustomerAndOrder(customerEmail: string) {
  const normalized = customerEmail.trim().toLowerCase();

  const foundCustomers = await db.query.customers.findMany({
    where: eq(customers.email, normalized),
    limit: 1,
  });
  const customer = foundCustomers && Array.isArray(foundCustomers) ? foundCustomers[0] : null;

  // Find latest order if available
  const foundOrders = await db.query.orders.findMany({
    where: eq(orders.customerEmail, normalized),
    orderBy: [desc(orders.createdAt)],
    limit: 1,
  });
  const latestOrder = foundOrders && Array.isArray(foundOrders) ? foundOrders[0] : null;

  return {
    customerId: customer?.id || null,
    relatedOrderId: latestOrder?.id || null,
  };
}

/**
 * Finds or creates an email thread based on in-reply-to, references, or sender + subject match.
 */
export async function findOrCreateThread(payload: InboundEmailPayload): Promise<{ threadId: string; isNewThread: boolean }> {
  const normalizedEmail = payload.fromEmail.trim().toLowerCase();

  // 1. Try finding parent thread by Message-ID matching inReplyTo or references
  if (payload.inReplyTo || payload.references) {
    const parentIds: string[] = [];
    if (payload.inReplyTo) parentIds.push(payload.inReplyTo.trim());
    if (payload.references) {
      const splitRefs = payload.references.split(/\s+/).map((r) => r.trim()).filter(Boolean);
      parentIds.push(...splitRefs);
    }

    if (parentIds.length > 0) {
      const existingMessage = await db.query.emailMessages.findFirst({
        where: sql`${emailMessages.messageId} IN ${parentIds}`,
      });

      if (existingMessage?.threadId) {
        return { threadId: existingMessage.threadId, isNewThread: false };
      }
    }
  }

  // 2. Try finding recent active thread by customer email and normalized subject
  const cleanSubject = payload.subject.replace(/^(re|fwd|fw):\s*/i, '').trim();
  const foundThreads = await db.query.emailThreads.findMany({
    where: and(
      eq(emailThreads.customerEmail, normalizedEmail),
      sql`LOWER(${emailThreads.subject}) LIKE LOWER(${'%' + cleanSubject + '%'})`
    ),
    orderBy: [desc(emailThreads.latestMessageAt)],
    limit: 1,
  });
  const matchingThread = foundThreads && Array.isArray(foundThreads) ? foundThreads[0] : null;

  if (matchingThread) {
    return { threadId: matchingThread.id, isNewThread: false };
  }

  // 3. Create new thread
  const { customerId, relatedOrderId } = await correlateCustomerAndOrder(normalizedEmail);
  const [newThread] = await db.insert(emailThreads).values({
    customerEmail: normalizedEmail,
    customerId,
    status: 'NEEDS_REPLY',
    subject: payload.subject || '(No Subject)',
    relatedOrderId,
    latestMessageAt: payload.receivedAt || new Date(),
    unreadCount: 1,
  }).returning({ id: emailThreads.id });

  return { threadId: newThread.id, isNewThread: true };
}

/**
 * Ingests a single inbound email safely.
 * Enforces:
 * - Sender recognition guard (unknown sender ignored)
 * - Deduplication via messageId / providerMessageId
 * - HTML sanitization
 * - Thread correlation and unread count update
 */
export async function ingestInboundEmail(payload: InboundEmailPayload): Promise<{
  status: 'IMPORTED' | 'IGNORED_UNKNOWN_SENDER' | 'DUPLICATE' | 'FAILED';
  threadId?: string;
  messageId?: string;
  reason?: string;
}> {
  const normalizedEmail = payload.fromEmail.trim().toLowerCase();

  // 1. Sender Recognition Guard
  const isRecognized = await isRecognizedSender(normalizedEmail);
  if (!isRecognized) {
    return {
      status: 'IGNORED_UNKNOWN_SENDER',
      reason: `Sender ${normalizedEmail} is not a recognized customer or lead in CloutFlow.`,
    };
  }

  // 2. Deduplication check
  if (payload.messageId || payload.providerMessageId) {
    const duplicate = await db.query.emailMessages.findFirst({
      where: or(
        payload.messageId ? eq(emailMessages.messageId, payload.messageId) : undefined,
        payload.providerMessageId ? eq(emailMessages.providerMessageId, payload.providerMessageId) : undefined
      ),
    });

    if (duplicate) {
      return {
        status: 'DUPLICATE',
        threadId: duplicate.threadId,
        messageId: duplicate.id,
        reason: 'Message already imported.',
      };
    }
  }

  try {
    // 3. Find or Create Thread
    const { threadId, isNewThread } = await findOrCreateThread(payload);

    // 4. Sanitize HTML body
    const sanitizedHtml = payload.htmlBody ? sanitizeHtml(payload.htmlBody) : null;

    // 5. Insert Message
    const [insertedMsg] = await db.insert(emailMessages).values({
      threadId,
      direction: 'INBOUND',
      provider: 'GMAIL',
      providerMessageId: payload.providerMessageId || null,
      messageId: payload.messageId || null,
      inReplyTo: payload.inReplyTo || null,
      references: payload.references || null,
      fromEmail: normalizedEmail,
      toEmail: payload.toEmail.trim().toLowerCase(),
      subject: payload.subject,
      textBody: payload.textBody || null,
      sanitizedHtmlBody: sanitizedHtml,
      receivedAt: payload.receivedAt || new Date(),
      metadata: payload.metadata || {},
    }).returning({ id: emailMessages.id });

    // 6. Update Thread Status & Timestamps (if existing thread)
    if (!isNewThread) {
      await db.update(emailThreads).set({
        latestMessageAt: payload.receivedAt || new Date(),
        status: 'NEEDS_REPLY',
        unreadCount: sql`${emailThreads.unreadCount} + 1`,
        updatedAt: new Date(),
      }).where(eq(emailThreads.id, threadId));
    }

    return {
      status: 'IMPORTED',
      threadId,
      messageId: insertedMsg.id,
    };
  } catch (error) {
    console.error('[InboxService] Failed to ingest inbound email:', error);
    return {
      status: 'FAILED',
      reason: error instanceof Error ? error.message : 'Unknown error during inbound email ingestion',
    };
  }
}

/**
 * Synchronizes recent messages from Gmail IMAP using GMAIL_USER + GMAIL_APP_PASSWORD.
 */
export async function syncGmailInbox(options?: { sinceMinutes?: number; limit?: number }) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    return {
      success: false,
      syncedCount: 0,
      ignoredCount: 0,
      duplicateCount: 0,
      error: 'Gmail IMAP credentials (GMAIL_USER, GMAIL_APP_PASSWORD) not configured.',
    };
  }

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
    logger: false,
  });

  let syncedCount = 0;
  let ignoredCount = 0;
  let duplicateCount = 0;

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      const sinceDate = new Date(Date.now() - (options?.sinceMinutes || 1440) * 60 * 1000); // default last 24h
      const messagesGenerator = client.fetch(
        { since: sinceDate },
        { envelope: true, source: true, bodyStructure: true, internalDate: true }
      );

      let processed = 0;
      const maxLimit = options?.limit || 50;

      for await (const msg of messagesGenerator) {
        if (processed >= maxLimit) break;
        processed++;

        const envelope = msg.envelope;
        if (!envelope || !envelope.from || envelope.from.length === 0) continue;

        const senderEmail = envelope.from[0].address || '';
        if (!senderEmail || senderEmail.toLowerCase() === gmailUser.toLowerCase()) {
          continue; // Skip self
        }

        const messageId = envelope.messageId || `imap-${msg.uid}`;
        const subject = envelope.subject || '(No Subject)';
        const toEmail = envelope.to?.[0]?.address || gmailUser;
        const inReplyTo = envelope.inReplyTo;
        const receivedAt = msg.internalDate ? new Date(msg.internalDate) : new Date();

        // Convert body/source snippet
        const textBody = msg.source?.toString('utf-8') || '';

        const result = await ingestInboundEmail({
          messageId,
          providerMessageId: String(msg.uid),
          fromEmail: senderEmail,
          toEmail,
          subject,
          textBody,
          htmlBody: textBody,
          inReplyTo,
          receivedAt,
        });

        if (result.status === 'IMPORTED') syncedCount++;
        else if (result.status === 'IGNORED_UNKNOWN_SENDER') ignoredCount++;
        else if (result.status === 'DUPLICATE') duplicateCount++;
      }
    } finally {
      lock.release();
    }

    await client.logout();

    return {
      success: true,
      syncedCount,
      ignoredCount,
      duplicateCount,
    };
  } catch (error) {
    console.error('[Gmail Sync] IMAP Error:', error);
    try {
      await client.logout();
    } catch {
      // ignore
    }
    return {
      success: false,
      syncedCount,
      ignoredCount,
      duplicateCount,
      error: error instanceof Error ? error.message : 'Unknown IMAP error',
    };
  }
}
