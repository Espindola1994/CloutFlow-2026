export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getAdminLiveWorldData } from '@/services/admin-live-world.service';

/**
 * GET /api/admin/live-world
 * 
 * Admin-only real-time global activity API for Live World visualization.
 * 
 * Security:
 * - Protected by requireAdmin(request) (Admin session + 2FA enforced)
 * - Read-only: absolutely no mutations, orders creation, fulfillment, or external API calls
 * - Zero PII: no email, phone, IP, username, profileUrl, visitorId, or sessionId
 * - Cache-Control: no-store (live polling ready)
 */
export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const data = await getAdminLiveWorldData();

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

    console.error('[AdminLiveWorldAPI] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
