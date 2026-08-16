import { PlatformId } from "./types";

export const ALLOWED_HOSTS: Record<PlatformId, string[]> = {
  instagram: ["instagram.com", "www.instagram.com"],
  tiktok: ["tiktok.com", "www.tiktok.com", "vm.tiktok.com", "vt.tiktok.com", "m.tiktok.com"],
  twitter: ["x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"],
  facebook: ["facebook.com", "www.facebook.com", "m.facebook.com", "web.facebook.com", "fb.com", "www.fb.com"],
};

export const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/,
  /^::1$/,
  /^fe80:/i,
  /^0\.0\.0\.0$/,
  /\.local$/i,
  /\.internal$/i,
];

export function validateSafeUrl(urlString: string, platform?: PlatformId): { isSafe: boolean; url?: URL; error?: string } {
  try {
    const trimmed = urlString.trim();
    if (trimmed.length > 2048) {
      return { isSafe: false, error: "URL is too long" };
    }

    // Protocol check
    if (!/^https?:\/\//i.test(trimmed)) {
      return { isSafe: false, error: "Only HTTP and HTTPS protocols are allowed" };
    }

    const parsed = new URL(trimmed);

    // Protocol must be http or https
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { isSafe: false, error: "Forbidden protocol" };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check blocked IP / localhost patterns
    for (const pattern of BLOCKED_HOST_PATTERNS) {
      if (pattern.test(hostname)) {
        return { isSafe: false, error: "Access to private or local network is forbidden" };
      }
    }

    // Verify against allowed social hosts if platform is specified
    if (platform) {
      const allowed = ALLOWED_HOSTS[platform];
      const isAllowed = allowed.some((h) => hostname === h);
      if (!isAllowed) {
        return { isSafe: false, error: `Hostname ${hostname} is not allowed for ${platform}` };
      }
    } else {
      // If no platform specified, check against any allowed platform host
      const allAllowed = Object.values(ALLOWED_HOSTS).flat();
      const isAllowed = allAllowed.some((h) => hostname === h);
      if (!isAllowed) {
        return { isSafe: false, error: `Hostname ${hostname} is not an allowed social media domain` };
      }
    }

    return { isSafe: true, url: parsed };
  } catch (err) {
    return { isSafe: false, error: "Malformed URL" };
  }
}
