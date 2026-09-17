import Script from "next/script";

/**
 * Early platform bootstrap script.
 * Runs synchronously in document <head> before rendering to evaluate navigator.userAgent
 * and immediately apply the `cf-platform-ios` class to `document.documentElement`.
 *
 * This guarantees zero visual flash (FOUC) on iOS while keeping SSR HTML free
 * of any user-agent specific classes, avoiding React hydration mismatch errors.
 */
const platformInitScript = `(function(){try{var ua=navigator.userAgent||'';var touch=navigator.maxTouchPoints||0;var isPad=/iPad/i.test(ua)||(/Macintosh/i.test(ua)&&touch>1);if(!isPad&&!/Android/i.test(ua)&&/iPhone|iPod/i.test(ua)){document.documentElement.classList.add('cf-platform-ios');}}catch(e){}})();`;

export function PlatformBootstrapScript() {
  return (
    <Script
      id="cf-platform-bootstrap"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: platformInitScript }}
    />
  );
}
