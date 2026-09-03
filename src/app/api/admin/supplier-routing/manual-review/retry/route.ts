import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { FinancialControlService } from '@/services/financial-control.service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    const body = await request.json();

    if (!body.orderId) {
      return NextResponse.json({ success: false, message: 'orderId is required' }, { status: 400 });
    }

    const result = await FinancialControlService.retryRouting(
      body.orderId,
      adminUser.id || adminUser.email
    );

    return NextResponse.json(result);
  } catch (error: any) {
    const isAuth = error.message === 'Unauthorized' || error.message === 'Forbidden';
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: isAuth ? 401 : 500 }
    );
  }
}
