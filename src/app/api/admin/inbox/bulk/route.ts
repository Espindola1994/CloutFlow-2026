import { NextResponse } from 'next/server';
import { db } from '@/db';
import { emailThreads, emailMessages } from '@/db/schema';
import { inArray, eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { threadIds, action } = body;

    if (!Array.isArray(threadIds) || threadIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No threadIds provided' }, { status: 400 });
    }

    if (!['RESOLVE', 'MARK_UNREAD', 'TRASH', 'RESTORE', 'DELETE_PERMANENT'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    let updatedCount = 0;

    switch (action) {
      case 'RESOLVE':
        await db.update(emailThreads)
          .set({ status: 'RESOLVED', updatedAt: new Date() })
          .where(inArray(emailThreads.id, threadIds));
        updatedCount = threadIds.length;
        break;
      
      case 'MARK_UNREAD':
        await db.update(emailThreads)
          .set({ unreadCount: 1, updatedAt: new Date() })
          .where(inArray(emailThreads.id, threadIds));
        updatedCount = threadIds.length;
        break;

      case 'TRASH':
        await db.update(emailThreads)
          .set({ deletedAt: new Date(), updatedAt: new Date() })
          .where(inArray(emailThreads.id, threadIds));
        updatedCount = threadIds.length;
        break;
        
      case 'RESTORE':
        await db.update(emailThreads)
          .set({ deletedAt: null, updatedAt: new Date() })
          .where(inArray(emailThreads.id, threadIds));
        updatedCount = threadIds.length;
        break;
        
      case 'DELETE_PERMANENT':
        await db.delete(emailMessages).where(inArray(emailMessages.threadId, threadIds));
        await db.delete(emailThreads).where(inArray(emailThreads.id, threadIds));
        updatedCount = threadIds.length;
        break;
    }

    return NextResponse.json({ success: true, message: `Action ${action} applied`, updatedCount });
  } catch (error) {
    console.error('[AdminBulkInboxAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process bulk action' },
      { status: 500 }
    );
  }
}
