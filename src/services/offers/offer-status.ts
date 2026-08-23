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
