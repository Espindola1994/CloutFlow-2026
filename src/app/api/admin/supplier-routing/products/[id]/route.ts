import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { FinancialControlService } from '@/services/financial-control.service';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const result = await FinancialControlService.updateProductFinancialRules({
      planId: id,
      adminUserId: adminUser.id || adminUser.email,
      priorityServiceId: body.priorityServiceId,
      fallback1ServiceId: body.fallback1ServiceId,
      fallback2ServiceId: body.fallback2ServiceId,
      minimumGrossMarginPercent: body.minimumGrossMarginPercent !== undefined ? Number(body.minimumGrossMarginPercent) : undefined,
      minimumGrossProfit: body.minimumGrossProfit !== undefined ? Number(body.minimumGrossProfit) : undefined,
      maxSupplierCostAbsolute: body.maxSupplierCostAbsolute !== undefined ? (body.maxSupplierCostAbsolute === null ? null : Number(body.maxSupplierCostAbsolute)) : undefined,
      costCeilingEnabled: body.costCeilingEnabled,
      manualReviewEnabled: body.manualReviewEnabled,
      confirmedReduction: body.confirmedReduction === true,
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
