import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getCrmContactDetail } from '@/services/crm/crm.service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ identity: string }> }
) {
  try {
    await requireAdmin();

    const { identity } = await params;
    const decodedEmail = decodeURIComponent(identity);

    const contact = await getCrmContactDetail(decodedEmail);

    if (!contact) {
      return NextResponse.json(
        { success: false, error: { message: 'Contact not found' } },
        {
          status: 404,
          headers: { 'Cache-Control': 'no-store' }
        }
      );
    }

    return NextResponse.json(
      { success: true, data: { contact } },
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

    console.error('[Admin CRM] Error getting contact detail:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' }
      }
    );
  }
}
