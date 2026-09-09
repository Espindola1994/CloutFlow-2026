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
});
