import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { generateFulfillmentPreview } from '@/services/fulfillment-chain.service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    let variant = 'standard';
    try {
      const body = await request.json().catch(() => ({}));
      if (body && typeof body.variant === 'string') {
        variant = body.variant;
      }
    } catch {
      // optional body
    }

    const preview = await generateFulfillmentPreview(id, variant);

    if (!preview.success) {
      return NextResponse.json(
        { success: false, error: preview.error },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: preview,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }
    console.error('[AdminFulfillmentPreviewAPI] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error during fulfillment preview' } },
      { status: 500 }
    );
  }
}
