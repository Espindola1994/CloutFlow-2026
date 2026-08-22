import { db } from '@/db';
import { orders, orderEvents, orderItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface RepairPerfectPayOrderAmountParams {
  publicId: string;
  perfectPaySaleCode: string;
  expectedCurrentTotalCents: number;
  authoritativeAmountCents: number;
  currency: string;
  confirmation: string;
  adminId: string;
}

export interface RepairPerfectPayOrderAmountResult {
  success: boolean;
  code:
    | 'SUCCESS'
    | 'ALREADY_REPAIRED'
    | 'ORDER_NOT_FOUND'
    | 'MISSING_CONFIRMATION'
    | 'EXTERNAL_ORDER_ID_MISMATCH'
    | 'AMOUNT_CONFLICT'
    | 'INVALID_AMOUNT'
    | 'INVALID_CURRENCY';
  message: string;
  orderId?: string;
  publicId?: string;
  previousSubtotalCents?: number;
  newSubtotalCents?: number;
  previousTotalCents?: number;
  newTotalCents?: number;
}

export const REPAIR_AMOUNT_CONFIRMATION_PHRASE = 'REPAIR PERFECTPAY AMOUNT';

/**
 * Safely repairs the historical monetary amount for a PerfectPay order.
 *
 * Requirements:
 * 1. Admin authentication (passed via adminId)
 * 2. Exact publicId & exact PerfectPay sale code
 * 3. current externalOrderId must equal supplied sale code
 * 4. current totalCents must equal expectedCurrentTotalCents
 * 5. authoritativeAmountCents must be positive (> 0)
 * 6. currency must be USD
 * 7. Exact confirmation phrase: 'REPAIR PERFECTPAY AMOUNT'
 * 8. Atomically updates:
 *    - orders.subtotalCents = authoritativeAmountCents
 *    - orders.totalCents = authoritativeAmountCents
 *    - order_items.unitPriceCents & totalPriceCents aligned to authoritativeAmountCents
 * 9. Explicitly preserves:
 *    - discountCents
 *    - paymentStatus (e.g. REFUNDED)
 *    - status (e.g. CANCELLED / PROCESSING)
 *    - fulfillmentStatus (e.g. COMPLETED / NOT_DISPATCHED)
 *    - provider data & provider costs
 *    - target URLs / social username
 * 10. Audit event: exactly one order_events record
 * 11. Idempotency: if already equal to authoritativeAmountCents -> ALREADY_REPAIRED
 * 12. Conflict safety: if current total differs from both expected and authoritative -> AMOUNT_CONFLICT
 */
export async function repairPerfectPayOrderAmount(
  params: RepairPerfectPayOrderAmountParams
): Promise<RepairPerfectPayOrderAmountResult> {
  const {
    publicId,
    perfectPaySaleCode,
    expectedCurrentTotalCents,
    authoritativeAmountCents,
    currency,
    confirmation,
    adminId,
  } = params;

  if (!publicId || !perfectPaySaleCode) {
    return {
      success: false,
      code: 'EXTERNAL_ORDER_ID_MISMATCH',
      message: 'Both publicId and perfectPaySaleCode are required.',
    };
  }

  if (confirmation !== REPAIR_AMOUNT_CONFIRMATION_PHRASE) {
    return {
      success: false,
      code: 'MISSING_CONFIRMATION',
      message: `Explicit confirmation phrase '${REPAIR_AMOUNT_CONFIRMATION_PHRASE}' is required.`,
    };
  }

  if (typeof authoritativeAmountCents !== 'number' || authoritativeAmountCents <= 0 || !Number.isInteger(authoritativeAmountCents)) {
    return {
      success: false,
      code: 'INVALID_AMOUNT',
      message: 'authoritativeAmountCents must be a positive integer cents value.',
    };
  }

  if (currency.toUpperCase() !== 'USD') {
    return {
      success: false,
      code: 'INVALID_CURRENCY',
      message: 'currency must be USD.',
    };
  }

  const cleanSaleCode = perfectPaySaleCode.trim();

  return await db.transaction(async (tx) => {
    // 1. Fetch target order
    const [existingOrder] = await tx.query.orders.findMany({
      where: eq(orders.publicId, publicId),
      limit: 1,
    });

    if (!existingOrder) {
      return {
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: `Order with publicId ${publicId} not found.`,
      };
    }

    // 2. Validate externalOrderId match
    if (existingOrder.externalOrderId !== cleanSaleCode) {
      return {
        success: false,
        code: 'EXTERNAL_ORDER_ID_MISMATCH',
        message: `Current externalOrderId (${existingOrder.externalOrderId}) does not match supplied sale code (${cleanSaleCode}).`,
        orderId: existingOrder.id,
        publicId: existingOrder.publicId,
      };
    }

    const currentTotal = Number(existingOrder.totalCents);
    const currentSubtotal = Number(existingOrder.subtotalCents);

    // 3. Idempotency Check: Already repaired
    if (currentTotal === authoritativeAmountCents && currentSubtotal === authoritativeAmountCents) {
      return {
        success: true,
        code: 'ALREADY_REPAIRED',
        message: `Order ${publicId} is already set to ${authoritativeAmountCents} cents.`,
        orderId: existingOrder.id,
        publicId: existingOrder.publicId,
        previousSubtotalCents: currentSubtotal,
        newSubtotalCents: authoritativeAmountCents,
        previousTotalCents: currentTotal,
        newTotalCents: authoritativeAmountCents,
      };
    }

    // 4. Amount Conflict Guard
    // For historical repair, require BOTH: current subtotalCents = 0 and current totalCents = 0 (or match expectedCurrentTotalCents).
    // If either differs from the expected pre-repair state (or subtotal differs from total), STOP with AMOUNT_CONFLICT.
    if (currentTotal !== expectedCurrentTotalCents || (expectedCurrentTotalCents === 0 && currentSubtotal !== 0)) {
      return {
        success: false,
        code: 'AMOUNT_CONFLICT',
        message: `Current monetary state (totalCents: ${currentTotal}, subtotalCents: ${currentSubtotal}) does not match expected pre-repair state (expectedCurrentTotalCents: ${expectedCurrentTotalCents}).`,
        orderId: existingOrder.id,
        publicId: existingOrder.publicId,
        previousSubtotalCents: currentSubtotal,
        previousTotalCents: currentTotal,
      };
    }

    // 5. Update orders table
    await tx
      .update(orders)
      .set({
        subtotalCents: authoritativeAmountCents,
        totalCents: authoritativeAmountCents,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, existingOrder.id));

    // 6. Update order_items table for monetary consistency
    const items = await tx.query.orderItems.findMany({
      where: eq(orderItems.orderId, existingOrder.id),
    });

    if (items.length > 0) {
      for (const item of items) {
        await tx
          .update(orderItems)
          .set({
            unitPriceCents: authoritativeAmountCents,
            totalPriceCents: authoritativeAmountCents,
          })
          .where(eq(orderItems.id, item.id));
      }
    }

    // 7. Audit Trail: Insert exactly one order_events record
    const currentFulfillmentSnapshot = existingOrder.fulfillmentStatus || 'NOT_DISPATCHED';
    const currentPaymentStatus = existingOrder.paymentStatus || 'PENDING';
    const currentStatus = existingOrder.status || 'PENDING_PAYMENT';

    await tx.insert(orderEvents).values({
      orderId: existingOrder.id,
      status: currentStatus,
      paymentStatus: currentPaymentStatus,
      fulfillmentStatus: currentFulfillmentSnapshot,
      description: 'Administrative PerfectPay historical order amount repair applied.',
      metadata: {
        source: 'ADMIN_RECONCILIATION',
        action: 'PERFECTPAY_AMOUNT_REPAIR',
        perfectPaySaleCode: cleanSaleCode,
        evidenceSource: 'PERFECTPAY_PERSISTED_WEBHOOK',
        authoritativeAmountCents: authoritativeAmountCents,
        previousSubtotalCents: currentSubtotal,
        newSubtotalCents: authoritativeAmountCents,
        previousTotalCents: currentTotal,
        newTotalCents: authoritativeAmountCents,
        currency: 'USD',
        reason: 'HISTORICAL_PERFECTPAY_AMOUNT_INGESTION_DEFECT',
        repairedAt: new Date().toISOString(),
        repairedBy: adminId, // Safe non-secret identifier
      },
    });

    return {
      success: true,
      code: 'SUCCESS',
      message: `Order ${publicId} amount successfully repaired from ${currentTotal} to ${authoritativeAmountCents} cents.`,
      orderId: existingOrder.id,
      publicId: existingOrder.publicId,
      previousSubtotalCents: currentSubtotal,
      newSubtotalCents: authoritativeAmountCents,
      previousTotalCents: currentTotal,
      newTotalCents: authoritativeAmountCents,
    };
  });
}
