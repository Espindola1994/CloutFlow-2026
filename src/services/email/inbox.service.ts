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

/**
 * Extracts clean text and sanitized HTML from an inbound email payload using mailparser.
 */
import { simpleParser } from 'mailparser';

async function parseEmailBody(rawSource: string | Buffer): Promise<{ text: string, html: string }> {
  try {
    const parsed = await simpleParser(rawSource);
    return {
      text: parsed.text || '',
      html: parsed.html || parsed.textAsHtml || ''
    };
  } catch (err) {
    console.error('Failed to parse email source:', err);
    return { text: '', html: '' };
  }
}

export interface InboundEmailPayload {
  messageId: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  rawSource?: string | Buffer;
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
  const cleanSubject = payload.subject ? payload.subject.replace(/^(re|fwd|fw):\s*/i, '').trim() : '';
  const foundThreads = await db.query.emailThreads.findMany({
    where: and(
      eq(emailThreads.customerEmail, normalizedEmail),
      cleanSubject ? sql`LOWER(${emailThreads.subject}) LIKE LOWER(${'%' + cleanSubject + '%'})` : undefined
    ),
    orderBy: [desc(emailThreads.latestMessageAt)],
    limit: 1,
  });
  const matchingThread = foundThreads && Array.isArray(foundThreads) && foundThreads.length > 0 ? foundThreads[0] : null;

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

    // 4. Sanitize HTML body or Parse Raw Source
    let textBody = payload.textBody || null;
    let htmlBody = payload.htmlBody || null;
    
    // Fallback parser if we only have raw source
    if (payload.rawSource && (!textBody || !htmlBody)) {
      const parsed = await parseEmailBody(payload.rawSource);
      if (!textBody && parsed.text) textBody = parsed.text;
      if (!htmlBody && parsed.html) htmlBody = parsed.html;
    }
    
    // Always fallback to textBody if htmlBody is missing after parse
    if (!htmlBody && textBody) {
      // Very basic formatting for text fallback to HTML if HTML was totally absent
      htmlBody = `<div style="white-space: pre-wrap;">${textBody}</div>`;
    }
    
    const sanitizedHtml = htmlBody ? sanitizeHtml(htmlBody) : null;

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
      textBody: textBody,
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

import { settings } from '@/db/schema';

// Helper to manage sync cursor in settings table
async function getSyncCursor() {
  const [record] = await db.query.settings.findMany({
    where: eq(settings.key, 'inbox_sync_cursor'),
    limit: 1,
  });
  if (!record || !record.value) {
    return { uidValidity: 0, lastUid: 0 };
  }
  return record.value as { uidValidity: number; lastUid: number };
}

async function updateSyncCursor(uidValidity: number, lastUid: number) {
  const value = { uidValidity, lastUid };
  await db.insert(settings)
    .values({ key: 'inbox_sync_cursor', value, isPublic: false })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() }
    });
}

/**
 * Ensures only one sync runs at a time.
 */
async function acquireSyncLock(): Promise<boolean> {
  // Simple DB-based lock using a setting with a short lease (e.g. 5 minutes)
  const now = new Date();
  
  // Try to find an existing lock
  const [record] = await db.query.settings.findMany({
    where: eq(settings.key, 'inbox_sync_lock'),
    limit: 1,
  });
  
  if (record && record.value) {
    const lockData = record.value as { lockedAt: string };
    const lockedAt = new Date(lockData.lockedAt);
    
    // If lock is less than 5 minutes old, we can't acquire it
    if (now.getTime() - lockedAt.getTime() < 5 * 60 * 1000) {
      return false;
    }
  }
  
  // Acquire or refresh the lock
  await db.insert(settings)
    .values({ key: 'inbox_sync_lock', value: { lockedAt: now.toISOString() }, isPublic: false })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: { lockedAt: now.toISOString() }, updatedAt: now }
    });
    
  return true;
}

async function releaseSyncLock() {
  await db.update(settings)
    .set({ value: { lockedAt: new Date(0).toISOString() } })
    .where(eq(settings.key, 'inbox_sync_lock'));
}

/**
 * Synchronizes recent messages from Gmail IMAP using GMAIL_USER + GMAIL_APP_PASSWORD.
 */
export async function syncGmailInbox(options?: { limit?: number }) {
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
  
  const lockAcquired = await acquireSyncLock();
  if (!lockAcquired) {
    return {
      success: true, // not an error, just skipping
      syncedCount: 0,
      ignoredCount: 0,
      duplicateCount: 0,
      status: 'SYNC_ALREADY_RUNNING',
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
    const mailbox = await client.mailboxOpen('INBOX');

    const serverUidValidity = BigInt(mailbox.uidValidity);
    const { uidValidity: localUidValidity, lastUid: localLastUid } = await getSyncCursor();

    let searchCriteria: import('imapflow').SearchObject;
    let newLastUid = localLastUid;

    if (localUidValidity !== Number(serverUidValidity)) {
      // UIDVALIDITY changed or first sync. Safe bounded fallback.
      searchCriteria = { since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }; // Last 30 days fallback
      newLastUid = 0; 
    } else {
      // Normal increment
      searchCriteria = { uid: `${localLastUid + 1}:*` };
    }

    const messagesGenerator = client.fetch(
      searchCriteria,
      { envelope: true, source: true, bodyStructure: true, internalDate: true, uid: true },
      { uid: true }
    );

    let processed = 0;
    const maxLimit = options?.limit || 50;
    let maxUidProcessed = newLastUid;

    for await (const msg of messagesGenerator) {
      if (processed >= maxLimit) break;
      
      // If we are using UID bounds, skip if it's somehow lower
      if (msg.uid <= localLastUid && localUidValidity === Number(serverUidValidity)) {
         continue; 
      }
      
      processed++;

      const envelope = msg.envelope;
      if (!envelope || !envelope.from || envelope.from.length === 0) continue;

      const senderEmail = envelope.from[0].address || '';
      if (!senderEmail || senderEmail.toLowerCase() === gmailUser.toLowerCase()) {
        if (msg.uid > maxUidProcessed) maxUidProcessed = msg.uid;
        continue; // Skip self
      }

      const messageId = envelope.messageId || `imap-${msg.uid}`;
      const subject = envelope.subject || '(No Subject)';
      const toEmail = envelope.to?.[0]?.address || gmailUser;
      const inReplyTo = envelope.inReplyTo;
      const receivedAt = msg.internalDate ? new Date(msg.internalDate) : new Date();

      const rawSource = msg.source || Buffer.from('');

      const result = await ingestInboundEmail({
        messageId,
        providerMessageId: String(msg.uid),
        fromEmail: senderEmail,
        toEmail,
        subject,
        rawSource,
        inReplyTo,
        receivedAt,
      });

      // Update cursor safely ONLY if ingestion succeeds or safely ignored/duplicate.
      // Do not advance cursor if FAILED, so we don't lose emails permanently due to a temporary DB error.
      if (result.status === 'IMPORTED' || result.status === 'IGNORED_UNKNOWN_SENDER' || result.status === 'DUPLICATE') {
         if (msg.uid > maxUidProcessed) {
           maxUidProcessed = msg.uid;
         }
      }

      if (result.status === 'IMPORTED') syncedCount++;
      else if (result.status === 'IGNORED_UNKNOWN_SENDER') ignoredCount++;
      else if (result.status === 'DUPLICATE') duplicateCount++;
    }
    
    // Save new cursor
    if (maxUidProcessed > newLastUid || localUidValidity !== Number(serverUidValidity)) {
       await updateSyncCursor(Number(serverUidValidity), maxUidProcessed);
    }

    await client.logout();

    return {
      success: true,
      syncedCount,
      ignoredCount,
      duplicateCount,
      status: 'COMPLETED'
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
      status: 'FAILED'
    };
  } finally {
    await releaseSyncLock();
  }
}
