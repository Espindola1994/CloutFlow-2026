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
  } catch (err: unknown) {
    clearTimeout(id);
    if (err instanceof Error && err.name === "AbortError") {
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

  const cleanUsername = username.trim().replace(/^@/, "");
  const { apiKey } = getHikerConfig();

  console.log(`[HikerAPI Log] Início da busca para: ${cleanUsername} | HIKER_API_KEY presente: ${Boolean(apiKey)}`);

  const cacheKey = `ig:user:${cleanUsername.toLowerCase()}`;
  const cached = socialCache.get<InstagramVerifiedProfile>(cacheKey);
  if (cached) {
    console.log(`[HikerAPI Log] Cache hit para: ${cleanUsername}`);
    return { success: true, data: cached };
  }

  if (!apiKey) {
    console.error("[HikerAPI] HIKER_API_KEY environment variable is not configured on the server.");
    return {
      success: false,
      code: "PROVIDER_ERROR",
      message: "We couldn't check this profile right now. Please try again.",
    };
  }

  try {
    const endpointV1 = `https://api.hikerapi.com/v1/user/by/username?username=${encodeURIComponent(cleanUsername)}`;
    console.log(`[HikerAPI Log] Chamando endpoint: ${endpointV1}`);
    let res = await fetchHiker(endpointV1);
    console.log(`[HikerAPI Log] HTTP status recebido (v1): ${res.status} ${res.statusText}`);

    if (res.status === 404) {
      socialCache.set(`ig:neg:${cleanUsername.toLowerCase()}`, true, 60);
      return { success: false, code: "PROFILE_NOT_FOUND", message: "Não encontramos esse perfil. Confira o @ ou link e tente novamente." };
    }

    if (res.status === 429) {
      return { success: false, code: "PROVIDER_RATE_LIMIT", message: "Limite de consultas temporariamente excedido. Aguarde alguns instantes." };
    }

    if (!res.ok) {
      const endpointV2 = `https://api.hikerapi.com/v2/user/by/username?v=${encodeURIComponent(cleanUsername)}`;
      console.log(`[HikerAPI Log] Tentando fallback legado v2: ${endpointV2}`);
      res = await fetchHiker(endpointV2);
      console.log(`[HikerAPI Log] HTTP status recebido (v2): ${res.status} ${res.statusText}`);
    }

    if (!res.ok) {
      console.error(`[HikerAPI Log] Falha em todos os endpoints para: ${cleanUsername} com status: ${res.status}`);
      return {
        success: false,
        code: res.status === 404 ? "PROFILE_NOT_FOUND" : "PROVIDER_ERROR",
        message: "Não encontramos esse perfil. Confira o @ ou link e tente novamente.",
      };
    }

    const json = await res.json();
    console.log(`[HikerAPI Log] Resposta JSON recebida. Top-level keys:`, Object.keys(json));
    const userObj = json.user || json.data || json.graphql?.user || json;

    if (!userObj || (!userObj.username && !userObj.pk && !userObj.id)) {
      console.error("[HikerAPI Log] userObj inválido:", userObj);
      return {
        success: false,
        code: "PROFILE_NOT_FOUND",
        message: "Não encontramos esse perfil. Confira o @ ou link e tente novamente.",
      };
    }

    const userId = String(userObj.pk || userObj.id || "");
    const isPrivate = Boolean(userObj.is_private);
    console.log(`[HikerAPI Log] Usuário identificado: ${userObj.username} | userId: ${userId} | isPrivate: ${isPrivate}`);

    // Fetch user media posts (se falhar ou for privado, NÃO quebra o perfil!)
    let posts: InstagramPostItem[] = [];
    if (userId && !isPrivate) {
      try {
        console.log(`[HikerAPI Log] Buscando mídias para userId: ${userId} / username: ${cleanUsername}`);
        let mediaRes = await fetchHiker(`https://api.hikerapi.com/v1/user/medias?user_id=${encodeURIComponent(userId)}`);
        console.log(`[HikerAPI Log] Mídias HTTP status (v1/user/medias?user_id): ${mediaRes.status}`);

        // Fallback para outros endpoints de mídia suportados pelo HikerAPI
        if (!mediaRes.ok) {
          console.log(`[HikerAPI Log] Tentando fallback v2/user/medias?user_id=${userId}`);
          mediaRes = await fetchHiker(`https://api.hikerapi.com/v2/user/medias?user_id=${encodeURIComponent(userId)}`);
          console.log(`[HikerAPI Log] Mídias HTTP status (v2/user/medias): ${mediaRes.status}`);
        }

        if (!mediaRes.ok) {
          console.log(`[HikerAPI Log] Tentando fallback v1/user/medias/by/username?username=${cleanUsername}`);
          mediaRes = await fetchHiker(`https://api.hikerapi.com/v1/user/medias/by/username?username=${encodeURIComponent(cleanUsername)}`);
          console.log(`[HikerAPI Log] Mídias HTTP status (v1 medias by username): ${mediaRes.status}`);
        }

        if (mediaRes.ok) {
          const mediaJson = await mediaRes.json();
          console.log(`[HikerAPI Log] mediaJson keys:`, Object.keys(mediaJson || {}));
          const items: unknown[] = Array.isArray(mediaJson)
            ? mediaJson
            : (mediaJson.items || mediaJson.data || mediaJson.response?.items || (Array.isArray(mediaJson.medias) ? mediaJson.medias : []));
          console.log(`[HikerAPI Log] Raw items count: ${items.length}`);

          const parsedPosts: InstagramPostItem[] = [];
          for (const m of items.slice(0, 6)) {
            const obj = m as Record<string, unknown>;
            const getCandidate = (o: Record<string, unknown>, path: string[]): string | undefined => {
              let curr: unknown = o;
              for (const p of path) {
                if (curr && typeof curr === "object" && p in (curr as Record<string, unknown>)) {
                  curr = (curr as Record<string, unknown>)[p];
                } else {
                  return undefined;
                }
              }
              return typeof curr === "string" ? curr : undefined;
            };

            const rawUrl =
              (typeof obj.thumbnail_url === "string" ? obj.thumbnail_url : undefined) ||
              getCandidate(obj, ["image_versions", "0", "url"]) ||
              getCandidate(obj, ["image_versions2", "candidates", "0", "url"]) ||
              getCandidate(obj, ["resources", "0", "thumbnail_url"]) ||
              getCandidate(obj, ["resources", "0", "image_versions", "0", "url"]) ||
              getCandidate(obj, ["carousel_media", "0", "image_versions2", "candidates", "0", "url"]) ||
              (typeof obj.display_url === "string" ? obj.display_url : undefined) ||
              getCandidate(obj, ["cover_media", "image_versions2", "candidates", "0", "url"]) ||
              getCandidate(obj, ["video_versions", "0", "url"]) ||
              "";

            if (rawUrl) {
              parsedPosts.push({
                id: String(obj.id || obj.pk || obj.code || Math.random()),
                thumbnail_url: String(rawUrl),
                is_video: Boolean(
                  obj.media_type === 2 ||
                  obj.is_video ||
                  obj.product_type === "clips" ||
                  obj.product_type === "feed_video" ||
                  obj.product_type === "igtv"
                ),
              });
            }
          }
          posts = parsedPosts;

          console.log(`[HikerAPI Log] Mídias carregadas com sucesso: ${posts.length} posts`);
        }
      } catch (err) {
        console.warn("[HikerAPI Log] Falha segura ao buscar mídias do usuário (perfil preservado):", err);
      }
    }

    // Normalização estrita dos dados
    const normalized: InstagramVerifiedProfile = {
      platform: "instagram",
      username: String(userObj.username || cleanUsername),
      full_name: String(userObj.full_name || userObj.username || cleanUsername),
      avatar_url: String(userObj.profile_pic_url || userObj.profile_pic_url_hd || `https://ui-avatars.com/api/?name=${cleanUsername}`),
      posts_count: Number(userObj.media_count || userObj.edge_owner_to_timeline_media?.count || 0),
      followers_count: Number(userObj.follower_count || userObj.edge_followed_by?.count || 0),
      following_count: Number(userObj.following_count || userObj.edge_follow?.count || 0),
      bio: String(userObj.biography || userObj.bio || ""),
      link: userObj.external_url ? String(userObj.external_url) : undefined,
      is_private: isPrivate,
      is_verified: Boolean(userObj.is_verified),
      posts,
    };

    console.log(`[HikerAPI Log] Perfil normalizado com sucesso para: ${normalized.username}`);
    socialCache.set(cacheKey, normalized, 180);
    return { success: true, data: normalized };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "PROVIDER_TIMEOUT") {
      return { success: false, code: "PROVIDER_TIMEOUT", message: "A consulta demorou mais que o esperado. Tente novamente." };
    }
    console.error("[HikerAPI Log] Erro não tratado:", err);
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
      message: "We couldn't check this profile right now. Please try again.",
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
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "PROVIDER_TIMEOUT") {
      return { success: false, code: "PROVIDER_TIMEOUT", message: "A consulta demorou mais que o esperado. Tente novamente." };
    }
    console.error("[HikerAPI] Erro ao resolver conteúdo:", err);
    return { success: false, code: "PROVIDER_ERROR", message: "Erro ao consultar o conteúdo no Instagram." };
  }
}
