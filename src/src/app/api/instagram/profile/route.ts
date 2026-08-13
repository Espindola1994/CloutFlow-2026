import { NextResponse } from 'next/server';
import { getInstagramUserByUsername } from '@/integrations/hikerapi';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  
  if (!username) {
    return NextResponse.json({ success: false, error: { message: 'Username is required' } }, { status: 400 });
  }

  try {
    const data = await getInstagramUserByUsername(username);
    
    if (!data) {
      return NextResponse.json({ success: false, error: { message: 'User not found' } }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
