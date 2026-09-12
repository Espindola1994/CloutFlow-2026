export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getAdminLiveWorldHistoryData } from '@/services/admin-live-world-history.service';

/**
 * GET /api/admin/live-world/history
 * 
 * Historical Geo Analytics & Filtering API for Admin Live World (Phase 4A).
 * 
 * Security & Constraints:
 * - Protected by requireAdmin(request) (Admin session + 2FA enforced)
 * - Read-only: absolutely no mutations, orders creation, fulfillment, or external API calls
 * - Zero PII: no email, phone, IP, username, profileUrl, visitorId, or sessionId
 * - Cache-Control: no-store
 * - Strict filter validation with HTTP 400 on invalid input (range, platform, service, country)
 */
export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const rangeInput = searchParams.get('range');
    const platformInput = searchParams.get('platform');
    const serviceInput = searchParams.get('service');
    const countryInput = searchParams.get('country');

    const data = await getAdminLiveWorldHistoryData({
      rangeInput,
      platformInput,
      serviceInput,
      countryInput,
    });

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: { message: err.message } },
        { status: 401 }
      );
    }

    // Validation errors (invalid range, platform, incompatible service, country) -> HTTP 400
    if (
      err.message.startsWith('Invalid range') ||
      err.message.startsWith('Invalid platform') ||
      err.message.startsWith('Invalid service') ||
      err.message.startsWith('Incompatible service') ||
      err.message.startsWith('Invalid country')
    ) {
      return NextResponse.json(
        { success: false, error: { message: err.message } },
        { status: 400 }
      );
    }

    console.error('[AdminLiveWorldHistoryAPI] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
