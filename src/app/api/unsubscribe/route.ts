import { NextResponse } from 'next/server';
import { verifyUnsubscribeToken, suppressEmail } from '@/services/lifecycle/unsubscribe.service';

export async function POST(req: Request) {
  try {
    const { email, token } = await req.json();

    if (!email || !token) {
      return NextResponse.json({ error: 'Missing email or token' }, { status: 400 });
    }

    if (!verifyUnsubscribeToken(email, token)) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 403 });
    }

    await suppressEmail(email, 'UNSUBSCRIBED', 'USER');

    return NextResponse.json({ success: true, message: 'Successfully unsubscribed' });
  } catch (error) {
    console.error('Error during unsubscribe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
