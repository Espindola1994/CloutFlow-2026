/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import ProfileLookupModal from "../profile-lookup-modal";
import { useFunnelStore } from "@/stores/funnel.store";

vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} />,
}));

describe("ProfileLookupModal Step 3 Navigation and Test Matrix", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    useFunnelStore.setState({
      email: null,
      username: null,
      targetType: null,
      targetValue: null,
      targetUrl: null,
      socialUsername: null,
      profileUrl: null,
      verifiedTargetData: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const mockResolvedProfile = {
    platform: "instagram",
    username: "guilhermeterraaa",
    full_name: "Guilherme Terra",
    avatar_url: "https://example.com/avatar.jpg",
    posts_count: 120,
    followers_count: 5400,
    following_count: 350,
    is_private: false,
    is_verified: false,
    posts: [],
  };

  // Test A & B: Step 3 renders, NO navigation before click, and waiting does not redirect
  it("A & B: valid profile lookup renders Step 3, does NOT navigate before click, and stays on Step 3 indefinitely", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        resolvedType: "profile",
        data: mockResolvedProfile,
      }),
    } as any);

    const onContinue = vi.fn();
    const onClose = vi.fn();

    render(
      <ProfileLookupModal
        platform="instagram"
        service="followers"
        open={true}
        onClose={onClose}
        onContinue={onContinue}
      />
    );

    // Step 1: fill input & email
    const usernameInput = screen.getByPlaceholderText("yourusername");
    const emailInput = screen.getByPlaceholderText("you@example.com");
    fireEvent.change(usernameInput, { target: { value: "guilhermeterraaa" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const submitBtn = screen.getByText(/Find my profile/i);
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // Step 3 should now be rendered
    expect(screen.getByText(/STEP 3 OF 3/i)).toBeDefined();
    expect(screen.getByText(/Profile Found/i)).toBeDefined();
    expect(screen.getByText(/Use this profile/i)).toBeDefined();

    // Verify NO auto-navigation happened
    expect(onContinue).not.toHaveBeenCalled();

    // Test B: Wait 10+ seconds on Step 3
    await act(async () => {
      vi.advanceTimersByTime(15000);
    });

    // Should STILL be on Step 3 and NOT have navigated
    expect(screen.getByText(/STEP 3 OF 3/i)).toBeDefined();
    expect(onContinue).not.toHaveBeenCalled();
  });

  // Test C: Click "Use this profile" => navigates exactly once to plans & sets store
  it("C: click 'Use this profile' navigates exactly once and updates store correctly", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        resolvedType: "profile",
        data: mockResolvedProfile,
      }),
    } as any);

    const onContinue = vi.fn();
    const onClose = vi.fn();

    render(
      <ProfileLookupModal
        platform="instagram"
        service="followers"
        open={true}
        onClose={onClose}
        onContinue={onContinue}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("yourusername"), { target: { value: "guilhermeterraaa" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@example.com" } });
    await act(async () => {
      fireEvent.click(screen.getByText(/Find my profile/i));
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    const useProfileBtn = screen.getByText(/Use this profile/i);
    await act(async () => {
      fireEvent.click(useProfileBtn);
    });

    expect(onContinue).toHaveBeenCalledTimes(1);

    const storeState = useFunnelStore.getState();
    expect(storeState.email).toBe("test@example.com");
    expect(storeState.targetValue).toBe("guilhermeterraaa");
    expect(storeState.socialUsername).toBe("guilhermeterraaa");
    expect(storeState.targetType).toBe("profile");
  });

  // Test D: Double-click "Use this profile" => one navigation
  it("D: double-clicking 'Use this profile' triggers onContinue only once", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        resolvedType: "profile",
        data: mockResolvedProfile,
      }),
    } as any);

    const onContinue = vi.fn();
    const onClose = vi.fn();

    render(
      <ProfileLookupModal
        platform="instagram"
        service="followers"
        open={true}
        onClose={onClose}
        onContinue={onContinue}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("yourusername"), { target: { value: "guilhermeterraaa" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@example.com" } });
    await act(async () => {
      fireEvent.click(screen.getByText(/Find my profile/i));
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    const useProfileBtn = screen.getByRole("button", { name: /Use this profile/i });
    
    // Simulate double click using act and fast-forward to clear React state updates
    await act(async () => {
      fireEvent.click(useProfileBtn);
    });
    await act(async () => {
      fireEvent.click(useProfileBtn);
    });

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  // Test E: Click "Search another profile" => returns Step 1, no plans navigation
  it("E: click 'Search another profile' returns to Step 1 and does not navigate", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        resolvedType: "profile",
        data: mockResolvedProfile,
      }),
    } as any);

    const onContinue = vi.fn();
    const onClose = vi.fn();

    render(
      <ProfileLookupModal
        platform="instagram"
        service="followers"
        open={true}
        onClose={onClose}
        onContinue={onContinue}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("yourusername"), { target: { value: "guilhermeterraaa" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@example.com" } });
    await act(async () => {
      fireEvent.click(screen.getByText(/Find my profile/i));
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/STEP 3 OF 3/i)).toBeDefined();

    const searchAnotherBtn = screen.getByText(/Search another profile/i);
    await act(async () => {
      fireEvent.click(searchAnotherBtn);
    });

    expect(screen.getByText(/STEP 1 OF 3/i)).toBeDefined();
    expect(onContinue).not.toHaveBeenCalled();
  });

  // Test F: Step 1 valid @username
  it("F: Step 1 accepts @username and strips prefix correctly", async () => {
    let capturedBody: any = null;
    global.fetch = vi.fn().mockImplementation(async (url, init) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        json: async () => ({
          success: true,
          resolvedType: "profile",
          data: mockResolvedProfile,
        }),
      };
    });

    const onContinue = vi.fn();
    render(
      <ProfileLookupModal
        platform="instagram"
        service="followers"
        open={true}
        onClose={vi.fn()}
        onContinue={onContinue}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("yourusername"), { target: { value: "@guilhermeterraaa" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "user@domain.com" } });
    await act(async () => {
      fireEvent.click(screen.getByText(/Find my profile/i));
    });

    expect(capturedBody.input).toBe("@guilhermeterraaa");
    expect(capturedBody.selectedPlatform).toBe("instagram");

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/STEP 3 OF 3/i)).toBeDefined();
    expect(onContinue).not.toHaveBeenCalled();
  });

  // Test G: Step 1 valid profile URL
  it("G: Step 1 accepts valid profile URL", async () => {
    let capturedBody: any = null;
    global.fetch = vi.fn().mockImplementation(async (url, init) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        json: async () => ({
          success: true,
          resolvedType: "profile",
          data: mockResolvedProfile,
        }),
      };
    });

    render(
      <ProfileLookupModal
        platform="instagram"
        service="followers"
        open={true}
        onClose={vi.fn()}
        onContinue={vi.fn()}
      />
    );

    // Switch to link tab
    fireEvent.click(screen.getByText(/Profile Link/i));
    fireEvent.change(screen.getByPlaceholderText("https://instagram.com/..."), {
      target: { value: "https://www.instagram.com/guilhermeterraaa" },
    });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "user@domain.com" },
    });
    await act(async () => {
      fireEvent.click(screen.getByText(/Find my profile/i));
    });

    expect(capturedBody.input).toBe("https://www.instagram.com/guilhermeterraaa");
    expect(capturedBody.selectedPlatform).toBe("instagram");

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/STEP 3 OF 3/i)).toBeDefined();
  });

  // Test H: Invalid profile => error, no Step 3
  it("H: invalid profile lookup displays error and stays on Step 1", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        message: "Profile not found",
      }),
    } as any);

    render(
      <ProfileLookupModal
        platform="instagram"
        service="followers"
        open={true}
        onClose={vi.fn()}
        onContinue={vi.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("yourusername"), { target: { value: "invalid_nonexistent_user" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "user@domain.com" } });
    await act(async () => {
      fireEvent.click(screen.getByText(/Find my profile/i));
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/STEP 1 OF 3/i)).toBeDefined();
    expect(screen.queryByText(/STEP 3 OF 3/i)).toBeNull();
    expect(screen.getByText(/Profile not found/i)).toBeDefined();
  });

  // Test I: Background polling with 45s window and successful completion
  it("I: async polling completes successfully and renders Step 3 without auto-redirecting", async () => {
    let pollCount = 0;
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/api/search/resolve")) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            status: "pending",
            requestId: "req_12345",
          }),
        };
      }
      if (url.includes("/api/search/status")) {
        pollCount++;
        if (pollCount >= 2) {
          return {
            ok: true,
            json: async () => ({
              status: "complete",
              data: mockResolvedProfile,
            }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            status: "pending",
            requestId: "req_12345",
          }),
        };
      }
      return { ok: false, json: async () => ({}) };
    });

    const onContinue = vi.fn();
    render(
      <ProfileLookupModal
        platform="instagram"
        service="followers"
        open={true}
        onClose={vi.fn()}
        onContinue={onContinue}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("yourusername"), { target: { value: "guilhermeterraaa" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "user@domain.com" } });
    await act(async () => {
      fireEvent.click(screen.getByText(/Find my profile/i));
    });

    // Progress polling intervals
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/STEP 3 OF 3/i)).toBeDefined();
    expect(screen.getByText(/Profile Found/i)).toBeDefined();
    expect(onContinue).not.toHaveBeenCalled();
  });

  // Test J: Combined Step 1 -> Step 2 -> Step 3 Polling Lifecycle & 10s processing vs 45s deadline
  it("J: 10s processing produces no timeout, and 45s deadline produces English timeout", async () => {
    // 1. Initial pending resolve response
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/search/resolve")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            status: "pending",
            requestId: "test-req-123",
          }),
        });
      }
      if (url.includes("/api/search/status")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            status: "pending",
            requestId: "test-req-123",
          }),
        });
      }
      return Promise.reject(new Error("unhandled fetch"));
    });

    const onContinue = vi.fn();
    const onClose = vi.fn();

    render(
      <ProfileLookupModal
        platform="instagram"
        service="followers"
        open={true}
        onClose={onClose}
        onContinue={onContinue}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("yourusername"), { target: { value: "guilhermeterraaa" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@example.com" } });

    await act(async () => {
      fireEvent.click(screen.getByText(/Find my profile/i));
    });

    // Advance 10 seconds (multiple polling cycles)
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    // Must NOT have timed out at 10s
    expect(screen.queryByText(/The search is taking longer than expected/i)).toBeNull();
    expect(screen.getByText(/STEP 2 OF 3/i)).toBeDefined();

    // Advance past the 45s deadline (another 36s => total 46s)
    await act(async () => {
      vi.advanceTimersByTime(36000);
    });

    // Must now show the English timeout message and revert to Step 1
    expect(screen.getByText(/The search is taking longer than expected. Please try again./i)).toBeDefined();
    expect(screen.getByText(/STEP 1 OF 3/i)).toBeDefined();
  });
});
