import { getBrightDataConfig } from "./resolvers";

// Sleep helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type ScraperResult = {
  ok: boolean;
  status: number;
  data?: any;
  pending?: boolean;
  snapshotId?: string;
  restricted?: boolean;
  error?: string;
};

/**
 * Dispatches a scrape query to Bright Data.
 * 
 * - Para Facebook (ou coletas marcadas com allowAsyncPending = true):
 *   Utiliza POST /datasets/v3/trigger que retorna em < 1 segundo com { snapshot_id },
 *   permitindo responder imediatamente 'pending' ao frontend para polling sem timeout.
 * 
 * - Para TikTok e Twitter (síncronos):
 *   Utiliza POST /datasets/v3/scrape (com fallback de trigger + polling curto).
 */
export async function fetchBrightDataStructuredScraper(
  datasetId: string | undefined,
  inputItem: Record<string, any>,
  allowAsyncPending = false
): Promise<ScraperResult> {
  if (!datasetId || datasetId.trim().length === 0) {
    return { ok: false, status: 503, restricted: true, error: "DATASET_NOT_CONFIGURED" };
  }

  const { apiKey, timeout } = getBrightDataConfig();

  if (!apiKey) {
    return { ok: false, status: 401, error: "BRIGHTDATA_API_KEY_MISSING" };
  }

  // -------------------------------------------------------------
  // MODO ASSÍNCRONO RÁPIDO (e.g. Facebook) -> Retorna snapshot_id em < 1s
  // -------------------------------------------------------------
  if (allowAsyncPending) {
    const triggerController = new AbortController();
    const triggerTimeoutId = setTimeout(() => triggerController.abort(), 10000);

    try {
      const triggerEndpoint = `https://api.brightdata.com/datasets/v3/trigger?dataset_id=${encodeURIComponent(datasetId)}&include_errors=true&format=json`;
      const triggerRes = await fetch(triggerEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([inputItem]),
        signal: triggerController.signal,
      });
      clearTimeout(triggerTimeoutId);

      if (triggerRes.status === 401 || triggerRes.status === 403) {
        return { ok: false, status: triggerRes.status, restricted: true, error: "PROVIDER_RESTRICTED" };
      }

      if (triggerRes.status === 404) {
        return { ok: false, status: 404, restricted: true, error: "DATASET_NOT_FOUND" };
      }

      if (!triggerRes.ok) {
        const errText = await triggerRes.text();
        return { ok: false, status: triggerRes.status, error: errText };
      }

      const triggerJson = await triggerRes.json();
      const snapshotId = triggerJson.snapshot_id || triggerJson.snapshotId || triggerJson.id;

      if (snapshotId) {
        return { ok: true, status: 202, pending: true, snapshotId };
      }

      if (Array.isArray(triggerJson) || triggerJson.data) {
        return { ok: true, status: 200, data: triggerJson };
      }

      return { ok: false, status: 500, error: "NO_SNAPSHOT_RETURNED" };
    } catch (err: any) {
      clearTimeout(triggerTimeoutId);
      return { ok: false, status: 500, error: err.message };
    }
  }

  // -------------------------------------------------------------
  // MODO SÍNCRONO (e.g. TikTok, Twitter)
  // -------------------------------------------------------------
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const scrapeEndpoint = `https://api.brightdata.com/datasets/v3/scrape?dataset_id=${encodeURIComponent(datasetId)}&notify=false&include_errors=true&format=json`;
    
    const requestBody = JSON.stringify({
      input: [inputItem],
    });

    const res = await fetch(scrapeEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: requestBody,
      signal: controller.signal,
    });

    if (res.status === 401 || res.status === 403) {
      clearTimeout(timeoutId);
      return { ok: false, status: res.status, restricted: true, error: "PROVIDER_RESTRICTED" };
    }

    if (res.status === 404) {
      clearTimeout(timeoutId);
      return { ok: false, status: 404, restricted: true, error: "DATASET_NOT_FOUND" };
    }

    const initialJson = await res.json().catch(() => null);

    // 1. Direct 200 OK with data array
    if (res.status === 200 && initialJson) {
      clearTimeout(timeoutId);
      return { ok: true, status: 200, data: initialJson };
    }

    // 2. 202 Accepted with snapshot_id
    const snapshotId = initialJson?.snapshot_id || initialJson?.snapshotId || initialJson?.id;

    if (snapshotId) {
      const startTime = Date.now();
      const maxPollMs = Math.min(timeout - 2000, 26000);

      while (Date.now() - startTime < maxPollMs) {
        await delay(2000);

        const progressRes = await fetch(`https://api.brightdata.com/datasets/v3/progress/${snapshotId}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: controller.signal,
        });

        if (!progressRes.ok) continue;

        const progressJson = await progressRes.json();
        if (progressJson.status === "ready") {
          const dataRes = await fetch(`https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`, {
            headers: { Authorization: `Bearer ${apiKey}` },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          if (dataRes.ok) {
            const snapshotData = await dataRes.json();
            return { ok: true, status: 200, data: snapshotData };
          }
          return { ok: false, status: dataRes.status, error: "FAILED_FETCH_SNAPSHOT" };
        } else if (progressJson.status === "failed") {
          clearTimeout(timeoutId);
          return { ok: false, status: 500, error: "SNAPSHOT_FAILED" };
        }
      }

      clearTimeout(timeoutId);
      return { ok: false, status: 504, error: "PROVIDER_TIMEOUT" };
    }

    clearTimeout(timeoutId);
    if (initialJson && (Array.isArray(initialJson) || initialJson.data)) {
      return { ok: true, status: 200, data: initialJson };
    }

    return { ok: false, status: res.status, error: "NO_DATA_OR_SNAPSHOT" };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      return { ok: false, status: 504, error: "PROVIDER_TIMEOUT" };
    }
    return { ok: false, status: 500, error: err.message };
  }
}

/**
 * Checks progress of a snapshot and returns data if ready
 */
export async function checkBrightDataSnapshot(snapshotId: string): Promise<{
  status: "pending" | "ready" | "failed" | "error";
  data?: any;
  error?: string;
}> {
  const { apiKey } = getBrightDataConfig();

  if (!apiKey) {
    return { status: "error", error: "BRIGHTDATA_API_KEY_MISSING" };
  }

  try {
    const progressRes = await fetch(`https://api.brightdata.com/datasets/v3/progress/${encodeURIComponent(snapshotId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!progressRes.ok) {
      if (progressRes.status === 404) return { status: "error", error: "SNAPSHOT_NOT_FOUND" };
      return { status: "error", error: `PROGRESS_HTTP_${progressRes.status}` };
    }

    const progressJson = await progressRes.json();
    const currentStatus = progressJson.status;

    if (currentStatus === "ready") {
      const dataRes = await fetch(`https://api.brightdata.com/datasets/v3/snapshot/${encodeURIComponent(snapshotId)}?format=json`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (dataRes.ok) {
        const data = await dataRes.json();
        return { status: "ready", data };
      }
      return { status: "error", error: `SNAPSHOT_FETCH_HTTP_${dataRes.status}` };
    }

    if (currentStatus === "failed") {
      return { status: "failed", error: "SNAPSHOT_FAILED" };
    }

    return { status: "pending" };
  } catch (err: any) {
    return { status: "error", error: err.message };
  }
}
