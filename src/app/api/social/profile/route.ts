import { NextResponse } from 'next/server';
import { scrapeProfile } from '@/integrations/brightdata';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const platform = searchParams.get('platform') || 'instagram';
  
  if (!username) {
    return NextResponse.json({ success: false, error: { message: 'Username is required' } }, { status: 400 });
  }

  try {
    const data = await scrapeProfile(platform, username);
    
    if (!data) {
      return NextResponse.json({ success: false, error: { message: 'User not found' } }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
