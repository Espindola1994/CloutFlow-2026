import { describe, it, expect } from 'vitest';
import { shouldLoadClarity } from '../ClarityProvider';

describe('C1 Microsoft Clarity Provider - Rules & Exclusions', () => {
  const validProjectId = 'clarity_proj_123';

  it('1. Clarity DOES NOT load without Project ID (null, undefined, empty, or whitespace)', () => {
    expect(shouldLoadClarity({ projectId: null, pathname: '/', isProduction: true })).toBe(false);
    expect(shouldLoadClarity({ projectId: undefined, pathname: '/', isProduction: true })).toBe(false);
    expect(shouldLoadClarity({ projectId: '', pathname: '/', isProduction: true })).toBe(false);
    expect(shouldLoadClarity({ projectId: '   ', pathname: '/', isProduction: true })).toBe(false);
  });

  it('2. Clarity DOES NOT load in development / preview / test environments (isProduction = false)', () => {
    expect(shouldLoadClarity({ projectId: validProjectId, pathname: '/', isProduction: false })).toBe(false);
    expect(shouldLoadClarity({ projectId: validProjectId, pathname: '/instagram/followers', isProduction: false })).toBe(false);
  });

  it('3. Clarity DOES NOT load in /admin or any /admin/* subroutes even in production', () => {
    expect(shouldLoadClarity({ projectId: validProjectId, pathname: '/admin', isProduction: true })).toBe(false);
    expect(shouldLoadClarity({ projectId: validProjectId, pathname: '/admin/login', isProduction: true })).toBe(false);
    expect(shouldLoadClarity({ projectId: validProjectId, pathname: '/admin/dashboard', isProduction: true })).toBe(false);
    expect(shouldLoadClarity({ projectId: validProjectId, pathname: '/admin/dashboard?tab=analytics', isProduction: true })).toBe(false);
    expect(shouldLoadClarity({ projectId: validProjectId, pathname: '/ADMIN/LOGIN', isProduction: true })).toBe(false);
  });

  it('4. Clarity DOES NOT load on /api or /api/* endpoints', () => {
    expect(shouldLoadClarity({ projectId: validProjectId, pathname: '/api/analytics/event', isProduction: true })).toBe(false);
    expect(shouldLoadClarity({ projectId: validProjectId, pathname: '/api/checkout/context', isProduction: true })).toBe(false);
    expect(shouldLoadClarity({ projectId: validProjectId, pathname: '/api/admin/analytics', isProduction: true })).toBe(false);
  });

  it('5. Clarity CAN load in production on public routes when valid Project ID is provided', () => {
    expect(shouldLoadClarity({ projectId: validProjectId, pathname: '/', isProduction: true })).toBe(true);
    expect(shouldLoadClarity({ projectId: validProjectId, pathname: '/instagram/followers', isProduction: true })).toBe(true);
    expect(shouldLoadClarity({ projectId: validProjectId, pathname: '/tiktok/likes', isProduction: true })).toBe(true);
    expect(shouldLoadClarity({ projectId: validProjectId, pathname: '/offer/special-growth', isProduction: true })).toBe(true);
  });
});
