import { NextResponse } from 'next/server';
import { db } from '@/db';
import { customerOffers, customers } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { generateOfferCode, POST_PURCHASE_OFFER_CAMPAIGN, POST_PURCHASE_DISCOUNT_PERCENT } from '@/services/lifecycle/post-purchase.service';
import { getMarketingEmailTransport } from '@/integrations/email/transport';

import { getPostPurchaseOfferTemplate } from '@/services/lifecycle/templates.service';

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const testOffers = await db.query.customerOffers.findMany({
      where: and(
        eq(customerOffers.campaignType, POST_PURCHASE_OFFER_CAMPAIGN),
        eq(customerOffers.sourceOrderId, 'ADMIN_TEST')
      ),
      orderBy: [desc(customerOffers.createdAt)]
    });

    return NextResponse.json({ success: true, data: { items: testOffers } });
  } catch (error) {
    console.error('[AdminTestOffers] Failed to list test offers:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (!authResult) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const { customerEmail, validHours = 48, sendEmail = false } = body;

    if (!customerEmail) {
      return NextResponse.json({ success: false, error: { message: 'Customer email is required' } }, { status: 400 });
    }

    const normalizedEmail = customerEmail.trim().toLowerCase();

    // Verify customer exists
    const existingCustomer = await db.query.customers.findFirst({
      where: eq(customers.email, normalizedEmail)
    });

    if (!existingCustomer) {
      return NextResponse.json({ success: false, error: { message: 'Select an existing CloutFlow contact to create a test offer.' } }, { status: 404 });
    }

    // Check for existing active test offer
    const activeTestOffers = await db.query.customerOffers.findMany({
      where: and(
        eq(customerOffers.customerEmail, normalizedEmail),
        eq(customerOffers.campaignType, POST_PURCHASE_OFFER_CAMPAIGN),
        eq(customerOffers.sourceOrderId, 'ADMIN_TEST'),
        eq(customerOffers.status, 'ACTIVE')
      )
    });

    const now = new Date();
    const hasActive = activeTestOffers.some(o => o.expiresAt && new Date(o.expiresAt) > now);

    if (hasActive) {
      return NextResponse.json({ success: false, error: { message: 'This contact already has an active Test Offer.' } }, { status: 409 });
    }

    const expiresAt = new Date(now.getTime() + validHours * 60 * 60 * 1000);
    const code = generateOfferCode();

    const [newOffer] = await db.insert(customerOffers).values({
      customerEmail: normalizedEmail,
      sourceOrderId: 'ADMIN_TEST', // Distinguish from real orders
      campaignType: POST_PURCHASE_OFFER_CAMPAIGN,
      discountType: 'PERCENTAGE',
      discountValue: POST_PURCHASE_DISCOUNT_PERCENT,
      status: 'ACTIVE', // Direct to active, no schedule
      code,
      validFrom: now,
      expiresAt,
      metadata: {
        isTest: true,
        source: 'ADMIN_TEST'
      }
    }).returning();

    if (sendEmail) {
      const emailRes = await sendTestEmail(normalizedEmail, code, expiresAt);
      if (!emailRes.success) {
         // Log but don't fail offer creation
         console.error('[AdminTestOffers] Failed to send test email', emailRes.error);
      }
    }

    return NextResponse.json({ success: true, data: newOffer });
  } catch (error) {
    console.error('[AdminTestOffers] Failed to create test offer:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

async function sendTestEmail(email: string, code: string, expiresAt: Date) {
  try {
     const transport = getMarketingEmailTransport(email);
     const contextData = { offerCode: code, expiresAt: expiresAt.toISOString() };
     const template = getPostPurchaseOfferTemplate(contextData, { customerEmail: email });
     
     const sendResult = await transport.send({
       to: email,
       subject: template.subject,
       html: template.html,
       idempotencyKey: `ADMIN_TEST_${code}`,
       category: 'marketing'
     });

     if (sendResult.success) {
       return { success: true };
     } else {
       return { success: false, error: sendResult.error || sendResult.reason };
     }
  } catch (e) {
     return { success: false, error: e };
  }
}
