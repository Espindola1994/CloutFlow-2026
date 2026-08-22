import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { sendManualEmail } from '@/services/crm/manual-email.service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const sendManualEmailSchema = z.object({
  customerEmail: z.string().email(),
  templateId: z.string().optional(),
  category: z.enum(['transactional', 'marketing', 'support']),
  subject: z.string().min(1, 'Subject is required').max(300),
  body: z.string().min(1, 'Body is required'),
  adminName: z.string().optional().default('Admin'),
  orderId: z.string().optional(),
  variables: z.record(z.string(), z.any()).optional()
});

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();

    const json = await request.json();
    const parsed = sendManualEmailSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: parsed.error.issues[0]?.message || 'Invalid payload',
            details: parsed.error.issues
          }
        },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const result = await sendManualEmail({
      ...parsed.data,
      adminName: parsed.data.adminName || 'Admin'
    });

    return NextResponse.json(
      { success: result.success, data: result },
      { status: result.success ? 200 : 422, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    console.error('[Admin CRM] Error sending manual email:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
