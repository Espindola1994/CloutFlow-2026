const fs = require('fs');
const catalog = JSON.parse(fs.readFileSync('all_twitter_services_dump.json', 'utf8'));

// Filter all services in catalog that have 'like' or 'fav' anywhere in their name or category
console.log('Total catalog dump entries:', catalog.length);
catalog.forEach(s => {
  console.log(`ID: ${s.service} | Category: ${s.category} | Name: ${s.name} | Rate: $${s.rate} | Min: ${s.min} | Max: ${s.max}`);
});
