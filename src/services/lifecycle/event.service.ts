import { db } from '@/db';
import { lifecycleEvents, lifecycleAutomations } from '@/db/schema';
import { eq, or, and, ne } from 'drizzle-orm';

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
      // If a customer makes a purchase, immediately suppress any pending Abandoned Checkout emails
      await tx.update(lifecycleAutomations)
        .set({
          status: 'SUPPRESSED',
          updatedAt: new Date(),
          errorLog: [{ 
            timestamp: new Date().toISOString(), 
            reason: `Suppressed by event ${params.eventType}` 
          }]
        })
        .where(
          and(
            eq(lifecycleAutomations.customerEmail, normalizedEmail),
            eq(lifecycleAutomations.status, 'PENDING'),
            or(
              eq(lifecycleAutomations.automationId, 'ABANDONED_CART_2H'),
              eq(lifecycleAutomations.automationId, 'ABANDONED_CART_24H')
            )
          )
        );
    }

    return {
      success: true,
      eventId: inserted.id,
      message: `Event ${params.eventType} emitted successfully.`,
      isDuplicate: false,
    };
  });
}

