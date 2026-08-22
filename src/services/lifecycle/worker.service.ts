import { claimReadyAutomations, handleAutomationFailure, markAutomationCompleted } from './scheduler.service';
import { db } from '@/db';
import { lifecycleAutomations, lifecycleEvents, emailLogs } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { getCartRecoveryTemplate } from './templates.service';
import { getMarketingEmailTransport } from '@/integrations/email/transport';
import { isEmailSuppressed } from './unsubscribe.service';

/**
 * Worker to process claimed lifecycle automations.
 * In Phase A + B, NO REAL EMAILS ARE SENT. It simulates execution.
 * In Phase C, ABANDONED_CART is implemented with safety rollout guards.
 */
export async function runLifecycleWorker(limit = 10) {
  const claimResult = await claimReadyAutomations(limit);
  
  if (!claimResult.success || claimResult.claimedCount === 0) {
    return {
      processed: 0,
      succeeded: 0,
      failed: 0,
      message: 'No automations ready to process.',
    };
  }

  let succeeded = 0;
  let failed = 0;

  for (const automation of claimResult.automations) {
    try {
      console.log(`[LifecycleWorker] Processing automation ${automation.id} (${automation.automationId}) for ${automation.customerEmail}`);
      
      const normalizedEmail = automation.customerEmail.trim().toLowerCase();

      // 1. Suppression check
      const isSuppressed = await isEmailSuppressed(normalizedEmail);
      if (isSuppressed) {
        await db.update(lifecycleAutomations).set({ status: 'SUPPRESSED', updatedAt: new Date() }).where(eq(lifecycleAutomations.id, automation.id));
        await logEmailSend(automation.id, normalizedEmail, automation.actionType, (automation.contextData as Record<string, unknown>)?.stepNumber as number, 'SUPPRESSED', 'User unsubscribed or blocked');
        succeeded++;
        continue;
      }

      // 2. Pre-send revalidation: Check for payment/order after this abandonment
      const [laterPayment] = await db.query.lifecycleEvents.findMany({
        where: and(
          eq(lifecycleEvents.customerEmail, normalizedEmail),
          eq(lifecycleEvents.eventType, 'PAYMENT_APPROVED'),
          gt(lifecycleEvents.createdAt, automation.createdAt)
        ),
        limit: 1,
      });

      if (laterPayment) {
        await db.update(lifecycleAutomations).set({ status: 'SUPPRESSED_CONVERTED', updatedAt: new Date() }).where(eq(lifecycleAutomations.id, automation.id));
        await logEmailSend(automation.id, normalizedEmail, automation.actionType, (automation.contextData as Record<string, unknown>)?.stepNumber as number, 'SUPPRESSED', 'Customer converted before send');
        succeeded++;
        continue;
      }

      // 3. Execution based on actionType
      if (automation.actionType === 'ABANDONED_CART') {
        const stepNumber = ((automation.contextData as Record<string, unknown>)?.stepNumber as number) || 1;
        
        // Ensure not already sent (Idempotency against email_logs)
        const [existingLog] = await db.query.emailLogs.findMany({
          where: and(
            eq(emailLogs.lifecycleAutomationId, automation.id),
            eq(emailLogs.status, 'SENT')
          ),
          limit: 1,
        });

        if (existingLog) {
          console.warn(`[LifecycleWorker] Automation ${automation.id} already has a SENT log. Skipping to prevent duplicate.`);
          await markAutomationCompleted(automation.id, claimResult.claimToken!);
          succeeded++;
          continue;
        }

        // Generate Return URL (fallback to base URL if context lacks detailed offer/platform)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cloutflow.com';
        const contextData = automation.contextData as Record<string, unknown>;
        
        let returnUrl = baseUrl;
        if (contextData?.platform && contextData?.service && contextData?.offerId) {
           returnUrl = `${baseUrl}/order/${contextData.platform}/${contextData.service}?offer=${contextData.offerId}`;
        } else if (contextData?.checkoutUrl) {
           returnUrl = contextData.checkoutUrl as string;
        }

        const template = getCartRecoveryTemplate(stepNumber, { returnUrl, customerEmail: normalizedEmail });

        const transport = getMarketingEmailTransport();
        const idempotencyKey = `lifecycle/${automation.id}/step/${stepNumber}`;

        const sendResult = await transport.send({
           to: normalizedEmail,
           subject: template.subject,
           html: template.html,
           idempotencyKey, // Generic idempotency key for provider
           headers: {
             'X-Idempotency-Key': idempotencyKey, // Resend standard header for idempotency
           },
           category: 'recovery'
        });

        if (sendResult.success) {
           // Persist send log with providerMessageId BEFORE marking automation completed
           // to eliminate the crash window duplicate send risk
           await logEmailSend(automation.id, normalizedEmail, automation.actionType, stepNumber, 'SENT', template.subject, sendResult.messageId);
           await markAutomationCompleted(automation.id, claimResult.claimToken!);
           succeeded++;
        } else if (sendResult.reason === 'BLOCKED_SEND_DISABLED' || sendResult.error === 'BLOCKED_EMAIL_CONFIG') {
           const blockStatus = (sendResult.error || sendResult.reason) as string;
           await logEmailSend(automation.id, normalizedEmail, automation.actionType, stepNumber, blockStatus, template.subject);
           // Put automation in a safe non-retrying blocked state or completed without consuming retry attempts
           await db.update(lifecycleAutomations).set({ status: blockStatus, updatedAt: new Date(), claimToken: null, claimedAt: null }).where(eq(lifecycleAutomations.id, automation.id));
           succeeded++;
        } else {
           throw new Error(sendResult.error as string || 'Unknown email send error');
        }
      } else {
        // Not implemented (Phase A/B rules for other types)
        await db.update(lifecycleAutomations)
          .set({
            status: 'BLOCKED_NOT_IMPLEMENTED',
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(lifecycleAutomations.id, automation.id),
              eq(lifecycleAutomations.claimToken, claimResult.claimToken!)
            )
          );
        succeeded++;
      }
    } catch (err: unknown) {
      console.error(`[LifecycleWorker] Error processing automation ${automation.id}:`, err);
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      await handleAutomationFailure(
        automation.id, 
        claimResult.claimToken!, 
        errMsg, 
        automation.attempts
      );
      failed++;
    }
  }

  return {
    processed: claimResult.claimedCount,
    succeeded,
    failed,
    message: `Processed ${claimResult.claimedCount} automations.`,
  };
}

async function logEmailSend(automationId: string, email: string, sequenceType: string, stepNumber: number, status: string, subject?: string, messageId?: string) {
  try {
    await db.insert(emailLogs).values({
      lifecycleAutomationId: automationId,
      customerEmail: email,
      sequenceType,
      stepNumber,
      status,
      subject,
      providerMessageId: messageId,
      sentAt: status === 'SENT' ? new Date() : null,
    });
  } catch (err: unknown) {
    // Check if duplicate key violation on (lifecycleAutomationId, stepNumber)
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === '23505') {
      console.warn(`[LifecycleWorker] Email log already exists for automation ${automationId} step ${stepNumber}. Suppressing duplicate insert.`);
      return;
    }
    throw err;
  }
}


