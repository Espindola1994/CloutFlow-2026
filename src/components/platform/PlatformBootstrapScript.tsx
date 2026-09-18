import { PLATFORM_BOOTSTRAP_SCRIPT } from "@/lib/platform";

/**
 * Early synchronous platform bootstrap script.
 * Emits a native synchronous inline <script> directly into <head> before any CSS/body render.
 * Evaluates navigator.userAgent synchronously during initial HTML parse and adds
 * `cf-platform-ios` or `cf-platform-ipados` to `document.documentElement` before first paint and before hydration.
 *
 * Runs without depending on Next.js client chunk hydration or next/script queue.
 * Single source of truth is PLATFORM_BOOTSTRAP_SCRIPT in `@/lib/platform`.
 */
export function PlatformBootstrapScript() {
  return (
    <script
      id="cf-platform-bootstrap"
      dangerouslySetInnerHTML={{ __html: PLATFORM_BOOTSTRAP_SCRIPT }}
    />
  );
}

