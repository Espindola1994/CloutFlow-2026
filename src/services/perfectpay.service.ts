import crypto from 'crypto';
import { db } from '@/db';
import { orders, orderItems, orderEvents, webhookEvents, paymentLeads, offers, checkoutContexts } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { normalizePerfectPayPayload } from '@/lib/perfectpay/normalize';

export interface ProcessWebhookResult {
  success: boolean;
  action:
    | 'ORDER_CREATED'
    | 'ORDER_UPDATED'
    | 'LEAD_RECORDED'
    | 'EVENT_LOGGED'
    | 'DUPLICATE_IGNORED'
    | 'OBSERVED_AUTHENTICATED'
    | 'UNAUTHENTICATED_IGNORED';
  authenticated: boolean;
  orderId?: string;
  publicId?: string;
  leadId?: string;
  message?: string;
  mode?: 'OBSERVATION' | 'VERIFIED';
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function secureCompare(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Robust, idempotent processor for PerfectPay webhook events with dual-layer deduplication,
 * Public Token authentication validation, strict simultaneous Product+Plan offer matching,
 * and secure Observation Mode protection.
 */
export async function processPerfectPayWebhook(rawPayload: Record<string, unknown>): Promise<ProcessWebhookResult> {
  const parsed = normalizePerfectPayPayload(rawPayload);

  // --- GATE 1: AUTHENTICATION VALIDATION ---
  const configuredToken = process.env.PERFECTPAY_WEBHOOK_TOKEN;
  const isAuthenticated = Boolean(
    configuredToken &&
    parsed.rawToken &&
    secureCompare(parsed.rawToken, configuredToken)
  );

  // --- GATE 2: PROCESSING AUTHORIZATION MODE ---
  const isVerifiedProcessing = process.env.PERFECTPAY_WEBHOOK_VERIFIED === 'true';

  // Diagnostic logging of safe payload shape (Zero secrets / tokens logged)
  console.log('[PerfectPayWebhook] Received Event Shape:', {
    authenticated: isAuthenticated,
    mode: isVerifiedProcessing ? 'VERIFIED_PROCESSING' : 'OBSERVATION_MODE',
    hasExternalEventId: Boolean(parsed.externalEventId),
    hasExternalOrderId: Boolean(parsed.externalOrderId),
    hasExternalPaymentId: Boolean(parsed.externalPaymentId),
    hasProductId: Boolean(parsed.productId),
    hasPlanId: Boolean(parsed.planId),
    hasCustomerEmail: Boolean(parsed.customerEmail),
    hasCustomerName: Boolean(parsed.customerName),
    hasCustomerPhone: Boolean(parsed.customerPhone),
    hasAmountCents: Boolean(parsed.amountCents),
    currency: parsed.currency,
    hasUtmSource: Boolean(parsed.utmSource),
    hasSrcOrSck: Boolean(parsed.src || parsed.sck),
    rawStatus: parsed.rawStatus,
    normalizedStatus: parsed.normalizedStatus,
  });

  return await db.transaction(async (tx) => {
    // 1. Dual-Layer Idempotency Check
    const idempotencyConditions = [];
    if (parsed.externalEventId) {
      idempotencyConditions.push(
        and(
          eq(webhookEvents.provider, 'perfectpay'),
          eq(webhookEvents.externalEventId, parsed.externalEventId)
        )
      );
    }
    if (parsed.deduplicationKey) {
      idempotencyConditions.push(
        and(
          eq(webhookEvents.provider, 'perfectpay'),
          eq(webhookEvents.deduplicationKey, parsed.deduplicationKey)
        )
      );
    }

    if (idempotencyConditions.length > 0) {
      const [existingEvent] = await tx.query.webhookEvents.findMany({
        where: or(...idempotencyConditions),
        limit: 1,
      });

      if (existingEvent) {
        return {
          success: true,
          authenticated: isAuthenticated,
          action: 'DUPLICATE_IGNORED',
          message: `Webhook event already processed (matched ID: ${existingEvent.id}).`,
          mode: isVerifiedProcessing ? 'VERIFIED' : 'OBSERVATION',
        };
      }
    }

    // 2. Insert Webhook Event Record safely
    const initialProcessingStatus = !isAuthenticated
      ? 'UNAUTHENTICATED'
      : isVerifiedProcessing
      ? 'PROCESSED'
      : 'OBSERVED_AUTHENTICATED';

    let loggedEvent;
    try {
      const [inserted] = await tx
        .insert(webhookEvents)
        .values({
          provider: 'perfectpay',
          externalEventId: parsed.externalEventId,
          deduplicationKey: parsed.deduplicationKey,
          externalOrderId: parsed.externalOrderId,
          externalPaymentId: parsed.externalPaymentId,
          eventType: parsed.normalizedStatus,
          rawEventType: parsed.rawEventType,
          rawStatus: parsed.rawStatus,
          normalizedStatus: parsed.normalizedStatus,
          productId: parsed.productId,
          planId: parsed.planId,
          customerEmail: parsed.customerEmail,
          customerName: parsed.customerName,
          customerPhone: parsed.customerPhone,
          amountCents: parsed.amountCents,
          currency: parsed.currency || 'USD',
          paymentMethod: parsed.paymentMethod,
          utmSource: parsed.utmSource,
          utmMedium: parsed.utmMedium,
          utmCampaign: parsed.utmCampaign,
          utmContent: parsed.utmContent,
          utmTerm: parsed.utmTerm,
          src: parsed.src,
          sck: parsed.sck,
          transactionId: parsed.externalPaymentId || parsed.externalOrderId,
          payload: rawPayload,
          metadataSafe: parsed.metadataSafe,
          errorMessage: parsed.rawStatusDetail ? parsed.rawStatusDetail.slice(0, 1000) : null,
          processed: true,
          processingStatus: initialProcessingStatus,
          processedAt: new Date(),
        })
        .returning();
      loggedEvent = inserted;
    } catch (err: any) {
      // Catch DB Unique constraint violation on duplicate race condition
      if (err.code === '23505' || err.message?.includes('duplicate key')) {
        return {
          success: true,
          authenticated: isAuthenticated,
          action: 'DUPLICATE_IGNORED',
          message: 'Concurrent duplicate webhook blocked by database constraint.',
          mode: isVerifiedProcessing ? 'VERIFIED' : 'OBSERVATION',
        };
      }
      throw err;
    }

    // --- GATE 1 ENFORCEMENT: UNAUTHENTICATED EVENTS CANNOT PROCEED ---
    if (!isAuthenticated) {
      return {
        success: true,
        authenticated: false,
        action: 'UNAUTHENTICATED_IGNORED',
        message: 'Webhook token missing or invalid. Recorded as UNAUTHENTICATED with no operational effects.',
        mode: isVerifiedProcessing ? 'VERIFIED' : 'OBSERVATION',
      };
    }

    // --- GATE 2 ENFORCEMENT: OBSERVATION MODE CANNOT CREATE ORDERS OR CRM LEADS ---
    if (!isVerifiedProcessing) {
      return {
        success: true,
        authenticated: true,
        action: 'OBSERVED_AUTHENTICATED',
        message: `Authenticated webhook observed and safely logged in Observation Mode with status ${parsed.normalizedStatus}. No orders created.`,
        mode: 'OBSERVATION',
      };
    }

    // --- BELOW PIPELINE ONLY RUNS WHEN BOTH GATES PASS: AUTHENTICATED === TRUE AND VERIFIED_PROCESSING === TRUE ---

    // 3. Strict Offer Matching: Requires Active === true AND Product Code AND Plan Code simultaneously
    let matchedOffer = null;
    if (parsed.productId && parsed.planId) {
      const [foundOffer] = await tx.query.offers.findMany({
        where: and(
          eq(offers.active, true),
          eq(offers.perfectpayProductId, parsed.productId),
          eq(offers.perfectpayPlanId, parsed.planId)
        ),
        limit: 1,
      });
      matchedOffer = foundOffer || null;
    }

    // 4. Handle Pre Checkout & Non-Payment events -> Lead Pipeline (CRM)
    if (
      parsed.normalizedStatus === 'pre_checkout' ||
      parsed.normalizedStatus === 'pending' ||
      parsed.normalizedStatus === 'rejected' ||
      parsed.normalizedStatus === 'checkout_error'
    ) {
      const [lead] = await tx
        .insert(paymentLeads)
        .values({
          provider: 'perfectpay',
          externalReference: parsed.externalOrderId || parsed.externalEventId || parsed.deduplicationKey,
          productId: parsed.productId,
          planId: parsed.planId,
          customerEmail: parsed.customerEmail,
          customerName: parsed.customerName,
          customerPhone: parsed.customerPhone,
          rawStatus: parsed.rawStatus,
          normalizedStatus: parsed.normalizedStatus,
          amountCents: parsed.amountCents,
          currency: parsed.currency || 'USD',
          paymentMethod: parsed.paymentMethod,
          utmSource: parsed.utmSource,
          utmMedium: parsed.utmMedium,
          utmCampaign: parsed.utmCampaign,
          utmContent: parsed.utmContent,
          utmTerm: parsed.utmTerm,
          src: parsed.src,
          sck: parsed.sck,
        })
        .returning();

      return {
        success: true,
        authenticated: true,
        action: 'LEAD_RECORDED',
        leadId: lead.id,
        mode: 'VERIFIED',
      };
    }

    // 5. Handle Confirmed Sales -> Order Pipeline (Approved / Completed)
    if (parsed.normalizedStatus === 'approved' || parsed.normalizedStatus === 'completed') {
      let existingOrder = null;
      if (parsed.externalOrderId) {
        const [found] = await tx.query.orders.findMany({
          where: and(
            eq(orders.paymentGateway, 'perfectpay'),
            eq(orders.externalOrderId, parsed.externalOrderId)
          ),
          limit: 1,
        });
        existingOrder = found || null;
      }

      if (existingOrder) {
        // Update existing order (Approved -> Completed does NOT create a duplicate order)
        await tx
          .update(orders)
          .set({
            paymentStatus: parsed.normalizedStatus === 'completed' ? 'COMPLETED' : 'PAID',
            status: 'PROCESSING',
            perfectpayRawStatus: parsed.rawStatus,
            paidAt: existingOrder.paidAt || new Date(),
            updatedAt: new Date(),
          })
          .where(eq(orders.id, existingOrder.id));

        await tx.insert(orderEvents).values({
          orderId: existingOrder.id,
          status: 'PROCESSING',
          paymentStatus: parsed.normalizedStatus === 'completed' ? 'COMPLETED' : 'PAID',
          description: `PerfectPay status updated to ${parsed.normalizedStatus.toUpperCase()}`,
          metadata: parsed.metadataSafe,
        });

        return {
          success: true,
          authenticated: true,
          action: 'ORDER_UPDATED',
          orderId: existingOrder.id,
          publicId: existingOrder.publicId,
          mode: 'VERIFIED',
        };
      }

      // Create new Order cleanly
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const publicId = `CF-${Date.now().toString().slice(-4)}${randomSuffix}`;

      const totalCents = parsed.amountCents !== undefined ? parsed.amountCents : (matchedOffer ? Number(matchedOffer.priceCents) : 0);
      const quantity = matchedOffer ? Number(matchedOffer.quantity) : 0;
      const platform = matchedOffer?.platform || null;
      const service = matchedOffer?.service || null;

      // Resolve Social Target from Checkout Context if CFCTX_ is provided in src/checkoutReference
      let resolvedSocialUsername: string | null = null;
      let resolvedProfileUrl: string | null = null;
      let resolvedTargetUrl: string | null = null;

      const rawSrcRef = parsed.src || parsed.checkoutReference;
      if (rawSrcRef && rawSrcRef.startsWith('CFCTX_')) {
        const [foundContext] = await tx.query.checkoutContexts.findMany({
          where: eq(checkoutContexts.contextId, rawSrcRef),
          limit: 1,
        });

        if (foundContext) {
          const now = new Date();
          const isNotExpired = new Date(foundContext.expiresAt) > now;
          const isPlatformMatch = !matchedOffer || foundContext.platform === matchedOffer.platform;
          const isServiceMatch = !matchedOffer || foundContext.service === matchedOffer.service;
          const isOfferMatch = !matchedOffer || !foundContext.offerId || foundContext.offerId === matchedOffer.id;

          if (isNotExpired && isPlatformMatch && isServiceMatch && isOfferMatch) {
            resolvedSocialUsername = foundContext.socialUsername;
            resolvedProfileUrl = foundContext.profileUrl;
            resolvedTargetUrl = foundContext.targetUrl;

            // Mark context as consumed on approved order creation
            await tx
              .update(checkoutContexts)
              .set({ consumedAt: new Date() })
              .where(eq(checkoutContexts.id, foundContext.id));
          } else {
            console.log('[PerfectPay] Checkout Context validation failed / mismatch. Discarding target.');
          }
        }
      } else if (parsed.checkoutReference && !parsed.checkoutReference.startsWith('CFCTX_')) {
        resolvedSocialUsername = parsed.checkoutReference;
      }

      const [newOrder] = await tx
        .insert(orders)
        .values({
          publicId,
          externalOrderId: parsed.externalOrderId,
          externalPaymentId: parsed.externalPaymentId,
          paymentGateway: 'perfectpay',
          customerEmail: parsed.customerEmail,
          customerName: parsed.customerName,
          customerPhone: parsed.customerPhone,
          platform,
          service,
          offerId: matchedOffer?.id || null,
          socialUsername: resolvedSocialUsername,
          profileUrl: resolvedProfileUrl,
          targetUrl: resolvedTargetUrl,
          quantity,
          subtotalCents: totalCents,
          discountCents: 0,
          totalCents,
          currency: parsed.currency || 'USD',
          status: 'PROCESSING',
          paymentStatus: parsed.normalizedStatus === 'completed' ? 'COMPLETED' : 'PAID',
          perfectpayRawStatus: parsed.rawStatus,
          fulfillmentStatus: 'NOT_DISPATCHED',
          utmSource: parsed.utmSource,
          utmMedium: parsed.utmMedium,
          utmCampaign: parsed.utmCampaign,
          utmContent: parsed.utmContent,
          utmTerm: parsed.utmTerm,
          src: parsed.src,
          sck: parsed.sck,
          paidAt: new Date(),
        })
        .returning();

      // Snapshot order item: minimal, secure, and useful snapshot (no duplicate PII, tokens, or raw body)
      await tx.insert(orderItems).values({
        orderId: newOrder.id,
        serviceName: service || 'unmatched_service',
        planName: matchedOffer?.name || parsed.planName || 'Unmatched Package',
        quantity,
        unitPriceCents: totalCents,
        totalPriceCents: totalCents,
        currency: parsed.currency || 'USD',
        metadata: {
          matchedOfferId: matchedOffer?.id || null,
          matchedOfferName: matchedOffer?.name || null,
          perfectpay: {
            externalOrderId: parsed.externalOrderId || null,
            productCode: parsed.productId || null,
            productName: parsed.productName || null,
            planCode: parsed.planId || null,
            planName: parsed.planName || null,
            saleStatusEnum: parsed.rawStatus || null,
            currency: parsed.currency || 'USD',
            amountCents: totalCents,
          },
        },
      });

      // Log initial order event with explicit NOT_DISPATCHED fulfillment snapshot
      await tx.insert(orderEvents).values({
        orderId: newOrder.id,
        status: 'PROCESSING',
        paymentStatus: parsed.normalizedStatus === 'completed' ? 'COMPLETED' : 'PAID',
        fulfillmentStatus: 'NOT_DISPATCHED',
        description: matchedOffer
          ? 'Order created and payment approved via PerfectPay webhook'
          : 'Payment approved but offer unmatched. Manual review required.',
        metadata: parsed.metadataSafe,
      });

      // Fail-Safe Lead Conversion:
      // Match candidate leads strictly by customer_email + product_id + plan_id within 48 hours
      // Convert ONLY if there is exactly 1 unequivocal candidate (0 = skip, >1 = ambiguous, do not convert)
      if (parsed.customerEmail && parsed.productId && parsed.planId) {
        try {
          const windowThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
          const candidateLeads = await tx.query.paymentLeads.findMany({
            where: and(
              eq(paymentLeads.customerEmail, parsed.customerEmail),
              eq(paymentLeads.productId, parsed.productId),
              eq(paymentLeads.planId, parsed.planId),
              eq(paymentLeads.provider, 'perfectpay')
            ),
          });

          // Filter unconverted candidates within the 48-hour window
          const validCandidates = candidateLeads.filter(
            (lead) => !lead.convertedOrderId && new Date(lead.firstSeenAt) >= windowThreshold
          );

          if (validCandidates.length === 1) {
            await tx
              .update(paymentLeads)
              .set({
                convertedOrderId: newOrder.id,
                convertedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(paymentLeads.id, validCandidates[0].id));
          } else if (validCandidates.length > 1) {
            console.log('[PerfectPay] Lead conversion ambiguous: multiple unconverted leads found. Skipping auto-conversion.');
          }
        } catch (leadErr) {
          // Analytical enrichment failure MUST NEVER abort or roll back financial order creation
          console.error('[PerfectPay] Safe lead enrichment skipped:', leadErr);
        }
      }

      if (loggedEvent) {
        await tx
          .update(webhookEvents)
          .set({ 
            orderId: newOrder.id,
            processingStatus: matchedOffer ? 'PROCESSED' : 'UNMATCHED_OFFER',
          })
          .where(eq(webhookEvents.id, loggedEvent.id));
      }

      return {
        success: true,
        authenticated: true,
        action: 'ORDER_CREATED',
        orderId: newOrder.id,
        publicId: newOrder.publicId,
        mode: 'VERIFIED',
      };
    }

    // 6. Handle Refunds & Chargebacks & Cancellations (Distinct statuses preserved)
    if (
      parsed.normalizedStatus === 'refunded' ||
      parsed.normalizedStatus === 'chargeback' ||
      parsed.normalizedStatus === 'charged_back' ||
      parsed.normalizedStatus === 'cancelled'
    ) {
      if (parsed.externalOrderId) {
        const [existingOrder] = await tx.query.orders.findMany({
          where: and(
            eq(orders.paymentGateway, 'perfectpay'),
            eq(orders.externalOrderId, parsed.externalOrderId)
          ),
          limit: 1,
        });

        if (existingOrder) {
          const newPaymentStatus = 
            parsed.normalizedStatus === 'refunded' ? 'REFUNDED' :
            (parsed.normalizedStatus === 'chargeback' || parsed.normalizedStatus === 'charged_back') ? 'CHARGEBACK' : 'CANCELLED';

          const currentFulfillmentSnapshot = existingOrder.fulfillmentStatus || 'NOT_DISPATCHED';

          await tx
            .update(orders)
            .set({
              paymentStatus: newPaymentStatus,
              status: 'CANCELLED',
              perfectpayRawStatus: parsed.rawStatus,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, existingOrder.id));

          await tx.insert(orderEvents).values({
            orderId: existingOrder.id,
            status: 'CANCELLED',
            paymentStatus: newPaymentStatus,
            fulfillmentStatus: currentFulfillmentSnapshot,
            description: `Payment status updated to ${newPaymentStatus} via PerfectPay webhook`,
            metadata: parsed.metadataSafe,
          });

          return {
            success: true,
            authenticated: true,
            action: 'ORDER_UPDATED',
            orderId: existingOrder.id,
            publicId: existingOrder.publicId,
            mode: 'VERIFIED',
          };
        }
      }
    }

    return {
      success: true,
      authenticated: true,
      action: 'EVENT_LOGGED',
      message: `Webhook event logged with status ${parsed.normalizedStatus}`,
      mode: 'VERIFIED',
    };
  });
}
