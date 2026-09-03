/**
 * Dataset Oficial fornecido pelo proprietário para os 66 cards comerciais
 */
export interface PerfectPayDatasetItem {
  platform: 'instagram' | 'tiktok' | 'twitter' | 'youtube';
  service: 'followers' | 'likes' | 'views';
  plan: 'starter' | 'boost' | 'growth' | 'pro' | 'elite' | 'max';
  productCode: string;
  planCode: string;
  checkoutUrl: string;
}

export const OFFICIAL_PERFECTPAY_66_DATASET: PerfectPayDatasetItem[] = [
  // INSTAGRAM (18)
  // Followers (6)
  { platform: 'instagram', service: 'followers', plan: 'starter', productCode: 'PPPBF6TP', planCode: 'PPLQQQ3F7', checkoutUrl: 'https://go.centerpag.com/PPU38CQEOIF' },
  { platform: 'instagram', service: 'followers', plan: 'boost', productCode: 'PPPBF6TP', planCode: 'PPLQQQ3G4', checkoutUrl: 'https://go.centerpag.com/PPU38CQEOKI' },
  { platform: 'instagram', service: 'followers', plan: 'growth', productCode: 'PPPBF6TP', planCode: 'PPLQQQ3G6', checkoutUrl: 'https://go.centerpag.com/PPU38CQEOKK' },
  { platform: 'instagram', service: 'followers', plan: 'pro', productCode: 'PPPBF6TP', planCode: 'PPLQQQ3G7', checkoutUrl: 'https://go.centerpag.com/PPU38CQEOKM' },
  { platform: 'instagram', service: 'followers', plan: 'elite', productCode: 'PPPBF6TP', planCode: 'PPLQQQ3G8', checkoutUrl: 'https://go.centerpag.com/PPU38CQFROA' },
  { platform: 'instagram', service: 'followers', plan: 'max', productCode: 'PPPBF6TP', planCode: 'PPLQQQ3GA', checkoutUrl: 'https://go.centerpag.com/PPU38CQEOKP' },
  // Likes (6)
  { platform: 'instagram', service: 'likes', plan: 'starter', productCode: 'PPPBF6TP', planCode: 'PPLQQQ3N7', checkoutUrl: 'https://go.centerpag.com/PPU38CQEOSR' },
  { platform: 'instagram', service: 'likes', plan: 'boost', productCode: 'PPPBF6TP', planCode: 'PPLQQQ3N8', checkoutUrl: 'https://go.centerpag.com/PPU38CQEOSS' },
  { platform: 'instagram', service: 'likes', plan: 'growth', productCode: 'PPPBF6TP', planCode: 'PPLQQQ3N9', checkoutUrl: 'https://go.centerpag.com/PPU38CQEOST' },
  { platform: 'instagram', service: 'likes', plan: 'pro', productCode: 'PPPBF6TP', planCode: 'PPLQQQ3NA', checkoutUrl: 'https://go.centerpag.com/PPU38CQEOSU' },
  { platform: 'instagram', service: 'likes', plan: 'elite', productCode: 'PPPBF6TP', planCode: 'PPLQQQ3NB', checkoutUrl: 'https://go.centerpag.com/PPU38CQEOT0' },
  { platform: 'instagram', service: 'likes', plan: 'max', productCode: 'PPPBF6TP', planCode: 'PPLQQQ3ND', checkoutUrl: 'https://go.centerpag.com/PPU38CQEOT2' },
  // Views (6)
  { platform: 'instagram', service: 'views', plan: 'starter', productCode: 'PPPBF6TP', planCode: 'PPLQQQ3NF', checkoutUrl: 'https://go.centerpag.com/PPU38CQEOT3' },
  { platform: 'instagram', service: 'views', plan: 'boost', productCode: 'PPPBF6TP', planCode: 'PPLQQQ3GB', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRO7' },
  { platform: 'instagram', service: 'views', plan: 'growth', productCode: 'PPPBF6TP', planCode: 'PPLQQQ3NE', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRO8' },
  { platform: 'instagram', service: 'views', plan: 'pro', productCode: 'PPPBF6TP', planCode: 'PPLQQQD2F', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRO9' },
  { platform: 'instagram', service: 'views', plan: 'elite', productCode: 'PPPBF6TP', planCode: 'PPLQQQD0F', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR82' },
  { platform: 'instagram', service: 'views', plan: 'max', productCode: 'PPPBF6TP', planCode: 'PPLQQQD0H', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR84' },

  // TIKTOK (18)
  // Followers (6)
  { platform: 'tiktok', service: 'followers', plan: 'starter', productCode: 'PPPBF6TP', planCode: 'PPLQQQD0I', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR8B' },
  { platform: 'tiktok', service: 'followers', plan: 'boost', productCode: 'PPPBF6TP', planCode: 'PPLQQQD0J', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR8K' },
  { platform: 'tiktok', service: 'followers', plan: 'growth', productCode: 'PPPBF6TP', planCode: 'PPLQQQD0K', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR8L' },
  { platform: 'tiktok', service: 'followers', plan: 'pro', productCode: 'PPPBF6TP', planCode: 'PPLQQQD0L', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR8M' },
  { platform: 'tiktok', service: 'followers', plan: 'elite', productCode: 'PPPBF6TP', planCode: 'PPLQQQD0M', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR8N' },
  { platform: 'tiktok', service: 'followers', plan: 'max', productCode: 'PPPBF6TP', planCode: 'PPLQQQD0N', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR8O' },
  // Likes (6)
  { platform: 'tiktok', service: 'likes', plan: 'starter', productCode: 'PPPBF6TP', planCode: 'PPLQQQD0O', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR8P' },
  { platform: 'tiktok', service: 'likes', plan: 'boost', productCode: 'PPPBF6TP', planCode: 'PPLQQQD0P', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR8Q' },
  { platform: 'tiktok', service: 'likes', plan: 'growth', productCode: 'PPPBF6TP', planCode: 'PPLQQQD0Q', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR8R' },
  { platform: 'tiktok', service: 'likes', plan: 'pro', productCode: 'PPPBF6TP', planCode: 'PPLQQQD0R', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR8S' },
  { platform: 'tiktok', service: 'likes', plan: 'elite', productCode: 'PPPBF6TP', planCode: 'PPLQQQD1B', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR9L' },
  { platform: 'tiktok', service: 'likes', plan: 'max', productCode: 'PPPBF6TP', planCode: 'PPLQQQD0T', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR8U' },
  // Views (6)
  { platform: 'tiktok', service: 'views', plan: 'starter', productCode: 'PPPBF6TP', planCode: 'PPLQQQD0U', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR91' },
  { platform: 'tiktok', service: 'views', plan: 'boost', productCode: 'PPPBF6TP', planCode: 'PPLQQQD0V', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR92' },
  { platform: 'tiktok', service: 'views', plan: 'growth', productCode: 'PPPBF6TP', planCode: 'PPLQQQD10', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR93' },
  { platform: 'tiktok', service: 'views', plan: 'pro', productCode: 'PPPBF6TP', planCode: 'PPLQQQD13', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR96' },
  { platform: 'tiktok', service: 'views', plan: 'elite', productCode: 'PPPBF6TP', planCode: 'PPLQQQD14', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR98' },
  { platform: 'tiktok', service: 'views', plan: 'max', productCode: 'PPPBF6TP', planCode: 'PPLQQQD15', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR99' },

  // X / TWITTER (18)
  // Followers (6)
  { platform: 'twitter', service: 'followers', plan: 'starter', productCode: 'PPPBF6TP', planCode: 'PPLQQQD1C', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR9O' },
  { platform: 'twitter', service: 'followers', plan: 'boost', productCode: 'PPPBF6TP', planCode: 'PPLQQQD27', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRDI' },
  { platform: 'twitter', service: 'followers', plan: 'growth', productCode: 'PPPBF6TP', planCode: 'PPLQQQD2A', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRDL' },
  { platform: 'twitter', service: 'followers', plan: 'pro', productCode: 'PPPBF6TP', planCode: 'PPLQQQD2D', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRE9' },
  { platform: 'twitter', service: 'followers', plan: 'elite', productCode: 'PPPBF6TP', planCode: 'PPLQQQD2H', checkoutUrl: 'https://go.centerpag.com/PPU38CQFREJ' },
  { platform: 'twitter', service: 'followers', plan: 'max', productCode: 'PPPBF6TP', planCode: 'PPLQQQD2K', checkoutUrl: 'https://go.centerpag.com/PPU38CQFREN' },
  // Likes (6)
  { platform: 'twitter', service: 'likes', plan: 'starter', productCode: 'PPPBF6TP', planCode: 'PPLQQQD0S', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRSH' },
  { platform: 'twitter', service: 'likes', plan: 'boost', productCode: 'PPPBF6TP', planCode: 'PPLQQQD28', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRDJ' },
  { platform: 'twitter', service: 'likes', plan: 'growth', productCode: 'PPPBF6TP', planCode: 'PPLQQQD2B', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRE6' },
  { platform: 'twitter', service: 'likes', plan: 'pro', productCode: 'PPPBF6TP', planCode: 'PPLQQQD2E', checkoutUrl: 'https://go.centerpag.com/PPU38CQFREA' },
  { platform: 'twitter', service: 'likes', plan: 'elite', productCode: 'PPPBF6TP', planCode: 'PPLQQQD2I', checkoutUrl: 'https://go.centerpag.com/PPU38CQFREK' },
  { platform: 'twitter', service: 'likes', plan: 'max', productCode: 'PPPBF6TP', planCode: 'PPLQQQD2N', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRER' },
  // Views (6)
  { platform: 'twitter', service: 'views', plan: 'starter', productCode: 'PPPBF6TP', planCode: 'PPLQQQD1E', checkoutUrl: 'https://go.centerpag.com/PPU38CQFR9Q' },
  { platform: 'twitter', service: 'views', plan: 'boost', productCode: 'PPPBF6TP', planCode: 'PPLQQQD29', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRDK' },
  { platform: 'twitter', service: 'views', plan: 'growth', productCode: 'PPPBF6TP', planCode: 'PPLQQQD2C', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRE7' },
  { platform: 'twitter', service: 'views', plan: 'pro', productCode: 'PPPBF6TP', planCode: 'PPLQQQ3GC', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRSL' },
  { platform: 'twitter', service: 'views', plan: 'elite', productCode: 'PPPBF6TP', planCode: 'PPLQQQD2J', checkoutUrl: 'https://go.centerpag.com/PPU38CQFREM' },
  { platform: 'twitter', service: 'views', plan: 'max', productCode: 'PPPBF6TP', planCode: 'PPLQQQD2L', checkoutUrl: 'https://go.centerpag.com/PPU38CQFREP' },

  // YOUTUBE (12)
  // Likes (6)
  { platform: 'youtube', service: 'likes', plan: 'starter', productCode: 'PPPBF6TP', planCode: 'PPLQQQD2V', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRFH' },
  { platform: 'youtube', service: 'likes', plan: 'boost', productCode: 'PPPBF6TP', planCode: 'PPLQQQD2S', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRFD' },
  { platform: 'youtube', service: 'likes', plan: 'growth', productCode: 'PPPBF6TP', planCode: 'PPLQQQD30', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRFI' },
  { platform: 'youtube', service: 'likes', plan: 'pro', productCode: 'PPPBF6TP', planCode: 'PPLQQQD33', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRFM' },
  { platform: 'youtube', service: 'likes', plan: 'elite', productCode: 'PPPBF6TP', planCode: 'PPLQQQD36', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRG6' },
  { platform: 'youtube', service: 'likes', plan: 'max', productCode: 'PPPBF6TP', planCode: 'PPLQQQD3A', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRGC' },
  // Views (6)
  { platform: 'youtube', service: 'views', plan: 'starter', productCode: 'PPPBF6TP', planCode: 'PPLQQQD2O', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRET' },
  { platform: 'youtube', service: 'views', plan: 'boost', productCode: 'PPPBF6TP', planCode: 'PPLQQQD2T', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRFE' },
  { platform: 'youtube', service: 'views', plan: 'growth', productCode: 'PPPBF6TP', planCode: 'PPLQQQD32', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRFL' },
  { platform: 'youtube', service: 'views', plan: 'pro', productCode: 'PPPBF6TP', planCode: 'PPLQQQD34', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRG3' },
  { platform: 'youtube', service: 'views', plan: 'elite', productCode: 'PPPBF6TP', planCode: 'PPLQQQD38', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRG8' },
  { platform: 'youtube', service: 'views', plan: 'max', productCode: 'PPPBF6TP', planCode: 'PPLQQQD3D', checkoutUrl: 'https://go.centerpag.com/PPU38CQFRGF' },
];
