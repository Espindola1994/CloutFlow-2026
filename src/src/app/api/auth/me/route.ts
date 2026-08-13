import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const result = await getSession();
  
  if (!result) {
    return NextResponse.json({ success: false }, { status: 401 });
  }
  
  return NextResponse.json({
    success: true,
    data: {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role
      }
    }
  });
}