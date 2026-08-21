import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { repairPerfectPayOrderLink, REPAIR_CONFIRMATION_PHRASE } from '@/services/admin-order-link.service';

const repairOrderLinkSchema = z.object({
  publicId: z.string().min(1, 'publicId is required'),
  perfectPaySaleCode: z.string().min(1, 'perfectPaySaleCode is required'),
  confirmation: z.literal(REPAIR_CONFIRMATION_PHRASE, {
    message: `confirmation must be explicitly '${REPAIR_CONFIRMATION_PHRASE}'`,
  }),
});

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdmin();

    const body = await request.json();
    const validated = repairOrderLinkSchema.parse(body);

    const result = await repairPerfectPayOrderLink({
      publicId: validated.publicId,
      perfectPaySaleCode: validated.perfectPaySaleCode,
      confirmation: validated.confirmation,
      adminId: adminUser.id,
    });

    if (!result.success) {
      const statusCode =
        result.code === 'ORDER_NOT_FOUND'
          ? 404
          : result.code === 'MISSING_CONFIRMATION' || result.code === 'AMBIGUOUS_LINK'
          ? 400
          : result.code === 'EXTERNAL_ORDER_ID_CONFLICT' || result.code === 'SALE_CODE_ALREADY_IN_USE'
          ? 409
          : 422;

      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.code,
            message: result.message,
            orderId: result.orderId,
            publicId: result.publicId,
            previousExternalOrderId: result.previousExternalOrderId,
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
        publicId: result.publicId,
        previousExternalOrderId: result.previousExternalOrderId,
        newExternalOrderId: result.newExternalOrderId,
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

    console.error('[AdminOrderLinkRepairAPI] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error during order link repair',
        },
      },
      { status: 500 }
    );
  }
}
