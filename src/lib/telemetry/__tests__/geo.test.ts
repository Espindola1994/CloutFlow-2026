import { describe, it, expect } from 'vitest';
import { extractGeoFromHeaders } from '../geo';

describe('Server-Side GEO Telemetry Helper (Global-First)', () => {
  it('1. Returns null for all geo attributes when headers are absent', () => {
    const headers = new Headers();
    const geo = extractGeoFromHeaders(headers);

    expect(geo.country).toBeNull();
    expect(geo.countryCode).toBeNull();
    expect(geo.region).toBeNull();
    expect(geo.city).toBeNull();
    expect(geo.latitude).toBeNull();
    expect(geo.longitude).toBeNull();
  });

  it('2. Extracts full geo coordinates and location when Vercel edge headers are present', () => {
    const headers = new Headers({
      'x-vercel-ip-country': 'US',
      'x-vercel-ip-country-region': 'CA',
      'x-vercel-ip-city': 'San%20Francisco',
      'x-vercel-ip-latitude': '37.7749',
      'x-vercel-ip-longitude': '-122.4194',
    });

    const geo = extractGeoFromHeaders(headers);

    expect(geo.country).toBe('US');
    expect(geo.countryCode).toBe('US');
    expect(geo.region).toBe('CA');
    expect(geo.city).toBe('San Francisco');
    expect(geo.latitude).toBe('37.774900');
    expect(geo.longitude).toBe('-122.419400');
  });

  it('3. Handles URL encoded cities properly (e.g. S%C3%A3o%20Paulo)', () => {
    const headers = new Headers({
      'x-vercel-ip-country': 'BR',
      'x-vercel-ip-country-region': 'SP',
      'x-vercel-ip-city': 'S%C3%A3o%20Paulo',
      'x-vercel-ip-latitude': '-23.5505',
      'x-vercel-ip-longitude': '-46.6333',
    });

    const geo = extractGeoFromHeaders(headers);

    expect(geo.country).toBe('BR');
    expect(geo.countryCode).toBe('BR');
    expect(geo.region).toBe('SP');
    expect(geo.city).toBe('São Paulo');
    expect(geo.latitude).toBe('-23.550500');
    expect(geo.longitude).toBe('-46.633300');
  });

  it('4. Ignores invalid latitude / longitude (NaN or out of bounds)', () => {
    const headers = new Headers({
      'x-vercel-ip-country': 'GB',
      'x-vercel-ip-latitude': '999.00',
      'x-vercel-ip-longitude': 'not-a-number',
    });

    const geo = extractGeoFromHeaders(headers);

    expect(geo.country).toBe('GB');
    expect(geo.latitude).toBeNull();
    expect(geo.longitude).toBeNull();
  });
});
