import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const isLive = process.env.LIFECYCLE_EMAILS_ENABLED === 'true';
    const hasResendKey = Boolean(process.env.RESEND_API_KEY);
    const hasCronSecret = Boolean(process.env.CRON_SECRET);
    const liveFromStr = process.env.LIFECYCLE_EMAILS_LIVE_FROM;
    
    let liveSince = null;
    let liveFromConfigured = false;
    
    if (liveFromStr) {
      const liveFromDate = new Date(liveFromStr);
      if (!isNaN(liveFromDate.getTime())) {
        liveSince = liveFromStr;
        liveFromConfigured = true;
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        marketingAutomation: isLive ? 'LIVE' : 'OFF',
        lifecycleWorker: hasCronSecret ? 'ACTIVE' : 'ERROR',
        resend: hasResendKey ? 'CONFIGURED' : 'CONFIG ERROR',
        liveSince: liveSince,
        lifecycleEmailsEnabled: isLive,
        liveFromConfigured: liveFromConfigured
      }
    });
  } catch (error) {
    console.error('[AdminAutomationsStatusAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
