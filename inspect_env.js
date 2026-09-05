const fs = require('fs');
const lines = fs.readFileSync('.env.vercel.prod.current', 'utf8').split(/\r?\n/);

const keys = [
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'REPLY_TO_EMAIL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SAFE_MODE',
  'EMAIL_ALLOWLIST',
  'LIFECYCLE_EMAIL_ALLOWLIST',
  'EMAIL_PROVIDER'
];

for (const k of keys) {
  const line = lines.find(x => x.startsWith(k + '='));
  if (!line) {
    console.log(k + ': NOT FOUND');
    continue;
  }
  let raw = line.substring(k.length + 1);
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1);
  }
  const len = raw.length;
  const trimmed = raw.trim();
  const prefix = raw.substring(0, 6);
  console.log(`${k}: len=${len}, trimmedLen=${trimmed.length}, prefix=${prefix}***, whitespace=${len !== trimmed.length}`);
}
