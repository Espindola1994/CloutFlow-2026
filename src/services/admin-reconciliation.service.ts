import { db } from '@/db';
import { orders, orderEvents } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface AdminReconcileRefundParams {
  publicId: string;
  perfectPaySaleCode: string;
  confirmationPhrase: string;
  adminId: string;
}

export interface AdminReconcileRefundResult {
  success: boolean;
  code:
    | 'SUCCESS'
    | 'ALREADY_RECONCILED'
    | 'ORDER_NOT_FOUND'
    | 'WRONG_SALE_CODE'
    | 'MISSING_CONFIRMATION'
    | 'INVALID_STATUS';
  message: string;
  orderId?: string;
}

export async function adminReconcileRefund(
  params: AdminReconcileRefundParams
): Promise<AdminReconcileRefundResult> {
  const { publicId, perfectPaySaleCode, confirmationPhrase, adminId } = params;

  if (confirmationPhrase !== 'RECONCILE REFUND') {
    return {
      success: false,
      code: 'MISSING_CONFIRMATION',
      message: "Explicit confirmation phrase 'RECONCILE REFUND' is required.",
    };
  }

  return await db.transaction(async (tx) => {
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

    if (existingOrder.externalOrderId !== perfectPaySaleCode) {
      return {
        success: false,
        code: 'WRONG_SALE_CODE',
        message: 'Provided PerfectPay sale code does not match the order.',
      };
    }

    if (existingOrder.paymentStatus === 'REFUNDED') {
      return {
        success: true,
        code: 'ALREADY_RECONCILED',
        message: 'Order is already REFUNDED. No changes made.',
        orderId: existingOrder.id,
      };
    }

    const previousPaymentStatus = existingOrder.paymentStatus;
    const currentFulfillmentSnapshot = existingOrder.fulfillmentStatus || 'NOT_DISPATCHED';

    await tx
      .update(orders)
      .set({
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, existingOrder.id));

    await tx.insert(orderEvents).values({
      orderId: existingOrder.id,
      status: 'CANCELLED',
      paymentStatus: 'REFUNDED',
      fulfillmentStatus: currentFulfillmentSnapshot,
      description: 'Administrative refund reconciliation applied.',
      metadata: {
        source: 'ADMIN_RECONCILIATION',
        gateway: 'perfectpay',
        perfectPaySaleCode: perfectPaySaleCode,
        previousPaymentStatus: previousPaymentStatus,
        newPaymentStatus: 'REFUNDED',
        reason: 'MISSING_GATEWAY_REFUND_WEBHOOK',
        reconciledAt: new Date().toISOString(),
        reconciledBy: adminId, // Safe non-secret identifier
      },
    });

    return {
      success: true,
      code: 'SUCCESS',
      message: 'Order successfully reconciled as REFUNDED.',
      orderId: existingOrder.id,
    };
  });
}
