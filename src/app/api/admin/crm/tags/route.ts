import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { updateCrmContactTags } from '@/services/crm/crm.service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const tagSchema = z.object({
  customerEmail: z.string().email(),
  tags: z.array(z.string().max(50)).max(20),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const json = await request.json();
    const parsed = tagSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: parsed.error.issues[0]?.message || 'Invalid tags payload',
            details: parsed.error.issues
          }
        },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const updatedTags = await updateCrmContactTags(parsed.data.customerEmail, parsed.data.tags);

    return NextResponse.json(
      { success: true, data: { tags: updatedTags } },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    console.error('[Admin CRM] Error updating tags:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
