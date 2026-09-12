export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { visitorPresence } from '@/db/schema/visitor-presence';
import { eq } from 'drizzle-orm';

/**
 * Temporary secure inspection endpoint for Smoke Test Verification.
 * Returns the exact record stored in visitor_presence for a given sessionId.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId || !sessionId.startsWith('smoke_session_prod_')) {
    return NextResponse.json({ error: 'Unauthorized inspection' }, { status: 403 });
  }

  try {
    const records = await db
      .select()
      .from(visitorPresence)
      .where(eq(visitorPresence.sessionId, sessionId))
      .limit(5);

    return NextResponse.json({
      count: records.length,
      record: records[0] || null,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
