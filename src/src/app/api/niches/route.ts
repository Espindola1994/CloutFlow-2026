import { NextResponse } from 'next/server';
import { getNiches } from '@/db/repositories/catalog.repository';

export async function GET() {
  try {
    const niches = await getNiches();
    return NextResponse.json({ success: true, data: { niches } });
  } catch (error) {
    console.error('Error fetching niches:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}