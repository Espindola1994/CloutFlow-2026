import { NextResponse } from 'next/server';
import { db } from '@/db';
import { lifecycleAutomations, lifecycleEvents, emailLogs, orders } from '@/db/schema';
import { eq, and, gt, gte, inArray, or } from 'drizzle-orm';
import { getCartRecoveryTemplate } from '@/services/lifecycle/templates.service';
import { getMarketingEmailTransport } from '@/integrations/email/transport';
import { isEmailSuppressed } from '@/services/lifecycle/unsubscribe.service';
import crypto from 'crypto';

/**
 * SCOPED EXECUTION ENDPOINT FOR ETAPA 11E-1
 * Strictly bound to CFCTX_94510b0aaa3205cbfbd9ac55 and instaplussoftware@gmail.com
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'Bearer cloutflow-scoped-11e1-test-token-77a8') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { automationId, dryRun } = await request.json();
    const EXPECTED_AUTOMATION_ID = '50fcf722-656d-47a8-a13b-a6a250b4da1b';
    const EXPECTED_JOURNEY_ID = 'CFCTX_94510b0aaa3205cbfbd9ac55';
    const EXPECTED_EMAIL = 'instaplussoftware@gmail.com';

    if (automationId !== EXPECTED_AUTOMATION_ID) {
      return NextResponse.json({ success: false, error: 'Prohibited automation ID. Scoped execution only.' }, { status: 403 });
    }

    // 1. Fetch exactly this automation
    const [automation] = await db.query.lifecycleAutomations.findMany({
      where: eq(lifecycleAutomations.id, EXPECTED_AUTOMATION_ID),
      limit: 1,
    });

    if (!automation) {
      return NextResponse.json({ success: false, error: 'Automation not found' }, { status: 404 });
    }

    const contextData = automation.contextData as Record<string, unknown>;
    const journeyId = contextData?.journeyId;
    const normalizedEmail = automation.customerEmail.trim().toLowerCase();

    if (journeyId !== EXPECTED_JOURNEY_ID || normalizedEmail !== EXPECTED_EMAIL) {
      return NextResponse.json({ success: false, error: 'Scope violation: Mismatched journey or email' }, { status: 403 });
    }

    // 2. Suppression check
    const isSuppressed = await isEmailSuppressed(normalizedEmail);
    if (isSuppressed) {
      return NextResponse.json({ success: false, error: 'Email suppressed' }, { status: 400 });
    }

    // 3. Pre-send conversion check
    const [laterPayment] = await db.query.lifecycleEvents.findMany({
      where: and(
        eq(lifecycleEvents.customerEmail, normalizedEmail),
        eq(lifecycleEvents.eventType, 'PAYMENT_APPROVED'),
        gt(lifecycleEvents.createdAt, automation.createdAt)
      ),
      limit: 1,
    });

    const matchedOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.customerEmail, normalizedEmail),
        inArray(orders.paymentStatus, ['PAID', 'COMPLETED', 'approved', 'completed']),
        or(
          eq(orders.src, EXPECTED_JOURNEY_ID),
          gte(orders.createdAt, automation.createdAt)
        )
      ),
      limit: 1,
    });

    if (laterPayment || matchedOrders.length > 0) {
      await db.update(lifecycleAutomations)
        .set({ status: 'SUPPRESSED_CONVERTED', updatedAt: new Date() })
        .where(eq(lifecycleAutomations.id, automation.id));
      return NextResponse.json({ success: false, status: 'SUPPRESSED_CONVERTED' }, { status: 200 });
    }

    // 4. Check idempotency against email_logs
    const [existingSentLog] = await db.query.emailLogs.findMany({
      where: and(
        eq(emailLogs.lifecycleAutomationId, automation.id),
        eq(emailLogs.status, 'SENT')
      ),
      limit: 1,
    });

    if (existingSentLog) {
      return NextResponse.json({
        success: true,
        alreadySent: true,
        providerCall: 0,
        status: 'ALREADY_SENT_COMPLETED',
        message: 'Automation already has a SENT log. Provider call skipped by idempotency.',
        existingLog: {
          id: existingSentLog.id,
          providerMessageId: existingSentLog.providerMessageId,
          sentAt: existingSentLog.sentAt
        }
      });
    }

    if (dryRun) {
      return NextResponse.json({ success: true, dryRun: true, status: 'READY_TO_SEND' });
    }

    // 5. Claim lock atomically
    const claimToken = crypto.randomUUID();
    const now = new Date();
    await db.update(lifecycleAutomations)
      .set({
        status: 'PROCESSING',
        claimedAt: now,
        claimToken,
        updatedAt: now,
      })
      .where(and(eq(lifecycleAutomations.id, automation.id), eq(lifecycleAutomations.status, 'PENDING')));

    // 6. Resolve Return URL exactly matching worker logic
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cloutflow.co';
    let returnUrl = baseUrl;
    if (contextData?.checkoutUrl) {
      returnUrl = contextData.checkoutUrl as string;
    } else if (contextData?.canonicalOfferId || (contextData?.platform && contextData?.service)) {
      const plat = (contextData.platform as string) || '';
      const serv = (contextData.service as string) || '';
      const offerParam = (contextData.offerId as string) || (contextData.canonicalOfferId as string) || '';
      if (plat && serv && offerParam) {
        returnUrl = `${baseUrl}/order/${plat}/${serv}?offer=${offerParam}`;
      } else if (plat && serv) {
        returnUrl = `${baseUrl}/order/${plat}/${serv}`;
      } else {
        returnUrl = baseUrl;
      }
    }

    const stepNumber = (contextData?.stepNumber as number) || 1;
    const template = getCartRecoveryTemplate(stepNumber, { returnUrl, customerEmail: normalizedEmail });
    const transport = getMarketingEmailTransport(normalizedEmail);
    const idempotencyKey = `lifecycle/${automation.id}/step/${stepNumber}`;

    // 7. Send real email via Marketing Transport (Resend with allowlist validation)
    const sendResult = await transport.send({
      to: normalizedEmail,
      subject: template.subject,
      html: template.html,
      idempotencyKey,
      headers: {
        'X-Idempotency-Key': idempotencyKey,
      },
      category: 'recovery',
    });

    if (sendResult.success) {
      // Persist send log
      const [newLog] = await db.insert(emailLogs).values({
        lifecycleAutomationId: automation.id,
        customerEmail: normalizedEmail,
        sequenceType: automation.actionType,
        stepNumber,
        status: 'SENT',
        subject: template.subject,
        providerMessageId: sendResult.messageId,
        sentAt: new Date(),
      }).returning();

      // Mark automation completed
      await db.update(lifecycleAutomations)
        .set({
          status: 'COMPLETED',
          updatedAt: new Date(),
        })
        .where(eq(lifecycleAutomations.id, automation.id));

      return NextResponse.json({
        success: true,
        providerCall: 1,
        sendResult,
        returnUrl,
        logId: newLog.id,
        status: 'COMPLETED'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: sendResult.error || sendResult.reason
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[ScopedLifecycle11E1] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
