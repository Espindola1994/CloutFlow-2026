import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { addCrmNote } from '@/services/crm/crm.service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noteSchema = z.object({
  customerEmail: z.string().email(),
  adminName: z.string().optional().default('Admin'),
  text: z.string().min(1, 'Note text cannot be empty').max(5000),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const json = await request.json();
    const parsed = noteSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: parsed.error.issues[0]?.message || 'Invalid note payload',
            details: parsed.error.issues
          }
        },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const note = await addCrmNote(parsed.data);

    return NextResponse.json(
      { success: true, data: { note } },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    console.error('[Admin CRM] Error creating note:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
