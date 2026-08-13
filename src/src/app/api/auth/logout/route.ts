import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { invalidateSession } from '@/db/repositories/auth.repository';

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await invalidateSession(sessionToken);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);

  return NextResponse.json({ success: true });
}
