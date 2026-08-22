import { NextResponse } from 'next/server';
import { db } from '@/db';
import { lifecycleAutomations, emailLogs, emailSuppressions } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const automations = await db.query.lifecycleAutomations.findMany({
      orderBy: [desc(lifecycleAutomations.createdAt)],
      limit: 50,
    });

    const logs = await db.query.emailLogs.findMany({
      orderBy: [desc(emailLogs.createdAt)],
      limit: 50,
    });

    const suppressions = await db.query.emailSuppressions.findMany({
      orderBy: [desc(emailSuppressions.createdAt)],
      limit: 50,
    });

    return NextResponse.json({
      automations,
      logs,
      suppressions,
    });
  } catch (error) {
    console.error('Error fetching admin lifecycle data:', error);
    return NextResponse.json({ error: 'Failed to fetch lifecycle data' }, { status: 500 });
  }
}
