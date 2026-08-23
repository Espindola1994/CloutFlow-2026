import { db } from '@/db';
import { customerOffers, lifecycleAutomations, lifecycleEvents, orders } from '@/db/schema';
import { eq, and, gt, inArray } from 'drizzle-orm';
import crypto from 'crypto';

function normalizeCanonicalEmail(email: string): string | null {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  // Basic validation
  if (trimmed.length < 5 || trimmed.length > 254 || !trimmed.includes('@')) return null;
  return trimmed;
}

export const POST_PURCHASE_OFFER_CAMPAIGN = 'POST_PURCHASE_25_OFF';
export const POST_PURCHASE_DISCOUNT_PERCENT = 25;
export const POST_PURCHASE_OFFER_DEFAULT_VALID_HOURS = 48;
export const POST_PURCHASE_SCHEDULE_DELAY_MINUTES = 15;

/**
 * Gets the configured validity window for the post-purchase offer in hours.
 */
export function getPostPurchaseOfferValidHours(): number {
  const envHours = process.env.POST_PURCHASE_OFFER_VALID_HOURS;
  if (envHours && !isNaN(Number(envHours))) {
    return Number(envHours);
  }
  return POST_PURCHASE_OFFER_DEFAULT_VALID_HOURS;
}

/**
 * Gets the configured rollout boundary timestamp.
 * Only orders/events created at or after this timestamp are eligible.
 */
export function getPostPurchaseLiveFrom(): Date | null {
  const liveFromStr = process.env.POST_PURCHASE_25_OFF_LIVE_FROM;
  if (!liveFromStr) return null;
  const parsed = new Date(liveFromStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Generates a unique, non-sequential offer coupon code.
 * Example: CF25-9B2F81A4
 */
export function generateOfferCode(): string {
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CF25-${randomPart}`;
}

interface HandlePostPurchaseOfferParams {
  customerEmail: string;
  sourceOrderId: string;
  lifecycleEventId?: string;
  sourceJourneyId?: string;
  orderCreatedAt?: Date;
}

/**
 * Evaluates eligibility and creates a 25% post-purchase offer + schedules the lifecycle automation.
 * Safe & idempotent: checks for existing offer for this order and existing active offers for the customer.
 */
export async function schedulePostPurchaseOffer(params: HandlePostPurchaseOfferParams) {
  const normalizedEmail = normalizeCanonicalEmail(params.customerEmail);
  if (!normalizedEmail) return { success: false, reason: 'INVALID_EMAIL' };

  // 1. Check controlled rollout boundary
  const liveFrom = getPostPurchaseLiveFrom();
  const eventTime = params.orderCreatedAt || new Date();
  if (liveFrom && eventTime.getTime() < liveFrom.getTime()) {
    return { success: false, reason: 'BEFORE_LIVE_FROM_BOUNDARY' };
  }

  // 2. Check if an offer already exists for this sourceOrderId (Duplicate webhook protection)
  const existingForOrder = await db.query.customerOffers.findFirst({
    where: and(
      eq(customerOffers.customerEmail, normalizedEmail),
      eq(customerOffers.sourceOrderId, params.sourceOrderId),
      eq(customerOffers.campaignType, POST_PURCHASE_OFFER_CAMPAIGN)
    )
  });

  if (existingForOrder) {
    return { success: true, offerId: existingForOrder.id, duplicate: true };
  }

  // 3. Check if customer already has an ACTIVE (unexpired, unredeemed) offer
  const now = new Date();
  const activeOffers = await db.query.customerOffers.findMany({
    where: and(
      eq(customerOffers.customerEmail, normalizedEmail),
      eq(customerOffers.campaignType, POST_PURCHASE_OFFER_CAMPAIGN),
      inArray(customerOffers.status, ['CREATED', 'SCHEDULED', 'SENT']),
      gt(customerOffers.expiresAt, now)
    )
  });

  if (activeOffers.length > 0) {
    return { success: false, reason: 'ACTIVE_OFFER_ALREADY_EXISTS' };
  }

  // 4. Create the offer
  const validHours = getPostPurchaseOfferValidHours();
  const validFrom = now;
  const expiresAt = new Date(now.getTime() + validHours * 60 * 60 * 1000);
  const code = generateOfferCode();

  const [newOffer] = await db.insert(customerOffers).values({
    customerEmail: normalizedEmail,
    sourceOrderId: params.sourceOrderId,
    sourceJourneyId: params.sourceJourneyId || null,
    campaignType: POST_PURCHASE_OFFER_CAMPAIGN,
    discountType: 'PERCENTAGE',
    discountValue: POST_PURCHASE_DISCOUNT_PERCENT,
    status: 'SCHEDULED',
    code,
    validFrom,
    expiresAt,
    metadata: {
      validHours,
      sourceOrderId: params.sourceOrderId,
    }
  }).returning();

  // 5. Schedule the lifecycle automation step (10-15 minutes after purchase)
  const scheduledFor = new Date(now.getTime() + POST_PURCHASE_SCHEDULE_DELAY_MINUTES * 60 * 1000);
  
  // Find or use lifecycleEventId
  let eventId = params.lifecycleEventId;
  if (!eventId) {
    const event = await db.query.lifecycleEvents.findFirst({
      where: and(
        eq(lifecycleEvents.customerEmail, normalizedEmail),
        eq(lifecycleEvents.eventType, 'PAYMENT_APPROVED')
      )
    });
    eventId = event?.id;
  }

  if (eventId) {
    // Check if automation already scheduled for this event
    const existingAuto = await db.query.lifecycleAutomations.findFirst({
      where: and(
        eq(lifecycleAutomations.customerEmail, normalizedEmail),
        eq(lifecycleAutomations.automationId, POST_PURCHASE_OFFER_CAMPAIGN),
        eq(lifecycleAutomations.lifecycleEventId, eventId)
      )
    });

    if (!existingAuto) {
      await db.insert(lifecycleAutomations).values({
        lifecycleEventId: eventId,
        customerEmail: normalizedEmail,
        automationId: POST_PURCHASE_OFFER_CAMPAIGN,
        actionType: 'EMAIL_PROMO',
        scheduledFor,
        status: 'PENDING',
        contextData: {
          offerId: newOffer.id,
          offerCode: code,
          discountPercent: POST_PURCHASE_DISCOUNT_PERCENT,
          expiresAt: expiresAt.toISOString(),
          sourceOrderId: params.sourceOrderId,
        }
      });
    }
  }

  return { success: true, offer: newOffer };
}
