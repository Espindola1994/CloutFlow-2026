import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getCrmContactsList } from '@/services/crm/crm.service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const contacts = await getCrmContactsList();

    return NextResponse.json(
      { success: true, data: { contacts } },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      }
    );
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        {
          status: 401,
          headers: { 'Cache-Control': 'no-store' }
        }
      );
    }

    console.error('[Admin CRM] Error listing contacts:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' }
      }
    );
  }
}
