import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { SupplierRateMonitorService } from '@/services/supplier-rate-monitor.service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // empty body is fine
    }

    const result = await SupplierRateMonitorService.refreshRatesFromProvider(body.serviceIds);

    // If there were any errors during execution, return them clearly with status 200/500
    if (result.errors && result.errors.length > 0) {
      console.error('[SupplierRoutingRatesRefresh] Provider or DB errors during refresh:', result.errors);
      return NextResponse.json(
        {
          success: false,
          code: 'RATE_REFRESH_FAILED',
          error: result.errors.join(' | '),
          provider: 'peakerr',
          timestamp: new Date().toISOString(),
          data: result,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      code: 'RATES_REFRESHED_SUCCESS',
      provider: 'peakerr',
      timestamp: new Date().toISOString(),
      data: result,
    });
  } catch (error: any) {
    const isAuth = error.message === 'Unauthorized' || error.message === 'Forbidden';
    const errorCode = isAuth
      ? 'UNAUTHORIZED'
      : error.code === 'PEAKERR_AUTH_FAILED'
      ? 'PEAKERR_AUTH_FAILED'
      : error.code === 'PEAKERR_TIMEOUT'
      ? 'PEAKERR_TIMEOUT'
      : error.code === '42P01' || (error.message && error.message.includes('relation') && error.message.includes('does not exist'))
      ? 'DATABASE_TABLE_MISSING'
      : 'RATE_REFRESH_FAILED';

    console.error('[SupplierRoutingRatesRefresh] Fatal error:', error);

    return NextResponse.json(
      {
        success: false,
        code: errorCode,
        error: error.message || 'Internal server error while refreshing supplier rates',
        provider: 'peakerr',
        timestamp: new Date().toISOString(),
      },
      { status: isAuth ? 401 : 500 }
    );
  }
}
