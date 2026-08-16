import crypto from "crypto";
import { PlatformId } from "./types";

export interface PendingJobPayload {
  snapshotId: string;
  platform: PlatformId;
  operation: "profile" | "content";
  originalInput: string;
  issuedAt: number;
  expiresAt: number;
}

function getJobSecret(): string {
  return (
    process.env.SEARCH_JOB_SECRET ||
    process.env.SESSION_SECRET ||
    "cloutflow_default_internal_signing_secret_2026"
  );
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

/**
 * Creates an opaque, HMAC-SHA256 signed token for tracking pending Bright Data jobs across serverless instances.
 * Lifetime default: 600 seconds (10 minutes).
 */
export function createSignedJobToken(
  payload: Omit<PendingJobPayload, "issuedAt" | "expiresAt">,
  ttlSeconds = 600
): string {
  const secret = getJobSecret();
  const now = Date.now();
  const fullPayload: PendingJobPayload = {
    ...payload,
    issuedAt: now,
    expiresAt: now + ttlSeconds * 1000,
  };

  const payloadString = JSON.stringify(fullPayload);
  const encodedPayload = base64UrlEncode(payloadString);

  const signature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `req_${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes an opaque signed job token.
 * Returns the decoded payload or specific error reasons.
 */
export function verifySignedJobToken(
  token: string
): { valid: true; payload: PendingJobPayload } | { valid: false; error: "INVALID_SIGNATURE" | "JOB_EXPIRED" | "MALFORMED_TOKEN" } {
  if (!token || typeof token !== "string" || !token.startsWith("req_")) {
    return { valid: false, error: "MALFORMED_TOKEN" };
  }

  const rawToken = token.substring(4);
  const parts = rawToken.split(".");
  if (parts.length !== 2) {
    return { valid: false, error: "MALFORMED_TOKEN" };
  }

  const [encodedPayload, providedSignature] = parts;
  const secret = getJobSecret();

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  // Constant-time comparison to prevent timing attacks
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return { valid: false, error: "INVALID_SIGNATURE" };
  }

  try {
    const payloadJson = base64UrlDecode(encodedPayload);
    const payload: PendingJobPayload = JSON.parse(payloadJson);

    if (!payload.snapshotId || !payload.expiresAt) {
      return { valid: false, error: "MALFORMED_TOKEN" };
    }

    if (Date.now() > payload.expiresAt) {
      return { valid: false, error: "JOB_EXPIRED" };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: "MALFORMED_TOKEN" };
  }
}
