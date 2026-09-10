/**
 * Anonymous Identity Manager for CloutFlow Funnel Analytics.
 * Strict First-Party, Privacy-Safe, Zero-Fingerprint.
 * 
 * Rules:
 * - anonymousVisitorId: First-party random UUID stored in localStorage (persisted across sessions).
 * - anonymousSessionId: First-party random UUID stored in sessionStorage (per browser session).
 * - NO fingerprinting (NO canvas, NO audio, NO fonts, NO IP, NO hardware).
 * - If storage throws or is blocked (incognito / sandboxed), fallback gracefully to in-memory IDs.
 * - Under NO circumstance does this throw or disrupt checkout or UI execution.
 */

const VISITOR_STORAGE_KEY = 'cf_aid_v1';
const SESSION_STORAGE_KEY = 'cf_asid_v1';
const ATTRIBUTION_STORAGE_KEY = 'cf_attr_v1';

// In-memory fallbacks when localStorage / sessionStorage are restricted or throw
let memoryVisitorId: string | null = null;
let memorySessionId: string | null = null;

function generateRandomUUID(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // fallback below
  }
  // Standard RFC4122 v4 UUID fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns or generates a persistent first-party anonymous visitor UUID.
 * Fail-open: Never throws.
 */
export function getAnonymousVisitorId(): string {
  if (typeof window === 'undefined') {
    return '00000000-0000-0000-0000-000000000000';
  }

  try {
    const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
    if (existing && existing.length >= 16) {
      return existing;
    }
    const newId = generateRandomUUID();
    window.localStorage.setItem(VISITOR_STORAGE_KEY, newId);
    return newId;
  } catch {
    if (!memoryVisitorId) {
      memoryVisitorId = generateRandomUUID();
    }
    return memoryVisitorId;
  }
}

/**
 * Returns or generates a session-scoped first-party anonymous session UUID.
 * Fail-open: Never throws.
 */
export function getAnonymousSessionId(): string {
  if (typeof window === 'undefined') {
    return '00000000-0000-0000-0000-000000000000';
  }

  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && existing.length >= 16) {
      return existing;
    }
    const newId = generateRandomUUID();
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, newId);
    return newId;
  } catch {
    if (!memorySessionId) {
      memorySessionId = generateRandomUUID();
    }
    return memorySessionId;
  }
}

export interface SessionAttribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  src?: string;
  sck?: string;
  referrer?: string;
  landingPage?: string;
}

let memoryAttribution: SessionAttribution | null = null;

/**
 * Captures initial session attribution from current URL and referrer.
 * Priority: First landing attribution of the session (does not overwrite valid UTMs).
 * Fail-open: Never throws.
 */
export function captureSessionAttribution(): SessionAttribution {
  if (typeof window === 'undefined') return {};

  try {
    // Check if attribution is already stored for this session
    const stored = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return parsed as SessionAttribution;
        }
      } catch {}
    }
  } catch {}

  if (memoryAttribution) {
    return memoryAttribution;
  }

  try {
    const url = new URL(window.location.href);
    const params = url.searchParams;

    const utmSource = params.get('utm_source')?.slice(0, 100) || undefined;
    const utmMedium = params.get('utm_medium')?.slice(0, 100) || undefined;
    const utmCampaign = params.get('utm_campaign')?.slice(0, 100) || undefined;
    const utmContent = params.get('utm_content')?.slice(0, 100) || undefined;
    const utmTerm = params.get('utm_term')?.slice(0, 100) || undefined;
    const src = params.get('src')?.slice(0, 100) || undefined;
    const sck = params.get('sck')?.slice(0, 100) || undefined;

    let referrer: string | undefined = undefined;
    if (document.referrer) {
      try {
        const refUrl = new URL(document.referrer);
        // Do not store CloutFlow internal as external referrer
        if (refUrl.hostname !== window.location.hostname) {
          referrer = refUrl.hostname.slice(0, 150);
        }
      } catch {
        referrer = document.referrer.slice(0, 150);
      }
    }

    const landingPage = url.pathname.slice(0, 150);

    const attribution: SessionAttribution = {
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      src,
      sck,
      referrer,
      landingPage,
    };

    try {
      window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
    } catch {}

    memoryAttribution = attribution;
    return attribution;
  } catch {
    return {};
  }
}
