import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { PENDING_2FA_COOKIE_NAME, createPending2faToken, PENDING_2FA_TTL_SECONDS } from '@/lib/auth/pending-2fa';
import { getAdminSecurityStatus, logAdminSecurityEvent } from '@/lib/auth/totp-service';

const loginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = loginSchema.parse(body);

    const configuredPassword = process.env.ADMIN_PASSWORD;

    if (!configuredPassword) {
      console.error('[AdminAuth] ADMIN_PASSWORD is not configured.');
      return NextResponse.json(
        { success: false, error: { message: 'Incorrect password. Please try again.' } },
        { status: 401 }
      );
    }

    // Constant time comparison to avoid timing attacks
    const passwordBuffer = Buffer.from(password);
    const configuredBuffer = Buffer.from(configuredPassword);

    const isValid =
      passwordBuffer.length === configuredBuffer.length &&
      crypto.timingSafeEqual(passwordBuffer, configuredBuffer);

    if (!isValid) {
      await logAdminSecurityEvent('ADMIN_PASSWORD_FAILURE');
      return NextResponse.json(
        { success: false, error: { message: 'Incorrect password. Please try again.' } },
        { status: 401 }
      );
    }

    await logAdminSecurityEvent('ADMIN_PASSWORD_SUCCESS');

    // Query 2FA status to determine if user needs enrollment or standard TOTP verification
    const securityStatus = await getAdminSecurityStatus('admin_root');

    const stage = securityStatus.enabled ? 'TOTP_REQUIRED' : 'ENROLLMENT_REQUIRED';
    const pendingToken = createPending2faToken('admin_root', stage);

    const cookieStore = await cookies();

    // Ensure any existing full session is purged
    cookieStore.delete(SESSION_COOKIE_NAME);

    // Set short-lived (5 min) signed pending 2FA cookie
    const expiresAt = new Date(Date.now() + PENDING_2FA_TTL_SECONDS * 1000);
    cookieStore.set(PENDING_2FA_COOKIE_NAME, pendingToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      data: {
        requires2fa: true,
        stage, // 'ENROLLMENT_REQUIRED' or 'TOTP_REQUIRED'
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: 'Incorrect password. Please try again.' } },
        { status: 400 }
      );
    }
    console.error('[AdminAuth] Login error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
