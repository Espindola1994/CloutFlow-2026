import { OFFICIAL_PERFECTPAY_66_DATASET } from './official-perfectpay-dataset';
import { normalizePlatform, normalizeService, normalizePlan, buildCanonicalOfferId } from '../services/commercial-offer.resolver';

export interface BackfillRecord {
  id: string;
  platform?: string | null;
  service?: string | null;
  planName?: string | null;
  quantity?: number | null;
  perfectpayProductId?: string | null;
  perfectpayPlanId?: string | null;
  offerId?: string | null;
}

export interface BackfillResult {
  canBackfill: boolean;
  canonicalOfferId: string | null;
  reason: string;
}

/**
 * Pure, safe resolver for historical records backfill.
 * Strictly avoids guessing:
 * Returns canonicalOfferId ONLY when there is an unequivocal match by:
 * 1. Exact PerfectPay Product Code + Plan Code from official 66 dataset
 * 2. OR exact platform + service + plan/quantity corresponding to exactly one canonical offer.
 * If ambiguous or unresolvable, leaves NULL.
 * The historical evidence order '219a37e9-83de-4a0c-b8cc-9c4ef1453311' is protected.
 */
export function resolveSafeHistoricalBackfill(record: BackfillRecord): BackfillResult {
  // Never modify old evidence order
  if (record.id === '219a37e9-83de-4a0c-b8cc-9c4ef1453311') {
    return {
      canBackfill: false,
      canonicalOfferId: null,
      reason: 'Protected evidence order: preserved unchanged.',
    };
  }

  // 1. Check match by PerfectPay Product + Plan
  if (record.perfectpayProductId && record.perfectpayPlanId) {
    const match = OFFICIAL_PERFECTPAY_66_DATASET.find(
      (item) =>
        item.productCode === record.perfectpayProductId?.trim() &&
        item.planCode === record.perfectpayPlanId?.trim()
    );
    if (match) {
      return {
        canBackfill: true,
        canonicalOfferId: buildCanonicalOfferId(match.platform, match.service, match.plan),
        reason: `Unequivocal match by PerfectPay codes: ${match.productCode} / ${match.planCode}`,
      };
    }
  }

  // 2. Check match by platform + service + plan/quantity
  if (record.platform && record.service) {
    const plat = normalizePlatform(record.platform);
    const serv = normalizeService(record.service);
    if (plat && serv) {
      if (record.planName) {
        const pl = normalizePlan(record.planName);
        if (pl) {
          const match = OFFICIAL_PERFECTPAY_66_DATASET.find(
            (item) => item.platform === plat && item.service === serv && item.plan === pl
          );
          if (match) {
            return {
              canBackfill: true,
              canonicalOfferId: buildCanonicalOfferId(match.platform, match.service, match.plan),
              reason: `Unequivocal match by platform, service, and plan name: ${plat}/${serv}/${pl}`,
            };
          }
        }
      }
    }
  }

  return {
    canBackfill: false,
    canonicalOfferId: null,
    reason: 'Ambiguous or insufficient data to determine canonical identity unequivocally.',
  };
}
