import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { plans, services, platforms } from '@/db/schema/catalog';
import { offers } from '@/db/schema/offers';
import { fulfillmentChains, fulfillmentChainServices } from '@/db/schema/fulfillment-chains';
import { supplierRateSnapshots } from '@/db/schema/supplier-routing';
import { CLOUTFLOW_CATALOG_PACKAGES, DEFAULT_FINANCIAL_PROTECTION_RULES, CRITICAL_CARD_CEILING_OVERRIDES } from '@/config/financial-protection.config';
import { calculateCostCeiling, calculateSupplierCost, calculateGrossProfit, calculateGrossMarginPercent } from '@/lib/routing/financial-routing';

export const dynamic = 'force-dynamic';

export const CANONICAL_SUPPLIER_ROUTING: Record<string, { primary: string; fallback1: string; fallback2: string | null }> = {
  'instagram:followers': {
    primary: '31714',
    fallback1: '31849',
    fallback2: '31850',
  },
  'instagram:likes': {
    primary: '31783',
    fallback1: '31784',
    fallback2: '31785',
  },
  'instagram:views': {
    primary: '26641',
    fallback1: '16453',
    fallback2: '14863',
  },
  'tiktok:followers': {
    primary: '30159',
    fallback1: '32771',
    fallback2: '33105',
  },
  'tiktok:likes': {
    primary: '31040',
    fallback1: '30163',
    fallback2: '31264',
  },
  'tiktok:views': {
    primary: '32011',
    fallback1: '29890',
    fallback2: '31761',
  },
  'twitter:followers': {
    primary: '33882',
    fallback1: '33608',
    fallback2: '33883',
  },
  'twitter:likes': {
    primary: '33478',
    fallback1: '33696',
    fallback2: null,
  },
  'twitter:views': {
    primary: '29863',
    fallback1: '29859',
    fallback2: '9276',
  },
  'youtube:likes': {
    primary: '33471',
    fallback1: '33528',
    fallback2: '33529',
  },
  'youtube:views': {
    primary: '33451',
    fallback1: '30202',
    fallback2: '30751',
  },
};

export const TARGET_SUPPLIER_IDS = [
  '31714', '31849', '31850',
  '31783', '31784', '31785',
  '26641', '16453', '14863',
  '30159', '32771', '33105',
  '31040', '30163', '31264',
  '32011', '29890', '31761',
  '33882', '33608', '33883',
  '33478', '33696',
  '29863', '29859', '9276',
  '33471', '33528', '33529',
  '33451', '30202', '30751',
];

/**
 * GET: Verifies Peakerr Services (read-only getServices) for all 32 Canonical IDs
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const isConfigured = peakerrClient.isConfigured();
    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Peakerr API Key is not configured on server.',
        isConfigured: false,
      }, { status: 500 });
    }

    const servicesRes = await peakerrClient.getServices();
    if (!Array.isArray(servicesRes)) {
      return NextResponse.json({
        success: false,
        error: (servicesRes as any)?.error || 'Peakerr returned non-array response',
      }, { status: 500 });
    }

    const serviceMap = new Map<string, any>();
    for (const s of servicesRes) {
      serviceMap.set(String(s.service), s);
    }

    const verificationResults = TARGET_SUPPLIER_IDS.map((id) => {
      const found = serviceMap.get(id);
      if (found) {
        return {
          id,
          name: found.name,
          category: found.category,
          rate: parseFloat(String(found.rate || '0')),
          min: found.min ? parseInt(String(found.min), 10) : null,
          max: found.max ? parseInt(String(found.max), 10) : null,
          type: found.type,
          exists: true,
          status: 'AVAILABLE',
        };
      }
      return {
        id,
        name: 'NOT_FOUND_IN_PEAKERR',
        category: null,
        rate: null,
        min: null,
        max: null,
        type: null,
        exists: false,
        status: 'UNAVAILABLE',
      };
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalTargetIds: TARGET_SUPPLIER_IDS.length,
      availableCount: verificationResults.filter((r) => r.exists).length,
      unavailableCount: verificationResults.filter((r) => !r.exists).length,
      services: verificationResults,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Error verifying Peakerr services',
    }, { status: 500 });
  }
}
