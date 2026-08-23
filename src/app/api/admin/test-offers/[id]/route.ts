import { NextResponse } from 'next/server';
import { db } from '@/db';
import { customerOffers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAdmin();
    if (!authResult) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await context.params;

    const [offer] = await db.query.customerOffers.findMany({
      where: eq(customerOffers.id, id),
    });

    if (!offer) {
      return NextResponse.json({ success: false, error: { message: 'Test offer not found' } }, { status: 404 });
    }

    if (offer.sourceOrderId !== 'ADMIN_TEST') {
      return NextResponse.json({ success: false, error: { message: 'Cannot delete genuine production offers through this endpoint' } }, { status: 403 });
    }

    if (offer.status === 'REDEEMED') {
      return NextResponse.json({ success: false, error: { message: 'Cannot delete a redeemed test offer' } }, { status: 400 });
    }

    await db.delete(customerOffers).where(eq(customerOffers.id, id));

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('[AdminTestOffers] Failed to delete test offer:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAdmin();
    if (!authResult) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const [offer] = await db.query.customerOffers.findMany({
      where: eq(customerOffers.id, id),
    });

    if (!offer) {
      return NextResponse.json({ success: false, error: { message: 'Test offer not found' } }, { status: 404 });
    }

    if (offer.sourceOrderId !== 'ADMIN_TEST') {
      return NextResponse.json({ success: false, error: { message: 'Cannot expire genuine production offers through this endpoint' } }, { status: 403 });
    }

    if (body.action === 'expire') {
      const [updated] = await db.update(customerOffers)
        .set({ 
          status: 'EXPIRED',
          expiresAt: new Date(), // Set expiration to now
        })
        .where(eq(customerOffers.id, id))
        .returning();
      
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: { message: 'Invalid action' } }, { status: 400 });
  } catch (error) {
    console.error('[AdminTestOffers] Failed to update test offer:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
