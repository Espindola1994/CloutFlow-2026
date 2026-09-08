const fs = require('fs');
const content = fs.readFileSync('.env.production.local', 'utf8');
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
const keys = [
  'SAFE_MODE',
  'LIFECYCLE_EMAILS_ENABLED',
  'LIFECYCLE_EMAIL_ALLOWLIST',
  'PEAKERR_LIVE_FULFILLMENT',
  'PEAKERR_AUTO_DISPATCH_ENABLED',
  'FULFILLMENT_ENABLED',
  'NEXT_PUBLIC_APP_URL',
  'PERFECTPAY_WEBHOOK_TOKEN'
];
for (const k of keys) {
  if (k.includes('TOKEN')) {
    console.log(k + '=length:' + (env[k] ? env[k].length : 0));
  } else {
    console.log(k + '=' + env[k]);
  }
}
