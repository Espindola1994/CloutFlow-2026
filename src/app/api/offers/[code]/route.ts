/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { customerOffers, offers, orders } from '@/db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import { getEffectiveOfferStatus, formatOfferDateTime } from '@/services/offers/offer-status';
import { PERFECTPAY_POST_PURCHASE_COUPON } from '@/lib/coupons';
import { maskEmail } from '@/lib/email/mask';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> | { code: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const code = resolvedParams?.code?.trim();

    if (!code) {
      return NextResponse.json(
        { success: false, error: { message: 'Offer not found or no longer available.' } },
        { status: 404 }
      );
    }

    // 1. Fetch Customer Offer Server-Side
    const [customerOffer] = await db.query.customerOffers.findMany({
      where: eq(customerOffers.code, code),
      limit: 1,
    }).catch((err) => {
      console.error('[PublicOfferAPI] customerOffers query error:', err);
      return [];
    });

    if (!customerOffer) {
      return NextResponse.json(
        { success: false, error: { message: 'This offer is no longer available.' } },
        { status: 404 }
      );
    }

    // 2. Validate Campaign Type (POST_PURCHASE_25_OFF or ADMIN_TEST representations)
    const isPostPurchase = customerOffer.campaignType === 'POST_PURCHASE_25_OFF';
    if (!isPostPurchase) {
      return NextResponse.json(
        { success: false, error: { message: 'This offer is no longer available.' } },
        { status: 404 }
      );
    }

    // 3. Derive Authoritative Canonical Effective Status
    const now = new Date();
    const effectiveStatus = getEffectiveOfferStatus(customerOffer, now);

    if (effectiveStatus !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'This offer is no longer available.',
            reason: effectiveStatus === 'EXPIRED' ? 'EXPIRED' : (effectiveStatus === 'REDEEMED' ? 'REDEEMED' : 'UNAVAILABLE'),
          },
        },
        { status: 410 }
      );
    }

    // 4. Fetch Active Growth Offers for Package Selection & Previous Identity
    let previousTarget: {
      platform: string;
      username: string;
      targetType?: string;
      profileUrl?: string | null;
      avatarUrl?: string | null;
      maskedEmail?: string | null;
      previousPackageName?: string | null;
    } | null = null;

    try {
      const customerEmail = customerOffer.customerEmail;
      const maskedEmail = customerEmail ? maskEmail(customerEmail) : null;

      if (customerOffer.metadata && typeof customerOffer.metadata === 'object') {
        const m = customerOffer.metadata as Record<string, any>;
        if (m.platform && (m.targetHandle || m.socialUsername || m.username)) {
          previousTarget = {
            platform: String(m.platform).toLowerCase(),
            username: String(m.targetHandle || m.socialUsername || m.username).replace(/^@+/, ''),
            targetType: m.targetType || 'profile',
            profileUrl: m.profileUrl || null,
            avatarUrl: m.avatarUrl || m.profilePicUrl || m.profileImageUrl || m.avatar || m.avatar_url || m.profile_pic_url || m.profile_image_url || m.picture || null,
            maskedEmail: m.maskedEmail || maskedEmail,
            previousPackageName: m.previousPackageName || m.packageName || null,
          };
        }
      }

      if (!previousTarget && customerOffer.sourceOrderId && customerOffer.sourceOrderId !== 'ADMIN_TEST') {
        const [sourceOrder] = await db.query.orders.findMany({
          where: eq(orders.id, customerOffer.sourceOrderId),
          limit: 1,
        }).catch(() => []);
        if (sourceOrder && sourceOrder.platform && (sourceOrder.socialUsername || sourceOrder.username)) {
          previousTarget = {
            platform: String(sourceOrder.platform).toLowerCase(),
            username: String(sourceOrder.socialUsername || sourceOrder.username).replace(/^@+/, ''),
            targetType: 'profile',
            profileUrl: sourceOrder.profileUrl || null,
            avatarUrl: null,
            maskedEmail,
            previousPackageName: sourceOrder.service ? `${sourceOrder.quantity.toLocaleString()} ${sourceOrder.service}` : null,
          };
        }
      }

      if (!previousTarget && customerEmail) {
        const [lastOrder] = await db.query.orders.findMany({
          where: eq(orders.customerEmail, customerEmail),
          orderBy: [desc(orders.createdAt)],
          limit: 1,
        }).catch(() => []);
        if (lastOrder && lastOrder.platform && (lastOrder.socialUsername || lastOrder.username)) {
          previousTarget = {
            platform: String(lastOrder.platform).toLowerCase(),
            username: String(lastOrder.socialUsername || lastOrder.username).replace(/^@+/, ''),
            targetType: 'profile',
            profileUrl: lastOrder.profileUrl || null,
            avatarUrl: null,
            maskedEmail,
            previousPackageName: lastOrder.service ? `${lastOrder.quantity.toLocaleString()} ${lastOrder.service}` : null,
          };
        }
      }

      // If we have a previousTarget but no maskedEmail attached, attach it
      if (previousTarget && !previousTarget.maskedEmail && maskedEmail) {
        previousTarget.maskedEmail = maskedEmail;
      }
    } catch (targetErr) {
      console.warn('[PublicOfferAPI] previousTarget evaluation warning:', targetErr);
    }

    const activePackages = await db.query.offers.findMany({
      where: eq(offers.active, true),
      orderBy: [asc(offers.sortOrder), asc(offers.priceCents)],
      limit: 24,
    }).catch((err) => {
      console.error('[PublicOfferAPI] offers query error:', err);
      return [];
    });

    // Sanitize packages: strip sensitive backend fields, keep only public display & selection data
    const sanitizedPackages = activePackages.map((p) => {
      const meta = (p.metadata as Record<string, any>) || {};
      return {
        id: p.id,
        platform: p.platform,
        service: p.service,
        name: p.name,
        slug: p.slug,
        quantity: p.quantity,
        bonusQuantity: p.bonusQuantity || 0,
        priceCents: Number(p.priceCents),
        currency: p.currency || 'USD',
        badge: p.badge || meta.badge || null,
        isPopular: p.isPopular || Boolean(meta.isPopular || meta.featured),
      };
    });

    // 5. Build Safe Public Response (NO PII, NO DB IDs, NO INTERNAL KEYS)
    const expiresAt = customerOffer.expiresAt ? new Date(customerOffer.expiresAt).toISOString() : null;
    const formattedExpiresAt = customerOffer.expiresAt ? formatOfferDateTime(customerOffer.expiresAt, { style: 'email' }) : null;

    return NextResponse.json({
      success: true,
      data: {
        code: customerOffer.code,
        discountPercent: customerOffer.discountValue || 25,
        couponCode: PERFECTPAY_POST_PURCHASE_COUPON,
        status: effectiveStatus,
        expiresAt,
        formattedExpiresAt,
        previousTarget,
        packages: sanitizedPackages,
      },
    });
  } catch (error: unknown) {
    console.error('[PublicOfferAPI] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'This offer is no longer available.' } },
      { status: 500 }
    );
  }
}
