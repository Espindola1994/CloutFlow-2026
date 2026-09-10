import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { PENDING_2FA_COOKIE_NAME, verifyPending2faToken } from '@/lib/auth/pending-2fa';
import { SESSION_COOKIE_NAME, createAdminToken } from '@/lib/auth';
import { verifyRecoveryCode } from '@/lib/auth/totp-service';

const recoverySchema = z.object({
  code: z.string().min(5),
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
    const { code } = recoverySchema.parse(body);

    const result = await verifyRecoveryCode(code, payload.adminId);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: result.error || 'Invalid recovery code.' } },
        { status: 401 }
      );
    }

    // Recovery code succeeded: issue full authenticated admin session
    const tokenResult = createAdminToken(7, true);
    if (!tokenResult) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication configuration error.' } },
        { status: 500 }
      );
    }

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
        remainingCount: result.remainingCount,
        user: {
          id: payload.adminId,
          name: 'Administrator',
          email: 'admin@cloutflow.co',
          role: 'SUPER_ADMIN',
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: 'Please enter a valid recovery code.' } },
        { status: 400 }
      );
    }
    console.error('[AdminRecoveryLogin] Error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
