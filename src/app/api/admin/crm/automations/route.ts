import { NextResponse } from 'next/server';
import { db } from '@/db';
import { lifecycleAutomations, lifecycleEvents, emailLogs } from '@/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim().toLowerCase();
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const automations = await db.query.lifecycleAutomations.findMany({
      orderBy: [desc(lifecycleAutomations.createdAt)],
      limit: Math.min(limit, 200),
    });

    const logs = await db.query.emailLogs.findMany({
      orderBy: [desc(emailLogs.createdAt)],
      limit: 300,
    });
    const logMap = new Map(logs.map((l) => [l.lifecycleAutomationId, l]));

    let items = automations.map((a) => {
      const emailLog = logMap.get(a.id);
      const ctx = a.contextData as Record<string, unknown>;

      return {
        id: a.id,
        automationId: a.automationId,
        actionType: a.actionType,
        customerEmail: a.customerEmail,
        scheduledFor: a.scheduledFor,
        status: a.status,
        attempts: a.attempts,
        lastAttemptAt: a.lastAttemptAt,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        stepNumber: ctx?.stepNumber || (a.automationId.includes('STEP_1') ? 1 : a.automationId.includes('STEP_2') ? 2 : a.automationId.includes('STEP_3') ? 3 : 1),
        targetHandle: ctx?.targetHandle || ctx?.username || null,
        platform: ctx?.platform || null,
        service: ctx?.service || null,
        emailLogStatus: emailLog?.status || null,
        lastError: a.errorLog && Array.isArray(a.errorLog) && a.errorLog.length > 0
          ? (a.errorLog[a.errorLog.length - 1] as any)?.reason || JSON.stringify(a.errorLog[a.errorLog.length - 1])
          : null,
      };
    });

    if (status && status !== 'ALL') {
      items = items.filter((i) => i.status === status);
    }

    if (search) {
      items = items.filter(
        (i) =>
          i.customerEmail.toLowerCase().includes(search) ||
          i.automationId.toLowerCase().includes(search) ||
          (i.targetHandle && String(i.targetHandle).toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        items,
        counts: {
          total: automations.length,
          pending: automations.filter((a) => a.status === 'PENDING').length,
          completed: automations.filter((a) => a.status === 'COMPLETED').length,
          suppressed: automations.filter((a) => a.status.startsWith('SUPPRESSED')).length,
          failed: automations.filter((a) => a.status === 'FAILED').length,
          blocked: automations.filter((a) => a.status.startsWith('BLOCKED')).length,
        },
      },
    });
  } catch (error) {
    console.error('[AdminAutomationsListAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch automations' },
      { status: 500 }
    );
  }
}
