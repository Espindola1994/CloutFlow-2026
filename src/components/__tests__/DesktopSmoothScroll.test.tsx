import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { DesktopSmoothScroll } from "@/components/DesktopSmoothScroll";

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
});
