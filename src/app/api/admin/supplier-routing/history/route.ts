import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { FinancialControlService } from '@/services/financial-control.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const platform = searchParams.get('platform') || undefined;
    const service = searchParams.get('service') || undefined;
    const decision = searchParams.get('decision') || undefined;
    const position = searchParams.get('position') || undefined;
    const supplierId = searchParams.get('supplierId') || undefined;

    const result = await FinancialControlService.getSupplierAttemptHistory({
      page,
      pageSize,
      platform,
      service,
      decision,
      position,
      supplierId,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    const isAuth = error.message === 'Unauthorized' || error.message === 'Forbidden';
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: isAuth ? 401 : 500 }
    );
  }
}
