export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { visitorPresence } from '@/db/schema/visitor-presence';
import { extractGeoFromHeaders } from '@/lib/telemetry/geo';
import { extractDeviceTelemetry } from '@/lib/telemetry/device';
import { ensurePresenceTable } from '@/lib/telemetry/db-init';

// Active Window: 90 seconds (client heartbeats every ~40s)
const ACTIVE_WINDOW_MS = 90 * 1000;

// Rate Limiting per IP or Session (in-memory sliding window)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_HEARTBEATS_PER_WINDOW = 60; // 60 heartbeats/min per IP/session is very generous

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    if (rateLimitMap.size > 10000) {
      for (const [k, v] of rateLimitMap.entries()) {
        if (now > v.resetAt) rateLimitMap.delete(k);
      }
    }
    return true;
  }

  if (entry.count >= MAX_HEARTBEATS_PER_WINDOW) {
    return false;
  }

  entry.count += 1;
  return true;
}

// Bot User-Agent detection patterns
const KNOWN_BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /googlebot/i,
  /bingbot/i,
  /yandex/i,
  /duckduckbot/i,
  /baiduspider/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /rogerbot/i,
  /linkedinbot/i,
  /embedly/i,
  /quora link preview/i,
  /showyoubot/i,
  /outbrain/i,
  /pinterest\/0\./i,
  /developers\.google\.com\/\+\/web\/snippet/i,
  /slackbot/i,
  /vkShare/i,
  /W3C_Validator/i,
  /whatsapp/i,
  /flipboard/i,
  /tumblr/i,
  /bitlybot/i,
  /skypeuripreview/i,
  /nuzzel/i,
  /discordbot/i,
  /qwantify/i,
  /pinterestbot/i,
  /bitrix link preview/i,
  /xing-contenttabreceiver/i,
  /chrome-lighthouse/i,
  /telegrambot/i,
];

function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return KNOWN_BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/**
 * POST /api/analytics/presence
 * 
 * Ingests live visitor presence heartbeat.
 * Fail-open, zero-PII, UPSERT by sessionId with 90s active window expiration.
 */
export async function POST(request: Request) {
  try {
    const userAgent = request.headers.get('user-agent') || '';
    if (isBot(userAgent)) {
      return new NextResponse(null, { status: 204 });
    }

    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > 8192) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Body must be an object' }, { status: 400 });
    }

    const { sessionId, visitorId, platform, service, planId } = body;

    // Validate sessionId (matches anonymousSessionId format)
    if (!sessionId || typeof sessionId !== 'string' || sessionId.length < 8 || sessionId.length > 100) {
      return NextResponse.json({ error: 'Valid sessionId required' }, { status: 400 });
    }

    // Rate limit check per IP/session
    const rateLimitKey = `${ip}:${sessionId}`;
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const safeSessionId = sessionId.slice(0, 100);
    const safeVisitorId = typeof visitorId === 'string' ? visitorId.slice(0, 100) : null;
    const safePlatform = typeof platform === 'string' ? platform.slice(0, 50).toLowerCase() : null;
    const safeService = typeof service === 'string' ? service.slice(0, 50).toLowerCase() : null;
    const safePlanId = typeof planId === 'string' ? planId.slice(0, 100) : null;

    // Extract server-side Geo from edge headers (null if absent, NEVER fictitious)
    const geo = extractGeoFromHeaders(request.headers);

    // Extract server-side Device/OS/Browser from User-Agent (non-invasive)
    const device = extractDeviceTelemetry(request.headers);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ACTIVE_WINDOW_MS);

    // Ensure database table & indexes exist (idempotent, fail-open)
    await ensurePresenceTable();

    // UPSERT by sessionId
    await db.insert(visitorPresence).values({

      sessionId: safeSessionId,
      visitorId: safeVisitorId,
      platform: safePlatform,
      service: safeService,
      planId: safePlanId,
      country: geo.country,
      countryCode: geo.countryCode,
      region: geo.region,
      city: geo.city,
      latitude: geo.latitude,
      longitude: geo.longitude,
      deviceType: device.deviceType,
      os: device.os,
      browser: device.browser,
      lastSeenAt: now,
      expiresAt: expiresAt,
      createdAt: now,
    }).onConflictDoUpdate({
      target: visitorPresence.sessionId,
      set: {
        visitorId: safeVisitorId,
        platform: safePlatform,
        service: safeService,
        planId: safePlanId,
        country: geo.country,
        countryCode: geo.countryCode,
        region: geo.region,
        city: geo.city,
        latitude: geo.latitude,
        longitude: geo.longitude,
        deviceType: device.deviceType,
        os: device.os,
        browser: device.browser,
        lastSeenAt: now,
        expiresAt: expiresAt,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Fail-open: Never block or disrupt caller
    console.error('[PresenceAPI] Error processing presence heartbeat:', error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
