import { db } from '@/db';
import { lifecycleAutomations, lifecycleEvents } from '@/db/schema';
import { eq, and, lte, gte, inArray } from 'drizzle-orm';
import crypto from 'crypto';
import { emitLifecycleEvent } from './event.service';

/**
 * Default threshold for checkout abandonment evaluation in minutes.
 */
export const DEFAULT_ABANDONMENT_THRESHOLD_MINUTES = 30;

/**
 * Evaluates pending LEAD_CAPTURED or CHECKOUT_STARTED events that have been inactive
 * for longer than the threshold and do NOT have a subsequent PAYMENT_APPROVED event.
 * If eligible, creates a CHECKOUT_ABANDONED event.
 */
export async function evaluateCheckoutAbandonments(thresholdMinutes = DEFAULT_ABANDONMENT_THRESHOLD_MINUTES) {
  const cutoff = new Date(Date.now() - thresholdMinutes * 60 * 1000);

  // 1. Find leads / started checkouts older than cutoff
  const potentialLeads = await db.query.lifecycleEvents.findMany({
    where: and(
      inArray(lifecycleEvents.eventType, ['LEAD_CAPTURED', 'CHECKOUT_STARTED']),
      lte(lifecycleEvents.createdAt, cutoff)
    ),
    limit: 50,
  });

  let createdAbandonments = 0;

  for (const lead of potentialLeads) {
    // 2. Check if a PAYMENT_APPROVED or already existing CHECKOUT_ABANDONED event exists for this customerEmail
    const [payment] = (await db.query.lifecycleEvents.findMany({
      where: and(
        eq(lifecycleEvents.customerEmail, lead.customerEmail),
        eq(lifecycleEvents.eventType, 'PAYMENT_APPROVED')
      ),
      limit: 1,
    })) || [];

    if (payment) {
      // Payment exists, do not emit CHECKOUT_ABANDONED
      continue;
    }

    const [existingAbandonment] = (await db.query.lifecycleEvents.findMany({
      where: and(
        eq(lifecycleEvents.customerEmail, lead.customerEmail),
        eq(lifecycleEvents.eventType, 'CHECKOUT_ABANDONED'),
        gte(lifecycleEvents.createdAt, lead.createdAt)
      ),
      limit: 1,
    })) || [];

    if (existingAbandonment) {
      continue;
    }

    // 3. Emit CHECKOUT_ABANDONED idempotently
    const idempotencyKey = `CHECKOUT_ABANDONED:LEAD:${lead.id}`;
    const result = await emitLifecycleEvent({
      customerEmail: lead.customerEmail,
      customerId: lead.customerId || undefined,
      eventType: 'CHECKOUT_ABANDONED',
      idempotencyKey,
      payload: {
        ...(lead.payload as Record<string, unknown>),
        sourceEventId: lead.id,
        evaluatedAt: new Date().toISOString(),
      },
    });

    if (result.success && !result.isDuplicate && result.eventId) {
      // Schedule Cart Recovery sequence
      const now = new Date();
      
      // Step 1: Immediate
      await scheduleLifecycleAutomation({
        eventId: result.eventId,
        customerEmail: lead.customerEmail,
        automationId: 'ABANDONED_CART_STEP_1',
        actionType: 'ABANDONED_CART',
        scheduledFor: now,
        contextData: { ...(lead.payload as object), stepNumber: 1 }
      });

      // Step 2: +24 hours
      const step2Time = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      await scheduleLifecycleAutomation({
        eventId: result.eventId,
        customerEmail: lead.customerEmail,
        automationId: 'ABANDONED_CART_STEP_2',
        actionType: 'ABANDONED_CART',
        scheduledFor: step2Time,
        contextData: { ...(lead.payload as object), stepNumber: 2 }
      });

      // Step 3: +48 hours
      const step3Time = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      await scheduleLifecycleAutomation({
        eventId: result.eventId,
        customerEmail: lead.customerEmail,
        automationId: 'ABANDONED_CART_STEP_3',
        actionType: 'ABANDONED_CART',
        scheduledFor: step3Time,
        contextData: { ...(lead.payload as object), stepNumber: 3 }
      });

      createdAbandonments++;
    }
  }

  return {
    evaluatedCount: potentialLeads.length,
    abandonmentsCreated: createdAbandonments,
  };
}

/**
 * Schedules a new automation (e.g. an email) to be run at a specific time.
 */
export async function scheduleLifecycleAutomation(params: {
  eventId: string;
  customerEmail: string;
  automationId: string;
  actionType: string;
  scheduledFor: Date;
  contextData: Record<string, unknown>;
}) {
  return await db.insert(lifecycleAutomations).values({
    lifecycleEventId: params.eventId,
    customerEmail: params.customerEmail,
    automationId: params.automationId,
    actionType: params.actionType,
    scheduledFor: params.scheduledFor,
    contextData: params.contextData || {},
    status: 'PENDING',
  }).returning();
}

/**
 * Claims pending automations that are ready to run.
 * Uses a safe lock mechanism via claimToken to avoid duplicate processing.
 */
export async function claimReadyAutomations(limit = 10) {
  const now = new Date();
  const claimToken = crypto.randomUUID();
  
  // Claim them atomically using CTE / subquery if possible, or atomic update with predicate
  // In Drizzle/Postgres: UPDATE ... WHERE id IN (SELECT id FROM ... FOR UPDATE SKIP LOCKED) RETURNING ...
  // With standard Drizzle query builder:
  const claimed = await db.update(lifecycleAutomations)
    .set({
      status: 'PROCESSING',
      claimedAt: now,
      claimToken: claimToken,
      updatedAt: now,
    })
    .where(
      inArray(
        lifecycleAutomations.id,
        db.select({ id: lifecycleAutomations.id })
          .from(lifecycleAutomations)
          .where(
            and(
              eq(lifecycleAutomations.status, 'PENDING'),
              lte(lifecycleAutomations.scheduledFor, now)
            )
          )
          .limit(limit)
      )
    )
    .returning();

  return { success: true, claimedCount: claimed.length, automations: claimed, claimToken };
}

/**
 * Mark automation as successfully completed.
 */
export async function markAutomationCompleted(id: string, claimToken: string) {
  return await db.update(lifecycleAutomations)
    .set({
      status: 'COMPLETED',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(lifecycleAutomations.id, id),
        eq(lifecycleAutomations.claimToken, claimToken)
      )
    );
}

/**
 * Process a failed automation. Retries up to 3 times with backoff, otherwise marks FAILED.
 */
export async function handleAutomationFailure(id: string, claimToken: string, _errorMsg: string, currentAttempts: number) {
  const maxAttempts = 3;
  const newAttempts = currentAttempts + 1;
  const now = new Date();
  
  if (newAttempts >= maxAttempts) {
    // Fail permanently
    return await db.update(lifecycleAutomations)
      .set({
        status: 'FAILED',
        updatedAt: now,
        lastAttemptAt: now,
      })
      .where(and(eq(lifecycleAutomations.id, id), eq(lifecycleAutomations.claimToken, claimToken)));
  } else {
    // Retry: put back to PENDING and schedule for later (e.g. 15 mins backoff)
    const nextRetry = new Date(now.getTime() + 15 * 60000); 
    
    return await db.update(lifecycleAutomations)
      .set({
        status: 'PENDING',
        attempts: newAttempts,
        lastAttemptAt: now,
        scheduledFor: nextRetry,
        claimToken: null,
        claimedAt: null,
        updatedAt: now,
      })
      .where(and(eq(lifecycleAutomations.id, id), eq(lifecycleAutomations.claimToken, claimToken)));
  }
}

