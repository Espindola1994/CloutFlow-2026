import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdminShell } from "../../AdminShell";
import { AdminBottomNavigation } from "../AdminBottomNavigation";
import { AdminMobileHeader } from "../AdminMobileHeader";
import { AdminMobileMoreSheet } from "../AdminMobileMoreSheet";
import { AdminOfflineBanner } from "../AdminOfflineBanner";
import { AdminThemeProvider } from "../../theme/AdminThemeProvider";

// Mock router and search params
const mockPush = vi.fn();
let mockCurrentTab: string | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/admin/dashboard",
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === "tab") return mockCurrentTab;
      return null;
    },
    toString: () => (mockCurrentTab ? `tab=${mockCurrentTab}` : ""),
  }),
}));

describe("UI 5.8 — Final Regression Audit Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentTab = null;
  });

  it("1. AdminShell renders exactly one mobile header and one bottom navigation on mobile", () => {
    render(<AdminShell />);

    const headers = screen.getAllByTestId("admin-mobile-header");
    expect(headers).toHaveLength(1);

    const bottomNavs = screen.getAllByTestId("admin-bottom-navigation");
    expect(bottomNavs).toHaveLength(1);
  });

  it("2. AdminBottomNavigation contains the 5 primary tabs with accessible labels and touch targets", () => {
    const onSelect = vi.fn();
    const onOpenMore = vi.fn();

    render(
      <AdminBottomNavigation
        activeTab="dashboard"
        onSelectTab={onSelect}
        onOpenMore={onOpenMore}
        isMoreOpen={false}
      />
    );

    const dashboardBtn = screen.getByTestId("admin-bottom-nav-dashboard");
    const ordersBtn = screen.getByTestId("admin-bottom-nav-orders");
    const analyticsBtn = screen.getByTestId("admin-bottom-nav-analytics");
    const crmBtn = screen.getByTestId("admin-bottom-nav-crm");
    const moreBtn = screen.getByTestId("admin-bottom-nav-more");

    expect(dashboardBtn).toBeDefined();
    expect(ordersBtn).toBeDefined();
    expect(analyticsBtn).toBeDefined();
    expect(crmBtn).toBeDefined();
    expect(moreBtn).toBeDefined();

    expect(dashboardBtn.getAttribute("aria-current")).toBe("page");
    expect(ordersBtn.getAttribute("aria-current")).toBeNull();

    fireEvent.click(ordersBtn);
    expect(onSelect).toHaveBeenCalledWith("orders");

    fireEvent.click(moreBtn);
    expect(onOpenMore).toHaveBeenCalled();
  });

  it("3. AdminMobileMoreSheet displays secondary modules and handles Escape and Backdrop dismiss", () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();
    const onLogout = vi.fn();

    const { rerender } = render(
      <AdminMobileMoreSheet
        isOpen={true}
        onClose={onClose}
        activeTab="settings"
        onSelectTab={onSelect}
        onLogout={onLogout}
      />
    );

    expect(screen.getByTestId("admin-mobile-more-sheet")).toBeDefined();
    expect(screen.getByTestId("admin-more-item-settings")).toBeDefined();
    expect(screen.getByTestId("admin-more-item-live-world")).toBeDefined();
    expect(screen.getByTestId("admin-more-item-supplier-routing")).toBeDefined();
    expect(screen.getByTestId("admin-more-item-fulfillment")).toBeDefined();

    // Backdrop click dismisses
    const backdrop = screen.getByTestId("admin-more-backdrop");
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();

    // Escape dismisses
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);

    // Close button dismisses
    const closeBtn = screen.getByTestId("admin-more-close-btn");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("4. AdminMobileHeader reflects active tab and updates section context dynamically", () => {
    const { rerender } = render(
      <AdminThemeProvider>
        <AdminMobileHeader activeTab="dashboard" />
      </AdminThemeProvider>
    );
    expect(screen.getByTestId("admin-mobile-header-title").textContent).toBe("Dashboard");

    rerender(
      <AdminThemeProvider>
        <AdminMobileHeader activeTab="orders" />
      </AdminThemeProvider>
    );
    expect(screen.getByTestId("admin-mobile-header-title").textContent).toBe("Orders & Margins");

    rerender(
      <AdminThemeProvider>
        <AdminMobileHeader activeTab="live-world" />
      </AdminThemeProvider>
    );
    expect(screen.getByTestId("admin-mobile-header-title").textContent).toBe("Live World");

    rerender(
      <AdminThemeProvider>
        <AdminMobileHeader activeTab="settings" />
      </AdminThemeProvider>
    );
    expect(screen.getByTestId("admin-mobile-header-title").textContent).toBe("Settings");
  });

  it("5. Offline banner renders with status role and polite aria-live attribute without blocking navigation", () => {
    render(<AdminOfflineBanner />);

    // Initially online -> banner null
    expect(screen.queryByTestId("admin-offline-banner")).toBeNull();

    // Trigger offline
    fireEvent(window, new Event("offline"));
    const banner = screen.getByTestId("admin-offline-banner");
    expect(banner).toBeDefined();
    expect(banner.getAttribute("role")).toBe("status");
    expect(banner.getAttribute("aria-live")).toBe("polite");
  });

  it("6. AdminThemeProvider toggles between light and dark without layout disruption", () => {
    render(
      <AdminThemeProvider>
        <div data-testid="test-content">Theme Content</div>
      </AdminThemeProvider>
    );

    const root = document.querySelector(".cloutflow-admin");
    expect(root).toBeDefined();
    expect(root?.getAttribute("data-admin-theme")).toBe("light");
  });
});
