const fs = require('fs');
const catalog = JSON.parse(fs.readFileSync('all_twitter_services_dump.json', 'utf8'));

// Filter all services in catalog that are Likes / Favorites
const likeServices = catalog.filter(s => {
  const name = (s.name || '').toLowerCase();
  const cat = (s.category || '').toLowerCase();
  return (name.includes('like') || name.includes('favorite') || name.includes('fav') || (cat.includes('likes') && !name.includes('follower') && !name.includes('view') && !name.includes('retweet')));
});

console.log('Found', likeServices.length, 'Likes services:');
console.log(JSON.stringify(likeServices, null, 2));
