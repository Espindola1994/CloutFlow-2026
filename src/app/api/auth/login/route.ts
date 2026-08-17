import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { SESSION_COOKIE_NAME, createAdminToken } from '@/lib/auth';

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
      return NextResponse.json(
        { success: false, error: { message: 'Incorrect password. Please try again.' } },
        { status: 401 }
      );
    }

    // Create session token and set httpOnly cookie
    const tokenResult = createAdminToken(7);

    if (!tokenResult) {
      console.error('[AdminAuth] ADMIN_SESSION_SECRET is not configured.');
      return NextResponse.json(
        { success: false, error: { message: 'Authentication configuration error.' } },
        { status: 500 }
      );
    }

    const { token, expiresAt } = tokenResult;

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: 'admin_root',
          name: 'Administrator',
          email: 'admin@cloutflow.com',
          role: 'SUPER_ADMIN',
        },
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
