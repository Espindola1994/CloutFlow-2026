import { NextResponse } from 'next/server';
import { getPlatformBySlug, getServicesByPlatformId } from '@/db/repositories/catalog.repository';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const platform = await getPlatformBySlug(slug);
    
    if (!platform) {
      return NextResponse.json({ success: false, error: { message: 'Platform not found' } }, { status: 404 });
    }
    
    const services = await getServicesByPlatformId(platform.id);
    
    return NextResponse.json({ 
      success: true, 
      data: { platform, services } 
    });
  } catch (error) {
    console.error('Error fetching platform services:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
