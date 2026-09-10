export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getAdminAnalyticsData } from '@/services/admin-analytics.service';

/**
 * GET /api/admin/analytics
 * Read-only analytics endpoint for CloutFlow Admin.
 * Strictly protected by requireAdmin (session + 2FA).
 * Absolutely no mutations, side-effects, or external API calls.
 */
export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    const data = await getAdminAnalyticsData(range);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }
    console.error('[AdminAnalyticsAPI] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
