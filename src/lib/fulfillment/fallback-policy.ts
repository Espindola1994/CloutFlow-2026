import { PeakerrErrorKind } from '@/providers/peakerr/peakerr.types';

/**
 * Categorizes an error message or code from Peakerr into a strict ErrorKind.
 */
export function classifyPeakerrError(errorMessage?: string | null): PeakerrErrorKind {
  if (!errorMessage) return 'UNKNOWN_ERROR';
  const msg = errorMessage.toLowerCase();

  if (msg.includes('api key') || msg.includes('bad key') || msg.includes('invalid key')) {
    return 'BAD_API_KEY';
  }
  if (msg.includes('auth') || msg.includes('unauthorized') || msg.includes('permission')) {
    return 'AUTH_ERROR';
  }
  if (msg.includes('balance') || msg.includes('funds') || msg.includes('not enough money')) {
    return 'INSUFFICIENT_BALANCE';
  }
  if (msg.includes('link') || msg.includes('url') || msg.includes('invalid profile') || msg.includes('private')) {
    return 'INVALID_LINK';
  }
  if (msg.includes('quantity') || msg.includes('min') || msg.includes('max') || msg.includes('amount')) {
    return 'INVALID_QUANTITY';
  }
  if (msg.includes('disabled') || msg.includes('stopped')) {
    return 'SERVICE_DISABLED';
  }
  if (msg.includes('service') || msg.includes('maintenance') || msg.includes('unavailable') || msg.includes('down')) {
    return 'SERVICE_UNAVAILABLE';
  }

  return 'UNKNOWN_ERROR';
}

/**
 * Evaluates whether an error kind is eligible for automated provider fallback.
 * 
 * ALLOWED FALLBACK:
 * - SERVICE_UNAVAILABLE
 * - SERVICE_DISABLED
 * - TEMPORARY_UNAVAILABLE
 * 
 * BLOCKED FALLBACK (Client or Config errors must not trigger fallback):
 * - INVALID_LINK
 * - INVALID_QUANTITY
 * - AUTH_ERROR
 * - BAD_API_KEY
 * - INSUFFICIENT_BALANCE
 */
export function canFallbackOnError(errorKind: PeakerrErrorKind): boolean {
  switch (errorKind) {
    case 'SERVICE_UNAVAILABLE':
    case 'SERVICE_DISABLED':
    case 'TEMPORARY_UNAVAILABLE':
      return true;
    case 'INVALID_LINK':
    case 'INVALID_QUANTITY':
    case 'AUTH_ERROR':
    case 'BAD_API_KEY':
    case 'INSUFFICIENT_BALANCE':
    case 'UNKNOWN_ERROR':
    default:
      return false;
  }
}
