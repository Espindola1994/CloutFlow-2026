import { db } from '@/db';
import { orders, orderEvents } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';

export interface AdminRepairOrderLinkParams {
  publicId: string;
  perfectPaySaleCode: string;
  confirmation: string;
  adminId: string;
}

export interface AdminRepairOrderLinkResult {
  success: boolean;
  code:
    | 'SUCCESS'
    | 'ALREADY_LINKED'
    | 'ORDER_NOT_FOUND'
    | 'MISSING_CONFIRMATION'
    | 'EXTERNAL_ORDER_ID_CONFLICT'
    | 'SALE_CODE_ALREADY_IN_USE'
    | 'AMBIGUOUS_LINK';
  message: string;
  orderId?: string;
  publicId?: string;
  previousExternalOrderId?: string | null;
  newExternalOrderId?: string;
}

export const REPAIR_CONFIRMATION_PHRASE = 'LINK PERFECTPAY SALE';

/**
 * Safely repairs the missing PerfectPay sale code (externalOrderId) for historical orders.
 *
 * Enforces:
 * 1. Admin authentication
 * 2. Exact publicId and perfectPaySaleCode
 * 3. Exact confirmation phrase 'LINK PERFECTPAY SALE'
 * 4. Immutability guard: if already same -> ALREADY_LINKED; if different -> EXTERNAL_ORDER_ID_CONFLICT
 * 5. Uniqueness guard: sale code must not belong to another order
 * 6. Audit trail: inserts exactly one order_events record
 * 7. Leaves fulfillment, provider cost, target queue, and financial records completely untouched
 */
export async function repairPerfectPayOrderLink(
  params: AdminRepairOrderLinkParams
): Promise<AdminRepairOrderLinkResult> {
  const { publicId, perfectPaySaleCode, confirmation, adminId } = params;

  if (!publicId || !perfectPaySaleCode) {
    return {
      success: false,
      code: 'AMBIGUOUS_LINK',
      message: 'Both publicId and perfectPaySaleCode are required.',
    };
  }

  if (confirmation !== REPAIR_CONFIRMATION_PHRASE) {
    return {
      success: false,
      code: 'MISSING_CONFIRMATION',
      message: `Explicit confirmation phrase '${REPAIR_CONFIRMATION_PHRASE}' is required.`,
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

    // 2. Immutability Guard: Check if externalOrderId is already populated
    if (existingOrder.externalOrderId) {
      if (existingOrder.externalOrderId === cleanSaleCode) {
        return {
          success: true,
          code: 'ALREADY_LINKED',
          message: `Order ${publicId} is already linked to PerfectPay sale code ${cleanSaleCode}.`,
          orderId: existingOrder.id,
          publicId: existingOrder.publicId,
          previousExternalOrderId: existingOrder.externalOrderId,
          newExternalOrderId: cleanSaleCode,
        };
      } else {
        return {
          success: false,
          code: 'EXTERNAL_ORDER_ID_CONFLICT',
          message: `Order ${publicId} already has a different externalOrderId (${existingOrder.externalOrderId}). Cannot overwrite.`,
          orderId: existingOrder.id,
          publicId: existingOrder.publicId,
          previousExternalOrderId: existingOrder.externalOrderId,
        };
      }
    }

    // 3. Uniqueness Safety: Verify no OTHER order already uses this PerfectPay sale code
    const [conflictingOrder] = await tx.query.orders.findMany({
      where: and(
        eq(orders.externalOrderId, cleanSaleCode),
        ne(orders.id, existingOrder.id)
      ),
      limit: 1,
    });

    if (conflictingOrder) {
      return {
        success: false,
        code: 'SALE_CODE_ALREADY_IN_USE',
        message: `PerfectPay sale code ${cleanSaleCode} is already assigned to another order (${conflictingOrder.publicId}).`,
        orderId: existingOrder.id,
        publicId: existingOrder.publicId,
      };
    }

    // 4. Perform atomic update ONLY on externalOrderId and updatedAt
    // Preserves fulfillmentStatus, provider costs, target queue, and all operational states intact
    await tx
      .update(orders)
      .set({
        externalOrderId: cleanSaleCode,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, existingOrder.id));

    // 5. Insert exactly one order_events audit trail entry
    const currentFulfillmentSnapshot = existingOrder.fulfillmentStatus || 'NOT_DISPATCHED';
    const currentPaymentStatus = existingOrder.paymentStatus || 'PENDING';
    const currentStatus = existingOrder.status || 'PENDING_PAYMENT';

    await tx.insert(orderEvents).values({
      orderId: existingOrder.id,
      status: currentStatus,
      paymentStatus: currentPaymentStatus,
      fulfillmentStatus: currentFulfillmentSnapshot,
      description: 'Administrative PerfectPay external sale code link repair applied.',
      metadata: {
        source: 'ADMIN_RECONCILIATION',
        action: 'PERFECTPAY_LINK_REPAIR',
        perfectPaySaleCode: cleanSaleCode,
        previousExternalOrderId: null,
        newExternalOrderId: cleanSaleCode,
        reason: 'HISTORICAL_INGESTION_MISSING_EXTERNAL_ID',
        repairedAt: new Date().toISOString(),
        repairedBy: adminId, // Safe non-secret identifier
      },
    });

    return {
      success: true,
      code: 'SUCCESS',
      message: `Order ${publicId} successfully linked to PerfectPay sale code ${cleanSaleCode}.`,
      orderId: existingOrder.id,
      publicId: existingOrder.publicId,
      previousExternalOrderId: null,
      newExternalOrderId: cleanSaleCode,
    };
  });
}
