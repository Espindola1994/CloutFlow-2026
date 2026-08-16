import {
  YouTubeVerifiedProfile,
  YouTubeVideoItem,
  SearchErrorCode,
} from "../types";
import { socialCache } from "../cache";
import { fetchBrightDataStructuredScraper } from "./scraper";
import { getBrightDataConfig } from "./resolvers";
import { createSignedJobToken } from "../tokens";

// -------------------------------------------------------------
// YOUTUBE (Channel: gd_lk538t2k2p1k3oos71 / Video: gd_lk56epmy2i5g7lzu0k)
// -------------------------------------------------------------

export function normalizeYouTubeChannelUrl(input: string): string {
  const clean = input.trim();
  if (clean.startsWith("@")) {
    return `https://www.youtube.com/${clean}/about`;
  }
  if (clean.startsWith("http")) {
    const url = new URL(clean);
    let path = url.pathname.replace(/\/+$/, "");
    if (!path.endsWith("/about") && (path.includes("/@") || path.includes("/channel/"))) {
      path = `${path}/about`;
    }
    return `https://www.youtube.com${path}`;
  }
  return `https://www.youtube.com/@${clean.replace(/^@/, "")}/about`;
}

export function normalizeYouTubeChannelData(rawData: any, fallbackHandle: string): YouTubeVerifiedProfile | null {
  const item = Array.isArray(rawData) ? rawData[0] : (rawData.data ? rawData.data[0] || rawData.data : rawData);
  if (!item || (!item.name && !item.handle && !item.id && !item.identifier)) {
    return null;
  }

  const rawHandle = String(item.handle || fallbackHandle || item.name || "");
  const formattedHandle = rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`;
  const channelName = String(item.name || item.title || rawHandle.replace(/^@/, ""));
  const avatarUrl = String(item.profile_image || item.avatar || item.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(channelName)}`);
  const coverUrl = item.banner_img || item.banner || item.header_image || item.cover || undefined;
  const subscriberCount = Number(item.subscribers !== undefined ? item.subscribers : (item.subscriber_count || 0));
  const videoCount = Number(item.videos_count !== undefined ? item.videos_count : (item.video_count || 0));
  const totalViews = Number(item.views !== undefined ? item.views : (item.view_count || 0));
  const bio = item.Description || item.description || item.bio || undefined;

  let links: string | undefined = undefined;
  if (item.Links && Array.isArray(item.Links) && item.Links.length > 0) {
    const firstLink = item.Links[0];
    if (typeof firstLink === "string") {
      links = firstLink;
    } else if (firstLink && typeof firstLink === "object") {
      links = typeof firstLink.url === "string" ? firstLink.url : (typeof firstLink.href === "string" ? firstLink.href : (typeof firstLink.link === "string" ? firstLink.link : undefined));
    }
  }

  // Videos do canal (se vierem em top_videos ou recent_videos)
  let videos: YouTubeVideoItem[] = [];
  const rawVideos: any[] = item.top_videos || item.videos || item.recent_videos || [];
  if (rawVideos.length > 0) {
    videos = rawVideos.slice(0, 3).map((v: any) => ({
      id: String(v.id || v.video_id || Math.random()),
      title: v.title || v.name,
      thumbnail_url: String(v.thumbnail || v.preview_image || v.thumbnail_url || v.cover || ""),
      views_count: Number(v.views || v.view_count || v.play_count || 0),
    }));
  }

  return {
    platform: "youtube",
    channel_id: String(item.id || item.identifier || item.channel_id || ""),
    username: formattedHandle,
    full_name: channelName,
    avatar_url: avatarUrl,
    cover_url: coverUrl,
    followers_count: subscriberCount,
    video_count: videoCount,
    total_views: totalViews,
    bio: bio ? String(bio).trim() : undefined,
    link: links,
    is_verified: Boolean(item.is_verified || item.verified),
    videos: videos.length > 0 ? videos : undefined,
  };
}

export async function resolveYouTubeChannel(
  handleOrUrl: string
): Promise<{
  success: boolean;
  data?: YouTubeVerifiedProfile;
  pending?: boolean;
  requestId?: string;
  code?: SearchErrorCode;
  message?: string;
}> {
  if (!handleOrUrl) {
    return { success: false, code: "INVALID_HANDLE", message: "Identificador de canal inválido." };
  }

  const { apiKey } = getBrightDataConfig();
  const targetUrl = normalizeYouTubeChannelUrl(handleOrUrl);
  const cacheKey = `yt:channel:${targetUrl.toLowerCase()}`;

  const cached = socialCache.get<YouTubeVerifiedProfile>(cacheKey);
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

  const youtubeDatasetId = process.env.BRIGHTDATA_YOUTUBE_DATASET;
  if (!youtubeDatasetId) {
    return {
      success: false,
      code: "PROVIDER_RESTRICTED",
      message: "Esta consulta está temporariamente indisponível para esta plataforma.",
    };
  }

  const scraperRes = await fetchBrightDataStructuredScraper(
    youtubeDatasetId,
    { url: targetUrl },
    true
  );

  console.log(`[YouTube Channel Scraper] URL: ${targetUrl} | Status: ${scraperRes.status} | Pending: ${Boolean(scraperRes.pending)}`);

  if (scraperRes.pending && scraperRes.snapshotId) {
    const requestId = createSignedJobToken({
      platform: "youtube",
      snapshotId: scraperRes.snapshotId,
      operation: "profile",
      originalInput: handleOrUrl,
    }, 300);

    return { success: true, pending: true, requestId };
  }

  if (scraperRes.ok && scraperRes.data) {
    const normalized = normalizeYouTubeChannelData(scraperRes.data, handleOrUrl);
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
    message: "Não encontramos esse canal no YouTube. Confira o @ ou link e tente novamente.",
  };
}

export async function resolveYouTubeVideo(
  videoUrl: string
): Promise<{
  success: boolean;
  data?: YouTubeVerifiedProfile;
  pending?: boolean;
  requestId?: string;
  code?: SearchErrorCode;
  message?: string;
}> {
  if (!videoUrl) {
    return { success: false, code: "CONTENT_NOT_FOUND", message: "Esse vídeo não foi encontrado ou não está mais disponível." };
  }

  const { apiKey } = getBrightDataConfig();
  const cacheKey = `yt:video:${videoUrl.toLowerCase()}`;

  const cached = socialCache.get<YouTubeVerifiedProfile>(cacheKey);
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

  const videoDatasetId = process.env.BRIGHTDATA_YOUTUBE_VIDEO_DATASET;
  if (!videoDatasetId) {
    return {
      success: false,
      code: "PROVIDER_RESTRICTED",
      message: "Esta consulta está temporariamente indisponível para esta plataforma.",
    };
  }

  const scraperRes = await fetchBrightDataStructuredScraper(
    videoDatasetId,
    { url: videoUrl },
    true
  );

  console.log(`[YouTube Video Scraper] URL: ${videoUrl} | Status: ${scraperRes.status} | Pending: ${Boolean(scraperRes.pending)}`);

  if (scraperRes.pending && scraperRes.snapshotId) {
    const requestId = createSignedJobToken({
      platform: "youtube",
      snapshotId: scraperRes.snapshotId,
      operation: "content",
      originalInput: videoUrl,
    }, 300);

    return { success: true, pending: true, requestId };
  }

  if (scraperRes.ok && scraperRes.data) {
    const rawData = scraperRes.data;
    const item = Array.isArray(rawData) ? rawData[0] : (rawData.data ? rawData.data[0] || rawData.data : rawData);
    const channelTarget = item?.channel_url || item?.channel_url_decoded || item?.handle_name || item?.youtuber || item?.uploader_url;

    if (channelTarget) {
      return await resolveYouTubeChannel(channelTarget);
    }
  }

  return {
    success: false,
    code: "CONTENT_NOT_FOUND",
    message: "Esse vídeo do YouTube não foi encontrado ou não está mais disponível.",
  };
}
