import { CanonicalSearchInput, PlatformId, SearchErrorCode, SearchInputType } from "./types";
import { ALLOWED_HOSTS, validateSafeUrl } from "./security";

// Simple local email validation (no external APIs, no DNS, no SMTP)
export function validateEmailFormat(email: string): { isValid: boolean; normalized?: string; message?: string } {
  if (!email || typeof email !== "string") {
    return { isValid: false, message: "Digite um email válido. Exemplo: nome@email.com" };
  }

  const trimmed = email.trim();

  // Basic length constraints
  if (trimmed.length < 5 || trimmed.length > 254) {
    return { isValid: false, message: "Digite um email válido. Exemplo: nome@email.com" };
  }

  // Spaces not allowed
  if (/\s/.test(trimmed)) {
    return { isValid: false, message: "Digite um email válido. Exemplo: nome@email.com" };
  }

  // Must have exactly one @
  const atParts = trimmed.split("@");
  if (atParts.length !== 2) {
    return { isValid: false, message: "Digite um email válido. Exemplo: nome@email.com" };
  }

  const [localPart, domainPart] = atParts;

  // Local part and domain part non-empty
  if (!localPart || !domainPart) {
    return { isValid: false, message: "Digite um email válido. Exemplo: nome@email.com" };
  }

  // Domain must contain a dot, not at start or end, and valid TLD format
  if (!domainPart.includes(".") || domainPart.startsWith(".") || domainPart.endsWith(".")) {
    return { isValid: false, message: "Digite um email válido. Exemplo: nome@email.com" };
  }

  const domainSubParts = domainPart.split(".");
  const tld = domainSubParts[domainSubParts.length - 1];

  // TLD must have at least 2 alpha characters
  if (!/^[a-zA-Z]{2,24}$/.test(tld)) {
    return { isValid: false, message: "Digite um email válido. Exemplo: nome@email.com" };
  }

  // Standard safe regex test for characters
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(trimmed)) {
    return { isValid: false, message: "Digite um email válido. Exemplo: nome@email.com" };
  }

  return { isValid: true, normalized: trimmed.toLowerCase() };
}

// Usernames validity by platform
export function validateHandleFormat(handle: string, platform?: PlatformId): { isValid: boolean; normalized?: string; error?: SearchErrorCode } {
  if (!handle) return { isValid: false, error: "INVALID_HANDLE" };

  let raw = handle.trim();
  if (raw.startsWith("@")) {
    raw = raw.substring(1).trim();
  }

  if (!raw || raw === "@") {
    return { isValid: false, error: "INVALID_HANDLE" };
  }

  // General handle length and characters
  if (raw.length < 1 || raw.length > 50) {
    return { isValid: false, error: "INVALID_HANDLE" };
  }

  // Platform specific rules
  if (platform === "instagram") {
    // Letters, numbers, periods, underscores. Max 30 chars
    if (!/^[a-zA-Z0-9._]{1,30}$/.test(raw) || raw.includes("..") || raw.endsWith(".")) {
      return { isValid: false, error: "INVALID_HANDLE" };
    }
  } else if (platform === "tiktok") {
    // Letters, numbers, underscores, periods. Max 24 chars
    if (!/^[a-zA-Z0-9._]{1,24}$/.test(raw) || raw.endsWith(".")) {
      return { isValid: false, error: "INVALID_HANDLE" };
    }
  } else if (platform === "twitter") {
    // Letters, numbers, underscores. Max 15 chars
    if (!/^[a-zA-Z0-9_]{1,15}$/.test(raw)) {
      return { isValid: false, error: "INVALID_HANDLE" };
    }
  } else if (platform === "facebook") {
    // Alphanumeric with dots, min 5 chars usually or id
    if (!/^[a-zA-Z0-9.]{1,50}$/.test(raw)) {
      return { isValid: false, error: "INVALID_HANDLE" };
    }
  } else {
    // General fallback
    if (!/^[a-zA-Z0-9._-]{1,50}$/.test(raw)) {
      return { isValid: false, error: "INVALID_HANDLE" };
    }
  }

  return { isValid: true, normalized: raw };
}

// Detector central
export function detectSearchInput(
  input: string,
  selectedPlatform?: PlatformId
): CanonicalSearchInput {
  if (!input || typeof input !== "string") {
    return {
      originalInput: "",
      inputType: "invalid",
      isValid: false,
      errorCode: "INVALID_INPUT",
      errorMessage: "Entrada vazia ou inválida.",
    };
  }

  const raw = input.trim();

  if (raw.length === 0 || raw.length > 2048) {
    return {
      originalInput: raw,
      inputType: "invalid",
      isValid: false,
      errorCode: "INVALID_INPUT",
      errorMessage: "Tamanho de entrada inválido.",
    };
  }

  // 1. Check if Email
  if (raw.includes("@") && !raw.startsWith("@") && !raw.includes("/") && !raw.includes("http")) {
    const emailRes = validateEmailFormat(raw);
    if (emailRes.isValid) {
      return {
        originalInput: raw,
        inputType: "email",
        email: emailRes.normalized,
        isValid: true,
      };
    } else {
      return {
        originalInput: raw,
        inputType: "email",
        isValid: false,
        errorCode: "INVALID_EMAIL",
        errorMessage: emailRes.message || "Digite um email válido. Exemplo: nome@email.com",
      };
    }
  }

  // 2. Check if URL
  if (/^https?:\/\//i.test(raw) || /^www\./i.test(raw) || /^[a-z0-9-]+\.[a-z]{2,}\//i.test(raw)) {
    const urlStringToParse = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const safeCheck = validateSafeUrl(urlStringToParse, selectedPlatform);

    if (!safeCheck.isSafe || !safeCheck.url) {
      return {
        originalInput: raw,
        inputType: "invalid",
        isValid: false,
        errorCode: "UNSUPPORTED_DOMAIN",
        errorMessage: safeCheck.error || "Esse link não pertence a uma rede social compatível.",
      };
    }

    const url = safeCheck.url;
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname;

    // Detect Platform from hostname
    let detectedPlatform: PlatformId | undefined = selectedPlatform;
    if (!detectedPlatform) {
      for (const [plat, hosts] of Object.entries(ALLOWED_HOSTS)) {
        if (hosts.includes(hostname)) {
          detectedPlatform = plat as PlatformId;
          break;
        }
      }
    }

    if (!detectedPlatform) {
      return {
        originalInput: raw,
        inputType: "invalid",
        isValid: false,
        errorCode: "UNSUPPORTED_DOMAIN",
        errorMessage: "Esse link não pertence a uma rede social compatível.",
      };
    }

    // Clean tracking query params
    const canonical = new URL(url.origin + pathname);

    // Platform URL parsers
    if (detectedPlatform === "instagram") {
      // Formats:
      // /username or /username/
      // /p/CODE
      // /reel/CODE
      // /tv/CODE
      const segments = pathname.split("/").filter(Boolean);

      if (segments.length === 0) {
        return {
          originalInput: raw,
          inputType: "invalid",
          platform: "instagram",
          isValid: false,
          errorCode: "INVALID_URL",
          errorMessage: "URL do Instagram não contém perfil ou publicação.",
        };
      }

      const first = segments[0].toLowerCase();
      if (first === "p" || first === "reel" || first === "tv" || first === "reels") {
        const code = segments[1];
        if (!code) {
          return {
            originalInput: raw,
            inputType: "invalid",
            platform: "instagram",
            isValid: false,
            errorCode: "INVALID_URL",
            errorMessage: "Código de publicação não identificado.",
          };
        }
        return {
          originalInput: raw,
          inputType: "content_url",
          platform: "instagram",
          canonicalUrl: canonical.toString(),
          contentId: code,
          isValid: true,
        };
      } else {
        // Assume username
        const handle = segments[0];
        const val = validateHandleFormat(handle, "instagram");
        if (!val.isValid) {
          return {
            originalInput: raw,
            inputType: "profile_url",
            platform: "instagram",
            isValid: false,
            errorCode: "INVALID_HANDLE",
            errorMessage: "Nome de usuário na URL inválido.",
          };
        }
        return {
          originalInput: raw,
          inputType: "profile_url",
          platform: "instagram",
          canonicalUrl: canonical.toString(),
          username: val.normalized,
          isValid: true,
        };
      }
    }

    if (detectedPlatform === "tiktok") {
      // Formats:
      // /@username
      // /@username/video/ID
      // vm.tiktok.com/CODE or vt.tiktok.com/CODE
      if (hostname.includes("vm.tiktok.com") || hostname.includes("vt.tiktok.com")) {
        return {
          originalInput: raw,
          inputType: "content_url",
          platform: "tiktok",
          canonicalUrl: url.toString(),
          contentId: pathname.replace(/^\//, ""),
          isValid: true,
        };
      }

      const segments = pathname.split("/").filter(Boolean);
      if (segments.length === 0) {
        return {
          originalInput: raw,
          inputType: "invalid",
          platform: "tiktok",
          isValid: false,
          errorCode: "INVALID_URL",
          errorMessage: "URL do TikTok inválida.",
        };
      }

      const userSegment = segments[0];
      const usernameClean = userSegment.startsWith("@") ? userSegment.substring(1) : userSegment;

      if (segments.length >= 3 && segments[1].toLowerCase() === "video") {
        return {
          originalInput: raw,
          inputType: "content_url",
          platform: "tiktok",
          canonicalUrl: canonical.toString(),
          username: usernameClean,
          contentId: segments[2],
          isValid: true,
        };
      }

      const val = validateHandleFormat(usernameClean, "tiktok");
      if (!val.isValid) {
        return {
          originalInput: raw,
          inputType: "profile_url",
          platform: "tiktok",
          isValid: false,
          errorCode: "INVALID_HANDLE",
          errorMessage: "Nome de usuário na URL inválido.",
        };
      }

      return {
        originalInput: raw,
        inputType: "profile_url",
        platform: "tiktok",
        canonicalUrl: canonical.toString(),
        username: val.normalized,
        isValid: true,
      };
    }

    if (detectedPlatform === "twitter") {
      // Formats:
      // /username
      // /username/status/ID
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length === 0) {
        return {
          originalInput: raw,
          inputType: "invalid",
          platform: "twitter",
          isValid: false,
          errorCode: "INVALID_URL",
          errorMessage: "URL do X/Twitter inválida.",
        };
      }

      const username = segments[0];
      if (segments.length >= 3 && segments[1].toLowerCase() === "status") {
        return {
          originalInput: raw,
          inputType: "content_url",
          platform: "twitter",
          canonicalUrl: canonical.toString(),
          username,
          contentId: segments[2],
          isValid: true,
        };
      }

      const val = validateHandleFormat(username, "twitter");
      if (!val.isValid) {
        return {
          originalInput: raw,
          inputType: "profile_url",
          platform: "twitter",
          isValid: false,
          errorCode: "INVALID_HANDLE",
          errorMessage: "Nome de usuário na URL inválido.",
        };
      }

      return {
        originalInput: raw,
        inputType: "profile_url",
        platform: "twitter",
        canonicalUrl: canonical.toString(),
        username: val.normalized,
        isValid: true,
      };
    }

    if (detectedPlatform === "facebook") {
      // Formats:
      // /username
      // /profile.php?id=123
      // /reel/ID
      // /watch/?v=ID
      // /username/videos/ID
      const segments = pathname.split("/").filter(Boolean);
      if (pathname.includes("profile.php")) {
        const id = url.searchParams.get("id");
        if (id) {
          return {
            originalInput: raw,
            inputType: "profile_url",
            platform: "facebook",
            canonicalUrl: `${url.origin}/profile.php?id=${id}`,
            username: id,
            isValid: true,
          };
        }
      }

      if (segments.length > 0) {
        const first = segments[0].toLowerCase();
        if (first === "reel" || first === "reels" || first === "watch") {
          const contentId = segments[1] || url.searchParams.get("v") || "";
          return {
            originalInput: raw,
            inputType: "content_url",
            platform: "facebook",
            canonicalUrl: canonical.toString(),
            contentId,
            isValid: true,
          };
        }

        if (segments.length >= 3 && segments[1].toLowerCase() === "videos") {
          return {
            originalInput: raw,
            inputType: "content_url",
            platform: "facebook",
            canonicalUrl: canonical.toString(),
            username: segments[0],
            contentId: segments[2],
            isValid: true,
          };
        }

        return {
          originalInput: raw,
          inputType: "profile_url",
          platform: "facebook",
          canonicalUrl: canonical.toString(),
          username: segments[0],
          isValid: true,
        };
      }

      return {
        originalInput: raw,
        inputType: "invalid",
        platform: "facebook",
        isValid: false,
        errorCode: "INVALID_URL",
        errorMessage: "URL do Facebook não reconhecida.",
      };
    }
  }

  // 3. Handle / Username input (@username or raw username)
  const targetPlatform = selectedPlatform || "instagram";
  const handleVal = validateHandleFormat(raw, targetPlatform);

  if (!handleVal.isValid || !handleVal.normalized) {
    return {
      originalInput: raw,
      inputType: "handle",
      platform: targetPlatform,
      isValid: false,
      errorCode: handleVal.error || "INVALID_HANDLE",
      errorMessage: "Este @ não possui um formato válido.",
    };
  }

  return {
    originalInput: raw,
    inputType: "handle",
    platform: targetPlatform,
    username: handleVal.normalized,
    isValid: true,
  };
}
