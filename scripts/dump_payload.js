const { execSync } = require('child_process');
const fs = require('fs');

const cmd = `npx supabase db query --linked "SELECT payload FROM webhook_events WHERE id = '8734e987-f3dd-463d-b813-25f22c68f802';"`;
const out = execSync(cmd).toString();
fs.writeFileSync('scripts/last_webhook_payload.txt', out);
console.log('Written to scripts/last_webhook_payload.txt');
