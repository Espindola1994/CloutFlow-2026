import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import PresenceHeartbeat from '../PresenceHeartbeat';

describe('PresenceHeartbeat Client Component', () => {
  let fetchCalls: { url: string; body: any }[] = [];
  const originalFetch = global.fetch;

  beforeEach(() => {
    fetchCalls = [];
    vi.useFakeTimers();

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });

    global.fetch = vi.fn().mockImplementation((url, init) => {
      fetchCalls.push({ url, body: init?.body ? JSON.parse(init.body) : null });
      return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
    });


    // Mock sessionStorage and localStorage
    const storage: Record<string, string> = {
      cf_asid_v1: 'sess-mock-12345678',
      cf_aid_v1: 'vis-mock-12345678',
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => storage[key] || null);
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('1. Sends immediate heartbeat on mount with fail-open session & visitor IDs', () => {
    render(<PresenceHeartbeat />);

    expect(fetchCalls.length).toBe(1);
    expect(fetchCalls[0].url).toBe('/api/analytics/presence');
    expect(fetchCalls[0].body.sessionId).toBe('sess-mock-12345678');
    expect(fetchCalls[0].body.visitorId).toBe('vis-mock-12345678');
  });

  it('2. Sends recurring heartbeat every ~40 seconds', () => {
    render(<PresenceHeartbeat />);
    expect(fetchCalls.length).toBe(1);

    vi.advanceTimersByTime(40000);
    expect(fetchCalls.length).toBe(2);

    vi.advanceTimersByTime(40000);
    expect(fetchCalls.length).toBe(3);
  });

  it('3. Pauses heartbeat when document.visibilityState is "hidden"', () => {
    render(<PresenceHeartbeat />);
    expect(fetchCalls.length).toBe(1);

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
      configurable: true,
    });

    vi.advanceTimersByTime(40000);
    // Should NOT have sent another heartbeat because visibility is hidden
    expect(fetchCalls.length).toBe(1);
  });

  it('4. Immediately triggers heartbeat when document becomes "visible" again', () => {
    render(<PresenceHeartbeat />);
    expect(fetchCalls.length).toBe(1);

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
      configurable: true,
    });
    vi.advanceTimersByTime(40000);
    expect(fetchCalls.length).toBe(1);

    // Become visible
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    // Should immediately send heartbeat upon becoming visible
    expect(fetchCalls.length).toBe(2);
  });
});
