import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { resolveAndValidateTarget, resolveFulfillmentChainAndPreview } from '@/services/fulfillment-chain.service';
import { z } from 'zod';

const simulatePayloadSchema = z.object({
  platform: z.enum(['instagram', 'tiktok', 'twitter', 'youtube']),
  service: z.enum(['followers', 'likes', 'views', 'comments']),
  variant: z.string().default('standard'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  target: z.string().min(1, 'Target URL or username is required'),
});

export async function POST(request: Request) {
  try {
    // 1. Strict Admin Authentication Guard
    await requireAdmin();

    // 2. Server-side Zod validation
    const body = await request.json();
    const data = simulatePayloadSchema.parse(body);

    // 3. Strict target validation and platform mismatch check
    const targetValidation = resolveAndValidateTarget(data.target, data.platform, data.service);
    if (!targetValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: targetValidation.code,
            message: targetValidation.message,
          },
        },
        { status: 422 }
      );
    }

    // 4. Resolve fulfillment chain from Supabase (Zero mutations, Read-Only Dry Run)
    const simulation = await resolveFulfillmentChainAndPreview({
      platform: data.platform,
      service: data.service,
      variant: data.variant,
      quantity: data.quantity,
      target: targetValidation.target,
      targetType: targetValidation.targetType,
    });

    if (!simulation.success) {
      return NextResponse.json(
        { success: false, error: simulation.error },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: simulation,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: error.issues[0]?.message || 'Invalid simulation input',
            details: error.issues,
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

    console.error('[AdminFulfillmentSimulateAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error during simulation.' } },
      { status: 500 }
    );
  }
}
