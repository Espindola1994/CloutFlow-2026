import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { FinancialControlService } from '@/services/financial-control.service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    const body = await request.json();

    if (!body.orderId || !body.supplierId || body.supplierCost === undefined) {
      return NextResponse.json(
        { success: false, message: 'orderId, supplierId, and supplierCost are required' },
        { status: 400 }
      );
    }

    const result = await FinancialControlService.manualSupplierOverride({
      orderId: body.orderId,
      supplierId: String(body.supplierId),
      supplierCost: Number(body.supplierCost),
      reason: body.reason || '',
      adminUserId: adminUser.id || adminUser.email,
      confirmedViolation: body.confirmedViolation === true,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    const isAuth = error.message === 'Unauthorized' || error.message === 'Forbidden';
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: isAuth ? 401 : 500 }
    );
  }
}
