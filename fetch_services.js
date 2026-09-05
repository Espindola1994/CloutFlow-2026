const fs = require('fs');
const https = require('https');
const path = require('path');

function getApiKey() {
  const envFiles = [
    path.join(__dirname, '.env.prod.audit'),
    path.join(__dirname, '.env.production.local'),
    path.join(__dirname, '.env.local')
  ];
  for (const f of envFiles) {
    if (fs.existsSync(f)) {
      const c = fs.readFileSync(f, 'utf8');
      const lines = c.split('\n');
      for (const line of lines) {
        if (line.startsWith('PEAKERR_API_KEY=')) {
          const val = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
          if (val) return val;
        }
      }
    }
  }
  return null;
}

const key = getApiKey();
if (!key) {
  console.error('API Key not found in env files');
  process.exit(1);
}

console.log('Key length found:', key.length);

const postData = 'key=' + encodeURIComponent(key) + '&action=services';

const req = https.request('https://peakerr.com/api/v2', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      if (!Array.isArray(data)) {
        console.error('Response is not array:', data);
        return;
      }
      fs.writeFileSync(path.join(__dirname, 'temp_peakerr_catalog.json'), JSON.stringify(data, null, 2));
      console.log('Successfully saved ' + data.length + ' services to temp_peakerr_catalog.json');
    } catch (e) {
      console.error('Parse error:', e.message);
    }
  });
});

req.on('error', (e) => console.error('Req error:', e));
req.write(postData);
req.end();
