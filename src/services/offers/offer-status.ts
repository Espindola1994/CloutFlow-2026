/**
 * Canonical offer status and timezone formatting helpers.
 *
 * Expiration rule:
 * 1. If redeemedAt exists OR status === 'REDEEMED' => REDEEMED
 * 2. Else if expiresAt <= current server time => EXPIRED
 * 3. Else if status in ('CANCELED', 'CANCELLED') => CANCELED
 * 4. Else => ACTIVE (or original non-terminal status if before expiration)
 *
 * Timezone:
 * Canonical production timezone: America/Sao_Paulo (UTC-03:00)
 */

export type CanonicalOfferStatus = 'ACTIVE' | 'EXPIRED' | 'REDEEMED' | 'CANCELED' | 'SCHEDULED' | 'CREATED';

export interface OfferStatusInput {
  status?: string | null;
  expiresAt?: Date | string | null;
  redeemedAt?: Date | string | null;
  validFrom?: Date | string | null;
}

export const CANONICAL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Derives the authoritative effective status for an offer at the given reference time (defaults to now).
 */
export function getEffectiveOfferStatus(
  offer: OfferStatusInput,
  now: Date = new Date()
): CanonicalOfferStatus {
  if (offer.redeemedAt || offer.status === 'REDEEMED') {
    return 'REDEEMED';
  }

  if (offer.status === 'CANCELED' || offer.status === 'CANCELLED') {
    return 'CANCELED';
  }

  if (offer.expiresAt) {
    const expDate = typeof offer.expiresAt === 'string' ? new Date(offer.expiresAt) : offer.expiresAt;
    if (!isNaN(expDate.getTime()) && expDate.getTime() <= now.getTime()) {
      return 'EXPIRED';
    }
  }

  if (offer.status === 'SCHEDULED' || offer.status === 'CREATED') {
    if (offer.validFrom) {
      const validDate = typeof offer.validFrom === 'string' ? new Date(offer.validFrom) : offer.validFrom;
      if (!isNaN(validDate.getTime()) && validDate.getTime() > now.getTime()) {
        return offer.status as CanonicalOfferStatus;
      }
    }
  }

  return 'ACTIVE';
}

/**
 * Checks if an offer is currently valid and usable.
 */
export function isOfferActive(offer: OfferStatusInput, now: Date = new Date()): boolean {
  return getEffectiveOfferStatus(offer, now) === 'ACTIVE';
}

/**
 * Formats a timestamp into canonical America/Sao_Paulo format.
 * Format example: "Aug 23, 8:31 PM (UTC-03)" or "23/08/2026 20:31:36 (UTC-03)"
 */
export function formatOfferDateTime(
  dateInput: Date | string | null | undefined,
  options?: {
    includeSeconds?: boolean;
    style?: 'email' | 'admin';
  }
): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  const style = options?.style || 'admin';

  if (style === 'email') {
    // e.g. "Aug 23, 8:31 PM (UTC-03)"
    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone: CANONICAL_TIMEZONE,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
    return `${formatted} (UTC-03)`;
  }

  // Admin style: e.g. "23/08/2026 20:31:36 (UTC-03)" or "23/08/2026 20:31"
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    timeZone: CANONICAL_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: options?.includeSeconds ? '2-digit' : undefined,
    hour12: false,
  }).format(date);

  return `${formatted} (UTC-03)`;
}

/**
 * Formats remaining duration into US natural countdown format for offer timer badges.
 *
 * Rules:
 * >= 24 hours (diffMs >= 24 * 3600 * 1000):
 *   {days} day/days + {hours} hr/hrs
 *   (e.g., "1 day 4 hrs", "2 days 1 hr")
 *
 * < 24 hours and >= 1 hour (diffMs >= 3600 * 1000):
 *   {hours} hr/hrs + {minutes} min
 *   (e.g., "23 hrs 59 min", "4 hrs 30 min", "1 hr 5 min")
 *
 * < 1 hour and >= 1 minute (diffMs >= 60 * 1000):
 *   {minutes} min + {seconds} sec
 *   (e.g., "59 min 42 sec", "15 min 8 sec", "1 min 5 sec")
 *
 * < 1 minute (diffMs < 60 * 1000):
 *   {seconds} sec
 *   (e.g., "45 sec", "1 sec", "0 sec")
 *
 * Non-positive or negative values are clamped to "0 sec".
 */
export function formatOfferCountdown(diffMs: number): string {
  if (diffMs <= 0 || isNaN(diffMs)) {
    return '0 sec';
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);

  if (days >= 1) {
    const remHours = totalHours % 24;
    const dayStr = days === 1 ? '1 day' : `${days} days`;
    const hrStr = remHours === 1 ? '1 hr' : `${remHours} hrs`;
    return `${dayStr} ${hrStr}`;
  }

  if (totalHours >= 1) {
    const remMinutes = totalMinutes % 60;
    const hrStr = totalHours === 1 ? '1 hr' : `${totalHours} hrs`;
    return `${hrStr} ${remMinutes} min`;
  }

  if (totalMinutes >= 1) {
    const remSeconds = totalSeconds % 60;
    return `${totalMinutes} min ${remSeconds} sec`;
  }

  return `${totalSeconds} sec`;
}

/**
 * Formats an offer's expiration timestamp into US 12-hour clock format (e.g., "5:10 PM", "9:35 AM").
 * Uses the client/browser's local timezone by default, unless explicitly overridden (useful for deterministic tests).
 */
export function formatOfferExpirationClock(
  dateInput: Date | string | null | undefined,
  timeZone?: string
): string | null {
  if (!dateInput) return null;
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return null;

  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  if (timeZone) {
    options.timeZone = timeZone;
  }

  return new Intl.DateTimeFormat('en-US', options).format(date);
}

