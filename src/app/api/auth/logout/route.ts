import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { PENDING_2FA_COOKIE_NAME } from '@/lib/auth/pending-2fa';
import { logAdminSecurityEvent } from '@/lib/auth/totp-service';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    cookieStore.delete(PENDING_2FA_COOKIE_NAME);

    await logAdminSecurityEvent('ADMIN_LOGOUT');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AdminLogout] Error:', error);
    return NextResponse.json({ success: true });
  }
}
