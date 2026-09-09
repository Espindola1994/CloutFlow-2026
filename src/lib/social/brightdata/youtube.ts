import {
  YouTubeVerifiedProfile,
  YouTubeVideoItem,
  SearchErrorCode,
} from "../types";
import { socialCache } from "../cache";
import { fetchBrightDataStructuredScraper } from "./scraper";
import { getBrightDataConfig } from "./resolvers";
import { createSignedJobToken } from "../tokens";
import { resolveYouTubeChannelViaDataApi, resolveYouTubeVideoViaDataApi } from "../youtube-data-api";

// -------------------------------------------------------------
// YOUTUBE (Channel: gd_lk538t2k2p1k3oos71 / Video: gd_lk56epmy2i5g7lzu0k)
// -------------------------------------------------------------

export function extractYouTubeChannelTarget(rawData: any): string | null {
  const item = Array.isArray(rawData) ? rawData[0] : (rawData?.data ? rawData.data[0] || rawData.data : rawData);
  if (!item) return null;

  const candidates = [
    item.channel_url,
    item.channel_url_decoded,
    item.youtuber,
    item.uploader_url,
    item.author_url,
    item.channel_handle,
    item.handle,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const clean = candidate.trim();
    if (!clean) continue;
    if (clean.startsWith("http") || clean.startsWith("@")) return clean;
  }

  // Bright Data's handle_name is commonly a display name, not a handle.
  // Use it only when it is explicitly formatted as @handle.
  if (typeof item.handle_name === "string" && item.handle_name.trim().startsWith("@")) {
    return item.handle_name.trim();
  }

  return null;
}

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
    return { success: false, code: "INVALID_HANDLE", message: "Invalid channel identifier." };
  }

  const { apiKey } = getBrightDataConfig();
  const targetUrl = normalizeYouTubeChannelUrl(handleOrUrl);
  const cacheKey = `yt:channel:${targetUrl.toLowerCase()}`;

  const cached = socialCache.get<YouTubeVerifiedProfile>(cacheKey);
  if (cached) {
    return { success: true, data: cached };
  }

  // FAST PATH: official YouTube Data API. Usually resolves in seconds and
  // preserves the same normalized profile shape used by the existing UI.
  const fastProfile = await resolveYouTubeChannelViaDataApi(handleOrUrl);
  if (fastProfile) {
    socialCache.set(cacheKey, fastProfile, 21600);
    socialCache.set(`yt:channel:${fastProfile.username.toLowerCase()}`, fastProfile, 21600);
    if (fastProfile.channel_id) {
      socialCache.set(`yt:channel-id:${fastProfile.channel_id.toLowerCase()}`, fastProfile, 21600);
    }
    return { success: true, data: fastProfile };
  }

  // Bright Data remains a transparent fallback for legacy channel URLs and
  // fields that the official API cannot resolve.
  if (!apiKey) {
    return {
      success: false,
      code: "PROVIDER_ERROR",
      message: "We couldn't check this channel right now. Please try again.",
    };
  }

  const youtubeDatasetId = process.env.BRIGHTDATA_YOUTUBE_DATASET;
  if (!youtubeDatasetId) {
    return {
      success: false,
      code: "PROVIDER_RESTRICTED",
      message: "This query is temporarily unavailable for this platform.",
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
      socialCache.set(cacheKey, normalized, 21600);
      socialCache.set(`yt:channel:${normalized.username.toLowerCase()}`, normalized, 21600);
      return { success: true, data: normalized };
    }
  }

  if (scraperRes.restricted) {
    return {
      success: false,
      code: "PROVIDER_RESTRICTED",
      message: "This query is temporarily unavailable for this platform.",
    };
  }

  return {
    success: false,
    code: "PROFILE_NOT_FOUND",
    message: "We couldn't find this YouTube channel. Check the @handle or link and try again.",
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
    return { success: false, code: "CONTENT_NOT_FOUND", message: "This video could not be found or is no longer available." };
  }

  const { apiKey } = getBrightDataConfig();
  const cacheKey = `yt:video:${videoUrl.toLowerCase()}`;

  const cached = socialCache.get<YouTubeVerifiedProfile>(cacheKey);
  if (cached) {
    return { success: true, data: cached };
  }

  // FAST PATH: validate the video/Short and resolve its owner through the
  // official YouTube Data API instead of waiting for two Bright Data jobs.
  const fastProfile = await resolveYouTubeVideoViaDataApi(videoUrl);
  if (fastProfile) {
    socialCache.set(cacheKey, fastProfile, 21600);
    socialCache.set(`yt:channel:${fastProfile.username.toLowerCase()}`, fastProfile, 21600);
    if (fastProfile.channel_id) {
      socialCache.set(`yt:channel-id:${fastProfile.channel_id.toLowerCase()}`, fastProfile, 21600);
    }
    return { success: true, data: fastProfile };
  }

  if (!apiKey) {
    return {
      success: false,
      code: "PROVIDER_ERROR",
      message: "We couldn't check this video right now. Please try again.",
    };
  }

  const videoDatasetId = process.env.BRIGHTDATA_YOUTUBE_VIDEO_DATASET;
  if (!videoDatasetId) {
    return {
      success: false,
      code: "PROVIDER_RESTRICTED",
      message: "This query is temporarily unavailable for this platform.",
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
    const channelTarget = extractYouTubeChannelTarget(scraperRes.data);

    if (channelTarget) {
      return await resolveYouTubeChannel(channelTarget);
    }
  }

  return {
    success: false,
    code: "CONTENT_NOT_FOUND",
    message: "This YouTube video could not be found or is no longer available.",
  };
}
