export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { funnelEvents } from '@/db/schema/analytics';
import { isAllowedFunnelEvent } from '@/lib/analytics/taxonomy';
import { ensureFunnelEventsTable } from '@/lib/analytics/db-init';

// Rate Limiting per IP or Session (in-memory sliding window)
// Collector only: Does not affect checkout or normal site endpoints
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_EVENTS_PER_WINDOW = 120; // 120 events/min per IP/session

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    // Cleanup old keys occasionally
    if (rateLimitMap.size > 10000) {
      for (const [k, v] of rateLimitMap.entries()) {
        if (now > v.resetAt) rateLimitMap.delete(k);
      }
    }
    return true;
  }

  if (entry.count >= MAX_EVENTS_PER_WINDOW) {
    return false;
  }

  entry.count += 1;
  return true;
}

// Bot User-Agent detection patterns (privacy-safe, non-invasive)
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

// Strictly forbidden PII keys in metadata
const FORBIDDEN_PII_KEYS = [
  'email',
  'username',
  'target',
  'targetvalue',
  'targeturl',
  'profileurl',
  'socialusername',
  'contenturl',
  'phone',
  'customeremail',
  'customerphone',
  'customername',
  'cardnumber',
  'cvv',
  'password',
  'token',
  'secret',
];

/**
 * Strips any potential PII from metadata object and bounds string sizes.
 */
function sanitizeMetadata(rawMeta: unknown): Record<string, unknown> {
  if (!rawMeta || typeof rawMeta !== 'object' || Array.isArray(rawMeta)) {
    return {};
  }

  const sanitized: Record<string, unknown> = {};
  const entries = Object.entries(rawMeta as Record<string, unknown>);

  for (const [key, value] of entries) {
    const lowerKey = key.toLowerCase();
    // Reject any key that resembles PII
    if (FORBIDDEN_PII_KEYS.some((pii) => lowerKey.includes(pii))) {
      continue;
    }

    // Only allow primitives or safe arrays
    if (typeof value === 'string') {
      // Reject if string looks like an email address
      if (value.includes('@') && value.includes('.')) {
        continue;
      }
      sanitized[key] = value.slice(0, 200); // bound string length
    } else if (typeof value === 'number') {
      if (Number.isFinite(value)) {
        sanitized[key] = value;
      }
    } else if (typeof value === 'boolean') {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * POST /api/analytics/event
 * 
 * Public write-only analytics collector.
 * Fail-open, validated, privacy-safe.
 */
export async function POST(request: Request) {
  try {
    const userAgent = request.headers.get('user-agent') || '';
    if (isBot(userAgent)) {
      // Discard bot traffic silently with 204 No Content
      return new NextResponse(null, { status: 204 });
    }

    // Check payload size limit (max 16KB)
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > 16384) {
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

    const { eventName, sessionId, visitorId, platform, service, planId, metadata } = body;

    // Validate event name against closed allowlist
    if (!eventName || !isAllowedFunnelEvent(eventName)) {
      return NextResponse.json({ error: 'Unknown or disallowed event' }, { status: 400 });
    }

    // Validate sessionId
    if (!sessionId || typeof sessionId !== 'string' || sessionId.length < 8 || sessionId.length > 100) {
      return NextResponse.json({ error: 'Valid sessionId required' }, { status: 400 });
    }

    // Check rate limit per session/IP
    const rateLimitKey = `${ip}:${sessionId}`;
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const safeMetadata = sanitizeMetadata(metadata);

    // If visitorId is provided, store in metadata for correlation
    if (visitorId && typeof visitorId === 'string') {
      safeMetadata.visitorId = visitorId.slice(0, 64);
    }

    // Normalize platform/service strings
    const safePlatform = typeof platform === 'string' ? platform.slice(0, 50).toLowerCase() : null;
    const safeService = typeof service === 'string' ? service.slice(0, 50).toLowerCase() : null;
    const safePlanId = typeof planId === 'string' ? planId.slice(0, 100) : null;

    // Ensure table exists (idempotent, fail-open)
    await ensureFunnelEventsTable();

    // Persist to existing funnel_events table
    // event column is varchar(100), session_id is text, metadata is jsonb, created_at is timestamp
    await db.insert(funnelEvents).values({
      sessionId: sessionId.slice(0, 100),
      event: eventName,
      platformId: null, // IDs can be null; normalized slugs are stored in metadata
      serviceId: null,
      planId: safePlanId,
      metadata: {
        ...safeMetadata,
        platform: safePlatform || safeMetadata.platform,
        service: safeService || safeMetadata.service,
        receivedAt: new Date().toISOString(),
      },
      createdAt: new Date(),
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Fail-open logging: Do not crash, return 204 or 500 without stack traces to client
    console.error('[AnalyticsCollector] Error processing event:', error);
    return new NextResponse(null, { status: 500 });
  }
}
