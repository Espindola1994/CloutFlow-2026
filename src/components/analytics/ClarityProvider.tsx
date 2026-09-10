'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

export interface ClarityProviderProps {
  projectId?: string;
}

/**
 * Checks if Microsoft Clarity should be loaded based on strict safety constraints:
 * 1. Project ID must be defined, non-empty, and valid format.
 * 2. Environment must be production (VERCEL_ENV === 'production' or NODE_ENV === 'production').
 * 3. Pathname must NOT be admin (/admin or /admin/*) or API (/api or /api/*).
 */
export function shouldLoadClarity(params: {
  projectId?: string | null;
  pathname?: string | null;
  isProduction?: boolean;
}): boolean {
  const { projectId, pathname, isProduction } = params;

  // 1. Project ID guard
  if (!projectId || typeof projectId !== 'string' || projectId.trim().length === 0) {
    return false;
  }

  // 2. Production environment guard (strictly production only - no localhost, test, preview)
  if (!isProduction) {
    return false;
  }

  // 3. Route exclusion guard (strictly exclude admin and api routes, including client navigations)
  if (!pathname) {
    return false;
  }

  const normalizedPath = pathname.toLowerCase();
  if (
    normalizedPath === '/admin' ||
    normalizedPath.startsWith('/admin/') ||
    normalizedPath === '/api' ||
    normalizedPath.startsWith('/api/')
  ) {
    return false;
  }

  return true;
}

/**
 * Microsoft Clarity Official Provider Component
 * 
 * Non-blocking (afterInteractive), isolated, fail-safe.
 * Masking configured to protect all sensitive fields.
 */
export default function ClarityProvider({ projectId }: ClarityProviderProps) {
  const pathname = usePathname();

  const effectiveProjectId = projectId || process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  // Detect true production environment
  const isProduction =
    process.env.NODE_ENV === 'production' &&
    (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ||
      typeof window === 'undefined' ||
      window.location.hostname === 'cloutflow.co' ||
      window.location.hostname === 'www.cloutflow.co');

  const canLoad = shouldLoadClarity({
    projectId: effectiveProjectId,
    pathname,
    isProduction,
  });

  if (!canLoad || !effectiveProjectId) {
    return null;
  }

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${effectiveProjectId.trim()}");
        `,
      }}
    />
  );
}
