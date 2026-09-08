import { YouTubeVerifiedProfile, YouTubeVideoItem } from "./types";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_CACHE_SECONDS = 6 * 60 * 60;
const YOUTUBE_TIMEOUT_MS = 8000;

type ChannelLookup =
  | { type: "id"; value: string }
  | { type: "handle"; value: string }
  | { type: "username"; value: string };

function getApiKey(): string | null {
  return process.env.YOUTUBE_DATA_API_KEY || process.env.YOUTUBE_API_KEY || null;
}

function parseChannelLookup(input: string): ChannelLookup | null {
  const clean = input.trim();
  if (!clean) return null;

  if (clean.startsWith("@")) {
    return { type: "handle", value: clean };
  }

  if (/^UC[a-zA-Z0-9_-]{20,}$/.test(clean)) {
    return { type: "id", value: clean };
  }

  if (clean.startsWith("http")) {
    try {
      const url = new URL(clean);
      const segments = url.pathname.split("/").filter(Boolean);
      if (segments[0]?.startsWith("@")) {
        return { type: "handle", value: segments[0] };
      }
      if (segments[0] === "channel" && segments[1]) {
        return { type: "id", value: segments[1] };
      }
      if (segments[0] === "user" && segments[1]) {
        return { type: "username", value: segments[1] };
      }
      // /c/... aliases are not reliably resolvable without a costly search.list call.
      // Let the existing Bright Data fallback handle those uncommon legacy URLs.
      return null;
    } catch {
      return null;
    }
  }

  return { type: "handle", value: clean.startsWith("@") ? clean : `@${clean}` };
}

export function extractYouTubeVideoId(input: string): string | null {
  const clean = input.trim();
  if (/^[a-zA-Z0-9_-]{6,}$/.test(clean) && !clean.includes("/")) return clean;

  try {
    const url = new URL(clean);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || null;
    }
    if (host.endsWith("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      const segments = url.pathname.split("/").filter(Boolean);
      if ((segments[0] === "shorts" || segments[0] === "embed" || segments[0] === "live") && segments[1]) {
        return segments[1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

async function youtubeGet(path: string, params: Record<string, string>): Promise<any | null> {
  const key = getApiKey();
  if (!key) return null;

  const url = new URL(`${YOUTUBE_API_BASE}/${path}`);
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }
  url.searchParams.set("key", key);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), YOUTUBE_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      signal: controller.signal,
      next: { revalidate: YOUTUBE_CACHE_SECONDS },
    });
    if (!res.ok) {
      console.warn(`[YouTube Data API] ${path} returned HTTP ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.warn(`[YouTube Data API] ${path} fast path failed:`, error instanceof Error ? error.message : error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function getRecentVideos(uploadPlaylistId?: string): Promise<YouTubeVideoItem[] | undefined> {
  if (!uploadPlaylistId) return undefined;

  const playlistJson = await youtubeGet("playlistItems", {
    part: "snippet,contentDetails",
    playlistId: uploadPlaylistId,
    maxResults: "3",
  });

  const items: any[] = Array.isArray(playlistJson?.items) ? playlistJson.items : [];
  if (items.length === 0) return undefined;

  const ids = items
    .map((item) => item?.contentDetails?.videoId || item?.snippet?.resourceId?.videoId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  let viewMap = new Map<string, number>();
  if (ids.length > 0) {
    const videosJson = await youtubeGet("videos", {
      part: "statistics",
      id: ids.join(","),
    });
    for (const video of Array.isArray(videosJson?.items) ? videosJson.items : []) {
      if (video?.id) viewMap.set(String(video.id), Number(video?.statistics?.viewCount || 0));
    }
  }

  return items.slice(0, 3).map((item) => {
    const videoId = String(item?.contentDetails?.videoId || item?.snippet?.resourceId?.videoId || "");
    const thumbs = item?.snippet?.thumbnails || {};
    const thumbnail = thumbs?.maxres?.url || thumbs?.standard?.url || thumbs?.high?.url || thumbs?.medium?.url || thumbs?.default?.url || "";
    return {
      id: videoId,
      title: item?.snippet?.title ? String(item.snippet.title) : undefined,
      thumbnail_url: String(thumbnail),
      views_count: viewMap.get(videoId) || 0,
    };
  });
}

async function resolveChannelByLookup(lookup: ChannelLookup): Promise<YouTubeVerifiedProfile | null> {
  const params: Record<string, string> = {
    part: "snippet,statistics,brandingSettings,contentDetails",
    maxResults: "1",
  };

  if (lookup.type === "id") params.id = lookup.value;
  if (lookup.type === "handle") params.forHandle = lookup.value;
  if (lookup.type === "username") params.forUsername = lookup.value;

  const json = await youtubeGet("channels", params);
  const channel = Array.isArray(json?.items) ? json.items[0] : null;
  if (!channel) return null;

  const snippet = channel.snippet || {};
  const stats = channel.statistics || {};
  const branding = channel.brandingSettings || {};
  const customUrl = typeof snippet.customUrl === "string" ? snippet.customUrl.trim() : "";
  const username = customUrl
    ? (customUrl.startsWith("@") ? customUrl : `@${customUrl}`)
    : (lookup.type === "handle" ? (lookup.value.startsWith("@") ? lookup.value : `@${lookup.value}`) : `@${channel.id}`);

  const thumbnails = snippet.thumbnails || {};
  const avatar = thumbnails?.maxres?.url || thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url || "";
  const uploadsPlaylist = channel?.contentDetails?.relatedPlaylists?.uploads;
  const videos = await getRecentVideos(uploadsPlaylist);

  return {
    platform: "youtube",
    channel_id: String(channel.id || ""),
    username,
    full_name: String(snippet.title || username.replace(/^@/, "")),
    avatar_url: String(avatar),
    cover_url: branding?.image?.bannerExternalUrl ? String(branding.image.bannerExternalUrl) : undefined,
    followers_count: Number(stats.subscriberCount || 0),
    video_count: Number(stats.videoCount || 0),
    total_views: Number(stats.viewCount || 0),
    bio: snippet.description ? String(snippet.description).trim() : undefined,
    link: `https://www.youtube.com/channel/${String(channel.id || "")}`,
    // YouTube Data API does not expose the public verification badge.
    // Do not infer it. Bright Data remains the fallback for fields unavailable here.
    is_verified: false,
    videos,
  };
}

export async function resolveYouTubeChannelViaDataApi(input: string): Promise<YouTubeVerifiedProfile | null> {
  if (!getApiKey()) return null;
  const lookup = parseChannelLookup(input);
  if (!lookup) return null;
  return resolveChannelByLookup(lookup);
}

export async function resolveYouTubeVideoViaDataApi(videoUrlOrId: string): Promise<YouTubeVerifiedProfile | null> {
  if (!getApiKey()) return null;
  const videoId = extractYouTubeVideoId(videoUrlOrId);
  if (!videoId) return null;

  const json = await youtubeGet("videos", {
    part: "snippet,status",
    id: videoId,
    maxResults: "1",
  });

  const video = Array.isArray(json?.items) ? json.items[0] : null;
  const channelId = video?.snippet?.channelId;
  if (!video || !channelId || video?.status?.privacyStatus === "private") return null;

  return resolveChannelByLookup({ type: "id", value: String(channelId) });
}
