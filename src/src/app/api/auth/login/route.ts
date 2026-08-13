import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { createSession } from '@/db/repositories/auth.repository';
import { eq } from 'drizzle-orm';
import argon2 from 'argon2';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const [user] = await db.query.users.findMany({
      where: eq(users.email, email),
      limit: 1,
    });

    if (!user || !user.active) {
      return NextResponse.json({ success: false, error: { message: 'Invalid credentials' } }, { status: 401 });
    }

    const isValid = await argon2.verify(user.passwordHash, password);

    if (!isValid) {
      return NextResponse.json({ success: false, error: { message: 'Invalid credentials' } }, { status: 401 });
    }

    // Record login
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Create session
    const userAgent = request.headers.get('user-agent') || undefined;
    const { token, session } = await createSession(user.id, userAgent);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: session.expiresAt,
      path: '/',
    });

    return NextResponse.json({ success: true, data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { message: 'Invalid input' } }, { status: 400 });
    }
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
