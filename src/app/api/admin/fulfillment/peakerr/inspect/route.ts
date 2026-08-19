import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import { db } from '@/db';
import { fulfillmentChains, fulfillmentChainServices } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { PeakerrService } from '@/providers/peakerr/peakerr.types';

export interface ChainSlotAuditResult {
  chainId: string;
  chainName: string;
  platform: string;
  service: string;
  variant: string;
  slotPriority: number;
  slotLabel: 'Primary' | 'Fallback 1' | 'Fallback 2';
  providerServiceId: string;
  configuredMin: number;
  configuredMax: number;
  status: 'FOUND' | 'NOT_FOUND' | 'SERVICE_CHAIN_MISMATCH';
  minMaxStatus: 'MATCH' | 'MIN_MAX_MISMATCH' | 'UNKNOWN';
  eligibleFor2000: 'ELIGIBLE_FOR_2000' | 'INELIGIBLE_FOR_2000' | 'UNKNOWN';
  specialPayloadRequired: boolean;
  mismatchReason?: string;
  peakerrDetails?: {
    serviceId: string;
    name: string;
    category: string;
    type: string;
    rate: string | number;
    min: string | number;
    max: string | number;
    refill: boolean | string | number;
    cancel: boolean | string | number;
  };
}

/**
 * Validates if a Peakerr service name/category is compatible with a given platform and service.
 */
function checkServiceCompatibility(
  platform: string,
  service: string,
  peakerrItem: PeakerrService
): { compatible: boolean; reason?: string } {
  const p = platform.toLowerCase();
  const s = service.toLowerCase();
  const name = (peakerrItem.name || '').toLowerCase();
  const category = (peakerrItem.category || '').toLowerCase();
  const combined = `${category} ${name}`;

  // 1. Platform checks
  if (p === 'instagram' && !combined.includes('instagram') && !combined.includes('ig')) {
    return { compatible: false, reason: 'Name/Category does not mention Instagram.' };
  }
  if (p === 'tiktok' && !combined.includes('tiktok') && !combined.includes('tt')) {
    return { compatible: false, reason: 'Name/Category does not mention TikTok.' };
  }
  if (p === 'youtube' && !combined.includes('youtube') && !combined.includes('yt')) {
    return { compatible: false, reason: 'Name/Category does not mention YouTube.' };
  }
  if (p === 'twitter' && !combined.includes('twitter') && !combined.includes(' x ') && !combined.startsWith('x ') && !combined.includes('x [') && !combined.includes('x -') && !combined.includes('tweets')) {
    return { compatible: false, reason: 'Name/Category does not mention Twitter/X.' };
  }

  // 2. Service checks
  if (s === 'followers' && !combined.includes('follower') && !combined.includes('sub') && !combined.includes('member')) {
    return { compatible: false, reason: 'Name/Category does not mention Followers/Subscribers.' };
  }
  if (s === 'likes' && !combined.includes('like') && !combined.includes('heart') && !combined.includes('favorite') && !combined.includes('fav')) {
    return { compatible: false, reason: 'Name/Category does not mention Likes/Hearts.' };
  }
  if (s === 'views' && !combined.includes('view') && !combined.includes('play') && !combined.includes('impression')) {
    return { compatible: false, reason: 'Name/Category does not mention Views/Plays.' };
  }
  if (s === 'comments' && !combined.includes('comment') && !combined.includes('repl')) {
    return { compatible: false, reason: 'Name/Category does not mention Comments/Replies.' };
  }

  return { compatible: true };
}

/**
 * Checks if a service requires custom/special payloads (e.g. Custom Comments, Custom List).
 */
function isSpecialPayloadService(peakerrItem: PeakerrService, service: string): boolean {
  const type = (peakerrItem.type || '').toLowerCase();
  const name = (peakerrItem.name || '').toLowerCase();
  
  if (type.includes('custom') || type.includes('comments') || type.includes('package') || type.includes('poll')) {
    return true;
  }
  if (service.toLowerCase() === 'comments' && (name.includes('custom') || name.includes('random') || type !== 'default')) {
    return true;
  }
  return false;
}

export async function POST() {
  try {
    await requireAdmin();

    // 1. Runtime environment inspection (API key presence, NEVER revealing the key)
    const apiKeyPresent = peakerrClient.isConfigured();
    const liveFulfillment = peakerrClient.isLiveEnabled();
    const webhookVerified = process.env.PERFECTPAY_WEBHOOK_VERIFIED === 'true';

    if (!apiKeyPresent) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'PEAKERR_API_KEY_MISSING',
          message: 'PEAKERR_API_KEY is not configured in server environment.',
        },
        runtime: {
          apiKeyPresent: false,
          liveFulfillment,
          webhookVerified,
        },
      }, { status: 400 });
    }

    // 2. Fetch Balance (READ-ONLY)
    const balanceResult = await peakerrClient.getBalance();
    const isBalanceOk = !('error' in balanceResult);

    // 3. Fetch Services (READ-ONLY)
    const servicesResult = await peakerrClient.getServices();
    const isServicesOk = Array.isArray(servicesResult);
    const servicesList: PeakerrService[] = isServicesOk ? (servicesResult as PeakerrService[]) : [];

    // Map Peakerr services by string ID for fast lookup
    const catalogMap = new Map<string, PeakerrService>();
    servicesList.forEach((s) => {
      catalogMap.set(String(s.service), s);
    });

    // 4. Fetch all existing chains from Supabase database
    const allChains = await db.select().from(fulfillmentChains).orderBy(desc(fulfillmentChains.createdAt));
    const allServices = await db.select().from(fulfillmentChainServices);

    const slotLabels: Record<number, 'Primary' | 'Fallback 1' | 'Fallback 2'> = {
      1: 'Primary',
      2: 'Fallback 1',
      3: 'Fallback 2',
    };

    // 5. Audit all configured slots against live Peakerr catalog
    const auditResults: ChainSlotAuditResult[] = [];
    let totalSlotsAudit = 0;
    let foundCount = 0;
    let notFoundCount = 0;
    let mismatchCount = 0;
    let minMaxMismatchCount = 0;

    allChains.forEach((chain) => {
      const chainSlots = allServices.filter((s) => s.chainId === chain.id);

      chainSlots.forEach((slot) => {
        totalSlotsAudit++;
        const sId = String(slot.providerServiceId).trim();
        const peakerrItem = catalogMap.get(sId);

        if (!peakerrItem) {
          notFoundCount++;
          auditResults.push({
            chainId: chain.id,
            chainName: chain.name,
            platform: chain.platform,
            service: chain.service,
            variant: chain.variant,
            slotPriority: slot.priority,
            slotLabel: slotLabels[slot.priority] || 'Primary',
            providerServiceId: sId,
            configuredMin: slot.minQuantity,
            configuredMax: slot.maxQuantity,
            status: 'NOT_FOUND',
            minMaxStatus: 'UNKNOWN',
            eligibleFor2000: 'UNKNOWN',
            specialPayloadRequired: false,
            mismatchReason: `Service ID ${sId} not found in Peakerr live catalog (${servicesList.length} services scanned).`,
          });
        } else {
          // Check semantic compatibility
          const comp = checkServiceCompatibility(chain.platform, chain.service, peakerrItem);
          const realMin = Number(peakerrItem.min);
          const realMax = Number(peakerrItem.max);
          const minMaxMatch = (!isNaN(realMin) && !isNaN(realMax)) && (slot.minQuantity >= realMin && slot.maxQuantity <= realMax);
          const eligible2k = (!isNaN(realMin) && !isNaN(realMax)) && (2000 >= realMin && 2000 <= realMax);
          const specialPayload = isSpecialPayloadService(peakerrItem, chain.service);

          if (!comp.compatible) {
            mismatchCount++;
          } else {
            foundCount++;
          }

          if (!minMaxMatch) {
            minMaxMismatchCount++;
          }

          auditResults.push({
            chainId: chain.id,
            chainName: chain.name,
            platform: chain.platform,
            service: chain.service,
            variant: chain.variant,
            slotPriority: slot.priority,
            slotLabel: slotLabels[slot.priority] || 'Primary',
            providerServiceId: sId,
            configuredMin: slot.minQuantity,
            configuredMax: slot.maxQuantity,
            status: comp.compatible ? 'FOUND' : 'SERVICE_CHAIN_MISMATCH',
            minMaxStatus: minMaxMatch ? 'MATCH' : 'MIN_MAX_MISMATCH',
            eligibleFor2000: eligible2k ? 'ELIGIBLE_FOR_2000' : 'INELIGIBLE_FOR_2000',
            specialPayloadRequired: specialPayload,
            mismatchReason: comp.reason,
            peakerrDetails: {
              serviceId: String(peakerrItem.service),
              name: peakerrItem.name,
              category: peakerrItem.category,
              type: peakerrItem.type,
              rate: peakerrItem.rate,
              min: peakerrItem.min,
              max: peakerrItem.max,
              refill: peakerrItem.refill,
              cancel: peakerrItem.cancel,
            },
          });
        }
      });
    });

    return NextResponse.json({
      success: true,
      runtime: {
        apiKeyPresent: true,
        liveFulfillment,
        webhookVerified,
      },
      connection: {
        connected: isBalanceOk && isServicesOk,
        balance: isBalanceOk ? (balanceResult as any).balance : null,
        currency: isBalanceOk ? (balanceResult as any).currency || 'USD' : 'USD',
        servicesCount: servicesList.length,
        balanceError: !isBalanceOk ? (balanceResult as any).error : null,
        servicesError: !isServicesOk ? (servicesResult as any).error : null,
        lastCheckedAt: new Date().toISOString(),
      },
      audit: {
        totalChains: allChains.length,
        totalSlotsAudit,
        foundCount,
        notFoundCount,
        mismatchCount,
        minMaxMismatchCount,
        slots: auditResults,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }
    console.error('[PeakerrInspectAPI] Error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error during Peakerr inspection.' } }, { status: 500 });
  }
}
