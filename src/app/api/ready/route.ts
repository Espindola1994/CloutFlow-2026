import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Ready check failed:', error);
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
