import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { submitOrderToPeakerrManual } from '@/services/fulfillment.service';
import { z } from 'zod';

const submitSchema = z.object({
  confirmation: z.literal('SUBMIT', {
    message: 'Explicit confirmation typing "SUBMIT" is required.',
  }),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Strict Admin Authentication Guard
    await requireAdmin();
    const { id } = await params;
    const cleanId = (id || '').trim();

    // 2. Validate explicit confirmation payload
    const body = await request.json().catch(() => ({}));
    submitSchema.parse(body);

    // 3. Execute live manual submit with all server-side reload & atomic claim rules
    const result = await submitOrderToPeakerrManual(cleanId);

    if (!result.success) {
      const status = result.code === 'LIVE_FULFILLMENT_DISABLED' ? 403 : 422;
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.code || 'SUBMIT_FAILED',
            message: result.error,
            isAmbiguous: result.isAmbiguous || false,
          },
        },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CONFIRMATION',
            message: error.issues[0]?.message || 'Invalid confirmation input.',
          },
        },
        { status: 400 }
      );
    }

    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized access.' } },
        { status: 401 }
      );
    }

    console.error('[AdminFulfillmentSubmitAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error during fulfillment submit.' } },
      { status: 500 }
    );
  }
}
