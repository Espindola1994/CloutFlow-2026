import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getAutoDispatchCandidates } from '@/services/fulfillment-auto-dispatch.service';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50));

    const candidates = await getAutoDispatchCandidates(limit);

    return NextResponse.json({
      success: true,
      data: candidates,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized access.' } },
        { status: 401 }
      );
    }

    console.error('[AdminAutoDispatchCandidatesAPI] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error fetching candidates.' } },
      { status: 500 }
    );
  }
}
