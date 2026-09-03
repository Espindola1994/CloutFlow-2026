import { db } from '../db';
import { supplierRateSnapshots, adminAlerts } from '../db/schema/supplier-routing';
import { peakerrClient } from '../providers/peakerr/peakerr.client';
import { eq, sql } from 'drizzle-orm';

export interface RateSnapshot {
  supplierServiceId: string;
  rate: number;
  currency: string;
  minQuantity: number | null;
  maxQuantity: number | null;
  previousRate: number | null;
  lastPriceChangePercent: number | null;
  fetchedAt: Date;
  status: 'FRESH' | 'CACHED' | 'STALE' | 'UNKNOWN';
  ageMinutes: number;
}

export interface RateRefreshResult {
  totalProcessed: number;
  updatedCount: number;
  alertCount: number;
  errors?: string[];
}

export const RATE_CONFIG = {
  supplierRateMaxAgeMinutes: 30,
  supplierRateIncreaseAlertPercent: 15,
};

export class SupplierRateMonitorService {
  /**
   * Determine rate status based on fetchedAt timestamp.
   * <= 30 min: FRESH / CACHED
   * > 30 min: STALE
   */
  public static calculateRateFreshness(fetchedAt: Date | string | null): {
    status: 'FRESH' | 'CACHED' | 'STALE' | 'UNKNOWN';
    ageMinutes: number;
  } {
    if (!fetchedAt) {
      return { status: 'UNKNOWN', ageMinutes: Infinity };
    }

    const date = typeof fetchedAt === 'string' ? new Date(fetchedAt) : fetchedAt;
    const ageMs = Date.now() - date.getTime();
    const ageMinutes = Math.max(0, Math.floor(ageMs / (1000 * 60)));

    if (ageMinutes <= 5) {
      return { status: 'FRESH', ageMinutes };
    }
    if (ageMinutes <= RATE_CONFIG.supplierRateMaxAgeMinutes) {
      return { status: 'CACHED', ageMinutes };
    }
    return { status: 'STALE', ageMinutes };
  }

  /**
   * Calculate percentage increase between previous rate and current rate.
   * Returns positive percentage if price increased, or null/0 if no increase.
   */
  public static calculateRateIncreasePercent(previousRate: number, currentRate: number): number {
    if (previousRate <= 0) return 0;
    const diff = currentRate - previousRate;
    return Number(((diff / previousRate) * 100).toFixed(2));
  }

  /**
   * Get all cached rate snapshots from database.
   */
  public static async getAllCachedRates(): Promise<Map<string, RateSnapshot>> {
    const rateMap = new Map<string, RateSnapshot>();

    try {
      const records = await db
        .select()
        .from(supplierRateSnapshots)
        .where(eq(supplierRateSnapshots.provider, 'peakerr'));

      for (const rec of records) {
        const rate = parseFloat(rec.rate);
        const prevRate = rec.previousRate ? parseFloat(rec.previousRate) : null;
        const changePct = rec.lastPriceChangePercent ? parseFloat(rec.lastPriceChangePercent) : null;
        const { status, ageMinutes } = this.calculateRateFreshness(rec.fetchedAt);

        rateMap.set(rec.supplierServiceId, {
          supplierServiceId: rec.supplierServiceId,
          rate,
          currency: rec.currency || 'USD',
          minQuantity: rec.minQuantity,
          maxQuantity: rec.maxQuantity,
          previousRate: prevRate,
          lastPriceChangePercent: changePct,
          fetchedAt: rec.fetchedAt,
          status,
          ageMinutes,
        });
      }
    } catch (error) {
      console.error('[RateMonitor] Error fetching cached rates:', error);
    }

    return rateMap;
  }

  /**
   * Fetch services from Peakerr, update snapshots cache, and trigger rate increase alerts if >= 15%.
   */
  public static async refreshRatesFromProvider(serviceIds?: string[]): Promise<RateRefreshResult> {
    const result: RateRefreshResult = {
      totalProcessed: 0,
      updatedCount: 0,
      alertCount: 0,
      errors: [],
    };

    try {
      // 1. Fetch entire catalog grouped from Peakerr (or filtered)
      const response = await peakerrClient.getServices();
      if (!Array.isArray(response)) {
        throw new Error((response as any)?.error || 'Failed to fetch services from Peakerr');
      }

      const services = response;
      const targetServiceIds = serviceIds ? new Set(serviceIds.map(String)) : null;

      // Existing cached rates
      const existingRates = await this.getAllCachedRates();

      for (const srv of services) {
        const srvId = String(srv.service);
        if (targetServiceIds && !targetServiceIds.has(srvId)) {
          continue;
        }

        result.totalProcessed++;
        const currentRate = parseFloat(String(srv.rate || '0'));
        const minQty = srv.min ? parseInt(String(srv.min), 10) : null;
        const maxQty = srv.max ? parseInt(String(srv.max), 10) : null;

        const existing = existingRates.get(srvId);
        const previousRate = existing ? existing.rate : null;

        let changePercent: number | null = null;
        let isSignificantIncrease = false;

        if (previousRate !== null && previousRate > 0) {
          changePercent = this.calculateRateIncreasePercent(previousRate, currentRate);
          if (changePercent >= RATE_CONFIG.supplierRateIncreaseAlertPercent) {
            isSignificantIncrease = true;
          }
        }

        const now = new Date();

        // Upsert into DB with table resilience (never throwing uncaught relation errors)
        try {
          if (existing) {
            await db
              .update(supplierRateSnapshots)
              .set({
                rate: currentRate.toFixed(6),
                minQuantity: minQty,
                maxQuantity: maxQty,
                previousRate: previousRate !== null ? previousRate.toFixed(6) : null,
                lastPriceChangePercent: changePercent !== null ? changePercent.toFixed(2) : null,
                fetchedAt: now,
                updatedAt: now,
              })
              .where(eq(supplierRateSnapshots.supplierServiceId, srvId));
          } else {
            await db.insert(supplierRateSnapshots).values({
              provider: 'peakerr',
              supplierServiceId: srvId,
              rate: currentRate.toFixed(6),
              currency: 'USD',
              minQuantity: minQty,
              maxQuantity: maxQty,
              previousRate: null,
              lastPriceChangePercent: null,
              fetchedAt: now,
              createdAt: now,
              updatedAt: now,
            });
          }

          result.updatedCount++;
        } catch (dbErr: any) {
          // If table does not exist or transient connection error, log safely
          console.error(`[RateMonitor] Database write error for service ${srvId}:`, dbErr.message || dbErr);
          if (!result.errors?.includes(dbErr.message || 'DATABASE_WRITE_FAILED')) {
            result.errors?.push(dbErr.message || 'DATABASE_WRITE_FAILED');
          }
        }

        // Trigger Alert if increase >= 15%
        if (isSignificantIncrease && changePercent !== null) {
          result.alertCount++;
          try {
            await db.insert(adminAlerts).values({
              type: 'RATE_INCREASE',
              severity: 'WARNING',
              title: `Rate Increase Alert: Supplier Service ${srvId}`,
              message: `Service ${srv.name || srvId} increased by +${changePercent}% (from $${previousRate?.toFixed(4)} to $${currentRate.toFixed(4)}/K)`,
              metadata: {
                supplierServiceId: srvId,
                serviceName: srv.name,
                previousRate,
                currentRate,
                increasePercent: changePercent,
              },
              resolved: false,
              dismissed: false,
              createdAt: now,
              updatedAt: now,
            });
          } catch (alertErr: any) {
            console.error('[RateMonitor] Error creating rate increase alert:', alertErr.message || alertErr);
          }
        }
      }
    } catch (err: any) {
      console.error('[RateMonitor] Refresh error:', err);
      result.errors?.push(err.message || String(err));
    }

    return result;
  }
}
