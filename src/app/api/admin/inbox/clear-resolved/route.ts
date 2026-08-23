import { NextResponse } from 'next/server';
import { db } from '@/db';
import { emailThreads } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';

export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await db.update(emailThreads)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(
        eq(emailThreads.status, 'RESOLVED'),
        sql`deleted_at IS NULL`
      ))
      .returning({ id: emailThreads.id });

    return NextResponse.json({
      success: true,
      message: 'Moved resolved threads to trash',
      count: result.length,
    });
  } catch (error) {
    console.error('[AdminClearResolvedAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear resolved threads' },
      { status: 500 }
    );
  }
}
