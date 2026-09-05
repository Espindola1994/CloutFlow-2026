const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.startsWith('.env'));
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split(/\r?\n/);
  for (const l of lines) {
    if (l.startsWith('RESEND_API_KEY=')) {
      const v = l.substring('RESEND_API_KEY='.length).trim().replace(/^["']|["']$/g, '');
      if (v.length > 5) {
        console.log(`${f} -> RESEND_API_KEY: len=${v.length}, prefix=${v.substring(0, 6)}***`);
      }
    }
    if (l.startsWith('RESEND_FROM_EMAIL=')) {
      const v = l.substring('RESEND_FROM_EMAIL='.length).trim().replace(/^["']|["']$/g, '');
      if (v.length > 0) {
        console.log(`${f} -> RESEND_FROM_EMAIL: ${v}`);
      }
    }
    if (l.startsWith('REPLY_TO_EMAIL=')) {
      const v = l.substring('REPLY_TO_EMAIL='.length).trim().replace(/^["']|["']$/g, '');
      if (v.length > 0) {
        console.log(`${f} -> REPLY_TO_EMAIL: ${v}`);
      }
    }
  }
}
