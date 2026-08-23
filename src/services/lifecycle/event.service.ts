import { db } from '@/db';
import { lifecycleEvents, lifecycleAutomations } from '@/db/schema';
import { eq, or, and, ne } from 'drizzle-orm';
import { sendAutomaticTransactionalEmail } from '@/services/email/transactional-trigger.service';

export type LifecycleEventType = 'LEAD_CAPTURED' | 'CHECKOUT_STARTED' | 'CHECKOUT_ABANDONED' | 'PAYMENT_APPROVED' | 'ORDER_COMPLETED' | 'REPEAT_PURCHASE' | 'ORDER_REFUNDED';

export interface EmitLifecycleEventParams {
  customerEmail: string;
  customerId?: string;
  eventType: LifecycleEventType;
  idempotencyKey: string;
  payload: Record<string, unknown>;
}

export interface EmitLifecycleEventResult {
  success: boolean;
  eventId?: string;
  message: string;
  isDuplicate: boolean;
}

/**
 * Normalizes email strings to provide a stable identity across events.
 */
export function normalizeCanonicalEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Checks if the customer has made a previous purchase and emits REPEAT_PURCHASE if so.
 * This should be called after a PAYMENT_APPROVED event.
 */
export async function evaluateRepeatPurchase(customerEmail: string, currentOrderId: string, amount: string | number): Promise<void> {
  const normalizedEmail = normalizeCanonicalEmail(customerEmail);
  if (!normalizedEmail) return;

  try {
    // Check if there is an existing PAYMENT_APPROVED event for a DIFFERENT order
    const [previousPayment] = await db.query.lifecycleEvents.findMany({
      where: and(
        eq(lifecycleEvents.customerEmail, normalizedEmail),
        eq(lifecycleEvents.eventType, 'PAYMENT_APPROVED'),
        ne(lifecycleEvents.idempotencyKey, `PAYMENT_APPROVED:ORDER:${currentOrderId}`)
      ),
      limit: 1,
    });

    if (previousPayment) {
      await emitLifecycleEvent({
        customerEmail: normalizedEmail,
        eventType: 'REPEAT_PURCHASE',
        idempotencyKey: `REPEAT_PURCHASE:ORDER:${currentOrderId}`,
        payload: {
          orderId: currentOrderId,
          amount,
          previousOrderId: (previousPayment.payload as Record<string, unknown>)?.orderId,
        }
      });
    }
  } catch (err) {
    console.error(`[LifecycleEventService] Failed to evaluate REPEAT_PURCHASE for ${normalizedEmail}`, err);
  }
}

/**
 * Emits a lifecycle event safely and idempotently.
 * It will not emit the event if the idempotencyKey already exists.
 * Does NOT schedule automations automatically; that's done by the event processors/schedulers.
 */
export async function emitLifecycleEvent(params: EmitLifecycleEventParams): Promise<EmitLifecycleEventResult> {
  const normalizedEmail = normalizeCanonicalEmail(params.customerEmail);
  if (!normalizedEmail) {
    return { success: false, message: 'Invalid or missing customer email.', isDuplicate: false };
  }
  
  if (!params.idempotencyKey) {
    return { success: false, message: 'idempotencyKey is required.', isDuplicate: false };
  }

  return await db.transaction(async (tx) => {
    // 1. Check for duplicate using idempotency key
    const [existingEvent] = await tx.query.lifecycleEvents.findMany({
      where: eq(lifecycleEvents.idempotencyKey, params.idempotencyKey),
      limit: 1,
    });

    if (existingEvent) {
      return {
        success: true,
        eventId: existingEvent.id,
        message: 'Duplicate event ignored (idempotency key matched).',
        isDuplicate: true,
      };
    }

    // 2. Insert event
    const [inserted] = await tx.insert(lifecycleEvents).values({
      customerEmail: normalizedEmail,
      customerId: params.customerId || null,
      eventType: params.eventType,
      idempotencyKey: params.idempotencyKey,
      payload: params.payload,
    }).returning({ id: lifecycleEvents.id });

    // 3. Supress pending automations that contradict this event (Phase B rules)
    if (params.eventType === 'PAYMENT_APPROVED' || params.eventType === 'ORDER_COMPLETED' || params.eventType === 'REPEAT_PURCHASE' || params.eventType === 'ORDER_REFUNDED') {
      const journeyId = (params.payload as any)?.checkoutContextId || (params.payload as any)?.externalReference || (params.payload as any)?.paymentLeadId || (params.payload as any)?.checkoutToken || (params.payload as any)?.sourceEventId;

      // Find pending automations
      const pendingAutomations = await tx.query.lifecycleAutomations.findMany({
        where: and(
          eq(lifecycleAutomations.customerEmail, normalizedEmail),
          eq(lifecycleAutomations.status, 'PENDING')
        )
      });

      for (const auto of pendingAutomations) {
        const autoJourneyId = (auto.contextData as any)?.journeyId;
        // Suppress if the journey matches, OR if there's no journey tracking on the event/automation (legacy fallback)
        if (!journeyId || !autoJourneyId || journeyId === autoJourneyId) {
          await tx.update(lifecycleAutomations)
            .set({
              status: 'SUPPRESSED_CONVERTED',
              updatedAt: new Date(),
              errorLog: [{ 
                timestamp: new Date().toISOString(), 
                reason: `Suppressed by event ${params.eventType}` 
              }]
            })
            .where(eq(lifecycleAutomations.id, auto.id));
        }
      }
    }

    // 4. Automatic Transactional Email Triggers
    if (params.eventType === 'PAYMENT_APPROVED' && params.payload?.orderId) {
      sendAutomaticTransactionalEmail({
        type: 'PAYMENT_APPROVED',
        orderId: String(params.payload.orderId),
        customerEmail: normalizedEmail,
        customerName: params.payload.customerName ? String(params.payload.customerName) : undefined,
        target: (params.payload.targetHandle || params.payload.target) ? String(params.payload.targetHandle || params.payload.target) : undefined,
        platform: params.payload.platform ? String(params.payload.platform) : undefined,
        service: params.payload.service ? String(params.payload.service) : undefined,
        quantity: typeof params.payload.quantity === 'number' ? params.payload.quantity : undefined,
      }).catch((err) => console.error('[LifecycleEventService] Automatic transactional email error:', err));
    } else if (params.eventType === 'ORDER_COMPLETED' && params.payload?.orderId) {
      sendAutomaticTransactionalEmail({
        type: 'ORDER_COMPLETED',
        orderId: String(params.payload.orderId),
        customerEmail: normalizedEmail,
        customerName: params.payload.customerName ? String(params.payload.customerName) : undefined,
        target: (params.payload.targetHandle || params.payload.target) ? String(params.payload.targetHandle || params.payload.target) : undefined,
        platform: params.payload.platform ? String(params.payload.platform) : undefined,
        service: params.payload.service ? String(params.payload.service) : undefined,
        quantity: typeof params.payload.quantity === 'number' ? params.payload.quantity : undefined,
      }).catch((err) => console.error('[LifecycleEventService] Automatic transactional email error:', err));
    }

    return {
      success: true,
      eventId: inserted.id,
      message: `Event ${params.eventType} emitted successfully.`,
      isDuplicate: false,
    };
  });
}

