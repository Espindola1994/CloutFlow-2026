import { NextResponse } from 'next/server';
import { db } from '@/db';
import { offers, checkoutContexts, paymentLeads, customers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { z } from 'zod';
import { emitLifecycleEvent } from '@/services/lifecycle/event.service';

const ALLOWED_TARGET_HOSTS: Record<string, string[]> = {
  instagram: ['instagram.com', 'www.instagram.com'],
  tiktok: ['tiktok.com', 'www.tiktok.com', 'm.tiktok.com', 'vm.tiktok.com'],
  youtube: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'],
  twitter: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'],
};

const checkoutContextCreateSchema = z.object({
  offerId: z.string().min(1, 'Offer ID is required'),
  targetType: z.enum(['profile', 'post', 'video', 'channel']),
  targetValue: z.string().optional().nullable(),
  targetUrl: z.string().url().optional().nullable(),
  socialUsername: z.string().optional().nullable(),
  profileUrl: z.string().url().optional().nullable(),
  email: z.string().email().optional().nullable(),
  utmSource: z.string().optional().nullable(),
  utmMedium: z.string().optional().nullable(),
  utmCampaign: z.string().optional().nullable(),
  utmContent: z.string().optional().nullable(),
  utmTerm: z.string().optional().nullable(),
  offerCode: z.string().optional().nullable(),
});

function validateSocialUrl(urlStr: string, platform: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    const allowed = ALLOWED_TARGET_HOSTS[platform] || [];
    return allowed.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = checkoutContextCreateSchema.parse(body);

    // 1. Fetch & Validate Active Offer Server-Side
    const foundOffers = await db.query.offers.findMany({
      where: and(eq(offers.id, data.offerId), eq(offers.active, true)),
    });
    const offer = foundOffers.find((o) => o.id === data.offerId && o.active);

    if (!offer) {
      return NextResponse.json(
        { success: false, error: { message: 'Offer not found or no longer active' } },
        { status: 404 }
      );
    }

    if (!offer.externalCheckoutUrl || !offer.perfectpayProductId || !offer.perfectpayPlanId) {
      return NextResponse.json(
        { success: false, error: { message: 'Offer checkout configuration is incomplete' } },
        { status: 422 }
      );
    }

    const platform = offer.platform.toLowerCase();
    const service = offer.service.toLowerCase();

    // 2. Validate Target Type & Requirements against Service
    if (service === 'followers') {
      if (platform === 'youtube') {
        if (data.targetType !== 'channel' && data.targetType !== 'profile') {
          return NextResponse.json(
            { success: false, error: { message: 'YouTube followers requires a valid channel or handle target' } },
            { status: 400 }
          );
        }
      } else {
        if (data.targetType !== 'profile') {
          return NextResponse.json(
            { success: false, error: { message: 'Followers service requires a profile target' } },
            { status: 400 }
          );
        }
        if (!data.socialUsername || data.socialUsername.trim().length === 0) {
          return NextResponse.json(
            { success: false, error: { message: 'Social username is required for followers service' } },
            { status: 400 }
          );
        }
      }
    } else if (service === 'likes' || service === 'views' || service === 'comments') {
      if (!data.targetUrl) {
        return NextResponse.json(
          { success: false, error: { message: `Content target URL is required for ${service}` } },
          { status: 400 }
        );
      }
      if (!validateSocialUrl(data.targetUrl, platform)) {
        return NextResponse.json(
          { success: false, error: { message: `Invalid target URL for ${platform}` } },
          { status: 400 }
        );
      }
    }

    // Optional profileUrl SSRF / Host validation
    if (data.profileUrl && !validateSocialUrl(data.profileUrl, platform)) {
      return NextResponse.json(
        { success: false, error: { message: `Invalid profile URL for ${platform}` } },
        { status: 400 }
      );
    }

    // 3. Generate Opaque, Cryptographically Secure Context ID
    const contextId = `CFCTX_${crypto.randomBytes(12).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours TTL

    const cleanUsername = data.socialUsername
      ? data.socialUsername.replace(/^@+/, '').trim()
      : null;
    const normalizedEmail = data.email ? data.email.trim().toLowerCase() : null;

    // Phase F: Evaluate offer code
    let appliedOfferCode: string | null = null;
    if (data.offerCode) {
      try {
        const { customerOffers } = await import('@/db/schema');
        const { gt, and, ne } = await import('drizzle-orm');
        const [customerOffer] = await db.query.customerOffers.findMany({
          where: and(
            eq(customerOffers.code, data.offerCode),
            gt(customerOffers.expiresAt, new Date()),
            ne(customerOffers.status, 'REDEEMED'),
            ne(customerOffers.status, 'EXPIRED'),
            ne(customerOffers.status, 'CANCELED')
          ),
          limit: 1
        });
        if (customerOffer) {
          appliedOfferCode = customerOffer.code;
        }
      } catch (err) {
        console.warn('[CheckoutContextAPI] customerOffers lookup warning:', err instanceof Error ? err.message : String(err));
      }
    }

    // 4. Persist Context in Database
    // Fail-Safe: If database column 'customer_email' is missing or insert throws schema/db errors,
    // we attempt with customerEmail first, and fallback safely without customerEmail to guarantee checkout continuity.
    try {
      await db.insert(checkoutContexts).values({
        contextId,
        platform,
        service,
        targetType: data.targetType,
        targetValue: data.targetValue ? data.targetValue.trim() : cleanUsername,
        targetUrl: data.targetUrl ? data.targetUrl.trim() : null,
        socialUsername: cleanUsername,
        profileUrl: data.profileUrl ? data.profileUrl.trim() : null,
        customerEmail: normalizedEmail,
        offerId: offer.id,
        appliedOfferCode,
        perfectpayProductId: offer.perfectpayProductId,
        perfectpayPlanId: offer.perfectpayPlanId,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        utmContent: data.utmContent || null,
        utmTerm: data.utmTerm || null,
        expiresAt,
      });
    } catch (dbInsertError: unknown) {
      const msg = dbInsertError instanceof Error ? dbInsertError.message : String(dbInsertError);
      console.warn(
        JSON.stringify({
          level: 'warn',
          event: 'CHECKOUT_CONTEXT_SCHEMA_FALLBACK',
          message: 'Primary insert with customerEmail failed, attempting fallback insert without customerEmail',
          contextId,
          error: msg,
        })
      );
      // Fallback insert without customerEmail in case of DB schema mismatch
      await db.insert(checkoutContexts).values({
        contextId,
        platform,
        service,
        targetType: data.targetType,
        targetValue: data.targetValue ? data.targetValue.trim() : cleanUsername,
        targetUrl: data.targetUrl ? data.targetUrl.trim() : null,
        socialUsername: cleanUsername,
        profileUrl: data.profileUrl ? data.profileUrl.trim() : null,
        offerId: offer.id,
        appliedOfferCode,
        perfectpayProductId: offer.perfectpayProductId,
        perfectpayPlanId: offer.perfectpayPlanId,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        utmContent: data.utmContent || null,
        utmTerm: data.utmTerm || null,
        expiresAt,
      });
    }

    // 5. Early CRM Lead Capture & Lifecycle Events (Persist BEFORE user leaves for checkout)
    // Non-critical side-effects MUST NEVER abort or break checkout
    if (normalizedEmail) {
      try {
        // Upsert customer / lead identity
        const [existingCustomer] = await db.query.customers.findMany({
          where: eq(customers.email, normalizedEmail),
          limit: 1,
        }).catch((err) => {
          console.warn('[CheckoutContextAPI] Customer lookup warning:', err?.message);
          return [];
        });

        if (!existingCustomer) {
          await db.insert(customers).values({
            email: normalizedEmail,
            name: cleanUsername || null,
            totalOrders: 0,
            totalSpentCents: 0,
          }).onConflictDoUpdate({
            target: customers.email,
            set: {
              name: cleanUsername || null,
            }
          }).catch(async () => {
            // Fallback insert without onConflictDoUpdate in case unique constraint is absent
            await db.insert(customers).values({
              email: normalizedEmail,
              name: cleanUsername || null,
              totalOrders: 0,
              totalSpentCents: 0,
            }).catch((err) => console.warn('[CheckoutContextAPI] Customer fallback insert warning:', err?.message));
          });
        }

        // Persist payment lead record for CRM & abandonment tracking
        let insertedLeadId: string | undefined = undefined;
        try {
          const [insertedLead] = await db.insert(paymentLeads).values({
            provider: 'perfectpay',
            externalReference: contextId,
            productId: offer.perfectpayProductId,
            planId: offer.perfectpayPlanId,
            customerEmail: normalizedEmail,
            customerName: cleanUsername || null,
            rawStatus: 'checkout_started',
            normalizedStatus: 'pre_checkout',
            inferredStatus: 'checkout_started',
            amountCents: offer.priceCents,
            currency: 'USD',
            utmSource: data.utmSource || null,
            utmMedium: data.utmMedium || null,
            utmCampaign: data.utmCampaign || null,
            utmContent: data.utmContent || null,
            utmTerm: data.utmTerm || null,
            src: contextId,
          }).returning({ id: paymentLeads.id });
          insertedLeadId = insertedLead?.id;
        } catch (leadInsertErr: unknown) {
          const msg = leadInsertErr instanceof Error ? leadInsertErr.message : String(leadInsertErr);
          console.warn('[CheckoutContextAPI] Payment lead insert warning:', msg);
        }

        // Emit Canonical Lifecycle Events
        await emitLifecycleEvent({
          customerEmail: normalizedEmail,
          eventType: 'LEAD_CAPTURED',
          idempotencyKey: `LEAD_CAPTURED:${contextId}:${normalizedEmail}`,
          payload: {
            contextId,
            leadId: insertedLeadId,
            platform,
            service,
            targetHandle: cleanUsername,
            offerId: offer.id,
          },
        }).catch((err) => console.warn('[CheckoutContextAPI] LEAD_CAPTURED warning:', err?.message));

        await emitLifecycleEvent({
          customerEmail: normalizedEmail,
          eventType: 'CHECKOUT_STARTED',
          idempotencyKey: `CHECKOUT_STARTED:${contextId}:${normalizedEmail}`,
          payload: {
            contextId,
            leadId: insertedLeadId,
            platform,
            service,
            targetHandle: cleanUsername,
            offerId: offer.id,
            priceCents: offer.priceCents,
          },
        }).catch((err) => console.warn('[CheckoutContextAPI] CHECKOUT_STARTED warning:', err?.message));
      } catch (leadError) {
        console.error('[CheckoutContextAPI] Failed to record lead/lifecycle event:', leadError);
      }
    }

    // 6. Construct Checkout URL preserving all existing query params & appending src=CFCTX_...
    const checkoutUrlObj = new URL(offer.externalCheckoutUrl);
    checkoutUrlObj.searchParams.set('src', contextId);

    if (appliedOfferCode) {
      // Pass coupon code directly to PerfectPay
      checkoutUrlObj.searchParams.set('cupom', appliedOfferCode);
    }

    return NextResponse.json({
      success: true,
      data: {
        contextId,
        checkoutUrl: checkoutUrlObj.toString(),
      },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid checkout context input', details: error.issues } },
        { status: 400 }
      );
    }
    let errObj: Record<string, unknown> = {};
    if (error instanceof Error) {
      errObj = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
      // Recursively copy properties including non-enumerable or nested cause/driver error
      const anyErr = error as any;
      if (anyErr.cause) {
        errObj.cause = {
          name: anyErr.cause.name,
          message: anyErr.cause.message,
          code: anyErr.cause.code,
          detail: anyErr.cause.detail,
          hint: anyErr.cause.hint,
          position: anyErr.cause.position,
          internalPosition: anyErr.cause.internalPosition,
          internalQuery: anyErr.cause.internalQuery,
          where: anyErr.cause.where,
          schema: anyErr.cause.schema,
          table: anyErr.cause.table,
          column: anyErr.cause.column,
          dataType: anyErr.cause.dataType,
          constraint: anyErr.cause.constraint,
          file: anyErr.cause.file,
          line: anyErr.cause.line,
          routine: anyErr.cause.routine,
        };
      }
      for (const k of Object.getOwnPropertyNames(error)) {
        if (!['stack', 'name', 'message'].includes(k)) {
          errObj[k] = (error as any)[k];
        }
      }
    } else {
      errObj = { message: String(error) };
    }

    console.error('[CheckoutContextAPI] Error:', JSON.stringify(errObj));
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Unable to prepare checkout. Please try again.',
          diagnostic: errObj
        } 
      },
      { status: 500 }
    );
  }
}
