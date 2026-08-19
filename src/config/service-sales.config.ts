export type Platform = 'instagram' | 'tiktok' | 'twitter' | 'youtube';
export type Service = 'followers' | 'likes' | 'views' | 'comments';

export interface PlatformTheme {
  name: string;
  badge: string;
  eyebrow: string;
  primary: string;
  primaryHover: string;
  soft: string;
  gradient: string;
  borderGlow: string;
  textAccent: string;
  cardHighlight: string;
  ambientGlow: string;
}

export const PLATFORM_THEMES: Record<Platform, PlatformTheme> = {
  instagram: {
    name: 'Instagram',
    badge: 'Instagram Growth',
    eyebrow: 'INSTAGRAM GROWTH',
    primary: '#E1306C',
    primaryHover: '#D82D66',
    soft: 'rgba(225, 48, 108, 0.08)',
    gradient: 'linear-gradient(90deg, #833AB4 0%, #C13584 26%, #E1306C 50%, #F56040 74%, #FCAF45 100%)',
    borderGlow: 'rgba(225, 48, 108, 0.28)',
    textAccent: 'text-pink-500',
    cardHighlight: 'from-pink-500/10 via-purple-500/5 to-transparent',
    ambientGlow: 'radial-gradient(ellipse at center, rgba(225, 48, 108, 0.14) 0%, rgba(131, 58, 180, 0.08) 45%, transparent 70%)',
  },
  tiktok: {
    name: 'TikTok',
    badge: 'TikTok Growth',
    eyebrow: 'TIKTOK GROWTH',
    primary: '#25F4EE',
    primaryHover: '#1ce0da',
    soft: 'rgba(37, 244, 238, 0.08)',
    gradient: 'linear-gradient(110deg, #080808 0%, #0a0d0e 25%, #155054 60%, #9b2948 100%)',
    borderGlow: 'rgba(37, 244, 238, 0.35)',
    textAccent: 'text-cyan-400',
    cardHighlight: 'from-cyan-500/10 via-pink-500/5 to-transparent',
    ambientGlow: 'radial-gradient(ellipse at center, rgba(37, 244, 238, 0.12) 0%, rgba(254, 44, 85, 0.08) 50%, transparent 70%)',
  },
  twitter: {
    name: 'X (Twitter)',
    badge: 'X Growth',
    eyebrow: 'X GROWTH',
    primary: '#FFFFFF',
    primaryHover: '#E2E8F0',
    soft: 'rgba(255, 255, 255, 0.08)',
    gradient: 'linear-gradient(110deg, #181c24 0%, #252b36 40%, #1e2430 75%, #0f141c 100%)',
    borderGlow: 'rgba(255, 255, 255, 0.22)',
    textAccent: 'text-neutral-200',
    cardHighlight: 'from-neutral-400/10 via-neutral-500/5 to-transparent',
    ambientGlow: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.08) 0%, rgba(70, 80, 100, 0.05) 50%, transparent 70%)',
  },
  youtube: {
    name: 'YouTube',
    badge: 'YouTube Growth',
    eyebrow: 'YOUTUBE GROWTH',
    primary: '#FF0000',
    primaryHover: '#D5000C',
    soft: 'rgba(255, 0, 0, 0.08)',
    gradient: 'linear-gradient(110deg, #C9000B 0%, #E6000C 28%, #FF0000 55%, #F21822 76%, #D5000C 100%)',
    borderGlow: 'rgba(255, 0, 0, 0.28)',
    textAccent: 'text-red-500',
    cardHighlight: 'from-red-500/10 via-red-600/5 to-transparent',
    ambientGlow: 'radial-gradient(ellipse at center, rgba(255, 0, 0, 0.13) 0%, rgba(160, 0, 0, 0.06) 50%, transparent 70%)',
  },
};

export interface ServiceCopy {
  serviceTitle: string;
  unitLabel: string;
  heroHeadline: string;
  heroHighlight: string;
  heroSubheadline: string;
  targetContextPrefix: string;
  projectionHeadline: string;
  projectionDescription: string;
  benefits: {
    title: string;
    description: string;
    iconName: 'shield' | 'zap' | 'users' | 'trending' | 'lock' | 'heart';
  }[];
  howItWorks: {
    step: string;
    title: string;
    description: string;
  }[];
  planGuide: {
    tier: string;
    idealFor: string;
    description: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
}

export const SERVICE_COPY_MAP: Record<Service, Record<Platform, ServiceCopy>> = {
  followers: {
    instagram: {
      serviceTitle: 'Instagram Followers',
      unitLabel: 'Followers',
      heroHeadline: 'Turn Your Profile Into a',
      heroHighlight: 'Stronger Presence.',
      heroSubheadline: 'Choose the right growth package for the profile you just selected and build a stronger first impression with CloutFlow.',
      targetContextPrefix: 'Growing profile',
      projectionHeadline: 'Visualizing Your Growth',
      projectionDescription: 'A stronger follower count can reinforce the first impression of an active and established social presence.',
      benefits: [
        { title: 'Stronger First Impression', description: 'Make an immediate impression on profile visitors, prospective collaborators, and brand partners.', iconName: 'shield' },
        { title: 'Simple Growth Experience', description: 'Streamlined package selection with zero technical setup required on your side.', iconName: 'zap' },
        { title: 'Your Target, Verified', description: 'Your order stays strictly connected to the verified public profile handle you confirmed.', iconName: 'lock' },
        { title: 'Secure Checkout Flow', description: 'Encrypted checkout transactions with dedicated order status tracking.', iconName: 'trending' },
      ],
      howItWorks: [
        { step: '01', title: 'Target Confirmed', description: 'Your public @username is verified and locked as destination.' },
        { step: '02', title: 'Choose Your Package', description: 'Select the volume tier that matches your current growth goal.' },
        { step: '03', title: 'Complete Checkout', description: 'Order processing begins automatically after payment confirmation.' },
      ],
      planGuide: [
        { tier: 'Starting Small', idealFor: 'Initial Momentum', description: 'Start smaller if you are testing the experience and establishing an initial follower baseline.' },
        { tier: 'Balanced Growth', idealFor: 'Active Creators', description: 'Choose a mid-range package for a more noticeable jump in your profile presentation.' },
        { tier: 'High-Impact Packages', idealFor: 'Brands & Influencers', description: 'Larger packages designed for users looking for a more substantial visible change.' },
      ],
      faqs: [
        { question: 'Do I need to provide my password?', answer: 'No. CloutFlow never needs your social account password to prepare or fulfill an order. Only your public @username is used.' },
        { question: 'How do I know the correct profile is selected?', answer: 'Your target profile is verified in Step 3 before package selection and stays uniquely connected to your checkout session.' },
        { question: 'Which package should I choose?', answer: 'Pick smaller tiers for initial momentum, mid-range packages for balanced growth, or high-volume tiers for a substantial presence boost.' },
        { question: 'Can I purchase another package later?', answer: 'Yes, you can return and purchase additional packages for the same profile or any other public account at any time.' },
        { question: 'What happens after checkout?', answer: 'Order processing begins after payment confirmation. You can track your order status anytime using your email.' },
        { question: 'Can I keep using my account normally?', answer: 'Yes. You can continue posting, browsing, and messaging as usual during the entire process.' },
      ],
    },
    tiktok: {
      serviceTitle: 'TikTok Followers',
      unitLabel: 'Followers',
      heroHeadline: 'Turn Your TikTok Into a',
      heroHighlight: 'Stronger Profile.',
      heroSubheadline: 'Choose the right growth package for the TikTok profile you just selected and build lasting social credibility with CloutFlow.',
      targetContextPrefix: 'Growing TikTok',
      projectionHeadline: 'Visualizing Your TikTok Authority',
      projectionDescription: 'A stronger follower foundation gives new viewers and brand partners greater confidence in your account.',
      benefits: [
        { title: 'Stronger First Impression', description: 'Capture immediate attention when viewers check your profile from the discover or search feeds.', iconName: 'shield' },
        { title: 'Simple Growth Experience', description: 'Select your volume tier and confirm in seconds with zero complicated setup.', iconName: 'zap' },
        { title: 'Your Target, Verified', description: 'Guaranteed delivery straight to your verified public TikTok @username.', iconName: 'lock' },
        { title: 'Secure Checkout Flow', description: 'Encrypted payment flow with automated order confirmation and tracking.', iconName: 'trending' },
      ],
      howItWorks: [
        { step: '01', title: 'Target Confirmed', description: 'TikTok profile verified and linked to your session.' },
        { step: '02', title: 'Choose Your Package', description: 'Select from 6 calibrated follower volumes.' },
        { step: '03', title: 'Complete Checkout', description: 'Order processing begins after payment confirmation.' },
      ],
      planGuide: [
        { tier: 'Starting Small', idealFor: 'New TikTok accounts', description: 'Start smaller if you are testing the experience and looking for early traction.' },
        { tier: 'Balanced Growth', idealFor: 'Regular video creators', description: 'Choose a mid-range package for a more noticeable jump in your profile numbers.' },
        { tier: 'High-Impact Packages', idealFor: 'Commercial brands & agencies', description: 'Larger packages designed for users looking for a substantial social footprint.' },
      ],
      faqs: [
        { question: 'Do I need to provide my password?', answer: 'No. CloutFlow never needs your TikTok password or login credentials.' },
        { question: 'How do I know the correct profile is selected?', answer: 'Your target account is verified beforehand and confirmed on this page.' },
        { question: 'Which package should I choose?', answer: 'Select the volume tier that best complements your current content strategy.' },
        { question: 'What happens after checkout?', answer: 'Order processing begins after payment confirmation through our secure checkout.' },
      ],
    },
    twitter: {
      serviceTitle: 'X (Twitter) Followers',
      unitLabel: 'Followers',
      heroHeadline: 'Turn Your X Handle Into a',
      heroHighlight: 'Stronger Voice.',
      heroSubheadline: 'Choose the right growth package for your verified handle and build a commanding social presence on X.',
      targetContextPrefix: 'Growing handle',
      projectionHeadline: 'Visualizing Your Audience Foundation',
      projectionDescription: 'A stronger follower count reinforces your perceived authority and credibility across timelines.',
      benefits: [
        { title: 'Stronger First Impression', description: 'Give your tweets, replies, and threads instant weight and perceived authority.', iconName: 'shield' },
        { title: 'Simple Growth Experience', description: 'Zero access required. Simply choose your volume and checkout securely.', iconName: 'zap' },
        { title: 'Your Target, Verified', description: 'Order routed directly to the public handle verified in your session.', iconName: 'lock' },
        { title: 'Secure Checkout Flow', description: 'Encrypted checkout transactions with real-time order registration.', iconName: 'trending' },
      ],
      howItWorks: [
        { step: '01', title: 'Target Confirmed', description: 'Your public @handle is confirmed and ready.' },
        { step: '02', title: 'Choose Your Package', description: 'Select your preferred follower tier.' },
        { step: '03', title: 'Complete Checkout', description: 'Order processing begins after payment confirmation.' },
      ],
      planGuide: [
        { tier: 'Starting Small', idealFor: 'Personal handles', description: 'Start smaller if you are testing the platform.' },
        { tier: 'Balanced Growth', idealFor: 'Founders & creators', description: 'Choose mid-range packages for steady authority scaling.' },
        { tier: 'High-Impact Packages', idealFor: 'Startups & public figures', description: 'Designed for a substantial profile presence.' },
      ],
      faqs: [
        { question: 'Do I need to provide my password?', answer: 'No. CloutFlow never asks for passwords. Only your public @handle is required.' },
        { question: 'What happens after checkout?', answer: 'Order processing begins after payment confirmation.' },
      ],
    },
    youtube: {
      serviceTitle: 'YouTube Subscribers',
      unitLabel: 'Subscribers',
      heroHeadline: 'Turn Your Channel Into a',
      heroHighlight: 'Stronger Brand.',
      heroSubheadline: 'Choose the right growth package for the YouTube channel you just selected and build immediate viewer confidence.',
      targetContextPrefix: 'Growing channel',
      projectionHeadline: 'Channel Milestone Projection',
      projectionDescription: 'Subscribers build essential social proof, encouraging new organic viewers to subscribe.',
      benefits: [
        { title: 'Stronger First Impression', description: 'Crossing key subscriber benchmarks gives first-time viewers instant confidence in your channel.', iconName: 'shield' },
        { title: 'Simple Growth Experience', description: 'No channel permissions or Google access needed. Just your public channel link.', iconName: 'zap' },
        { title: 'Your Target, Verified', description: 'Orders are accurately mapped to your verified channel destination.', iconName: 'lock' },
        { title: 'Secure Checkout Flow', description: 'Safe, encrypted transactions with order confirmation and tracking.', iconName: 'trending' },
      ],
      howItWorks: [
        { step: '01', title: 'Target Confirmed', description: 'Public channel confirmed and linked.' },
        { step: '02', title: 'Choose Your Package', description: 'Pick your desired subscriber milestone.' },
        { step: '03', title: 'Complete Checkout', description: 'Order processing begins after payment confirmation.' },
      ],
      planGuide: [
        { tier: 'Starting Small', idealFor: 'Emerging channels', description: 'Start smaller if you are reaching for your first subscriber milestone.' },
        { tier: 'Balanced Growth', idealFor: 'Consistent uploaders', description: 'Choose mid-tier packages for a solid channel foundation.' },
        { tier: 'High-Impact Packages', idealFor: 'Podcasts & media brands', description: 'Larger packages designed for high-capacity channel authority.' },
      ],
      faqs: [
        { question: 'Do I need to provide my Google password?', answer: 'No. We never ask for Google credentials or YouTube Studio access.' },
        { question: 'What happens after checkout?', answer: 'Order processing begins after payment confirmation.' },
      ],
    },
  },
  likes: {
    instagram: {
      serviceTitle: 'Instagram Likes',
      unitLabel: 'Likes',
      heroHeadline: 'Give Your Content',
      heroHighlight: 'More Presence.',
      heroSubheadline: 'Strengthen the visible engagement around the post or Reel you just selected with flexible like packages.',
      targetContextPrefix: 'Boosting post',
      projectionHeadline: 'Engagement Impact Preview',
      projectionDescription: 'Visible likes reinforce content appeal and encourage organic viewers to interact.',
      benefits: [
        { title: 'Stronger Post Presence', description: 'Elevate the social proof of key announcements, product drops, and photos.', iconName: 'heart' },
        { title: 'Simple Growth Experience', description: 'No login required. Delivered directly to your verified post link.', iconName: 'zap' },
        { title: 'Your Target, Verified', description: 'Target URL is locked to prevent delivery errors.', iconName: 'lock' },
        { title: 'Secure Checkout Flow', description: 'Protected checkout with automatic order registration.', iconName: 'trending' },
      ],
      howItWorks: [
        { step: '01', title: 'Target Confirmed', description: 'Selected post link verified and locked.' },
        { step: '02', title: 'Choose Your Package', description: 'Select the like count for this post.' },
        { step: '03', title: 'Complete Checkout', description: 'Order processing begins after payment confirmation.' },
      ],
      planGuide: [
        { tier: 'Starting Small', idealFor: 'Daily posts', description: 'Start smaller for a subtle engagement lift.' },
        { tier: 'Balanced Growth', idealFor: 'Collabs & launches', description: 'Choose mid-range packages for strong social proof.' },
        { tier: 'High-Impact Packages', idealFor: 'Hero content & ads', description: 'Larger packages for high-visibility campaigns.' },
      ],
      faqs: [
        { question: 'Do I need to provide my password?', answer: 'No passwords are ever requested. Only the public post URL is needed.' },
        { question: 'What happens after checkout?', answer: 'Order processing begins after payment confirmation.' },
      ],
    },
    tiktok: {
      serviceTitle: 'TikTok Likes',
      unitLabel: 'Likes',
      heroHeadline: 'Give Your TikToks',
      heroHighlight: 'More Presence.',
      heroSubheadline: 'Strengthen the visible engagement on your selected video and give it an active, polished presentation.',
      targetContextPrefix: 'Boosting video',
      projectionHeadline: 'Video Engagement Impact',
      projectionDescription: 'Strong like metrics make videos look captivating to new viewers.',
      benefits: [
        { title: 'Stronger Video Presence', description: 'Highlight your top uploads with compelling like counts.', iconName: 'heart' },
        { title: 'Simple Growth Experience', description: 'Just paste your video URL and choose your package.', iconName: 'zap' },
        { title: 'Your Target, Verified', description: 'Connected to your exact verified TikTok video URL.', iconName: 'lock' },
        { title: 'Secure Checkout Flow', description: 'Instant, encrypted checkout processing.', iconName: 'trending' },
      ],
      howItWorks: [
        { step: '01', title: 'Target Confirmed', description: 'TikTok video link verified.' },
        { step: '02', title: 'Choose Your Package', description: 'Pick your desired like volume.' },
        { step: '03', title: 'Complete Checkout', description: 'Order processing begins after payment confirmation.' },
      ],
      planGuide: [
        { tier: 'Starting Small', idealFor: 'Quick boost', description: 'Start smaller for fresh video uploads.' },
        { tier: 'Balanced Growth', idealFor: 'Trending content', description: 'Mid-range packages for solid video presence.' },
        { tier: 'High-Impact Packages', idealFor: 'Commercial launches', description: 'High-volume packages for maximum engagement impact.' },
      ],
      faqs: [
        { question: 'Do I need my TikTok password?', answer: 'Never. Only the public URL to your video is required.' },
      ],
    },
    twitter: {
      serviceTitle: 'X (Twitter) Likes',
      unitLabel: 'Likes',
      heroHeadline: 'Give Your Posts',
      heroHighlight: 'More Presence.',
      heroSubheadline: 'Strengthen the visible engagement around the tweet you selected with reliable like packages.',
      targetContextPrefix: 'Boosting post',
      projectionHeadline: 'Tweet Engagement Preview',
      projectionDescription: 'Higher like counts help your statements stand out in fast-moving timelines.',
      benefits: [
        { title: 'Stronger Post Presence', description: 'Make key announcements appear widely appreciated.', iconName: 'heart' },
        { title: 'Simple Growth Experience', description: 'Fast URL verification and package selection.', iconName: 'zap' },
        { title: 'Your Target, Verified', description: 'Directly linked to your public tweet destination.', iconName: 'lock' },
        { title: 'Secure Checkout Flow', description: 'Protected checkout with automatic queue routing.', iconName: 'trending' },
      ],
      howItWorks: [
        { step: '01', title: 'Target Confirmed', description: 'Tweet link confirmed.' },
        { step: '02', title: 'Choose Your Package', description: 'Select like tier.' },
        { step: '03', title: 'Complete Checkout', description: 'Order processing begins after payment confirmation.' },
      ],
      planGuide: [
        { tier: 'Starting Small', idealFor: 'Standard tweets', description: 'Quick credibility boost.' },
        { tier: 'Balanced Growth', idealFor: 'Threads & launches', description: 'Noticeable engagement presence.' },
        { tier: 'High-Impact Packages', idealFor: 'Major announcements', description: 'High-volume social authority.' },
      ],
      faqs: [
        { question: 'Do I need my X password?', answer: 'No passwords are ever requested.' },
      ],
    },
    youtube: {
      serviceTitle: 'YouTube Likes',
      unitLabel: 'Likes',
      heroHeadline: 'Give Your YouTube Videos',
      heroHighlight: 'More Presence.',
      heroSubheadline: 'Strengthen the visible engagement on your selected video or Short with verified like packages.',
      targetContextPrefix: 'Boosting video',
      projectionHeadline: 'Video Engagement Impact',
      projectionDescription: 'Positive like signals reinforce viewer confidence from the very first second.',
      benefits: [
        { title: 'Stronger Video Presence', description: 'Enhance the credibility of your Shorts and long-form uploads.', iconName: 'heart' },
        { title: 'Simple Growth Experience', description: 'Zero Google permissions required.', iconName: 'zap' },
        { title: 'Your Target, Verified', description: 'Strictly tied to your public YouTube video link.', iconName: 'lock' },
        { title: 'Secure Checkout Flow', description: 'Encrypted checkout and automated tracking.', iconName: 'trending' },
      ],
      howItWorks: [
        { step: '01', title: 'Target Confirmed', description: 'YouTube video link verified.' },
        { step: '02', title: 'Choose Your Package', description: 'Select like tier.' },
        { step: '03', title: 'Complete Checkout', description: 'Order processing begins after payment confirmation.' },
      ],
      planGuide: [
        { tier: 'Starting Small', idealFor: 'Shorts & clips', description: 'Clean boost for quick uploads.' },
        { tier: 'Balanced Growth', idealFor: 'Standard videos', description: 'Solid engagement foundation.' },
        { tier: 'High-Impact Packages', idealFor: 'Flagship productions', description: 'Significant like volumes.' },
      ],
      faqs: [
        { question: 'Do I need access to YouTube Studio?', answer: 'No. Only the public link to your video is needed.' },
      ],
    },
  },
  views: {
    instagram: {
      serviceTitle: 'Instagram Views',
      unitLabel: 'Views',
      heroHeadline: 'Put More Momentum',
      heroHighlight: 'Behind Your Content.',
      heroSubheadline: 'Increase the visible view count on the Reel or video you selected and strengthen its presentation.',
      targetContextPrefix: 'Scaling Reel',
      projectionHeadline: 'Projected View Metrics',
      projectionDescription: 'Higher view counts give your video content an established, high-interest presentation.',
      benefits: [
        { title: 'Content Momentum', description: 'Elevate view counters to make your video content look widely watched.', iconName: 'trending' },
        { title: 'Simple Growth Experience', description: 'Select high-capacity view tiers in just a few clicks.', iconName: 'zap' },
        { title: 'Your Target, Verified', description: 'Delivered accurately to your confirmed Reel destination.', iconName: 'lock' },
        { title: 'Secure Checkout Flow', description: 'Bank-grade encrypted payment gateway.', iconName: 'shield' },
      ],
      howItWorks: [
        { step: '01', title: 'Target Confirmed', description: 'Reel URL confirmed.' },
        { step: '02', title: 'Choose Your Package', description: 'Pick your view volume.' },
        { step: '03', title: 'Complete Checkout', description: 'Order processing begins after payment confirmation.' },
      ],
      planGuide: [
        { tier: 'Starting Small', idealFor: 'Fresh Reels', description: 'Get view counters moving early.' },
        { tier: 'Balanced Growth', idealFor: 'Core productions', description: 'Noticeable volume for key content.' },
        { tier: 'High-Impact Packages', idealFor: 'Promos & ads', description: 'Massive view numbers for high-budget campaigns.' },
      ],
      faqs: [
        { question: 'What happens after checkout?', answer: 'Order processing begins after payment confirmation.' },
      ],
    },
    tiktok: {
      serviceTitle: 'TikTok Views',
      unitLabel: 'Views',
      heroHeadline: 'Put More Momentum',
      heroHighlight: 'Behind Your TikToks.',
      heroSubheadline: 'Increase the visible view count on your selected video and make your profile feed feel vibrant and active.',
      targetContextPrefix: 'Scaling video',
      projectionHeadline: 'Video View Milestone',
      projectionDescription: 'Scale view metrics to build an active, engaging impression on profile visitors.',
      benefits: [
        { title: 'Content Momentum', description: 'Strong view counts highlight your most important videos.', iconName: 'trending' },
        { title: 'Simple Growth Experience', description: 'Fast URL confirmation and scalable tier selection.', iconName: 'zap' },
        { title: 'Your Target, Verified', description: 'Locked to your verified public video URL.', iconName: 'lock' },
        { title: 'Secure Checkout Flow', description: 'Safe, instant transaction processing.', iconName: 'shield' },
      ],
      howItWorks: [
        { step: '01', title: 'Target Confirmed', description: 'Video link locked in.' },
        { step: '02', title: 'Choose Your Package', description: 'Select view volume.' },
        { step: '03', title: 'Complete Checkout', description: 'Order processing begins after payment confirmation.' },
      ],
      planGuide: [
        { tier: 'Starting Small', idealFor: 'Daily clips', description: 'Clean baseline numbers.' },
        { tier: 'Balanced Growth', idealFor: 'Trending videos', description: 'Elevated view milestones.' },
        { tier: 'High-Impact Packages', idealFor: 'Brand campaigns', description: 'High-capacity view packages.' },
      ],
      faqs: [
        { question: 'Do you need my password?', answer: 'Never. Only the public link to your TikTok video.' },
      ],
    },
    twitter: {
      serviceTitle: 'X (Twitter) Views',
      unitLabel: 'Views',
      heroHeadline: 'Put More Momentum',
      heroHighlight: 'Behind Your Impressions.',
      heroSubheadline: 'Increase the visible impression metrics on your selected post and strengthen its presentation across feeds.',
      targetContextPrefix: 'Scaling tweet',
      projectionHeadline: 'Impression Counter Preview',
      projectionDescription: 'Visible impressions reinforce that your thoughts and announcements are being seen.',
      benefits: [
        { title: 'Content Momentum', description: 'Make key announcements appear widely viewed on X.', iconName: 'trending' },
        { title: 'Simple Growth Experience', description: 'Instant tweet URL mapping and tier selection.', iconName: 'zap' },
        { title: 'Your Target, Verified', description: 'Delivered directly to your public tweet.', iconName: 'lock' },
        { title: 'Secure Checkout Flow', description: 'Encrypted transactions with order tracking.', iconName: 'shield' },
      ],
      howItWorks: [
        { step: '01', title: 'Target Confirmed', description: 'Tweet URL verified.' },
        { step: '02', title: 'Choose Your Package', description: 'Pick impression tier.' },
        { step: '03', title: 'Complete Checkout', description: 'Order processing begins after payment confirmation.' },
      ],
      planGuide: [
        { tier: 'Starting Small', idealFor: 'Standard tweets', description: 'Quick impression boost.' },
        { tier: 'Balanced Growth', idealFor: 'Product launches', description: 'Noticeable impression jump.' },
        { tier: 'High-Impact Packages', idealFor: 'PR releases', description: 'Substantial impression volume.' },
      ],
      faqs: [
        { question: 'Is my login needed?', answer: 'No passwords are ever requested.' },
      ],
    },
    youtube: {
      serviceTitle: 'YouTube Views',
      unitLabel: 'Views',
      heroHeadline: 'Put More Momentum',
      heroHighlight: 'Behind Your Videos.',
      heroSubheadline: 'Increase the visible view count on the YouTube video you selected and build viewer confidence.',
      targetContextPrefix: 'Scaling video',
      projectionHeadline: 'Video View Milestone',
      projectionDescription: 'Higher view counts give first-time viewers greater reason to click and watch.',
      benefits: [
        { title: 'Content Momentum', description: 'Solid view numbers build immediate authority on your uploads.', iconName: 'trending' },
        { title: 'Simple Growth Experience', description: 'Applicable to standard videos and YouTube Shorts.', iconName: 'zap' },
        { title: 'Your Target, Verified', description: 'Tied strictly to your confirmed public YouTube video link.', iconName: 'lock' },
        { title: 'Secure Checkout Flow', description: 'Encrypted checkout with automatic order registration.', iconName: 'shield' },
      ],
      howItWorks: [
        { step: '01', title: 'Target Confirmed', description: 'Video URL confirmed.' },
        { step: '02', title: 'Choose Your Package', description: 'Choose view volume.' },
        { step: '03', title: 'Complete Checkout', description: 'Order processing begins after payment confirmation.' },
      ],
      planGuide: [
        { tier: 'Starting Small', idealFor: 'New uploads', description: 'Initial traction boost.' },
        { tier: 'Balanced Growth', idealFor: 'Core videos', description: 'Solid view milestones.' },
        { tier: 'High-Impact Packages', idealFor: 'Flagship videos', description: 'High-capacity view volume.' },
      ],
      faqs: [
        { question: 'Can I apply views to YouTube Shorts?', answer: 'Yes, our system supports both standard YouTube video and Shorts links.' },
      ],
    },
  },
  comments: {
    instagram: {
      serviceTitle: 'Instagram Comments',
      unitLabel: 'Comments',
      heroHeadline: 'Make Your Content',
      heroHighlight: 'Feel More Active.',
      heroSubheadline: 'Support the visible conversation around your selected post or Reel with calibrated comment packages.',
      targetContextPrefix: 'Boosting discussion',
      projectionHeadline: 'Conversation Level Projection',
      projectionDescription: 'An active comment thread makes content look engaging and invites further participation.',
      benefits: [
        { title: 'Active Discussion Impression', description: 'Posts with active comment threads feel lively and worthwhile.', iconName: 'users' },
        { title: 'Simple Growth Experience', description: 'No login required. Handled purely via public post URL.', iconName: 'zap' },
        { title: 'Your Target, Verified', description: 'Mapped directly to your verified post destination.', iconName: 'lock' },
        { title: 'Secure Checkout Flow', description: 'Encrypted payment flow with order tracking.', iconName: 'shield' },
      ],
      howItWorks: [
        { step: '01', title: 'Target Confirmed', description: 'Post link confirmed.' },
        { step: '02', title: 'Choose Your Package', description: 'Select comment volume.' },
        { step: '03', title: 'Complete Checkout', description: 'Order processing begins after payment confirmation.' },
      ],
      planGuide: [
        { tier: 'Starting Small', idealFor: 'Standard posts', description: 'Initial comment spark.' },
        { tier: 'Balanced Growth', idealFor: 'Product feedback', description: 'Active comment discussion.' },
        { tier: 'High-Impact Packages', idealFor: 'Major announcements', description: 'Busy, vibrant comment threads.' },
      ],
      faqs: [
        { question: 'Do I need to provide my password?', answer: 'No passwords are ever requested.' },
      ],
    },
    tiktok: {
      serviceTitle: 'TikTok Comments',
      unitLabel: 'Comments',
      heroHeadline: 'Make Your Videos',
      heroHighlight: 'Feel More Active.',
      heroSubheadline: 'Support the visible conversation under your selected TikTok video with targeted comment packages.',
      targetContextPrefix: 'Boosting discussion',
      projectionHeadline: 'Comment Feed Simulation',
      projectionDescription: 'Active comments encourage organic viewers to jump in and participate.',
      benefits: [
        { title: 'Active Discussion Impression', description: 'Vibrant comment sections highlight community interest.', iconName: 'users' },
        { title: 'Simple Growth Experience', description: 'Zero login details required.', iconName: 'zap' },
        { title: 'Your Target, Verified', description: 'Mapped directly to your verified video link.', iconName: 'lock' },
        { title: 'Secure Checkout Flow', description: 'Safe and encrypted payment pipeline.', iconName: 'shield' },
      ],
      howItWorks: [
        { step: '01', title: 'Target Confirmed', description: 'Video URL confirmed.' },
        { step: '02', title: 'Choose Your Package', description: 'Pick comment count.' },
        { step: '03', title: 'Complete Checkout', description: 'Order processing begins after payment confirmation.' },
      ],
      planGuide: [
        { tier: 'Starting Small', idealFor: 'Daily clips', description: 'Initial interaction boost.' },
        { tier: 'Balanced Growth', idealFor: 'Trending videos', description: 'Active comment discussion.' },
        { tier: 'High-Impact Packages', idealFor: 'Brand launches', description: 'Dense comment volume.' },
      ],
      faqs: [
        { question: 'Do I need my TikTok password?', answer: 'No. Only the public link to your video is required.' },
      ],
    },
    twitter: {
      serviceTitle: 'X (Twitter) Replies',
      unitLabel: 'Replies',
      heroHeadline: 'Make Your Posts',
      heroHighlight: 'Feel More Active.',
      heroSubheadline: 'Support the visible conversation and replies under your selected post with reliable packages.',
      targetContextPrefix: 'Boosting replies',
      projectionHeadline: 'Discussion Feed Preview',
      projectionDescription: 'Visible replies make statements look widely discussed and engaging.',
      benefits: [
        { title: 'Active Discussion Impression', description: 'Make key announcements appear widely debated.', iconName: 'users' },
        { title: 'Simple Growth Experience', description: 'Delivered purely via public tweet URL.', iconName: 'zap' },
        { title: 'Your Target, Verified', description: 'Directly linked to your verified post.', iconName: 'lock' },
        { title: 'Secure Checkout Flow', description: 'Encrypted checkout with automatic order registration.', iconName: 'shield' },
      ],
      howItWorks: [
        { step: '01', title: 'Target Confirmed', description: 'Tweet URL confirmed.' },
        { step: '02', title: 'Choose Your Package', description: 'Select reply tier.' },
        { step: '03', title: 'Complete Checkout', description: 'Order processing begins after payment confirmation.' },
      ],
      planGuide: [
        { tier: 'Starting Small', idealFor: 'Single tweets', description: 'Subtle reply activity.' },
        { tier: 'Balanced Growth', idealFor: 'Threads & questions', description: 'Active discussion presence.' },
        { tier: 'High-Impact Packages', idealFor: 'Major announcements', description: 'Substantial conversation footprint.' },
      ],
      faqs: [
        { question: 'Is my login needed?', answer: 'No passwords are ever requested.' },
      ],
    },
    youtube: {
      serviceTitle: 'YouTube Comments',
      unitLabel: 'Comments',
      heroHeadline: 'Make Your Videos',
      heroHighlight: 'Feel More Active.',
      heroSubheadline: 'Support the visible conversation on your YouTube video with calibrated comment packages.',
      targetContextPrefix: 'Boosting discussion',
      projectionHeadline: 'Community Discussion Preview',
      projectionDescription: 'An active comment section makes content look engaging and established.',
      benefits: [
        { title: 'Active Discussion Impression', description: 'Videos with active comments encourage viewer engagement.', iconName: 'users' },
        { title: 'Simple Growth Experience', description: 'No Google or YouTube Studio permissions needed.', iconName: 'zap' },
        { title: 'Your Target, Verified', description: 'Directly linked to your public video destination.', iconName: 'lock' },
        { title: 'Secure Checkout Flow', description: 'Safe payment processing with order tracking.', iconName: 'shield' },
      ],
      howItWorks: [
        { step: '01', title: 'Target Confirmed', description: 'Video URL confirmed.' },
        { step: '02', title: 'Choose Your Package', description: 'Choose comment tier.' },
        { step: '03', title: 'Complete Checkout', description: 'Order processing begins after payment confirmation.' },
      ],
      planGuide: [
        { tier: 'Starting Small', idealFor: 'New videos', description: 'Initial comment boost.' },
        { tier: 'Balanced Growth', idealFor: 'Regular productions', description: 'Active comment section.' },
        { tier: 'High-Impact Packages', idealFor: 'Flagship videos', description: 'High-density discussion threads.' },
      ],
      faqs: [
        { question: 'Do you need access to YouTube Studio?', answer: 'No. Only the public link to your video is required.' },
      ],
    },
  },
};
