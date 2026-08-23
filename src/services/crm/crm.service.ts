import { db } from '@/db';
import { 
  orders, 
  orderItems, 
  paymentLeads, 
  checkoutContexts, 
  lifecycleEvents, 
  lifecycleAutomations, 
  emailLogs, 
  emailSuppressions, 
  crmNotes, 
  crmContactMetadata, 
  customers,
  emailThreads,
} from '@/db/schema';
import { eq, desc, asc, inArray, or, ilike, and } from 'drizzle-orm';
import { validateEmailFormat } from '@/lib/social/normalize';

export interface CrmContactSummary {
  email: string;
  name?: string | null;
  target?: string | null;
  platform?: string | null;
  latestLifecycleState: string;
  latestOrderStatus?: string | null;
  latestFulfillmentStatus?: string | null;
  ordersCount: number;
  completedOrdersCount: number;
  lastActivity: string; // ISO string
  emailAutomationStatus?: string | null;
  suppressed: boolean;
  suppressionReason?: string | null;
  customerType: 'LEAD' | 'CUSTOMER' | 'REPEAT BUYER';
  tags: string[];
  derivedStatus: string;
  totalSpentCents: number;
}

export interface CrmContactDetail extends CrmContactSummary {
  orders: Array<{
    id: string;
    publicId: string;
    platform: string;
    service: string;
    quantity: number;
    targetHandle?: string | null;
    targetUrl?: string | null;
    amountCents: number;
    paymentStatus: string;
    fulfillmentStatus: string;
    createdAt: string;
  }>;
  lifecycleTimeline: Array<{
    id: string;
    eventType: string;
    title: string;
    description: string;
    createdAt: string;
    payload?: any;
  }>;
  emails: Array<{
    id: string;
    sendOrigin: string; // AUTOMATION | MANUAL
    category: string;
    subject: string;
    templateId?: string | null;
    status: string;
    provider: string;
    providerMessageId?: string | null;
    sentAt?: string | null;
    createdAt: string;
    stepNumber?: number | null;
  }>;
  automations: Array<{
    id: string;
    automationId: string;
    actionType: string;
    scheduledFor: string;
    status: string;
    attempts: number;
    lastAttemptAt?: string | null;
    errorLog?: any;
    contextData?: any;
    createdAt: string;
  }>;
  notes: Array<{
    id: string;
    adminName: string;
    text: string;
    createdAt: string;
  }>;
  threads?: Array<{
    id: string;
    subject: string;
    status: string;
    unreadCount: number;
    latestMessageAt: string;
    createdAt: string;
  }>;
  checkoutContexts: Array<{
    id: string;
    contextId: string;
    platform: string;
    service: string;
    targetValue?: string | null;
    socialUsername?: string | null;
    consumedAt?: string | null;
    createdAt: string;
  }>;
}

export function normalizeCrmEmail(rawEmail: string): string {
  const res = validateEmailFormat(rawEmail);
  return res.isValid && res.normalized ? res.normalized : rawEmail.trim().toLowerCase();
}

/**
 * Derives human-readable description for timeline events without replacing canonical DB values.
 */
export function formatLifecycleEvent(eventType: string, payload?: any): { title: string; description: string } {
  switch (eventType) {
    case 'LEAD_CAPTURED':
      return {
        title: 'Lead Captured',
        description: `Lead profile or email registered in checkout flow${payload?.service ? ` for ${payload.service}` : ''}.`
      };
    case 'CHECKOUT_STARTED':
      return {
        title: 'Checkout Started',
        description: `Customer initiated checkout process${payload?.platform ? ` on ${payload.platform}` : ''}.`
      };
    case 'CHECKOUT_ABANDONED':
      return {
        title: 'Checkout Abandoned',
        description: 'Customer exited checkout without completing payment.'
      };
    case 'PAYMENT_APPROVED':
      return {
        title: 'Payment Confirmed',
        description: `Payment confirmed successfully${payload?.orderId ? ` for order ${payload.orderId}` : ''}.`
      };
    case 'ORDER_PROCESSING':
      return {
        title: 'Order Processing',
        description: 'Order fulfillment queued and dispatched.'
      };
    case 'ORDER_COMPLETED':
      return {
        title: 'Delivery Completed',
        description: 'Social boost delivered successfully.'
      };
    case 'REPEAT_PURCHASE':
      return {
        title: 'Repeat Purchase',
        description: 'Returning customer completed an additional order.'
      };
    case 'ORDER_REFUNDED':
      return {
        title: 'Order Refunded',
        description: 'Payment was refunded or reversed.'
      };
    default:
      return {
        title: eventType.replace(/_/g, ' '),
        description: `Lifecycle event ${eventType} recorded.`
      };
  }
}

/**
 * Derives the operational attention status from orders and contacts.
 */
export function deriveContactStatus(params: {
  ordersCount: number;
  latestOrderStatus?: string | null;
  latestFulfillmentStatus?: string | null;
  latestLifecycleState?: string | null;
  hasTargetMissing?: boolean;
  hasPostLinkMissing?: boolean;
  suppressed?: boolean;
}): string {
  if (params.suppressed) return 'SUPPRESSED';
  if (params.hasPostLinkMissing) return 'MISSING POST LINK';
  if (params.hasTargetMissing) return 'MISSING TARGET';

  if (params.ordersCount === 0) {
    if (params.latestLifecycleState === 'CHECKOUT_ABANDONED') return 'ABANDONED';
    if (params.latestLifecycleState === 'CHECKOUT_STARTED') return 'CHECKOUT STARTED';
    return 'LEAD';
  }

  // A repeat buyer might have a currently abandoned checkout journey
  if (params.latestLifecycleState === 'CHECKOUT_ABANDONED') {
    return 'ABANDONED'; // Operationally abandoned, even if they have past orders
  }

  if (params.latestOrderStatus === 'paid') {
    if (params.latestFulfillmentStatus === 'completed') return 'COMPLETED';
    if (params.latestFulfillmentStatus === 'processing' || params.latestFulfillmentStatus === 'dispatched') return 'FULFILLING';
    if (params.latestFulfillmentStatus === 'failed') return 'NEEDS CUSTOMER ACTION';
    return 'PAID';
  }

  if (params.latestOrderStatus === 'pending') return 'WAITING PAYMENT';
  if (params.latestOrderStatus === 'refunded') return 'REFUNDED';
  if (params.latestOrderStatus === 'failed') return 'FAILED';

  return 'CUSTOMER';
}

/**
 * Loads all CRM contacts aggregated by normalized email.
 */
export async function getCrmContactsList(): Promise<CrmContactSummary[]> {
  // 1. Fetch raw data across lifecycle events, orders, payment leads, suppressions, metadata
  const [
    allEvents,
    allOrders,
    allLeads,
    allSuppressions,
    allMetadata,
    allAutomations
  ] = await Promise.all([
    db.query.lifecycleEvents.findMany({ orderBy: [desc(lifecycleEvents.createdAt)] }),
    db.query.orders.findMany({ orderBy: [desc(orders.createdAt)] }),
    db.query.paymentLeads.findMany({ orderBy: [desc(paymentLeads.createdAt)] }),
    db.query.emailSuppressions.findMany(),
    db.query.crmContactMetadata.findMany(),
    db.query.lifecycleAutomations.findMany({ orderBy: [desc(lifecycleAutomations.createdAt)] })
  ]);

  // Aggregate by canonical normalized email
  const contactMap = new Map<string, {
    email: string;
    name?: string | null;
    targets: Set<string>;
    platforms: Set<string>;
    events: typeof allEvents;
    orders: typeof allOrders;
    leads: typeof allLeads;
    automations: typeof allAutomations;
    suppressed: boolean;
    suppressionReason?: string | null;
    tags: string[];
    totalSpentCents: number;
    lastActivityDate: Date;
  }>();

  function getOrCreate(emailRaw: string) {
    const email = normalizeCrmEmail(emailRaw);
    if (!contactMap.has(email)) {
      contactMap.set(email, {
        email,
        name: null,
        targets: new Set(),
        platforms: new Set(),
        events: [],
        orders: [],
        leads: [],
        automations: [],
        suppressed: false,
        suppressionReason: null,
        tags: [],
        totalSpentCents: 0,
        lastActivityDate: new Date(0)
      });
    }
    return contactMap.get(email)!;
  }

  // Populate suppressions
  for (const s of allSuppressions) {
    const c = getOrCreate(s.customerEmail);
    c.suppressed = true;
    c.suppressionReason = s.reason;
  }

  // Populate metadata / tags
  for (const m of allMetadata) {
    const c = getOrCreate(m.customerEmail);
    if (m.tags) {
      c.tags = m.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
  }

  // Populate lifecycle events
  for (const ev of allEvents) {
    if (!ev.customerEmail) continue;
    const c = getOrCreate(ev.customerEmail);
    c.events.push(ev);
    if (ev.createdAt > c.lastActivityDate) {
      c.lastActivityDate = ev.createdAt;
    }
    const payload = ev.payload as any;
    if (payload?.target) c.targets.add(payload.target);
    if (payload?.platform) c.platforms.add(payload.platform);
    if (payload?.customerName && !c.name) c.name = payload.customerName;
  }

  // Populate orders
  for (const ord of allOrders) {
    if (!ord.customerEmail) continue;
    const c = getOrCreate(ord.customerEmail);
    c.orders.push(ord);
    if (ord.createdAt > c.lastActivityDate) {
      c.lastActivityDate = ord.createdAt;
    }
    if (ord.customerName && !c.name) c.name = ord.customerName;
    const target = ord.socialUsername || ord.username || ord.targetUrl;
    if (target) c.targets.add(target);
    if (ord.platform) c.platforms.add(ord.platform);
    if (ord.paymentStatus === 'approved' || ord.paymentStatus === 'completed' || ord.paymentStatus === 'paid') {
      c.totalSpentCents += (ord.totalCents || 0);
    }
  }

  // Populate leads
  for (const lead of allLeads) {
    if (!lead.customerEmail) continue;
    const c = getOrCreate(lead.customerEmail);
    c.leads.push(lead);
    if (lead.createdAt > c.lastActivityDate) {
      c.lastActivityDate = lead.createdAt;
    }
    if (lead.customerName && !c.name) c.name = lead.customerName;
  }

  // Populate automations
  for (const auto of allAutomations) {
    if (!auto.customerEmail) continue;
    const c = getOrCreate(auto.customerEmail);
    c.automations.push(auto);
  }

  // Compile summary items
  const summaries: CrmContactSummary[] = [];

  for (const contact of contactMap.values()) {
    const ordersCount = contact.orders.length;
    const completedOrders = contact.orders.filter(o => o.fulfillmentStatus === 'COMPLETED' || o.fulfillmentStatus === 'completed').length;
    const latestOrder = contact.orders[0];
    const latestEvent = contact.events[0];
    const latestAutomation = contact.automations[0];

    const customerType = ordersCount > 1 ? 'REPEAT BUYER' : ordersCount === 1 ? 'CUSTOMER' : 'LEAD';

    // Check missing target / post link
    const hasTargetMissing = contact.orders.some(o => (o.fulfillmentStatus === 'FAILED' || o.fulfillmentStatus === 'failed') && !o.socialUsername && !o.username && !o.targetUrl);
    const hasPostLinkMissing = contact.orders.some(o => (o.fulfillmentStatus === 'FAILED' || o.fulfillmentStatus === 'failed') && o.service?.toLowerCase().includes('like') && !o.targetUrl);

    const derived = deriveContactStatus({
      ordersCount,
      latestOrderStatus: latestOrder?.paymentStatus,
      latestFulfillmentStatus: latestOrder?.fulfillmentStatus,
      latestLifecycleState: latestEvent?.eventType,
      hasTargetMissing,
      hasPostLinkMissing,
      suppressed: contact.suppressed
    });

    const primaryTarget = Array.from(contact.targets)[0] || null;
    const primaryPlatform = Array.from(contact.platforms)[0] || null;

    summaries.push({
      email: contact.email,
      name: contact.name,
      target: primaryTarget,
      platform: primaryPlatform,
      latestLifecycleState: latestEvent?.eventType || (ordersCount > 0 ? 'ORDER_CREATED' : 'LEAD_CAPTURED'),
      latestOrderStatus: latestOrder?.paymentStatus || null,
      latestFulfillmentStatus: latestOrder?.fulfillmentStatus || null,
      ordersCount,
      completedOrdersCount: completedOrders,
      lastActivity: (contact.lastActivityDate.getTime() > 0 ? contact.lastActivityDate : new Date()).toISOString(),
      emailAutomationStatus: latestAutomation?.status || null,
      suppressed: contact.suppressed,
      suppressionReason: contact.suppressionReason,
      customerType,
      tags: contact.tags,
      derivedStatus: derived,
      totalSpentCents: contact.totalSpentCents
    });
  }

  // Sort by lastActivity desc
  return summaries.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
}

/**
 * Loads full Customer 360 detail for a specific normalized email identity.
 */
export async function getCrmContactDetail(rawEmail: string): Promise<CrmContactDetail | null> {
  const normalized = normalizeCrmEmail(rawEmail);

  // Fetch all related entities in parallel
  const [
    userOrders,
    userEvents,
    userAutomations,
    userEmails,
    userNotes,
    userContexts,
    userSuppression,
    userMetadata,
    userThreads
  ] = await Promise.all([
    db.query.orders.findMany({
      where: eq(orders.customerEmail, normalized),
      orderBy: [desc(orders.createdAt)]
    }),
    db.query.lifecycleEvents.findMany({
      where: eq(lifecycleEvents.customerEmail, normalized),
      orderBy: [desc(lifecycleEvents.createdAt)]
    }),
    db.query.lifecycleAutomations.findMany({
      where: eq(lifecycleAutomations.customerEmail, normalized),
      orderBy: [desc(lifecycleAutomations.createdAt)]
    }),
    db.query.emailLogs.findMany({
      where: eq(emailLogs.customerEmail, normalized),
      orderBy: [desc(emailLogs.createdAt)]
    }),
    db.query.crmNotes.findMany({
      where: eq(crmNotes.customerEmail, normalized),
      orderBy: [desc(crmNotes.createdAt)]
    }),
    db.query.checkoutContexts.findMany({
      orderBy: [desc(checkoutContexts.createdAt)]
    }),
    db.query.emailSuppressions.findMany({
      where: eq(emailSuppressions.customerEmail, normalized)
    }),
    db.query.crmContactMetadata.findMany({
      where: eq(crmContactMetadata.customerEmail, normalized)
    }),
    db.query.emailThreads.findMany({
      where: eq(emailThreads.customerEmail, normalized),
      orderBy: [desc(emailThreads.latestMessageAt)]
    })
  ]);

  // Aggregate metadata
  const targets = new Set<string>();
  const platforms = new Set<string>();
  let customerName: string | null = null;
  let totalSpentCents = 0;

  const mappedOrders = userOrders.map(o => {
    if (o.customerName && !customerName) customerName = o.customerName;
    const target = o.socialUsername || o.username;
    if (target) targets.add(target);
    if (o.targetUrl) targets.add(o.targetUrl);
    if (o.platform) platforms.add(o.platform);
    if (o.paymentStatus === 'approved' || o.paymentStatus === 'completed' || o.paymentStatus === 'paid') {
      totalSpentCents += (o.totalCents || 0);
    }

    return {
      id: o.id,
      publicId: o.publicId || o.id,
      platform: o.platform || 'instagram',
      service: o.service || 'growth',
      quantity: o.quantity || 0,
      targetHandle: target || null,
      targetUrl: o.targetUrl,
      amountCents: o.totalCents || 0,
      paymentStatus: o.paymentStatus || 'pending',
      fulfillmentStatus: o.fulfillmentStatus || 'pending',
      createdAt: o.createdAt.toISOString(),
    };
  });

  const timeline = userEvents.map(e => {
    const formatted = formatLifecycleEvent(e.eventType, e.payload);
    const payload = e.payload as any;
    if (payload?.target) targets.add(payload.target);
    if (payload?.platform) platforms.add(payload.platform);
    if (payload?.customerName && !customerName) customerName = payload.customerName;

    return {
      id: e.id,
      eventType: e.eventType,
      title: formatted.title,
      description: formatted.description,
      createdAt: e.createdAt.toISOString(),
      payload: e.payload
    };
  });

  const emails = userEmails.map(em => ({
    id: em.id,
    sendOrigin: em.sendOrigin || 'AUTOMATION',
    category: em.category || 'marketing',
    subject: em.subject || 'Email Notification',
    templateId: em.templateId,
    status: em.status,
    provider: em.provider,
    providerMessageId: em.providerMessageId,
    sentAt: em.sentAt ? em.sentAt.toISOString() : null,
    createdAt: em.createdAt.toISOString(),
    stepNumber: em.stepNumber
  }));

  const automations = userAutomations.map(a => ({
    id: a.id,
    automationId: a.automationId,
    actionType: a.actionType,
    scheduledFor: a.scheduledFor.toISOString(),
    status: a.status,
    attempts: a.attempts,
    lastAttemptAt: a.lastAttemptAt ? a.lastAttemptAt.toISOString() : null,
    errorLog: a.errorLog,
    contextData: a.contextData,
    createdAt: a.createdAt.toISOString()
  }));

  const notes = userNotes.map(n => ({
    id: n.id,
    adminName: n.adminName,
    text: n.text,
    createdAt: n.createdAt.toISOString()
  }));

  // Contexts filtered if matching social handle or target
  const relevantContexts = userContexts.filter(ctx => {
    if (ctx.socialUsername && Array.from(targets).some(t => t.toLowerCase().includes(ctx.socialUsername!.toLowerCase()))) return true;
    if (ctx.targetValue && Array.from(targets).some(t => t.toLowerCase().includes(ctx.targetValue!.toLowerCase()))) return true;
    return false;
  }).slice(0, 10).map(ctx => ({
    id: ctx.id,
    contextId: ctx.contextId,
    platform: ctx.platform,
    service: ctx.service,
    targetValue: ctx.targetValue,
    socialUsername: ctx.socialUsername,
    consumedAt: ctx.consumedAt ? ctx.consumedAt.toISOString() : null,
    createdAt: ctx.createdAt.toISOString()
  }));

  const isSuppressed = userSuppression.length > 0;
  const suppressionReason = isSuppressed ? userSuppression[0].reason : null;
  const rawTags = userMetadata[0]?.tags || '';
  const tags = rawTags.split(',').map(t => t.trim()).filter(Boolean);

  const ordersCount = mappedOrders.length;
  const completedOrders = mappedOrders.filter(o => o.fulfillmentStatus === 'completed').length;
  const latestOrder = mappedOrders[0];
  const latestEvent = timeline[0];
  const latestAutomation = automations[0];

  const customerType = ordersCount > 1 ? 'REPEAT BUYER' : ordersCount === 1 ? 'CUSTOMER' : 'LEAD';

  const derived = deriveContactStatus({
    ordersCount,
    latestOrderStatus: latestOrder?.paymentStatus,
    latestFulfillmentStatus: latestOrder?.fulfillmentStatus,
    latestLifecycleState: latestEvent?.eventType,
    suppressed: isSuppressed
  });

  const lastActivity = timeline[0]?.createdAt || latestOrder?.createdAt || new Date().toISOString();

  return {
    email: normalized,
    name: customerName,
    target: Array.from(targets)[0] || null,
    platform: Array.from(platforms)[0] || null,
    latestLifecycleState: latestEvent?.eventType || (ordersCount > 0 ? 'ORDER_CREATED' : 'LEAD_CAPTURED'),
    latestOrderStatus: latestOrder?.paymentStatus || null,
    latestFulfillmentStatus: latestOrder?.fulfillmentStatus || null,
    ordersCount,
    completedOrdersCount: completedOrders,
    lastActivity,
    emailAutomationStatus: latestAutomation?.status || null,
    suppressed: isSuppressed,
    suppressionReason,
    customerType,
    tags,
    derivedStatus: derived,
    totalSpentCents,
    orders: mappedOrders,
    lifecycleTimeline: timeline,
    emails,
    automations,
    notes,
    threads: userThreads.map((t) => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      unreadCount: t.unreadCount,
      latestMessageAt: t.latestMessageAt.toISOString(),
      createdAt: t.createdAt.toISOString(),
    })),
    checkoutContexts: relevantContexts
  };
}

/**
 * Adds an internal admin note for a contact.
 */
export async function addCrmNote(params: {
  customerEmail: string;
  adminName: string;
  text: string;
}): Promise<{ id: string; customerEmail: string; adminName: string; text: string; createdAt: string }> {
  const normalized = normalizeCrmEmail(params.customerEmail);
  const [created] = await db.insert(crmNotes).values({
    customerEmail: normalized,
    adminName: params.adminName || 'Admin',
    text: params.text.trim()
  }).returning();

  return {
    id: created.id,
    customerEmail: created.customerEmail,
    adminName: created.adminName,
    text: created.text,
    createdAt: created.createdAt.toISOString()
  };
}

/**
 * Updates tags for a contact.
 */
export async function updateCrmContactTags(customerEmail: string, tags: string[]): Promise<string[]> {
  const normalized = normalizeCrmEmail(customerEmail);
  const tagString = tags.map(t => t.trim()).filter(Boolean).join(',');

  const [existing] = await db.query.crmContactMetadata.findMany({
    where: eq(crmContactMetadata.customerEmail, normalized)
  });

  if (existing) {
    await db.update(crmContactMetadata)
      .set({ tags: tagString, updatedAt: new Date() })
      .where(eq(crmContactMetadata.customerEmail, normalized));
  } else {
    await db.insert(crmContactMetadata).values({
      customerEmail: normalized,
      tags: tagString
    });
  }

  return tags;
}
