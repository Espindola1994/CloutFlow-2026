import { claimReadyAutomations, handleAutomationFailure } from './scheduler.service';
import { db } from '@/db';
import { lifecycleAutomations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Worker to process claimed lifecycle automations.
 * In Phase A + B, NO REAL EMAILS ARE SENT. It simulates execution.
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
      
      // PHASE A+B RULE: Zero real emails are sent!
      // Here we simulate the processing logic (e.g., verifying status, preparing render payload)
      // Future Phase C will connect to Resend/Gmail handlers.

      // Do NOT mark as COMPLETED, because it wasn't actually sent.
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
    message: `Processed ${claimResult.claimedCount} automations (${succeeded} marked BLOCKED_NOT_IMPLEMENTED, ${failed} failed).`,
  };
}

