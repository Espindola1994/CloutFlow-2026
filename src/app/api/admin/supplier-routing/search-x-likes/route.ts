import { NextRequest, NextResponse } from 'next/server';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key');
    if (key !== 'cloutflow_canonical_routing_2026_apply') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const services = await peakerrClient.getServices();
    if (!Array.isArray(services)) {
      return NextResponse.json({ error: 'Failed to fetch services', raw: services }, { status: 500 });
    }

    // Broader search: any service containing "twitter" or " x " or "x/" or "favorite" in name or category
    const matched = services.filter((s: any) => {
      const name = (s.name || '').toLowerCase();
      const cat = (s.category || '').toLowerCase();
      
      const mentionsPlatform = name.includes('twitter') || cat.includes('twitter') || name.includes(' x ') || cat.includes(' x ') || name.includes('tweet') || cat.includes('tweet') || name.startsWith('x -') || name.startsWith('x [') || cat.startsWith('x -') || cat.startsWith('x [');
      
      return mentionsPlatform;
    });

    return NextResponse.json({
      success: true,
      totalCatalog: services.length,
      matchedCount: matched.length,
      matchedServices: matched,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
