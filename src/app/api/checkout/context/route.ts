import { NextResponse } from 'next/server';
import { db } from '@/db';
import { offers, paymentLeads, customers, checkoutContexts } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';
import { z } from 'zod';
import { emitLifecycleEvent } from '@/services/lifecycle/event.service';
import { getEffectiveOfferStatus } from '@/services/offers/offer-status';
import { 
  isValidPlatformService, 
  validateCheckoutUrl,
  CommercialPlatform, 
  CommercialService,
  CommercialPlan,
  normalizePlatform,
  normalizeService,
  normalizePlan,
  resolveCommercialOffer,
  getCanonicalPerfectPayItem,
  buildCanonicalOfferId
} from '@/services/commercial-offer.resolver';

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
    // We enforce the strict separation:
    // canonicalOfferId: canonical-{platform}-{service}-{plan} (mandatory official commercial identity)
    // physicalOfferId: UUID from offers table (only if physical override exists, otherwise NULL)
    let canonicalPlat: CommercialPlatform | null = null;
    let canonicalServ: CommercialService | null = null;
    let canonicalPl: CommercialPlan | null = null;
    let physicalOfferId: string | null = null;
    let offer: any = null;

    if (data.offerId.startsWith('canonical-') || data.offerId.startsWith('step3-')) {
      // Resolve canonical/synthetic ID format: canonical-{platform}-{service}-{plan}
      const parts = data.offerId.split('-');
      if (parts.length >= 4) {
        canonicalPlat = normalizePlatform(parts[1]);
        canonicalServ = normalizeService(parts[2]);
        canonicalPl = normalizePlan(parts[3]);
      }
    } else {
      // Input might be a physical UUID or custom offerId from offers table
      try {
        const foundOffers = await db.query.offers.findMany({
          where: and(eq(offers.id, data.offerId), eq(offers.active, true)),
        });
        const found = (foundOffers || []).find((o) => o.id === data.offerId && o.active);
        if (found) {
          canonicalPlat = normalizePlatform(found.platform);
          canonicalServ = normalizeService(found.service);
          canonicalPl = normalizePlan(found.name || found.slug || 'starter');
          physicalOfferId = found.id;
          offer = found;
        }
      } catch {
        // Safe fallback if query fails
      }
    }

    if (canonicalPlat && canonicalServ && !isValidPlatformService(canonicalPlat, canonicalServ)) {
      return NextResponse.json(
        { success: false, error: { message: `Service '${canonicalServ}' is not available for platform '${canonicalPlat}'` } },
        { status: 400 }
      );
    }

    if (!canonicalPlat || !canonicalServ || !canonicalPl) {
      return NextResponse.json(
        { success: false, error: { message: 'Offer not found or no longer active' } },
        { status: 404 }
      );
    }

    const canonicalOfferId = buildCanonicalOfferId(canonicalPlat, canonicalServ, canonicalPl);
    const canonicalPP = getCanonicalPerfectPayItem(canonicalPlat, canonicalServ, canonicalPl);

    // Check if there is a physical override in the database for this exact canonical identity
    let physicalOverride: any = offer;
    if (!physicalOverride) {
      try {
        const matchingOverrides = await db.query.offers.findMany({
          where: and(
            eq(sql`LOWER(${offers.platform})`, canonicalPlat),
            eq(sql`LOWER(${offers.service})`, canonicalServ),
            eq(offers.active, true)
          ),
        });
        physicalOverride = (matchingOverrides || []).find(
          (o) =>
            normalizePlatform(o.platform) === canonicalPlat &&
            normalizeService(o.service) === canonicalServ &&
            normalizePlan(o.name || o.slug) === canonicalPl &&
            o.active
        );
      } catch {
        // Safe fallback if query fails
      }
    }

    if (physicalOverride) {
      physicalOfferId = physicalOverride.id;
      offer = {
        id: physicalOverride.id,
        platform: canonicalPlat,
        service: canonicalServ,
        name: physicalOverride.name,
        slug: physicalOverride.slug,
        quantity: physicalOverride.quantity,
        bonusQuantity: physicalOverride.bonusQuantity,
        priceCents: physicalOverride.priceCents ? Number(physicalOverride.priceCents) : null,
        perfectpayProductId: physicalOverride.perfectpayProductId || canonicalPP?.productCode,
        perfectpayPlanId: physicalOverride.perfectpayPlanId || canonicalPP?.planCode,
        externalCheckoutUrl: physicalOverride.externalCheckoutUrl || canonicalPP?.checkoutUrl,
        active: true,
      };
    } else {
      // Pure canonical offer without physical override: physicalOfferId is NULL
      physicalOfferId = null;
      if (!canonicalPP) {
        return NextResponse.json(
          { success: false, error: { message: 'Official checkout configuration not found for canonical offer' } },
          { status: 404 }
        );
      }
      const resolved = resolveCommercialOffer(canonicalPlat, canonicalServ, canonicalPl, [], 'home');
      if (!resolved) {
        return NextResponse.json(
          { success: false, error: { message: 'Canonical offer could not be resolved' } },
          { status: 404 }
        );
      }
      offer = {
        id: null,
        platform: canonicalPlat,
        service: canonicalServ,
        name: resolved.planDisplayName,
        slug: `${canonicalPlat}-${canonicalServ}-${canonicalPl}`,
        quantity: resolved.quantity,
        bonusQuantity: resolved.bonusQuantity,
        priceCents: resolved.priceCents,
        perfectpayProductId: canonicalPP.productCode,
        perfectpayPlanId: canonicalPP.planCode,
        externalCheckoutUrl: canonicalPP.checkoutUrl,
        active: true,
      };
    }

    // Server-side validation of Product Code and Plan Code against official dataset
    if (canonicalPP && (offer.perfectpayProductId !== canonicalPP.productCode || offer.perfectpayPlanId !== canonicalPP.planCode)) {
      // In case physical override explicitly customized product/plan, verify it exists or fallback
      if (!physicalOverride) {
        return NextResponse.json(
          { success: false, error: { message: 'Checkout product/plan mismatch with canonical identity' } },
          { status: 422 }
        );
      }
    }

    if (!offer) {
      return NextResponse.json(
        { success: false, error: { message: 'Offer not found or no longer active' } },
        { status: 404 }
      );
    }

    const isUrlSecure = validateCheckoutUrl(offer.externalCheckoutUrl);
    if (!offer.externalCheckoutUrl || !isUrlSecure || !offer.perfectpayProductId || !offer.perfectpayPlanId) {
      return NextResponse.json(
        { success: false, error: { message: 'Offer checkout configuration is incomplete' } },
        { status: 422 }
      );
    }

    const platform = offer.platform.toLowerCase();
    const service = offer.service.toLowerCase();

    if (!isValidPlatformService(platform as CommercialPlatform, service as CommercialService)) {
      return NextResponse.json(
        { success: false, error: { message: `Service '${service}' is not available for platform '${platform}'` } },
        { status: 400 }
      );
    }

    // 2. Validate Target Type & Requirements against Service
    if (service === 'followers') {
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
    let normalizedEmail = data.email ? data.email.trim().toLowerCase() : null;

    // Phase F: Evaluate offer code
    let appliedOfferCode: string | null = null;
    if (data.offerCode) {
      try {
        const { customerOffers } = await import('@/db/schema');
        const [customerOffer] = await db.query.customerOffers.findMany({
          where: eq(customerOffers.code, data.offerCode),
          limit: 1
        });
        if (customerOffer && getEffectiveOfferStatus(customerOffer) === 'ACTIVE') {
          appliedOfferCode = customerOffer.code;
          if (!normalizedEmail && customerOffer.customerEmail) {
            normalizedEmail = customerOffer.customerEmail;
          }
        }
      } catch (err) {
        console.warn('[CheckoutContextAPI] customerOffers lookup warning:', err instanceof Error ? err.message : String(err));
      }
    }

    // 4. Persist Context in Database (STRICT COMMIT: Checkout URL is ONLY returned after DB commit)
    // canonical_offer_id is mandatory for the official commercial identity.
    // offer_id is physical UUID if override exists, or NULL if no override exists.
    // NO silent catch -> warning -> HTTP 200. Failures MUST yield HTTP 500/503 without checkoutUrl.
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
        canonicalOfferId,
        offerId: physicalOfferId,
        appliedOfferCode: appliedOfferCode || null,
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
      console.error('[CheckoutContextAPI] Critical: Failed to persist checkout context:', msg);
      return NextResponse.json(
        { success: false, error: { message: 'Database failure while securing checkout context. Checkout aborted.' } },
        { status: 503 }
      );
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
            canonicalOfferId,
            offerId: physicalOfferId,
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
            canonicalOfferId,
            offerId: physicalOfferId,
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
    console.error('[CheckoutContextAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Unable to prepare checkout. Please try again.' } },
      { status: 500 }
    );
  }
}
