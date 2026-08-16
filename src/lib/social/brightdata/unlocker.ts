import { getBrightDataConfig } from "./resolvers";

// Bright Data Web Unlocker Proxy API
export async function fetchBrightDataUnlocker(
  url: string
): Promise<{ ok: boolean; data?: any; status: number; restricted?: boolean; error?: string }> {
  const { apiKey, zone, baseUrl, timeout } = getBrightDataConfig();

  if (!apiKey) {
    return { ok: false, status: 401, error: "BRIGHTDATA_API_KEY_MISSING" };
  }

  if (!zone) {
    return { ok: false, status: 400, error: "BRIGHTDATA_ZONE_NOT_SET" };
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const endpoint = `${baseUrl}/request`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        zone,
        url,
        format: "raw",
      }),
      signal: controller.signal,
    });
    clearTimeout(id);

    // Compliance / KYC / Forbidden site header checks
    const brdError = res.headers.get("x-brd-err-msg") || res.headers.get("x-brd-error") || res.headers.get("proxy-status");
    const brdErrCode = res.headers.get("x-brd-err-code");

    if (
      brdErrCode === "policy_20050" ||
      (brdError && (brdError.includes("policy_20050") || brdError.includes("compliance") || brdError.includes("KYC") || brdError.includes("special permission")))
    ) {
      console.warn("[BrightData Unlocker] Restricted by Compliance Policy/KYC:", brdError);
      return { ok: false, status: 403, restricted: true, error: "PROVIDER_RESTRICTED" };
    }

    if (res.status === 404) return { ok: false, status: 404, error: "NOT_FOUND" };
    if (res.status === 429) return { ok: false, status: 429, error: "PROVIDER_RATE_LIMIT" };

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, status: res.status, error: errText };
    }

    const htmlOrJson = await res.text();
    if (!htmlOrJson || htmlOrJson.trim().length === 0) {
      return { ok: false, status: 204, error: "EMPTY_RESPONSE" };
    }

    return { ok: true, status: 200, data: htmlOrJson };
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === "AbortError") {
      return { ok: false, status: 504, error: "PROVIDER_TIMEOUT" };
    }
    return { ok: false, status: 500, error: err.message };
  }
}
