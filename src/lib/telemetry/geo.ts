/**
 * Server-Side Geo Telemetry Helper (Global-First)
 * 
 * Extracts geographical location strictly from trusted edge/proxy headers (Vercel Edge headers).
 * 
 * STRICT RULES:
 * 1. Absence of GEO = null, NEVER fictitious, fabricated, or default location.
 * 2. Geo is strictly telemetry. It MUST NEVER gate, block, or validate business transactions.
 * 3. Sanitizes and bounds all values.
 * 4. Zero PII: Only high-level coarse location (country, region, city, coordinates).
 */

export interface GeoLocation {
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  latitude: string | null;
  longitude: string | null;
}

/**
 * Extracts geo coordinates and names from request headers.
 * Safe fallback: Returns null for all missing attributes.
 */
export function extractGeoFromHeaders(headers: Headers): GeoLocation {
  try {
    // Vercel Edge Headers:
    // x-vercel-ip-country (e.g. US, BR, GB)
    // x-vercel-ip-country-region (e.g. CA, SP)
    // x-vercel-ip-city (e.g. San%20Francisco, Sao%20Paulo)
    // x-vercel-ip-latitude (e.g. 37.7749)
    // x-vercel-ip-longitude (e.g. -122.4194)

    const rawCountry = headers.get('x-vercel-ip-country') || null;
    const rawRegion = headers.get('x-vercel-ip-country-region') || null;
    let rawCity = headers.get('x-vercel-ip-city') || null;
    const rawLatitude = headers.get('x-vercel-ip-latitude') || null;
    const rawLongitude = headers.get('x-vercel-ip-longitude') || null;

    if (rawCity) {
      try {
        rawCity = decodeURIComponent(rawCity);
      } catch {
        // Keep rawCity as is if decoding fails
      }
    }

    const country = rawCountry ? rawCountry.trim().toUpperCase().slice(0, 10) : null;
    const countryCode = country; // Standard 2-letter ISO code
    const region = rawRegion ? rawRegion.trim().slice(0, 100) : null;
    const city = rawCity ? rawCity.trim().slice(0, 100) : null;

    let latitude: string | null = null;
    let longitude: string | null = null;

    if (rawLatitude) {
      const latNum = parseFloat(rawLatitude);
      if (!isNaN(latNum) && latNum >= -90 && latNum <= 90) {
        latitude = latNum.toFixed(6);
      }
    }

    if (rawLongitude) {
      const lonNum = parseFloat(rawLongitude);
      if (!isNaN(lonNum) && lonNum >= -180 && lonNum <= 180) {
        longitude = lonNum.toFixed(6);
      }
    }

    return {
      country,
      countryCode,
      region,
      city,
      latitude,
      longitude,
    };
  } catch {
    return {
      country: null,
      countryCode: null,
      region: null,
      city: null,
      latitude: null,
      longitude: null,
    };
  }
}
