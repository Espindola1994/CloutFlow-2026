import { NextResponse } from 'next/server';
import { getServiceBySlug, getPlansByServiceId } from '@/db/repositories/catalog.repository';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const service = await getServiceBySlug(slug);
    
    if (!service) {
      return NextResponse.json({ success: false, error: { message: 'Service not found' } }, { status: 404 });
    }
    
    const plans = await getPlansByServiceId(service.id);
    
    return NextResponse.json({ 
      success: true, 
      data: { service, plans } 
    });
  } catch (error) {
    console.error('Error fetching service plans:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}