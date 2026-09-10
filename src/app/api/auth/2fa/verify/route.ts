import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { PENDING_2FA_COOKIE_NAME, verifyPending2faToken } from '@/lib/auth/pending-2fa';
import { SESSION_COOKIE_NAME, createAdminToken } from '@/lib/auth';
import { verifyTotpToken, generateRecoveryCodes } from '@/lib/auth/totp-service';

const verifySchema = z.object({
  code: z.string().min(6).max(6),
  isEnrollment: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const pendingCookie = cookieStore.get(PENDING_2FA_COOKIE_NAME)?.value;

    if (!pendingCookie) {
      return NextResponse.json(
        { success: false, error: { message: 'Pending authentication expired. Please sign in with your password.' } },
        { status: 401 }
      );
    }

    const payload = verifyPending2faToken(pendingCookie);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: { message: 'Pending session expired. Please sign in with your password.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { code, isEnrollment } = verifySchema.parse(body);

    const isSetup = isEnrollment ?? (payload.stage === 'ENROLLMENT_REQUIRED');
    const result = await verifyTotpToken(code, payload.adminId, isSetup);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: { message: result.error || 'Invalid verification code.' },
          isLocked: result.isLocked,
        },
        { status: result.isLocked ? 429 : 401 }
      );
    }

    // Generate recovery codes if this was an initial enrollment
    let recoveryCodes: string[] | undefined;
    if (isSetup) {
      recoveryCodes = await generateRecoveryCodes(payload.adminId);
    }

    // Now issue full authenticated admin session (passwordVerified=true, mfaVerified=true)
    const tokenResult = createAdminToken(7, true);
    if (!tokenResult) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication configuration error.' } },
        { status: 500 }
      );
    }

    // Invalidate pending 2FA cookie and set full session cookie
    cookieStore.delete(PENDING_2FA_COOKIE_NAME);
    cookieStore.set(SESSION_COOKIE_NAME, tokenResult.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: tokenResult.expiresAt,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: payload.adminId,
          name: 'Administrator',
          email: 'admin@cloutflow.co',
          role: 'SUPER_ADMIN',
        },
        recoveryCodes, // Provided once on setup
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: 'Please enter a valid 6-digit code.' } },
        { status: 400 }
      );
    }
    console.error('[Admin2FAVerify] Error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
