import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PENDING_2FA_COOKIE_NAME, verifyPending2faToken } from '@/lib/auth/pending-2fa';
import { getAdminSecurityStatus, generateTotpEnrollment } from '@/lib/auth/totp-service';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const pendingCookie = cookieStore.get(PENDING_2FA_COOKIE_NAME)?.value;

    if (!pendingCookie) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required. Please enter your password first.' } },
        { status: 401 }
      );
    }

    const payload = verifyPending2faToken(pendingCookie);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: { message: 'Pending session expired. Please log in again.' } },
        { status: 401 }
      );
    }

    // Check if 2FA is already enabled. If already enabled, cannot re-run enrollment!
    const securityStatus = await getAdminSecurityStatus(payload.adminId);
    if (securityStatus.enabled) {
      return NextResponse.json(
        { success: false, error: { message: 'Two-factor authentication is already enrolled for this account.' } },
        { status: 403 }
      );
    }

    // Generate enrollment details
    const enrollment = await generateTotpEnrollment(payload.adminId);

    return NextResponse.json({
      success: true,
      data: {
        qrCode: enrollment.qrCodeDataUrl,
        manualKey: enrollment.secret, // provided ONLY during enrollment setup
        issuer: 'CloutFlow',
        account: 'CloutFlow Admin',
      },
    });
  } catch (error) {
    console.error('[Admin2FAEnrollment] Error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to initialize 2FA enrollment.' } },
      { status: 500 }
    );
  }
}
