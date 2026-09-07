import { NextResponse } from 'next/server';
import { and, asc, desc, eq, inArray, lte, sql } from 'drizzle-orm';

import { db } from '@/db';
import { lifecycleEvents } from '@/db/schema';

const TARGET_EMAIL = 'terraguilherme26@gmail.com';
const THRESHOLD_MINUTES = 30;

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cutoff = new Date(
      Date.now() - THRESHOLD_MINUTES * 60 * 1000
    );

    const eligibleWhere = and(
      inArray(lifecycleEvents.eventType, [
        'LEAD_CAPTURED',
        'CHECKOUT_STARTED',
      ]),
      lte(lifecycleEvents.createdAt, cutoff)
    );

    const [countResult] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(lifecycleEvents)
      .where(eligibleWhere);

    // Replica exatamente o lote atual do scheduler:
    // filtro + limit 50, sem orderBy.
    const currentBatch = await db.query.lifecycleEvents.findMany({
      where: eligibleWhere,
      limit: 50,
    });

    const targetEvents = await db.query.lifecycleEvents.findMany({
      where: and(
        eq(lifecycleEvents.customerEmail, TARGET_EMAIL),
        eligibleWhere
      ),
      orderBy: [asc(lifecycleEvents.createdAt)],
    });

    const [oldestCandidate] =
      await db.query.lifecycleEvents.findMany({
        where: eligibleWhere,
        orderBy: [asc(lifecycleEvents.createdAt)],
        limit: 1,
      });

    const [newestCandidate] =
      await db.query.lifecycleEvents.findMany({
        where: eligibleWhere,
        orderBy: [desc(lifecycleEvents.createdAt)],
        limit: 1,
      });

    const targetPositions = currentBatch
      .map((event, index) =>
        event.customerEmail?.toLowerCase() ===
        TARGET_EMAIL.toLowerCase()
          ? index + 1
          : null
      )
      .filter((value): value is number => value !== null);

    const eligibleCount = Number(countResult?.count ?? 0);

    return NextResponse.json({
      success: true,
      eligibleCount,

      currentBatch: {
        size: currentBatch.length,
        limit: 50,
        containsTarget: targetPositions.length > 0,
        targetPositions,
      },

      target: {
        email: TARGET_EMAIL,
        eligibleEventCount: targetEvents.length,
        events: targetEvents.map((event) => ({
          eventType: event.eventType,
          createdAt: event.createdAt,
        })),
      },

      range: {
        oldestCandidate: oldestCandidate?.createdAt ?? null,
        newestCandidate: newestCandidate?.createdAt ?? null,
      },

      diagnosis: {
        overBatchLimit: eligibleCount > 50,
        targetStarved:
          targetEvents.length > 0 &&
          targetPositions.length === 0,
      },
    });
  } catch (error) {
    console.error('[AbandonedCandidatesDiagnostic]', error);

    return NextResponse.json(
      { success: false, error: 'Diagnostic query failed' },
      { status: 500 }
    );
  }
}