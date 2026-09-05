const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.startsWith('.env'));
for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  for (const l of lines) {
    if (l.startsWith('DATABASE_URL=') || l.startsWith('POSTGRES_URL=')) {
      const val = l.split('=')[1] || '';
      if (val.length > 5 && !val.includes('localhost')) {
        console.log(f, val.substring(0, 35) + '... length=' + val.length);
      }
    }
  }
}
