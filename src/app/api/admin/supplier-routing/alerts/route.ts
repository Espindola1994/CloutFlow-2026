import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { FinancialControlService } from '@/services/financial-control.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const searchParams = request.nextUrl.searchParams;
    const onlyUnresolved = searchParams.get('unresolved') === 'true';

    const alerts = await FinancialControlService.getAlerts(onlyUnresolved);
    return NextResponse.json({ success: true, data: alerts, count: alerts.length });
  } catch (error: any) {
    const isAuth = error.message === 'Unauthorized' || error.message === 'Forbidden';
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: isAuth ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    const body = await request.json();

    if (!body.alertId || !body.action) {
      return NextResponse.json(
        { success: false, message: 'alertId and action (RESOLVE or DISMISS) are required' },
        { status: 400 }
      );
    }

    const ok = await FinancialControlService.resolveAlert(
      body.alertId,
      adminUser.id || adminUser.email,
      body.action
    );

    return NextResponse.json({ success: ok });
  } catch (error: any) {
    const isAuth = error.message === 'Unauthorized' || error.message === 'Forbidden';
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: isAuth ? 401 : 500 }
    );
  }
}
