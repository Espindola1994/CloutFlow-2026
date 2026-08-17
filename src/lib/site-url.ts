/**
 * Centralized Application URL resolution.
 * Production: https://cloutflow.co
 * Development / Preview: localhost or custom deployment host
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.NODE_ENV === 'production') {
    return 'https://cloutflow.co';
  }

  return 'http://localhost:3000';
}
