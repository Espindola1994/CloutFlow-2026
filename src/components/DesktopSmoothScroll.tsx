"use client";

import { useEffect } from "react";

/**
 * DesktopSmoothScroll:
 * Custom vertical smooth scroll with progressive deceleration and inertia for traditional mouse wheels on Desktop (>= 901px).
 *
 * Requirements:
 * 1. Desktop only: window.innerWidth >= 901px. Mobile/tablet <= 900px untouched.
 * 2. Mouse wheel vertical scrolling with multiplier (0.95) and easing (0.15).
 *    No progressive/accumulative acceleration: each wheel impulse has predictable, consistent response.
 * 3. Explicit programmatic scroll coordination:
 *    Listens for 'cf-programmatic-scroll-start' and 'cf-programmatic-scroll-end' (or global flag).
 *    During programmatic auto-scroll (e.g. plans auto-scroll), wheel interception is suspended.
 *    On end, currentY and targetY are immediately synchronized to window.scrollY.
 * 4. Trackpad safe: detects trackpad gestures (low delta with deltaMode === 0 or smooth fractional deltas)
 *    and lets trackpads use native smooth scrolling.
 * 5. Internal scrollable elements bypass: if event target or ancestor has scrollable vertical overflow and can scroll in event direction, bypass.
 * 6. Ctrl + Wheel / Pinch Zoom bypass: if event.ctrlKey is true, bypass.
 * 7. Horizontal / Shift + Wheel bypass: if Math.abs(event.deltaX) > Math.abs(event.deltaY) or event.shiftKey, bypass.
 * 8. Scrollbar dragging & keyboard keys (PageDown, Up, Down, Space, Home, End) & programmatic window.scrollTo() / scrollIntoView:
 *    instantly synchronizes internal state and cancels any pending animation frame so no fighting or jumping back occurs.
 * 9. prefers-reduced-motion: if reduce, completely inactive.
 * 10. High performance: single passive:false wheel listener, refs only (no React re-renders), single rAF loop with idle shutdown.
 */

export const MIN_WHEEL_STEP = 105; // Minimum impulse displacement (px) per notch for conventional mouse wheel
export const WHEEL_MULTIPLIER = 1.00; // Linear multiplier per notch
export const EASING = 0.18; // Responsive interpolation factor (0.16 to 0.20)
const EPSILON = 0.5; // Threshold to stop animation loop

export const PROGRAMMATIC_SCROLL_START_EVENT = "cf-programmatic-scroll-start";
export const PROGRAMMATIC_SCROLL_END_EVENT = "cf-programmatic-scroll-end";

/**
 * Helper to check if an element or any of its parents up to document.body
 * is scrollable in the direction of the wheel delta.
 */
function isScrollableElement(target: EventTarget | null, deltaY: number): boolean {
  if (!(target instanceof HTMLElement)) return false;

  let current: HTMLElement | null = target;

  while (current && current !== document.body && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;

    if (overflowY === "auto" || overflowY === "scroll") {
      const canScrollDown = deltaY > 0 && current.scrollTop + current.clientHeight < current.scrollHeight - 1;
      const canScrollUp = deltaY < 0 && current.scrollTop > 1;

      if (canScrollDown || canScrollUp) {
        return true;
      }
    }

    // Also check horizontal scroll containers if horizontal intent
    const overflowX = style.overflowX;
    if (overflowX === "auto" || overflowX === "scroll") {
      if (current.scrollWidth > current.clientWidth) {
        // If the container is horizontally scrollable, let it handle touch/wheel
        const canScrollRight = deltaY > 0 && current.scrollLeft + current.clientWidth < current.scrollWidth - 1;
        const canScrollLeft = deltaY < 0 && current.scrollLeft > 1;
        if (canScrollRight || canScrollLeft) {
          return true;
        }
      }
    }

    current = current.parentElement;
  }

  return false;
}

export function DesktopSmoothScroll() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    let targetY = window.pageYOffset || document.documentElement.scrollTop || 0;
    let currentY = targetY;
    let isRunning = false;
    let animationFrameId: number | null = null;
    let isProgrammaticOrExternalScroll = false;
    let isProgrammaticSuspended = false;

    const getMaxScroll = () => {
      return Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
    };

    const stopAnimation = () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      isRunning = false;
    };

    const tick = () => {
      if (!isRunning || isProgrammaticSuspended) return;

      const diff = targetY - currentY;

      if (Math.abs(diff) < EPSILON) {
        currentY = targetY;
        isProgrammaticOrExternalScroll = true;
        window.scrollTo(0, currentY);
        isProgrammaticOrExternalScroll = false;
        stopAnimation();
        return;
      }

      currentY += diff * EASING;
      isProgrammaticOrExternalScroll = true;
      window.scrollTo(0, currentY);
      isProgrammaticOrExternalScroll = false;

      animationFrameId = window.requestAnimationFrame(tick);
    };

    const startAnimation = () => {
      if (!isRunning && !isProgrammaticSuspended) {
        isRunning = true;
        animationFrameId = window.requestAnimationFrame(tick);
      }
    };

    // Programmatic scroll coordination handlers
    const onProgrammaticScrollStart = () => {
      isProgrammaticSuspended = true;
      stopAnimation();
    };

    const onProgrammaticScrollEnd = () => {
      const actualScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      targetY = actualScrollY;
      currentY = actualScrollY;
      isProgrammaticSuspended = false;
      stopAnimation();
    };

    // Wheel event handler
    const onWheel = (e: WheelEvent) => {
      // If programmatic auto-scroll is active, do not intercept or fight it
      if (isProgrammaticSuspended) {
        return;
      }

      // 1. Strict desktop check: innerWidth >= 901px
      if (window.innerWidth < 901) {
        return;
      }

      // 2. Ctrl key pressed -> browser zoom / pinch zoom
      if (e.ctrlKey || e.metaKey) {
        return;
      }

      // 3. Shift key or dominant horizontal scroll -> let native horizontal scroll happen
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return;
      }

      // 4. Check if cursor is over an internal scrollable container
      if (isScrollableElement(e.target, e.deltaY)) {
        return;
      }

      // 5. Detect trackpad vs traditional mouse wheel:
      // Traditional mouse wheel fires deltaMode === 1 (lines, e.g. Firefox) or deltaMode === 2 (pages)
      // or deltaMode === 0 with typically large integer multiples (e.g. ±100, ±120, ±150, ±240, ±360).
      // Trackpads fire deltaMode === 0 with very small, smooth, continuous fractional deltas (e.g. 1.25, 3.5, -2.1).
      // If deltaMode === 0 and Math.abs(e.deltaY) is small (e.g., < 40 and not integer multiples of standard wheel steps),
      // we treat it as trackpad / precision touch and let the browser's native inertial scroll handle it without interference.
      if (e.deltaMode === 0) {
        const absDelta = Math.abs(e.deltaY);
        const isStandardWheelStep = absDelta >= 50 && (absDelta % 10 === 0 || absDelta % 12 === 0 || absDelta % 24 === 0 || absDelta % 50 === 0);
        // Trackpads typically produce tiny deltas like 1, 2, 4, 7, 13, 23 with high frequency
        if (absDelta < 35 && !isStandardWheelStep) {
          // Sync current coordinates with native trackpad scroll and return
          targetY = window.pageYOffset || document.documentElement.scrollTop || 0;
          currentY = targetY;
          stopAnimation();
          return;
        }
      }

      // Prevent native harsh wheel jump
      e.preventDefault();

      const actualScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      const maxScroll = getMaxScroll();

      // If animation was not active, start from the true current window.scrollY
      if (!isRunning) {
        currentY = actualScrollY;
        targetY = actualScrollY;
      } else {
        // If current window.scrollY diverged substantially from currentY (user dragged bar or jump occurred), re-sync
        if (Math.abs(actualScrollY - currentY) > 80) {
          currentY = actualScrollY;
          targetY = actualScrollY;
        }
      }

      // Calculate step based on deltaMode and deltaY
      let rawDelta = e.deltaY;
      if (e.deltaMode === 1) {
        // Delta in lines (Firefox default) - normalize each line to standard line height
        rawDelta *= 33;
      } else if (e.deltaMode === 2) {
        // Delta in pages
        rawDelta *= window.innerHeight;
      }

      // Consistent minimum impulse for traditional mouse wheel notches:
      // Guarantees that a single wheel notch produces an immediate, clearly noticeable displacement (at least MIN_WHEEL_STEP px).
      // Each notch is completely linear without progressive acceleration or velocity buildup.
      const sign = Math.sign(rawDelta);
      const normalizedDelta = sign * Math.max(Math.abs(rawDelta), MIN_WHEEL_STEP);

      const impulse = normalizedDelta * WHEEL_MULTIPLIER;
      targetY = Math.min(Math.max(0, targetY + impulse), maxScroll);

      startAnimation();
    };

    // Sync on scroll from other sources (scrollbar dragging, programmatic scrollTo, keyboard)
    const onScroll = () => {
      // If the scroll was triggered by our own rAF tick, do not interrupt
      if (isProgrammaticOrExternalScroll) {
        return;
      }

      // Scroll came from external source (scrollbar drag, keyboard, programmatic auto-scroll)
      const actualScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

      // If we are currently running our wheel animation and an external scroll happened,
      // stop our animation so we don't fight with programmatic auto-scroll (e.g., plan auto-scroll)
      // or scrollbar dragging.
      targetY = actualScrollY;
      currentY = actualScrollY;
      stopAnimation();
    };

    // Synchronize target when window resizes
    const onResize = () => {
      if (window.innerWidth < 901) {
        stopAnimation();
        return;
      }
      const actualScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      const maxScroll = getMaxScroll();
      targetY = Math.min(Math.max(0, actualScrollY), maxScroll);
      currentY = targetY;
    };

    // Keyboard synchronization: when navigation keys are pressed, immediately sync to prevent snap
    const onKeyDown = (e: KeyboardEvent) => {
      const keys = ["PageDown", "PageUp", "Home", "End", "ArrowUp", "ArrowDown", "Space", " "];
      if (keys.includes(e.key)) {
        stopAnimation();
        // Give a microtask/timeout to allow native key scroll to update scrollY, then sync
        window.setTimeout(() => {
          const actualScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
          targetY = actualScrollY;
          currentY = actualScrollY;
        }, 16);
      }
    };

    // Register listeners
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("keydown", onKeyDown, { passive: true });
    window.addEventListener(PROGRAMMATIC_SCROLL_START_EVENT, onProgrammaticScrollStart);
    window.addEventListener(PROGRAMMATIC_SCROLL_END_EVENT, onProgrammaticScrollEnd);

    return () => {
      stopAnimation();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(PROGRAMMATIC_SCROLL_START_EVENT, onProgrammaticScrollStart);
      window.removeEventListener(PROGRAMMATIC_SCROLL_END_EVENT, onProgrammaticScrollEnd);
    };
  }, []);

  return null;
}
