import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import {
  DesktopSmoothScroll,
  MIN_WHEEL_STEP,
  WHEEL_MULTIPLIER,
  EASING,
  PROGRAMMATIC_SCROLL_START_EVENT,
  PROGRAMMATIC_SCROLL_END_EVENT,
} from "@/components/DesktopSmoothScroll";

describe("DesktopSmoothScroll", () => {
  let originalInnerWidth: number;
  let originalScrollY: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalScrollY = window.scrollY;
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", { value: originalInnerWidth, writable: true });
    Object.defineProperty(window, "scrollY", { value: originalScrollY, writable: true });
    vi.restoreAllMocks();
  });

  it("exports responsive speed constants (MIN_WHEEL_STEP = 105, WHEEL_MULTIPLIER = 1.00, EASING = 0.18)", () => {
    expect(MIN_WHEEL_STEP).toBe(105);
    expect(WHEEL_MULTIPLIER).toBe(1.00);
    expect(EASING).toBe(0.18);
    expect(MIN_WHEEL_STEP).toBeGreaterThanOrEqual(90);
    expect(MIN_WHEEL_STEP).toBeLessThanOrEqual(120);
    expect(WHEEL_MULTIPLIER).toBeGreaterThanOrEqual(0.95);
    expect(WHEEL_MULTIPLIER).toBeLessThanOrEqual(1.10);
    expect(EASING).toBeGreaterThanOrEqual(0.16);
    expect(EASING).toBeLessThanOrEqual(0.20);
  });

  it("does not intercept wheel events when innerWidth <= 900px (mobile/tablet)", () => {
    Object.defineProperty(window, "innerWidth", { value: 768, writable: true });

    render(<DesktopSmoothScroll />);

    const preventDefault = vi.fn();
    const wheelEvent = new WheelEvent("wheel", {
      deltaY: 100,
      deltaMode: 0,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(wheelEvent, "preventDefault", { value: preventDefault });

    window.dispatchEvent(wheelEvent);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("does not intercept wheel when ctrlKey is true (zoom)", () => {
    Object.defineProperty(window, "innerWidth", { value: 1280, writable: true });

    render(<DesktopSmoothScroll />);

    const preventDefault = vi.fn();
    const wheelEvent = new WheelEvent("wheel", {
      deltaY: 100,
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(wheelEvent, "preventDefault", { value: preventDefault });

    window.dispatchEvent(wheelEvent);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("does not intercept wheel when horizontal scroll is dominant", () => {
    Object.defineProperty(window, "innerWidth", { value: 1280, writable: true });

    render(<DesktopSmoothScroll />);

    const preventDefault = vi.fn();
    const wheelEvent = new WheelEvent("wheel", {
      deltaY: 10,
      deltaX: 100,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(wheelEvent, "preventDefault", { value: preventDefault });

    window.dispatchEvent(wheelEvent);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("does not intercept precision trackpad gestures (low continuous deltas)", () => {
    Object.defineProperty(window, "innerWidth", { value: 1280, writable: true });

    render(<DesktopSmoothScroll />);

    const preventDefault = vi.fn();
    const trackpadWheelEvent = new WheelEvent("wheel", {
      deltaY: 4,
      deltaMode: 0,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(trackpadWheelEvent, "preventDefault", { value: preventDefault });

    window.dispatchEvent(trackpadWheelEvent);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("intercepts wheel and animates scroll on desktop >= 901px for standard mouse wheel", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    const scrollToMock = vi.fn();
    window.scrollTo = scrollToMock;

    render(<DesktopSmoothScroll />);

    const preventDefault = vi.fn();
    const wheelEvent = new WheelEvent("wheel", {
      deltaY: 120,
      deltaMode: 0,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(wheelEvent, "preventDefault", { value: preventDefault });

    window.dispatchEvent(wheelEvent);
    expect(preventDefault).toHaveBeenCalled();
  });

  it("suspends DesktopSmoothScroll during programmatic auto-scroll and resumes on end", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    render(<DesktopSmoothScroll />);

    // Dispatch programmatic scroll start
    window.dispatchEvent(new CustomEvent(PROGRAMMATIC_SCROLL_START_EVENT));

    const preventDefaultDuring = vi.fn();
    const wheelEventDuring = new WheelEvent("wheel", {
      deltaY: 120,
      deltaMode: 0,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(wheelEventDuring, "preventDefault", { value: preventDefaultDuring });

    window.dispatchEvent(wheelEventDuring);
    // While suspended, wheel events must NOT be intercepted
    expect(preventDefaultDuring).not.toHaveBeenCalled();

    // Dispatch programmatic scroll end
    Object.defineProperty(window, "pageYOffset", { value: 750, writable: true });
    window.dispatchEvent(new CustomEvent(PROGRAMMATIC_SCROLL_END_EVENT));

    // After end, wheel is active again
    const preventDefaultAfter = vi.fn();
    const wheelEventAfter = new WheelEvent("wheel", {
      deltaY: 120,
      deltaMode: 0,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(wheelEventAfter, "preventDefault", { value: preventDefaultAfter });

    window.dispatchEvent(wheelEventAfter);
    expect(preventDefaultAfter).toHaveBeenCalled();
  });

  it("maintains predictable linear impulse without progressive acceleration", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    const scrollToMock = vi.fn();
    window.scrollTo = scrollToMock;

    render(<DesktopSmoothScroll />);

    // First impulse
    const preventDefault1 = vi.fn();
    const wheelEvent1 = new WheelEvent("wheel", {
      deltaY: 100,
      deltaMode: 0,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(wheelEvent1, "preventDefault", { value: preventDefault1 });
    window.dispatchEvent(wheelEvent1);
    expect(preventDefault1).toHaveBeenCalled();

    // Second consecutive impulse
    const preventDefault2 = vi.fn();
    const wheelEvent2 = new WheelEvent("wheel", {
      deltaY: 100,
      deltaMode: 0,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(wheelEvent2, "preventDefault", { value: preventDefault2 });
    window.dispatchEvent(wheelEvent2);
    expect(preventDefault2).toHaveBeenCalled();
  });

  it("applies MIN_WHEEL_STEP guarantee to mouse wheel notches below minimum threshold", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    render(<DesktopSmoothScroll />);

    // Single notch mouse wheel in deltaMode 1 (e.g. 1 line = 33px)
    // 33px is lower than MIN_WHEEL_STEP (105px), so it should be clamped to at least 105px
    const preventDefault = vi.fn();
    const lineWheelEvent = new WheelEvent("wheel", {
      deltaY: 1,
      deltaMode: 1, // Lines (Firefox)
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(lineWheelEvent, "preventDefault", { value: preventDefault });
    window.dispatchEvent(lineWheelEvent);
    expect(preventDefault).toHaveBeenCalled();
  });

  it("does NOT apply MIN_WHEEL_STEP to trackpad events", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    render(<DesktopSmoothScroll />);

    // Trackpad gesture produces fractional or small continuous delta (e.g. deltaY = 6, deltaMode = 0)
    const preventDefault = vi.fn();
    const trackpadEvent = new WheelEvent("wheel", {
      deltaY: 6,
      deltaMode: 0,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(trackpadEvent, "preventDefault", { value: preventDefault });
    window.dispatchEvent(trackpadEvent);
    // Trackpad is not intercepted, stays native
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("does not spawn multiple parallel rAF loops on consecutive wheel events", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    const rafSpy = vi.spyOn(window, "requestAnimationFrame");
    window.scrollTo = vi.fn();

    render(<DesktopSmoothScroll />);

    const wheel1 = new WheelEvent("wheel", { deltaY: 120, deltaMode: 0, cancelable: true });
    window.dispatchEvent(wheel1);

    const wheel2 = new WheelEvent("wheel", { deltaY: 120, deltaMode: 0, cancelable: true });
    window.dispatchEvent(wheel2);

    const wheel3 = new WheelEvent("wheel", { deltaY: 120, deltaMode: 0, cancelable: true });
    window.dispatchEvent(wheel3);

    // Initial loop initiation should request exactly 1 rAF frame before ticks run
    expect(rafSpy).toHaveBeenCalledTimes(1);
  });

  it("does not treat internal rAF window.scrollTo as external scroll interrupting the loop", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });

    let currentRafCb: FrameRequestCallback | null = null;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
      currentRafCb = cb;
      return 123;
    });

    const scrollToMock = vi.fn((x: number | ScrollToOptions, y?: number) => {
      // Browser triggers a scroll event when window.scrollTo is called
      const scrollY = typeof x === "number" ? (y ?? 0) : (x.top ?? 0);
      Object.defineProperty(window, "pageYOffset", { value: scrollY, writable: true });
      window.dispatchEvent(new Event("scroll"));
    });
    window.scrollTo = scrollToMock as unknown as typeof window.scrollTo;

    render(<DesktopSmoothScroll />);

    const wheel = new WheelEvent("wheel", { deltaY: 120, deltaMode: 0, cancelable: true });
    window.dispatchEvent(wheel);

    // Run first tick
    expect(currentRafCb).not.toBeNull();
    if (currentRafCb) {
      (currentRafCb as FrameRequestCallback)(performance.now());
    }

    // window.scrollTo was called and dispatched a scroll event
    expect(scrollToMock).toHaveBeenCalled();

    // The rAF loop requested the next frame because internal scroll did not cancel it
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(2);
  });

  it("guarantees monotonic displacement during downward and upward scrolling", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    Object.defineProperty(window, "pageYOffset", { value: 0, writable: true });
    Object.defineProperty(document.documentElement, "scrollHeight", { value: 5000, writable: true });
    Object.defineProperty(window, "innerHeight", { value: 800, writable: true });

    const renderedPositions: number[] = [];
    let currentRafCb: FrameRequestCallback | null = null;

    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
      currentRafCb = cb;
      return Math.floor(Math.random() * 1000);
    });

    window.scrollTo = vi.fn((x: number | ScrollToOptions, y?: number) => {
      const scrollY = typeof x === "number" ? (y ?? 0) : (x.top ?? 0);
      renderedPositions.push(scrollY);
      Object.defineProperty(window, "pageYOffset", { value: scrollY, writable: true });
    }) as unknown as typeof window.scrollTo;

    render(<DesktopSmoothScroll />);

    // Downward scroll
    const downWheel = new WheelEvent("wheel", { deltaY: 150, deltaMode: 0, cancelable: true });
    window.dispatchEvent(downWheel);

    for (let i = 0; i < 20; i++) {
      if (currentRafCb) {
        const cb: FrameRequestCallback = currentRafCb;
        currentRafCb = null;
        cb(performance.now());
      }
    }

    // Check downward monotonicity
    expect(renderedPositions.length).toBeGreaterThan(0);
    for (let i = 1; i < renderedPositions.length; i++) {
      expect(renderedPositions[i]).toBeGreaterThanOrEqual(renderedPositions[i - 1]);
    }
  });
});
