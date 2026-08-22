import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import {
  repairPerfectPayOrderAmount,
  REPAIR_AMOUNT_CONFIRMATION_PHRASE,
} from '@/services/admin-order-amount-repair.service';

const repairOrderAmountSchema = z.object({
  publicId: z.string().min(1, 'publicId is required'),
  perfectPaySaleCode: z.string().min(1, 'perfectPaySaleCode is required'),
  expectedCurrentTotalCents: z.number().int().min(0, 'expectedCurrentTotalCents must be a non-negative integer'),
  authoritativeAmountCents: z.number().int().positive('authoritativeAmountCents must be a positive integer'),
  currency: z.literal('USD', {
    message: "currency must be explicitly 'USD'",
  }),
  confirmation: z.literal(REPAIR_AMOUNT_CONFIRMATION_PHRASE, {
    message: `confirmation must be explicitly '${REPAIR_AMOUNT_CONFIRMATION_PHRASE}'`,
  }),
});

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdmin();

    const body = await request.json();
    const validated = repairOrderAmountSchema.parse(body);

    const result = await repairPerfectPayOrderAmount({
      publicId: validated.publicId,
      perfectPaySaleCode: validated.perfectPaySaleCode,
      expectedCurrentTotalCents: validated.expectedCurrentTotalCents,
      authoritativeAmountCents: validated.authoritativeAmountCents,
      currency: validated.currency,
      confirmation: validated.confirmation,
      adminId: adminUser.id,
    });

    if (!result.success) {
      const statusCode =
        result.code === 'ORDER_NOT_FOUND'
          ? 404
          : result.code === 'MISSING_CONFIRMATION' ||
            result.code === 'INVALID_AMOUNT' ||
            result.code === 'INVALID_CURRENCY'
          ? 400
          : result.code === 'AMOUNT_CONFLICT' ||
            result.code === 'EXTERNAL_ORDER_ID_MISMATCH'
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
            previousTotalCents: result.previousTotalCents,
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
        previousSubtotalCents: result.previousSubtotalCents,
        newSubtotalCents: result.newSubtotalCents,
        previousTotalCents: result.previousTotalCents,
        newTotalCents: result.newTotalCents,
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

    console.error('[AdminOrderAmountRepairAPI] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error during order amount repair',
        },
      },
      { status: 500 }
    );
  }
}
