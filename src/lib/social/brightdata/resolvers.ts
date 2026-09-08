import {
  TikTokVerifiedProfile,
  TikTokVideoItem,
  TwitterVerifiedProfile,
  TwitterPinnedTweet,
  YouTubeVerifiedProfile,
  YouTubeVideoItem,
  SearchErrorCode,
} from "../types";
import { socialCache } from "../cache";
import { fetchBrightDataStructuredScraper, checkBrightDataSnapshot } from "./scraper";
import { createSignedJobToken } from "../tokens";

export function getBrightDataConfig() {
  const apiKey = process.env.BRIGHTDATA_API_KEY;
  const zone = process.env.BRIGHTDATA_ZONE;
  const rawUrl = process.env.BRIGHTDATA_API_URL || "https://api.brightdata.com";
  const baseUrl = rawUrl.replace(/\/request\/?$/, "");
  const timeout = parseInt(process.env.API_TIMEOUT || "35000", 10);
  return { apiKey, zone, baseUrl, timeout };
}

// -------------------------------------------------------------
// TIKTOK (Dataset: gd_l1villgoiiidt09ci / Post: gd_lu702nij2f790tmv9h)
// -------------------------------------------------------------
const TIKTOK_CACHE_SECONDS = 6 * 60 * 60;
const TIKTOK_FAST_TIMEOUT_MS = 8000;

function cleanTikTokUsername(value: string): string {
  return value.trim().replace(/^@+/, "").split(/[/?#]/)[0];
}

function extractTikTokUsernameFromVideoUrl(input: string): string | null {
  try {
    const url = new URL(input);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments[0]?.startsWith("@") && segments[1] === "video" && segments[2]) {
      return cleanTikTokUsername(segments[0]);
    }
  } catch {
    return null;
  }
  return null;
}

function extractJsonScript(html: string, id: string): any | null {
  const match = html.match(new RegExp(`<script[^>]+id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`, "i"));
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function normalizeTikTokHydrationJson(json: any, fallbackUsername: string): TikTokVerifiedProfile | null {
  if (!json) return null;

  // Current TikTok web hydration format.
  const detail = json?.__DEFAULT_SCOPE__?.["webapp.user-detail"]?.userInfo;
  if (detail?.user) {
    const user = detail.user;
    const stats = detail.stats || {};
    const detailVideos =
      detail?.itemList ||
      detail?.items ||
      detail?.videos ||
      json?.__DEFAULT_SCOPE__?.["webapp.user-detail"]?.itemList ||
      [];
    return normalizeTikTokProfileData({
      account_id: user.uniqueId || fallbackUsername,
      nickname: user.nickname,
      profile_pic_url_hd: user.avatarLarger || user.avatarMedium || user.avatarThumb,
      following: stats.followingCount,
      followers: stats.followerCount,
      likes: stats.heartCount,
      biography: user.signature,
      bioLink: user.bioLink,
      privateAccount: user.privateAccount,
      verified: user.verified,
      videos: Array.isArray(detailVideos) ? detailVideos : [],
    }, fallbackUsername);
  }

  // Older SIGI_STATE format, kept as a compatibility fallback.
  const users = json?.UserModule?.users || {};
  const statsMap = json?.UserModule?.stats || {};
  const username = cleanTikTokUsername(fallbackUsername);
  const user = users[username] || users[`@${username}`] || (Object.values(users)[0] as any);
  const stats = statsMap[username] || statsMap[`@${username}`] || (Object.values(statsMap)[0] as any);
  if (user) {
    const itemModule = json?.ItemModule || {};
    const profileVideos = Object.values(itemModule).filter((item: any) => {
      const owner = item?.author || item?.authorUniqueId || item?.author_name;
      return !owner || cleanTikTokUsername(String(owner)).toLowerCase() === username.toLowerCase();
    });
    return normalizeTikTokProfileData({
      account_id: user.uniqueId || username,
      nickname: user.nickname,
      profile_pic_url_hd: user.avatarLarger || user.avatarMedium || user.avatarThumb,
      following: stats?.followingCount,
      followers: stats?.followerCount,
      likes: stats?.heartCount,
      biography: user.signature,
      bioLink: user.bioLink,
      privateAccount: user.privateAccount,
      verified: user.verified,
      videos: profileVideos,
    }, username);
  }

  return null;
}

async function resolveTikTokProfileFast(username: string): Promise<TikTokVerifiedProfile | null> {
  const cleanUsername = cleanTikTokUsername(username);
  if (!cleanUsername) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIKTOK_FAST_TIMEOUT_MS);
  try {
    const response = await fetch(`https://www.tiktok.com/@${encodeURIComponent(cleanUsername)}`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: TIKTOK_CACHE_SECONDS },
    });

    if (!response.ok) return null;
    const html = await response.text();
    const universal = extractJsonScript(html, "__UNIVERSAL_DATA_FOR_REHYDRATION__");
    const fromUniversal = normalizeTikTokHydrationJson(universal, cleanUsername);
    if (fromUniversal) return fromUniversal;

    const sigi = extractJsonScript(html, "SIGI_STATE");
    return normalizeTikTokHydrationJson(sigi, cleanUsername);
  } catch (error) {
    console.warn(`[TikTok Fast Path] @${cleanUsername} failed:`, error instanceof Error ? error.message : error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function resolveTikTokVideoOwnerFast(videoUrl: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIKTOK_FAST_TIMEOUT_MS);
  try {
    const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
    const response = await fetch(endpoint, {
      method: "GET",
      signal: controller.signal,
      next: { revalidate: TIKTOK_CACHE_SECONDS },
    });
    if (!response.ok) return null;
    const data = await response.json().catch(() => null);
    if (!data) return null;

    if (typeof data.author_url === "string") {
      const match = data.author_url.match(/tiktok\.com\/@([^/?#]+)/i);
      if (match?.[1]) return cleanTikTokUsername(match[1]);
    }
    if (typeof data.author_name === "string" && data.author_name.trim()) {
      return cleanTikTokUsername(data.author_name);
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveTikTokProfileByUsername(
  username: string
): Promise<{
  success: boolean;
  data?: TikTokVerifiedProfile;
  pending?: boolean;
  requestId?: string;
  code?: SearchErrorCode;
  message?: string;
}> {
  const cleanUsername = cleanTikTokUsername(username);
  if (!cleanUsername) {
    return { success: false, code: "INVALID_HANDLE", message: "Este @ não possui um formato válido." };
  }

  const cacheKey = `tk:user:${cleanUsername.toLowerCase()}`;
  const cached = socialCache.get<TikTokVerifiedProfile>(cacheKey);
  if (cached) {
    return { success: true, data: cached };
  }

  // FAST PATH: read TikTok's public web hydration payload first. This keeps
  // avatar, follower/following/likes counts, bio, privacy and verification
  // without waiting minutes for a dataset snapshot.
  const fastProfile = await resolveTikTokProfileFast(cleanUsername);
  if (fastProfile) {
    socialCache.set(cacheKey, fastProfile, TIKTOK_CACHE_SECONDS);
    return { success: true, data: fastProfile };
  }

  // Existing Bright Data dataset remains the safe fallback when TikTok blocks
  // direct HTML or changes its public hydration structure.
  const { apiKey } = getBrightDataConfig();
  if (!apiKey) {
    return {
      success: false,
      code: "PROVIDER_ERROR",
      message: "BRIGHTDATA_API_KEY não configurada no servidor.",
    };
  }

  const targetUrl = `https://www.tiktok.com/@${cleanUsername}`;
  const tiktokDatasetId = process.env.BRIGHTDATA_TIKTOK_DATASET;

  if (!tiktokDatasetId) {
    return {
      success: false,
      code: "PROVIDER_RESTRICTED",
      message: "Esta consulta está temporariamente indisponível para esta plataforma.",
    };
  }

  const scraperRes = await fetchBrightDataStructuredScraper(
    tiktokDatasetId,
    { url: targetUrl, country: "" },
    true
  );

  console.log(`[TikTok Scraper Fallback] User: @${cleanUsername} | Status: ${scraperRes.status} | Pending: ${Boolean(scraperRes.pending)}`);

  if (scraperRes.pending && scraperRes.snapshotId) {
    const requestId = createSignedJobToken({
      platform: "tiktok",
      snapshotId: scraperRes.snapshotId,
      operation: "profile",
      originalInput: cleanUsername,
    }, 300);

    return { success: true, pending: true, requestId };
  }

  if (scraperRes.ok && scraperRes.data) {
    const normalized = normalizeTikTokProfileData(scraperRes.data, cleanUsername);
    if (normalized) {
      socialCache.set(cacheKey, normalized, TIKTOK_CACHE_SECONDS);
      return { success: true, data: normalized };
    }
  }

  if (scraperRes.restricted) {
    return {
      success: false,
      code: "PROVIDER_RESTRICTED",
      message: "Esta consulta está temporariamente indisponível para esta plataforma.",
    };
  }

  return {
    success: false,
    code: "PROFILE_NOT_FOUND",
    message: "Não encontramos esse perfil no TikTok. Confira o @ ou link e tente novamente.",
  };
}

export async function resolveTikTokContentToProfile(
  videoUrlOrId: string
): Promise<{
  success: boolean;
  data?: TikTokVerifiedProfile;
  pending?: boolean;
  requestId?: string;
  code?: SearchErrorCode;
  message?: string;
}> {
  if (!videoUrlOrId) {
    return { success: false, code: "CONTENT_NOT_FOUND", message: "Esse conteúdo não foi encontrado ou não está mais disponível." };
  }

  const targetUrl = videoUrlOrId.startsWith("http") ? videoUrlOrId : `https://www.tiktok.com/video/${videoUrlOrId}`;
  const cacheKey = `tk:content:${targetUrl.toLowerCase()}`;
  const cached = socialCache.get<TikTokVerifiedProfile>(cacheKey);
  if (cached) {
    return { success: true, data: cached };
  }

  // FAST PATH: TikTok oEmbed validates a public video and provides its owner
  // without a long-running snapshot. URLs already containing @creator can be
  // used as a secondary hint if oEmbed is temporarily unavailable.
  const urlOwner = extractTikTokUsernameFromVideoUrl(targetUrl);
  const [oEmbedOwner, hintedProfile] = await Promise.all([
    resolveTikTokVideoOwnerFast(targetUrl),
    urlOwner ? resolveTikTokProfileFast(urlOwner) : Promise.resolve(null),
  ]);

  // Only the oEmbed result is treated as content validation. The username in
  // the URL is merely used to prefetch the profile in parallel.
  if (oEmbedOwner) {
    if (hintedProfile && urlOwner && cleanTikTokUsername(oEmbedOwner).toLowerCase() === urlOwner.toLowerCase()) {
      socialCache.set(`tk:user:${urlOwner.toLowerCase()}`, hintedProfile, TIKTOK_CACHE_SECONDS);
      socialCache.set(cacheKey, hintedProfile, TIKTOK_CACHE_SECONDS);
      return { success: true, data: hintedProfile };
    }

    const profileRes = await resolveTikTokProfileByUsername(oEmbedOwner);
    if (profileRes.success && profileRes.data) {
      socialCache.set(cacheKey, profileRes.data, TIKTOK_CACHE_SECONDS);
      return profileRes;
    }
    if (profileRes.pending) return profileRes;
  }

  // Fall back to the original post dataset if the fast public endpoints do not
  // confirm/resolve the content.
  const { apiKey } = getBrightDataConfig();
  if (!apiKey) {
    return {
      success: false,
      code: "PROVIDER_ERROR",
      message: "BRIGHTDATA_API_KEY não configurada no servidor.",
    };
  }

  const tiktokPostDatasetId = process.env.BRIGHTDATA_TIKTOK_POST_DATASET;
  if (!tiktokPostDatasetId) {
    return {
      success: false,
      code: "PROVIDER_RESTRICTED",
      message: "Esta consulta está temporariamente indisponível para esta plataforma.",
    };
  }

  const scraperRes = await fetchBrightDataStructuredScraper(
    tiktokPostDatasetId,
    { url: targetUrl },
    true
  );

  console.log(`[TikTok Post Scraper Fallback] URL: ${targetUrl} | Status: ${scraperRes.status} | Pending: ${Boolean(scraperRes.pending)}`);

  if (scraperRes.pending && scraperRes.snapshotId) {
    const requestId = createSignedJobToken({
      platform: "tiktok",
      snapshotId: scraperRes.snapshotId,
      operation: "content",
      originalInput: targetUrl,
    }, 300);

    return { success: true, pending: true, requestId };
  }

  if (scraperRes.ok && scraperRes.data) {
    const rawData = scraperRes.data;
    const item = Array.isArray(rawData) ? rawData[0] : (rawData.data ? rawData.data[0] || rawData.data : rawData);
    const authorUsername = item?.author?.uniqueId || item?.author?.username || item?.author_username || item?.authorUniqueId || item?.account_id || item?.username;

    if (authorUsername) {
      const profileRes = await resolveTikTokProfileByUsername(authorUsername);
      if (profileRes.success && profileRes.data) {
        socialCache.set(cacheKey, profileRes.data, TIKTOK_CACHE_SECONDS);
      }
      return profileRes;
    }
  }

  return {
    success: false,
    code: "CONTENT_NOT_FOUND",
    message: "Esse vídeo do TikTok não foi encontrado ou não está mais disponível.",
  };
}

export function normalizeTikTokProfileData(rawData: any, fallbackUsername: string): TikTokVerifiedProfile | null {
  const item = Array.isArray(rawData) ? rawData[0] : (rawData.data ? rawData.data[0] || rawData.data : rawData);
  if (!item || (!item.account_id && !item.nickname && !item.uniqueId && !item.username && !item.id)) {
    return null;
  }

  let videos: TikTokVideoItem[] = [];
  const rawVideos: any[] = item.top_videos || item.top_posts_data || item.videos || item.posts || [];
  
  videos = rawVideos.slice(0, 6).map((v: any) => ({
    id: String(v.video_id || v.id || v.aweme_id || Math.random()),
    thumbnail_url: String(v.cover_image || v.cover_url || v.cover || v.thumbnail_url || v.thumbnail || v.dynamicCover || v.dynamic_cover || ""),
    views_count: Number(v.playcount !== undefined ? v.playcount : (v.play_count !== undefined ? v.play_count : (v.views || v.view_count || v.views_count || 0))),
  }));

  return {
    platform: "tiktok",
    username: String(item.account_id || item.uniqueId || item.username || fallbackUsername),
    full_name: String(item.nickname || item.full_name || item.name || fallbackUsername),
    avatar_url: String(item.profile_pic_url_hd || item.profile_pic_url || item.avatarLarger || item.avatarThumb || `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackUsername)}`),
    following_count: Number(item.following !== undefined ? item.following : (item.followingCount || item.following_count || 0)),
    followers_count: Number(item.followers !== undefined ? item.followers : (item.followerCount || item.followers_count || 0)),
    likes_count: Number(item.likes !== undefined ? item.likes : (item.like_count || item.heartCount || item.likes_count || 0)),
    bio: String(item.biography || item.signature || item.bio || ""),
    link: item.bio_link ? String(item.bio_link) : (item.bioLink?.link ? String(item.bioLink.link) : undefined),
    is_private: Boolean(item.is_private || item.privateAccount),
    is_verified: Boolean(item.is_verified || item.verified),
    videos,
  };
}

// -------------------------------------------------------------
// X / TWITTER (gd_lwxmeb2u1cniijd7t4 / gd_lwxkxvnf1cynvib9co)
// -------------------------------------------------------------
export async function resolveTwitterProfileByUsername(
  username: string
): Promise<{
  success: boolean;
  data?: TwitterVerifiedProfile;
  pending?: boolean;
  requestId?: string;
  code?: SearchErrorCode;
  message?: string;
}> {
  if (!username) {
    return { success: false, code: "INVALID_HANDLE", message: "Este @ não possui um formato válido." };
  }

  const { apiKey } = getBrightDataConfig();
  const cacheKey = `tw:user:${username.toLowerCase()}`;
  const cached = socialCache.get<TwitterVerifiedProfile>(cacheKey);
  if (cached) {
    return { success: true, data: cached };
  }

  if (!apiKey) {
    return {
      success: false,
      code: "PROVIDER_ERROR",
      message: "BRIGHTDATA_API_KEY não configurada no servidor.",
    };
  }

  const targetUrl = `https://x.com/${username}`;
  const twitterDatasetId = process.env.BRIGHTDATA_TWITTER_DATASET;

  if (!twitterDatasetId) {
    return {
      success: false,
      code: "PROVIDER_RESTRICTED",
      message: "Esta consulta está temporariamente indisponível para esta plataforma.",
    };
  }

  const scraperRes = await fetchBrightDataStructuredScraper(
    twitterDatasetId,
    { url: targetUrl, max_number_of_posts: 3 },
    true
  );

  console.log(`[Twitter Scraper] User: @${username} | Status: ${scraperRes.status} | Pending: ${Boolean(scraperRes.pending)}`);

  if (scraperRes.pending && scraperRes.snapshotId) {
    const requestId = createSignedJobToken({
      platform: "twitter",
      snapshotId: scraperRes.snapshotId,
      operation: "profile",
      originalInput: username,
    }, 300);

    return { success: true, pending: true, requestId };
  }

  if (scraperRes.ok && scraperRes.data) {
    const normalized = normalizeTwitterProfileData(scraperRes.data, username);
    if (normalized) {
      socialCache.set(cacheKey, normalized, 180);
      return { success: true, data: normalized };
    }
  }

  if (scraperRes.restricted) {
    return {
      success: false,
      code: "PROVIDER_RESTRICTED",
      message: "Esta consulta está temporariamente indisponível para esta plataforma.",
    };
  }

  return {
    success: false,
    code: "PROFILE_NOT_FOUND",
    message: "Não encontramos esse perfil no X/Twitter. Confira o @ ou link e tente novamente.",
  };
}

export async function resolveTwitterContentToProfile(
  tweetIdOrUrl: string
): Promise<{
  success: boolean;
  data?: TwitterVerifiedProfile;
  pending?: boolean;
  requestId?: string;
  code?: SearchErrorCode;
  message?: string;
}> {
  if (!tweetIdOrUrl) {
    return { success: false, code: "CONTENT_NOT_FOUND", message: "Esse conteúdo não foi encontrado ou não está mais disponível." };
  }

  const { apiKey } = getBrightDataConfig();
  const cacheKey = `tw:content:${tweetIdOrUrl}`;
  const cached = socialCache.get<TwitterVerifiedProfile>(cacheKey);
  if (cached) {
    return { success: true, data: cached };
  }

  if (!apiKey) {
    return {
      success: false,
      code: "PROVIDER_ERROR",
      message: "BRIGHTDATA_API_KEY não configurada no servidor.",
    };
  }

  const targetUrl = tweetIdOrUrl.startsWith("http") ? tweetIdOrUrl : `https://x.com/i/status/${tweetIdOrUrl}`;
  const twitterPostDatasetId = process.env.BRIGHTDATA_TWITTER_POST_DATASET;

  if (!twitterPostDatasetId) {
    return {
      success: false,
      code: "PROVIDER_RESTRICTED",
      message: "Esta consulta está temporariamente indisponível para esta plataforma.",
    };
  }

  const scraperRes = await fetchBrightDataStructuredScraper(
    twitterPostDatasetId,
    { url: targetUrl },
    true
  );

  console.log(`[Twitter Post Scraper] URL: ${targetUrl} | Status: ${scraperRes.status} | Pending: ${Boolean(scraperRes.pending)}`);

  if (scraperRes.pending && scraperRes.snapshotId) {
    const requestId = createSignedJobToken({
      platform: "twitter",
      snapshotId: scraperRes.snapshotId,
      operation: "content",
      originalInput: targetUrl,
    }, 300);

    return { success: true, pending: true, requestId };
  }

  if (scraperRes.ok && scraperRes.data) {
    const rawData = scraperRes.data;
    const item = Array.isArray(rawData) ? rawData[0] : (rawData.data ? rawData.data[0] || rawData.data : rawData);
    const authorUsername = item?.user_posted || item?.user?.screen_name || item?.author?.username || item?.author_username || item?.username || item?.screen_name || item?.user_id;

    if (authorUsername) {
      return await resolveTwitterProfileByUsername(authorUsername);
    }
  }

  return {
    success: false,
    code: "CONTENT_NOT_FOUND",
    message: "Esse tweet não foi encontrado ou foi removido.",
  };
}

export function normalizeTwitterProfileData(rawData: any, fallbackUsername: string): TwitterVerifiedProfile | null {
  const item = Array.isArray(rawData) ? rawData[0] : (rawData.data ? rawData.data[0] || rawData.data : rawData);
  if (!item || (!item.profile_name && !item.screen_name && !item.username && !item.user_posted && !item.id && !item.x_id)) {
    return null;
  }

  let pinnedTweet: TwitterPinnedTweet | null = null;
  const posts: any[] = item.posts || [];
  const pinned = posts.find((p: any) => p.is_pinned || p.pinned) || item.pinned_tweet || item.pinnedTweet;
  if (pinned) {
    pinnedTweet = {
      id: String(pinned.post_id || pinned.id || ""),
      text: String(pinned.description || pinned.text || pinned.full_text || ""),
      created_at: pinned.date_posted || pinned.created_at,
      like_count: Number(pinned.likes || pinned.favorite_count || 0),
      retweet_count: Number(pinned.reposts || pinned.retweet_count || 0),
      reply_count: Number(pinned.replies || pinned.reply_count || 0),
    };
  }

  return {
    platform: "twitter",
    username: String(item.screen_name || item.username || item.user_posted || (item.id && !item.id.includes(" ") ? item.id : fallbackUsername.replace(/^@/, ""))),
    full_name: String(item.profile_name || item.name || item.user_posted || item.id || fallbackUsername.replace(/^@/, "")),
    avatar_url: String(item.profile_image_link || item.profile_image_url_https || item.profile_image_url || item.avatar || `https://ui-avatars.com/api/?name=${fallbackUsername}`),
    cover_url: item.banner_image || item.banner_img || item.header_image || item.profile_banner_url || item.cover_image || undefined,
    followers_count: Number(item.followers !== undefined ? item.followers : (item.followers_count || item.follower_count || 0)),
    following_count: Number(item.following !== undefined ? item.following : (item.following_count || item.friends_count || 0)),
    bio: String(item.biography || item.description || item.bio || ""),
    location: item.location ? String(item.location) : undefined,
    link: item.external_link ? String(item.external_link) : (item.url ? String(item.url) : undefined),
    is_verified: Boolean(item.is_verified || item.verified || item.is_blue_verified),
    pinned_tweet: pinnedTweet,
  };
}

// -------------------------------------------------------------
// YOUTUBE (exportado via youtube.ts)
// -------------------------------------------------------------
export {
  resolveYouTubeChannel,
  resolveYouTubeVideo,
  normalizeYouTubeChannelData,
  normalizeYouTubeChannelUrl,
} from "./youtube";
