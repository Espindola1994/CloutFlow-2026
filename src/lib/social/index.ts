import {
  CanonicalSearchInput,
  PlatformId,
  ResolveSearchResult,
} from "./types";
import { detectSearchInput, validateEmailFormat } from "./normalize";
import {
  resolveInstagramProfileByUsername,
  resolveInstagramContentToProfile,
} from "./hiker/instagram";
import {
  resolveTikTokProfileByUsername,
  resolveTikTokContentToProfile,
  resolveTwitterProfileByUsername,
  resolveTwitterContentToProfile,
} from "./brightdata/resolvers";
import {
  resolveYouTubeChannel,
  resolveYouTubeVideo,
} from "./brightdata/youtube";

export async function resolveSearchInput(
  rawInput: string,
  selectedPlatform?: PlatformId
): Promise<ResolveSearchResult> {
  const detected = detectSearchInput(rawInput, selectedPlatform);

  if (!detected.isValid) {
    return {
      success: false,
      code: detected.errorCode || "INVALID_INPUT",
      message: detected.errorMessage || "Entrada inválida.",
    };
  }

  // 1. Email Local Validation (No external APIs, no SMTP, no confirmation code)
  if (detected.inputType === "email") {
    const emailRes = validateEmailFormat(rawInput);
    if (!emailRes.isValid || !emailRes.normalized) {
      return {
        success: false,
        code: "INVALID_EMAIL",
        message: emailRes.message || "Digite um email válido. Exemplo: nome@email.com",
      };
    }
    return {
      success: true,
      inputType: "email",
      resolvedType: "email",
      data: {
        email: emailRes.normalized,
        validFormat: true,
      },
    };
  }

  const platform = detected.platform || selectedPlatform || "instagram";

  // 2. Instagram Resolution via HikerAPI
  if (platform === "instagram") {
    if (detected.inputType === "content_url" && detected.contentId) {
      const res = await resolveInstagramContentToProfile(detected.contentId);
      if (!res.success || !res.data) {
        return {
          success: false,
          code: res.code || "CONTENT_NOT_FOUND",
          message: res.message || "Esse conteúdo não foi encontrado ou não está mais disponível.",
        };
      }
      return {
        success: true,
        status: "complete",
        inputType: "content_url",
        platform: "instagram",
        resolvedType: "profile",
        data: res.data,
      };
    } else {
      const username = detected.username || rawInput.trim().replace(/^@/, "");
      const res = await resolveInstagramProfileByUsername(username);
      if (!res.success || !res.data) {
        return {
          success: false,
          code: res.code || "PROFILE_NOT_FOUND",
          message: res.message || "Não encontramos esse perfil. Confira o @ ou link e tente novamente.",
        };
      }
      return {
        success: true,
        status: "complete",
        inputType: detected.inputType as "handle" | "profile_url",
        platform: "instagram",
        resolvedType: "profile",
        data: res.data,
      };
    }
  }

  // 3. TikTok Resolution via Bright Data
  if (platform === "tiktok") {
    if (detected.inputType === "content_url" && (detected.canonicalUrl || detected.contentId)) {
      const res = await resolveTikTokContentToProfile(detected.canonicalUrl || detected.contentId || "");

      if (res.pending && res.requestId) {
        return {
          success: true,
          status: "pending",
          platform: "tiktok",
          requestId: res.requestId,
        };
      }

      if (!res.success || !res.data) {
        return {
          success: false,
          code: res.code || "CONTENT_NOT_FOUND",
          message: res.message || "Esse vídeo do TikTok não foi encontrado ou não está mais disponível.",
        };
      }
      return {
        success: true,
        status: "complete",
        inputType: "content_url",
        platform: "tiktok",
        resolvedType: "profile",
        data: res.data,
      };
    } else {
      const username = detected.username || rawInput.trim().replace(/^@/, "");
      const res = await resolveTikTokProfileByUsername(username);

      if (res.pending && res.requestId) {
        return {
          success: true,
          status: "pending",
          platform: "tiktok",
          requestId: res.requestId,
        };
      }

      if (!res.success || !res.data) {
        return {
          success: false,
          code: res.code || "PROFILE_NOT_FOUND",
          message: res.message || "Não encontramos esse perfil no TikTok. Confira o @ ou link e tente novamente.",
        };
      }
      return {
        success: true,
        status: "complete",
        inputType: detected.inputType as "handle" | "profile_url",
        platform: "tiktok",
        resolvedType: "profile",
        data: res.data,
      };
    }
  }

  // 4. Twitter / X Resolution via Bright Data
  if (platform === "twitter") {
    if (detected.inputType === "content_url" && (detected.canonicalUrl || detected.contentId)) {
      const res = await resolveTwitterContentToProfile(detected.canonicalUrl || detected.contentId || "");

      if (res.pending && res.requestId) {
        return {
          success: true,
          status: "pending",
          platform: "twitter",
          requestId: res.requestId,
        };
      }

      if (!res.success || !res.data) {
        return {
          success: false,
          code: res.code || "CONTENT_NOT_FOUND",
          message: res.message || "Esse tweet não foi encontrado ou foi removido.",
        };
      }
      return {
        success: true,
        status: "complete",
        inputType: "content_url",
        platform: "twitter",
        resolvedType: "profile",
        data: res.data,
      };
    } else {
      const username = detected.username || rawInput.trim().replace(/^@/, "");
      const res = await resolveTwitterProfileByUsername(username);

      if (res.pending && res.requestId) {
        return {
          success: true,
          status: "pending",
          platform: "twitter",
          requestId: res.requestId,
        };
      }

      if (!res.success || !res.data) {
        return {
          success: false,
          code: res.code || "PROFILE_NOT_FOUND",
          message: res.message || "Não encontramos esse perfil no X/Twitter. Confira o @ ou link e tente novamente.",
        };
      }
      return {
        success: true,
        status: "complete",
        inputType: detected.inputType as "handle" | "profile_url",
        platform: "twitter",
        resolvedType: "profile",
        data: res.data,
      };
    }
  }

  // 5. YouTube Resolution via Bright Data (suporte síncrono e assíncrono para Canais e Vídeos/Shorts)
  if (platform === "youtube") {
    if (detected.inputType === "content_url" && (detected.canonicalUrl || detected.contentId)) {
      const res = await resolveYouTubeVideo(detected.canonicalUrl || detected.contentId || "");

      if (res.pending && res.requestId) {
        return {
          success: true,
          status: "pending",
          platform: "youtube",
          requestId: res.requestId,
        };
      }

      if (!res.success || !res.data) {
        return {
          success: false,
          code: res.code || "CONTENT_NOT_FOUND",
          message: res.message || "Esse vídeo do YouTube não foi encontrado ou não está mais disponível.",
        };
      }
      return {
        success: true,
        status: "complete",
        inputType: "content_url",
        platform: "youtube",
        resolvedType: "profile",
        data: res.data,
      };
    } else {
      const targetIdentifier = detected.canonicalUrl || detected.username || rawInput.trim();
      const res = await resolveYouTubeChannel(targetIdentifier);

      if (res.pending && res.requestId) {
        return {
          success: true,
          status: "pending",
          platform: "youtube",
          requestId: res.requestId,
        };
      }

      if (!res.success || !res.data) {
        return {
          success: false,
          code: res.code || "PROFILE_NOT_FOUND",
          message: res.message || "Não encontramos esse canal no YouTube. Confira o @ ou link e tente novamente.",
        };
      }
      return {
        success: true,
        status: "complete",
        inputType: detected.inputType as "handle" | "profile_url",
        platform: "youtube",
        resolvedType: "profile",
        data: res.data,
      };
    }
  }

  return {
    success: false,
    code: "UNSUPPORTED_URL_TYPE",
    message: "Plataforma não suportada.",
  };
}
