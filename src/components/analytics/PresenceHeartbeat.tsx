'use client';

import { useEffect, useRef } from 'react';
import { getAnonymousSessionId, getAnonymousVisitorId } from '@/lib/analytics/identity';

const HEARTBEAT_INTERVAL_MS = 40 * 1000; // ~40 seconds

export default function PresenceHeartbeat() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run in browser, and ignore admin or non-public routes
    if (typeof window === 'undefined') return;
    const pathname = window.location.pathname;
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return;
    }

    const sendHeartbeat = () => {
      try {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          return;
        }

        const sessionId = getAnonymousSessionId();
        const visitorId = getAnonymousVisitorId();

        const payload = JSON.stringify({
          sessionId,
          visitorId,
        });

        if (typeof fetch === 'function') {
          fetch('/api/analytics/presence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
          }).catch(() => {
            // Fail-open: Never disrupt UX or log critical errors
          });
        }
      } catch {
        // Fail-open
      }
    };

    // 1. Send immediate heartbeat on mount
    sendHeartbeat();

    // 2. Set interval for approx 40s
    timerRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    // 3. Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Immediately trigger heartbeat when becoming visible
        sendHeartbeat();
        // Reset interval so next is 40s from now
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}
