/**
 * Early synchronous platform bootstrap script.
 * Emits a native synchronous inline <script> directly into <head> before any CSS/body render.
 * Evaluates navigator.userAgent synchronously during initial HTML parse and adds
 * `cf-platform-ios` to `document.documentElement` before first paint and before hydration.
 *
 * Runs without depending on Next.js client chunk hydration or next/script queue.
 */
const platformInitScript = `(function(){try{var ua=navigator.userAgent||'';var touch=navigator.maxTouchPoints||0;var isPad=/iPad/i.test(ua)||(/Macintosh/i.test(ua)&&touch>1);if(!isPad&&!/Android/i.test(ua)&&/iPhone|iPod/i.test(ua)){document.documentElement.classList.add('cf-platform-ios');}}catch(e){}})();`;

export function PlatformBootstrapScript() {
  return (
    <script
      id="cf-platform-bootstrap"
      dangerouslySetInnerHTML={{ __html: platformInitScript }}
    />
  );
}
