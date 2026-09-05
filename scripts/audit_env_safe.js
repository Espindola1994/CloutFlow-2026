const fs = require('fs');

const envFiles = [
  '.env.prod.raw',
  '.env.instahub.prod',
  '.env.vercel',
  '.env.preview.local'
];
const checkKeys = [
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'REPLY_TO_EMAIL',
  'GMAIL_USER',
  'GMAIL_APP_PASSWORD',
  'LIFECYCLE_EMAILS_ENABLED',
  'LIFECYCLE_EMAILS_LIVE_FROM',
  'LIFECYCLE_EMAIL_ALLOWLIST',
  'SAFE_MODE',
  'PEAKERR_LIVE_FULFILLMENT',
  'PEAKERR_AUTO_DISPATCH_ENABLED',
  'FULFILLMENT_ENABLED',
  'CRON_SECRET',
  'NEXT_PUBLIC_APP_URL',
  'DATABASE_URL'
];

for (const file of envFiles) {
  if (fs.existsSync(file)) {
    console.log('--- AUDITING PRODUCTION REAL VALUES (MASKED):', file, '---');
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const env = {};
    for (const line of lines) {
      const idx = line.indexOf('=');
      if (idx > 0) {
        const k = line.substring(0, idx).trim();
        const v = line.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
        env[k] = v;
      }
    }
    for (const k of checkKeys) {
      const val = env[k];
      let status = 'MISSING';
      let info = '';
      if (val !== undefined) {
        if (val.length === 0) {
          status = 'PRESENT_BUT_EMPTY';
        } else {
          status = 'PRESENT';
          if (k.includes('PASSWORD') || k.includes('KEY') || k.includes('SECRET') || k.includes('DATABASE_URL')) {
            info = `length: ${val.length}, prefix: ${val.substring(0, 4)}***`;
          } else {
            info = `value: ${val}`;
          }
        }
      }
      console.log(`  ${k}: [${status}] ${info}`);
    }
  }
}
