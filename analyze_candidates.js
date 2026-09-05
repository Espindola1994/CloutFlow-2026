const fs = require('fs');

const data = JSON.parse(fs.readFileSync('all_twitter_services_dump.json', 'utf8'));

console.log('Total Twitter services:', data.length);

const likeServices = data.filter(s => {
  const name = (s.name || '').toLowerCase();
  const cat = (s.category || '').toLowerCase();
  return (name.includes('like') || name.includes('fav') || cat.includes('like') || cat.includes('fav'))
    && !name.includes('retweet') && !name.includes('repost');
});

console.log('Total Twitter Like services:', likeServices.length);

const analyzed = data.filter(s => {
  const name = (s.name || '').toLowerCase();
  const cat = (s.category || '').toLowerCase();
  const isLike = (name.includes('like') || name.includes('fav') || cat.includes('like') || cat.includes('fav'));
  return isLike;
}).map(s => {
  const rate = parseFloat(s.rate);
  const min = parseInt(s.min, 10);
  const max = parseInt(s.max, 10);
  
  // Costs for 10K, 15K, 20K
  const cost10k = (10000 / 1000) * rate;
  const cost15k = (15000 / 1000) * rate;
  const cost20k = (20000 / 1000) * rate;

  // Pro: Venda $44.90, Max Cost $26.94
  const passProFinancial = cost10k <= 26.94;
  const passProQuantity = max >= 10000;
  const passPro = passProFinancial && passProQuantity;
  const grossProfitPro = 44.90 - cost10k;
  const grossMarginPro = ((grossProfitPro / 44.90) * 100).toFixed(2) + '%';

  // Elite: Venda $64.90, Max Cost $38.94
  const passEliteFinancial = cost15k <= 38.94;
  const passEliteQuantity = max >= 15000;
  const passElite = passEliteFinancial && passEliteQuantity;
  const grossProfitElite = 64.90 - cost15k;
  const grossMarginElite = ((grossProfitElite / 64.90) * 100).toFixed(2) + '%';

  // Max: Venda $79.90, Max Cost $47.94
  const passMaxFinancial = cost20k <= 47.94;
  const passMaxQuantity = max >= 20000;
  const passMax = passMaxFinancial && passMaxQuantity;
  const grossProfitMax = 79.90 - cost20k;
  const grossMarginMax = ((grossProfitMax / 79.90) * 100).toFixed(2) + '%';

  const passAllThree = passPro && passElite && passMax;

  return {
    id: s.service,
    name: s.name,
    category: s.category,
    rate,
    min,
    max,
    refill: s.refill,
    cancel: s.cancel,
    type: s.type,
    cost10k: cost10k.toFixed(2),
    cost15k: cost15k.toFixed(2),
    cost20k: cost20k.toFixed(2),
    passPro: passPro ? 'PASS' : `FAIL (${!passProFinancial ? 'Cost > $26.94' : ''} ${!passProQuantity ? `Max < 10k (${max})` : ''})`.trim(),
    grossProfitPro: `$${grossProfitPro.toFixed(2)}`,
    grossMarginPro,
    passElite: passElite ? 'PASS' : `FAIL (${!passEliteFinancial ? 'Cost > $38.94' : ''} ${!passEliteQuantity ? `Max < 15k (${max})` : ''})`.trim(),
    grossProfitElite: `$${grossProfitElite.toFixed(2)}`,
    grossMarginElite,
    passMax: passMax ? 'PASS' : `FAIL (${!passMaxFinancial ? 'Cost > $47.94' : ''} ${!passMaxQuantity ? `Max < 20k (${max})` : ''})`.trim(),
    grossProfitMax: `$${grossProfitMax.toFixed(2)}`,
    grossMarginMax,
    passAllThree
  };
});

fs.writeFileSync('analyzed_x_likes.json', JSON.stringify(analyzed, null, 2));
console.log('Saved analyzed_x_likes.json with', analyzed.length, 'services');
