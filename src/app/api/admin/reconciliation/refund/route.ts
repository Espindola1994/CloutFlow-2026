import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { adminReconcileRefund } from '@/services/admin-reconciliation.service';

const reconcileRefundSchema = z.object({
  publicId: z.string().min(1, 'publicId is required'),
  perfectPaySaleCode: z.string().min(1, 'perfectPaySaleCode is required'),
  targetPaymentStatus: z.literal('REFUNDED', {
    message: "targetPaymentStatus must be explicitly 'REFUNDED'",
  }),
  confirmationPhrase: z.string().min(1, 'confirmationPhrase is required'),
});

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdmin();

    const body = await request.json();
    const validated = reconcileRefundSchema.parse(body);

    const result = await adminReconcileRefund({
      publicId: validated.publicId,
      perfectPaySaleCode: validated.perfectPaySaleCode,
      confirmationPhrase: validated.confirmationPhrase,
      adminId: adminUser.id,
    });

    if (!result.success) {
      const statusCode =
        result.code === 'ORDER_NOT_FOUND'
          ? 404
          : result.code === 'MISSING_CONFIRMATION' || result.code === 'WRONG_SALE_CODE'
          ? 400
          : 422;

      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.code,
            message: result.message,
          },
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        code: result.code,
        message: result.message,
        orderId: result.orderId,
      },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: firstIssue?.message || 'Invalid input data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized access',
          },
        },
        { status: 401 }
      );
    }

    console.error('[AdminReconciliationAPI] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error during reconciliation',
        },
      },
      { status: 500 }
    );
  }
}
