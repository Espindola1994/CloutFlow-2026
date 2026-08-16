import {
  TikTokVerifiedProfile,
  TikTokVideoItem,
  TwitterVerifiedProfile,
  TwitterPinnedTweet,
  FacebookVerifiedProfile,
  FacebookDetailItem,
  SearchErrorCode,
} from "../types";
import { socialCache } from "../cache";
import { fetchBrightDataStructuredScraper, checkBrightDataSnapshot } from "./scraper";
import { fetchBrightDataUnlocker } from "./unlocker";
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
// TIKTOK (gd_l1villgoiiidt09ci / gd_lu702nij2f790tmv9h)
// -------------------------------------------------------------
export async function resolveTikTokProfileByUsername(
  username: string
): Promise<{ success: boolean; data?: TikTokVerifiedProfile; code?: SearchErrorCode; message?: string }> {
  if (!username) {
    return { success: false, code: "INVALID_HANDLE", message: "Este @ não possui um formato válido." };
  }

  const { apiKey } = getBrightDataConfig();

  const cacheKey = `tk:user:${username.toLowerCase()}`;
  const cached = socialCache.get<TikTokVerifiedProfile>(cacheKey);
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

  const targetUrl = `https://www.tiktok.com/@${username}`;

  const tiktokDatasetId = process.env.BRIGHTDATA_TIKTOK_DATASET;
  if (tiktokDatasetId) {
    const scraperRes = await fetchBrightDataStructuredScraper(tiktokDatasetId, {
      url: targetUrl,
      country: "",
    });

    if (scraperRes.ok && scraperRes.data) {
      const rawData = scraperRes.data;
      const item = Array.isArray(rawData) ? rawData[0] : (rawData.data ? rawData.data[0] || rawData.data : rawData);

      if (item && (item.account_id || item.nickname || item.uniqueId || item.username || item.id)) {
        let videos: TikTokVideoItem[] = [];
        const rawVideos: any[] = item.top_videos || item.top_posts_data || item.videos || item.posts || [];
        
        videos = rawVideos.slice(0, 6).map((v: any) => ({
          id: String(v.id || v.video_id || v.aweme_id || Math.random()),
          thumbnail_url: String(v.cover_url || v.cover || v.thumbnail || v.dynamicCover || `https://ui-avatars.com/api/?name=${username}`),
          views_count: Number(v.play_count || v.playCount || v.views || v.view_count || 0),
        }));

        const normalized: TikTokVerifiedProfile = {
          platform: "tiktok",
          username: String(item.account_id || item.uniqueId || item.username || username),
          full_name: String(item.nickname || item.full_name || item.name || username),
          avatar_url: String(item.profile_pic_url_hd || item.profile_pic_url || item.avatarLarger || item.avatarThumb || `https://ui-avatars.com/api/?name=${username}`),
          following_count: Number(item.following !== undefined ? item.following : (item.followingCount || item.following_count || 0)),
          followers_count: Number(item.followers !== undefined ? item.followers : (item.followerCount || item.followers_count || 0)),
          likes_count: Number(item.likes !== undefined ? item.likes : (item.like_count || item.heartCount || item.likes_count || 0)),
          bio: String(item.biography || item.signature || item.bio || ""),
          link: item.bio_link ? String(item.bio_link) : (item.bioLink?.link ? String(item.bioLink.link) : undefined),
          is_private: Boolean(item.is_private || item.privateAccount),
          is_verified: Boolean(item.is_verified || item.verified),
          videos,
        };

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
  }

  const unlockerRes = await fetchBrightDataUnlocker(targetUrl);
  if (unlockerRes.restricted) {
    return {
      success: false,
      code: "PROVIDER_RESTRICTED",
      message: "Esta consulta está temporariamente indisponível para esta plataforma.",
    };
  }

  return {
    success: false,
    code: "PROVIDER_RESTRICTED",
    message: "Esta consulta está temporariamente indisponível para esta plataforma.",
  };
}

export async function resolveTikTokContentToProfile(
  videoUrlOrId: string
): Promise<{ success: boolean; data?: TikTokVerifiedProfile; code?: SearchErrorCode; message?: string }> {
  if (!videoUrlOrId) {
    return { success: false, code: "CONTENT_NOT_FOUND", message: "Esse conteúdo não foi encontrado ou não está mais disponível." };
  }

  const { apiKey } = getBrightDataConfig();

  const cacheKey = `tk:content:${videoUrlOrId}`;
  const cached = socialCache.get<TikTokVerifiedProfile>(cacheKey);
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

  const targetUrl = videoUrlOrId.startsWith("http") ? videoUrlOrId : `https://www.tiktok.com/video/${videoUrlOrId}`;

  const tiktokPostDatasetId = process.env.BRIGHTDATA_TIKTOK_POST_DATASET;
  if (tiktokPostDatasetId) {
    const scraperRes = await fetchBrightDataStructuredScraper(tiktokPostDatasetId, {
      url: targetUrl,
    });

    if (scraperRes.ok && scraperRes.data) {
      const rawData = scraperRes.data;
      const item = Array.isArray(rawData) ? rawData[0] : (rawData.data ? rawData.data[0] || rawData.data : rawData);
      const authorUsername = item.author?.uniqueId || item.author?.username || item.author_username || item.authorUniqueId || item.account_id || item.username;

      if (authorUsername) {
        const profileRes = await resolveTikTokProfileByUsername(authorUsername);
        if (profileRes.success && profileRes.data) {
          socialCache.set(cacheKey, profileRes.data, 180);
        }
        return profileRes;
      }
    }

    if (scraperRes.restricted) {
      return {
        success: false,
        code: "PROVIDER_RESTRICTED",
        message: "Esta consulta está temporariamente indisponível para esta plataforma.",
      };
    }
  }

  const unlockerRes = await fetchBrightDataUnlocker(targetUrl);
  if (unlockerRes.restricted) {
    return {
      success: false,
      code: "PROVIDER_RESTRICTED",
      message: "Esta consulta está temporariamente indisponível para esta plataforma.",
    };
  }

  return {
    success: false,
    code: "CONTENT_NOT_FOUND",
    message: "Esse vídeo do TikTok não foi encontrado ou não está mais disponível.",
  };
}

// -------------------------------------------------------------
// X / TWITTER (gd_lwxmeb2u1cniijd7t4 / gd_lwxkxvnf1cynvib9co)
// -------------------------------------------------------------
export async function resolveTwitterProfileByUsername(
  username: string
): Promise<{ success: boolean; data?: TwitterVerifiedProfile; code?: SearchErrorCode; message?: string }> {
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
  if (twitterDatasetId) {
    const scraperRes = await fetchBrightDataStructuredScraper(twitterDatasetId, {
      url: targetUrl,
      max_number_of_posts: 3,
    });

    if (scraperRes.ok && scraperRes.data) {
      const rawData = scraperRes.data;
      const item = Array.isArray(rawData) ? rawData[0] : (rawData.data ? rawData.data[0] || rawData.data : rawData);

      if (item && (item.profile_name || item.screen_name || item.username || item.id || item.x_id)) {
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

        const normalized: TwitterVerifiedProfile = {
          platform: "twitter",
          username: String(item.id && !item.id.includes(" ") ? item.id : (item.screen_name || item.username || username)),
          full_name: String(item.profile_name || item.name || item.id || username),
          avatar_url: String(item.profile_image_link || item.profile_image_url_https || item.profile_image_url || item.avatar || `https://ui-avatars.com/api/?name=${username}`),
          cover_url: item.header_image || item.profile_banner_url || item.cover_image || undefined,
          followers_count: Number(item.followers !== undefined ? item.followers : (item.followers_count || item.follower_count || 0)),
          following_count: Number(item.following !== undefined ? item.following : (item.following_count || item.friends_count || 0)),
          bio: String(item.biography || item.description || item.bio || ""),
          location: item.location ? String(item.location) : undefined,
          link: item.external_link ? String(item.external_link) : (item.url ? String(item.url) : undefined),
          is_verified: Boolean(item.is_verified || item.verified || item.is_blue_verified),
          pinned_tweet: pinnedTweet,
        };

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
  }

  const unlockerRes = await fetchBrightDataUnlocker(targetUrl);
  if (unlockerRes.restricted) {
    return {
      success: false,
      code: "PROVIDER_RESTRICTED",
      message: "Esta consulta está temporariamente indisponível para esta plataforma.",
    };
  }

  return {
    success: false,
    code: "PROVIDER_RESTRICTED",
    message: "Esta consulta está temporariamente indisponível para esta plataforma.",
  };
}

export async function resolveTwitterContentToProfile(
  tweetIdOrUrl: string
): Promise<{ success: boolean; data?: TwitterVerifiedProfile; code?: SearchErrorCode; message?: string }> {
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
  if (twitterPostDatasetId) {
    const scraperRes = await fetchBrightDataStructuredScraper(twitterPostDatasetId, {
      url: targetUrl,
    });

    if (scraperRes.ok && scraperRes.data) {
      const rawData = scraperRes.data;
      const item = Array.isArray(rawData) ? rawData[0] : (rawData.data ? rawData.data[0] || rawData.data : rawData);
      const authorUsername = item.user?.screen_name || item.author?.username || item.author_username || item.user_id || item.screen_name;

      if (authorUsername) {
        const profileRes = await resolveTwitterProfileByUsername(authorUsername);
        if (profileRes.success && profileRes.data) {
          socialCache.set(cacheKey, profileRes.data, 180);
        }
        return profileRes;
      }
    }

    if (scraperRes.restricted) {
      return {
        success: false,
        code: "PROVIDER_RESTRICTED",
        message: "Esta consulta está temporariamente indisponível para esta plataforma.",
      };
    }
  }

  const unlockerRes = await fetchBrightDataUnlocker(targetUrl);
  if (unlockerRes.restricted) {
    return {
      success: false,
      code: "PROVIDER_RESTRICTED",
      message: "Esta consulta está temporariamente indisponível para esta plataforma.",
    };
  }

  return {
    success: false,
    code: "CONTENT_NOT_FOUND",
    message: "Esse tweet não foi encontrado ou foi removido.",
  };
}

// -------------------------------------------------------------
// FACEBOOK (gd_mf124a0511bauquyow / gd_lyclm1571iy3mv57zw)
// -------------------------------------------------------------
export async function resolveFacebookProfileByUsername(
  usernameOrId: string
): Promise<{
  success: boolean;
  data?: FacebookVerifiedProfile;
  pending?: boolean;
  requestId?: string;
  code?: SearchErrorCode;
  message?: string;
}> {
  if (!usernameOrId) {
    return { success: false, code: "INVALID_HANDLE", message: "Identificador de perfil inválido." };
  }

  const { apiKey } = getBrightDataConfig();

  const cacheKey = `fb:user:${usernameOrId.toLowerCase()}`;
  const cached = socialCache.get<FacebookVerifiedProfile>(cacheKey);
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

  const targetUrl = usernameOrId.startsWith("http")
    ? usernameOrId
    : (usernameOrId.match(/^\d+$/) ? `https://www.facebook.com/profile.php?id=${usernameOrId}` : `https://www.facebook.com/${usernameOrId}`);

  const facebookDatasetId = process.env.BRIGHTDATA_FACEBOOK_DATASET;
  if (facebookDatasetId) {
    // Permitir retorno assíncrono para Facebook (allowAsyncPending = true)
    const scraperRes = await fetchBrightDataStructuredScraper(
      facebookDatasetId,
      { url: targetUrl },
      true
    );

    // Se retornou pending com snapshotId, gera requestId opaco e assinado (stateless / serverless-safe)
    if (scraperRes.pending && scraperRes.snapshotId) {
      const requestId = createSignedJobToken({
        platform: "facebook",
        snapshotId: scraperRes.snapshotId,
        operation: "profile",
        originalInput: usernameOrId,
      }, 300); // 5 minutos de expiração

      return { success: true, pending: true, requestId };
    }

    if (scraperRes.ok && scraperRes.data) {
      const normalized = normalizeFacebookProfileData(scraperRes.data, usernameOrId);
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
  }

  return {
    success: false,
    code: "PROVIDER_RESTRICTED",
    message: "Esta consulta está temporariamente indisponível para esta plataforma.",
  };
}

export async function resolveFacebookContentToProfile(
  contentUrl: string
): Promise<{
  success: boolean;
  data?: FacebookVerifiedProfile;
  pending?: boolean;
  requestId?: string;
  code?: SearchErrorCode;
  message?: string;
}> {
  if (!contentUrl) {
    return { success: false, code: "CONTENT_NOT_FOUND", message: "Esse conteúdo não foi encontrado ou não está mais disponível." };
  }

  const { apiKey } = getBrightDataConfig();

  const cacheKey = `fb:content:${contentUrl}`;
  const cached = socialCache.get<FacebookVerifiedProfile>(cacheKey);
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

  const facebookPostDatasetId = process.env.BRIGHTDATA_FACEBOOK_POST_DATASET;
  if (facebookPostDatasetId) {
    const scraperRes = await fetchBrightDataStructuredScraper(
      facebookPostDatasetId,
      { url: contentUrl },
      true
    );

    if (scraperRes.pending && scraperRes.snapshotId) {
      const requestId = createSignedJobToken({
        platform: "facebook",
        snapshotId: scraperRes.snapshotId,
        operation: "content",
        originalInput: contentUrl,
      }, 300);

      return { success: true, pending: true, requestId };
    }

    if (scraperRes.ok && scraperRes.data) {
      const rawData = scraperRes.data;
      const item = Array.isArray(rawData) ? rawData[0] : (rawData.data ? rawData.data[0] || rawData.data : rawData);
      const authorIdentifier = item?.author?.username || item?.author?.id || item?.page?.username || item?.page?.id || item?.user_id || item?.owner;

      if (authorIdentifier) {
        return await resolveFacebookProfileByUsername(authorIdentifier);
      }
    }

    if (scraperRes.restricted) {
      return {
        success: false,
        code: "PROVIDER_RESTRICTED",
        message: "Esta consulta está temporariamente indisponível para esta plataforma.",
      };
    }
  }

  return {
    success: false,
    code: "CONTENT_NOT_FOUND",
    message: "Esse conteúdo do Facebook não foi encontrado ou não está mais disponível.",
  };
}

/**
 * Normaliza os campos do Facebook a partir do retorno de dados
 */
export function normalizeFacebookProfileData(rawData: any, fallbackId: string): FacebookVerifiedProfile | null {
  const item = Array.isArray(rawData) ? rawData[0] : (rawData.data ? rawData.data[0] || rawData.data : rawData);
  if (!item) return null;

  const details: FacebookDetailItem[] = [];
  if (item.work || item.job || item.current_work) details.push({ label: "Trabalho", value: String(item.work || item.job || item.current_work) });
  if (item.education || item.school) details.push({ label: "Educação", value: String(item.education || item.school) });
  if (item.location || item.city || item.lives_in) details.push({ label: "Cidade", value: String(item.location || item.city || item.lives_in) });

  return {
    platform: "facebook",
    username: String(item.username || item.id || item.page_id || item.account_id || fallbackId),
    full_name: String(item.name || item.title || item.page_name || fallbackId),
    avatar_url: String(item.avatar || item.profile_pic || item.profile_image || item.image || `https://ui-avatars.com/api/?name=${fallbackId}`),
    cover_url: item.cover || item.banner || item.cover_photo || undefined,
    followers_count: Number(item.followers_count !== undefined ? item.followers_count : (item.followers || item.likes || item.likes_count || 0)),
    following_count: Number(item.following_count !== undefined ? item.following_count : (item.following || 0)),
    is_verified: Boolean(item.verified || item.is_verified),
    details: details.length > 0 ? details : undefined,
  };
}
