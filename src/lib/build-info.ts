/**
 * Global build information helper.
 * Reads Vercel commit SHA injected at build time or falls back safely.
 */
export const BUILD_INFO = {
  commitSha:
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ||
    "local-dev",
  get shortSha() {
    return this.commitSha.slice(0, 7);
  },
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || "development",
};
