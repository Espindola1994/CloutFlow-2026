import { PeakerrErrorKind } from '@/providers/peakerr/peakerr.types';

/**
 * Categorizes an error message or code from Peakerr into a strict ErrorKind.
 */
export function classifyPeakerrError(errorMessage?: string | null): PeakerrErrorKind {
  if (!errorMessage) return 'UNKNOWN_ERROR';
  const msg = errorMessage.toLowerCase();

  if (msg.includes('api key') || msg.includes('bad key') || msg.includes('invalid key') || msg.includes('incorrect key')) {
    return 'BAD_API_KEY';
  }
  if (msg.includes('auth') || msg.includes('unauthorized') || msg.includes('permission') || msg.includes('forbidden')) {
    return 'AUTH_ERROR';
  }
  if (msg.includes('balance') || msg.includes('funds') || msg.includes('not enough money') || msg.includes('credit')) {
    return 'INSUFFICIENT_BALANCE';
  }
  if (msg.includes('link') || msg.includes('url') || msg.includes('invalid profile') || msg.includes('private') || msg.includes('username')) {
    return 'INVALID_LINK';
  }
  if (msg.includes('quantity') || msg.includes('min') || msg.includes('max') || msg.includes('amount') || msg.includes('count')) {
    return 'INVALID_QUANTITY';
  }
  if (msg.includes('disabled') || msg.includes('stopped') || msg.includes('inactive')) {
    return 'SERVICE_DISABLED';
  }
  if (msg.includes('service') && (msg.includes('maintenance') || msg.includes('unavailable') || msg.includes('down') || msg.includes('pause'))) {
    return 'SERVICE_UNAVAILABLE';
  }
  if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('etimedout') || msg.includes('abort') || msg.includes('socket hang up')) {
    return 'AMBIGUOUS_SUBMISSION';
  }

  return 'UNKNOWN_ERROR';
}

/**
 * Evaluates whether an error kind is eligible for automated provider fallback.
 * 
 * STRICT SAFE FALLBACK POLICY:
 * Only errors that unequivocally prove the order was NOT created on the provider are allowed to fallback.
 * 
 * ALLOWED FALLBACK:
 * - SERVICE_UNAVAILABLE (if verified pre-creation)
 * - SERVICE_DISABLED (if verified pre-creation)
 * - TEMPORARY_UNAVAILABLE
 * 
 * BLOCKED FALLBACK:
 * - AMBIGUOUS_SUBMISSION (Network timeout / connection abort / socket drop) -> NEVER FALLBACK (Prevents double dispatch)
 * - INVALID_LINK
 * - INVALID_QUANTITY
 * - AUTH_ERROR
 * - BAD_API_KEY
 * - INSUFFICIENT_BALANCE
 * - UNKNOWN_ERROR
 */
export function canFallbackOnError(errorKind: PeakerrErrorKind): boolean {
  switch (errorKind) {
    case 'SERVICE_UNAVAILABLE':
    case 'SERVICE_DISABLED':
    case 'TEMPORARY_UNAVAILABLE':
      return true;
    case 'AMBIGUOUS_SUBMISSION':
    case 'INVALID_LINK':
    case 'INVALID_QUANTITY':
    case 'AUTH_ERROR':
    case 'BAD_API_KEY':
    case 'INSUFFICIENT_BALANCE':
    case 'LIVE_FULFILLMENT_DISABLED':
    case 'CONFIG_MISSING':
    case 'PROVIDER_INVALID_RESPONSE':
    case 'UNKNOWN_ERROR':
    default:
      return false;
  }
}
