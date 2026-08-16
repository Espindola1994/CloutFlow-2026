import {
  InstagramVerifiedProfile,
  InstagramPostItem,
  SearchErrorCode,
} from "../types";
import { socialCache } from "../cache";

function getHikerConfig() {
  const apiKey = process.env.HIKER_API_KEY;
  const timeout = parseInt(process.env.API_TIMEOUT || "15000", 10);
  return { apiKey, timeout };
}

async function fetchHiker(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const { apiKey, timeout } = getHikerConfig();
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        "x-access-key": apiKey || "",
        Accept: "application/json",
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    clearTimeout(id);
    return res;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === "AbortError") {
      throw new Error("PROVIDER_TIMEOUT");
    }
    throw err;
  }
}

export async function resolveInstagramProfileByUsername(
  username: string
): Promise<{ success: boolean; data?: InstagramVerifiedProfile; code?: SearchErrorCode; message?: string }> {
  if (!username) {
    return { success: false, code: "INVALID_HANDLE", message: "Este @ não possui um formato válido." };
  }

  const { apiKey } = getHikerConfig();

  const cacheKey = `ig:user:${username.toLowerCase()}`;
  const cached = socialCache.get<InstagramVerifiedProfile>(cacheKey);
  if (cached) {
    return { success: true, data: cached };
  }

  if (!apiKey) {
    console.error("[HikerAPI] HIKER_API_KEY environment variable is not configured on the server.");
    return {
      success: false,
      code: "PROVIDER_ERROR",
      message: "Não foi possível consultar este perfil agora. Tente novamente.",
    };
  }

  try {
    let res = await fetchHiker(`https://api.hikerapi.com/v1/user/by/username?username=${encodeURIComponent(username)}`);

    if (res.status === 404) {
      socialCache.set(`ig:neg:${username.toLowerCase()}`, true, 60);
      return { success: false, code: "PROFILE_NOT_FOUND", message: "Não encontramos esse perfil. Confira o @ ou link e tente novamente." };
    }

    if (res.status === 429) {
      return { success: false, code: "PROVIDER_RATE_LIMIT", message: "Limite de consultas temporariamente excedido. Aguarde alguns instantes." };
    }

    if (!res.ok) {
      // Try legacy v2 fallback endpoint
      res = await fetchHiker(`https://api.hikerapi.com/v2/user/by/username?v=${encodeURIComponent(username)}`);
    }

    if (!res.ok) {
      return {
        success: false,
        code: "PROFILE_NOT_FOUND",
        message: "Não encontramos esse perfil. Confira o @ ou link e tente novamente.",
      };
    }

    const json = await res.json();
    const userObj = json.user || json.data || json.graphql?.user || json;

    if (!userObj || (!userObj.username && !userObj.pk && !userObj.id)) {
      return {
        success: false,
        code: "PROFILE_NOT_FOUND",
        message: "Não encontramos esse perfil. Confira o @ ou link e tente novamente.",
      };
    }

    const userId = String(userObj.pk || userObj.id || "");
    const isPrivate = Boolean(userObj.is_private);

    // Fetch user media posts (strictly whitelisted: max 6)
    let posts: InstagramPostItem[] = [];
    if (userId && !isPrivate) {
      try {
        const mediaRes = await fetchHiker(`https://api.hikerapi.com/v1/user/medias?user_id=${userId}`);
        if (mediaRes.ok) {
          const mediaJson = await mediaRes.json();
          const items: any[] = mediaJson.items || mediaJson.data || [];
          posts = items.slice(0, 6).map((m) => ({
            id: String(m.id || m.pk || m.code || Math.random()),
            thumbnail_url: String(m.thumbnail_url || m.image_versions2?.candidates?.[0]?.url || m.display_url || `https://ui-avatars.com/api/?name=${username}`),
            is_video: Boolean(m.media_type === 2 || m.is_video),
          }));
        }
      } catch (err) {
        console.warn("Could not fetch Instagram user medias", err);
      }
    }

    // Strictly whitelist only requested fields:
    // avatar, posts count, followers count, following count, bio, link, highlights (if present), posts
    const normalized: InstagramVerifiedProfile = {
      platform: "instagram",
      username: String(userObj.username || username),
      full_name: String(userObj.full_name || userObj.username || username),
      avatar_url: String(userObj.profile_pic_url || userObj.profile_pic_url_hd || `https://ui-avatars.com/api/?name=${username}`),
      posts_count: Number(userObj.media_count || userObj.edge_owner_to_timeline_media?.count || 0),
      followers_count: Number(userObj.follower_count || userObj.edge_followed_by?.count || 0),
      following_count: Number(userObj.following_count || userObj.edge_follow?.count || 0),
      bio: String(userObj.biography || userObj.bio || ""),
      link: userObj.external_url ? String(userObj.external_url) : undefined,
      is_private: isPrivate,
      is_verified: Boolean(userObj.is_verified),
      posts,
    };

    socialCache.set(cacheKey, normalized, 180);
    return { success: true, data: normalized };
  } catch (err: any) {
    if (err.message === "PROVIDER_TIMEOUT") {
      return { success: false, code: "PROVIDER_TIMEOUT", message: "A consulta demorou mais que o esperado. Tente novamente." };
    }
    console.error("HikerAPI profile resolution error:", err);
    return { success: false, code: "PROVIDER_ERROR", message: "Erro ao consultar provedor social. Tente novamente." };
  }
}

export async function resolveInstagramContentToProfile(
  code: string
): Promise<{ success: boolean; data?: InstagramVerifiedProfile; code?: SearchErrorCode; message?: string }> {
  if (!code) {
    return { success: false, code: "CONTENT_NOT_FOUND", message: "Esse conteúdo não foi encontrado ou não está mais disponível." };
  }

  const { apiKey } = getHikerConfig();

  const cacheKey = `ig:content:${code}`;
  const cached = socialCache.get<InstagramVerifiedProfile>(cacheKey);
  if (cached) {
    return { success: true, data: cached };
  }

  if (!apiKey) {
    console.error("[HikerAPI] HIKER_API_KEY environment variable is not configured on the server.");
    return {
      success: false,
      code: "PROVIDER_ERROR",
      message: "Não foi possível consultar este perfil agora. Tente novamente.",
    };
  }

  try {
    // Resolve post/reel by code/shortcode
    const res = await fetchHiker(`https://api.hikerapi.com/v1/media/by/code?code=${encodeURIComponent(code)}`);

    if (res.status === 404) {
      return { success: false, code: "CONTENT_NOT_FOUND", message: "Esse conteúdo não foi encontrado ou não está mais disponível." };
    }

    if (!res.ok) {
      return { success: false, code: "CONTENT_NOT_FOUND", message: "Esse conteúdo não foi encontrado ou não está mais disponível." };
    }

    const json = await res.json();
    const mediaObj = json.item || json.data || json;
    const authorUser = mediaObj.user || mediaObj.owner;

    if (!authorUser || (!authorUser.username && !authorUser.pk)) {
      return { success: false, code: "CONTENT_NOT_FOUND", message: "Não foi possível identificar o autor desta publicação." };
    }

    const authorUsername = authorUser.username;
    if (!authorUsername) {
      return { success: false, code: "CONTENT_NOT_FOUND", message: "Autor não localizado para esta publicação." };
    }

    // Now resolve the author's full profile
    const profileRes = await resolveInstagramProfileByUsername(authorUsername);
    if (profileRes.success && profileRes.data) {
      socialCache.set(cacheKey, profileRes.data, 180);
    }
    return profileRes;
  } catch (err: any) {
    if (err.message === "PROVIDER_TIMEOUT") {
      return { success: false, code: "PROVIDER_TIMEOUT", message: "A consulta demorou mais que o esperado. Tente novamente." };
    }
    console.error("HikerAPI content resolution error:", err);
    return { success: false, code: "PROVIDER_ERROR", message: "Erro ao consultar o conteúdo no Instagram." };
  }
}
