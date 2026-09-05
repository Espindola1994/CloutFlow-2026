const fs = require('fs');
const path = require('path');

const envFiles = fs.readdirSync('.').filter(f => f.startsWith('.env'));
for (const f of envFiles) {
  try {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split(/\r?\n/);
    const hasResend = lines.some(l => l.startsWith('RESEND_API_KEY=') && l.length > 20);
    const hasSupabase = lines.some(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=') && l.length > 30);
    console.log(`${f}: hasResend=${hasResend}, hasSupabase=${hasSupabase}, size=${content.length}`);
  } catch (e) {
    console.log(`${f}: error reading`);
  }
}
