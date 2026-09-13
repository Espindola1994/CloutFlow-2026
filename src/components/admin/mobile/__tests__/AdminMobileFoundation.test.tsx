import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdminMobileHeader } from "../AdminMobileHeader";
import { AdminBottomNavigation } from "../AdminBottomNavigation";
import { AdminMobileMoreSheet } from "../AdminMobileMoreSheet";
import { AdminShell } from "../../AdminShell";
import { AdminThemeProvider } from "../../theme/AdminThemeProvider";

// Mock next/navigation
const pushMock = vi.fn();
let mockSearchParams = new URLSearchParams();
let mockPathname = "/admin/dashboard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => mockPathname,
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<AdminThemeProvider>{ui}</AdminThemeProvider>);
}

describe("UI 5.1 — Admin Mobile & PWA Foundation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    mockPathname = "/admin/dashboard";
  });

  describe("AdminMobileHeader", () => {
    it("renders the contextual title matching the active tab", () => {
      const { rerender } = renderWithTheme(<AdminMobileHeader activeTab="dashboard" />);
      expect(screen.getByTestId("admin-mobile-header-title").textContent).toBe("Dashboard");

      rerender(<AdminThemeProvider><AdminMobileHeader activeTab="orders" /></AdminThemeProvider>);
      expect(screen.getByTestId("admin-mobile-header-title").textContent).toBe("Orders & Margins");

      rerender(<AdminThemeProvider><AdminMobileHeader activeTab="analytics" /></AdminThemeProvider>);
      expect(screen.getByTestId("admin-mobile-header-title").textContent).toBe("Analytics");

      rerender(<AdminThemeProvider><AdminMobileHeader activeTab="crm" /></AdminThemeProvider>);
      expect(screen.getByTestId("admin-mobile-header-title").textContent).toBe("CRM & Communication");

      rerender(<AdminThemeProvider><AdminMobileHeader activeTab="dropshield" /></AdminThemeProvider>);
      expect(screen.getByTestId("admin-mobile-header-title").textContent).toBe("Drop Shield 24/7");
    });

    it("renders the theme toggle button for dark/light modes", () => {
      renderWithTheme(<AdminMobileHeader activeTab="dashboard" />);
      const themeBtn = screen.getByRole("button", { name: /toggle admin theme/i });
      expect(themeBtn).toBeDefined();
    });
  });

  describe("AdminBottomNavigation", () => {
    it("renders the 5 destinations on mobile", () => {
      render(
        <AdminBottomNavigation
          activeTab="dashboard"
          onSelectTab={vi.fn()}
          onOpenMore={vi.fn()}
        />
      );

      expect(screen.getByTestId("admin-bottom-nav-dashboard")).toBeDefined();
      expect(screen.getByTestId("admin-bottom-nav-orders")).toBeDefined();
      expect(screen.getByTestId("admin-bottom-nav-analytics")).toBeDefined();
      expect(screen.getByTestId("admin-bottom-nav-crm")).toBeDefined();
      expect(screen.getByTestId("admin-bottom-nav-more")).toBeDefined();
    });

    it("marks the active destination with aria-current='page'", () => {
      const { rerender } = render(
        <AdminBottomNavigation
          activeTab="dashboard"
          onSelectTab={vi.fn()}
          onOpenMore={vi.fn()}
        />
      );

      expect(screen.getByTestId("admin-bottom-nav-dashboard").getAttribute("aria-current")).toBe("page");
      expect(screen.getByTestId("admin-bottom-nav-orders").getAttribute("aria-current")).toBeNull();

      rerender(
        <AdminBottomNavigation
          activeTab="orders"
          onSelectTab={vi.fn()}
          onOpenMore={vi.fn()}
        />
      );

      expect(screen.getByTestId("admin-bottom-nav-dashboard").getAttribute("aria-current")).toBeNull();
      expect(screen.getByTestId("admin-bottom-nav-orders").getAttribute("aria-current")).toBe("page");
    });

    it("marks 'More' as active when activeTab is outside the primary 4 destinations", () => {
      render(
        <AdminBottomNavigation
          activeTab="dropshield"
          onSelectTab={vi.fn()}
          onOpenMore={vi.fn()}
        />
      );

      expect(screen.getByTestId("admin-bottom-nav-more").getAttribute("aria-current")).toBe("page");
    });

    it("calls onSelectTab with the selected tab on click", () => {
      const handleSelectTab = vi.fn();
      render(
        <AdminBottomNavigation
          activeTab="dashboard"
          onSelectTab={handleSelectTab}
          onOpenMore={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId("admin-bottom-nav-analytics"));
      expect(handleSelectTab).toHaveBeenCalledWith("analytics");
    });

    it("calls onOpenMore when the More button is clicked", () => {
      const handleOpenMore = vi.fn();
      render(
        <AdminBottomNavigation
          activeTab="dashboard"
          onSelectTab={vi.fn()}
          onOpenMore={handleOpenMore}
        />
      );

      fireEvent.click(screen.getByTestId("admin-bottom-nav-more"));
      expect(handleOpenMore).toHaveBeenCalled();
    });
  });

  describe("AdminMobileMoreSheet", () => {
    it("does not render when isOpen is false", () => {
      render(
        <AdminMobileMoreSheet
          isOpen={false}
          onClose={vi.fn()}
          activeTab="dashboard"
          onSelectTab={vi.fn()}
          onLogout={vi.fn()}
        />
      );

      expect(screen.queryByTestId("admin-mobile-more-sheet")).toBeNull();
    });

    it("renders drawer with all additional modules when isOpen is true", () => {
      render(
        <AdminMobileMoreSheet
          isOpen={true}
          onClose={vi.fn()}
          activeTab="dashboard"
          onSelectTab={vi.fn()}
          onLogout={vi.fn()}
        />
      );

      expect(screen.getByTestId("admin-mobile-more-sheet")).toBeDefined();
      expect(screen.getByTestId("admin-more-item-live-world")).toBeDefined();
      expect(screen.getByTestId("admin-more-item-supplier-routing")).toBeDefined();
      expect(screen.getByTestId("admin-more-item-dropshield")).toBeDefined();
      expect(screen.getByTestId("admin-more-item-fulfillment")).toBeDefined();
      expect(screen.getByTestId("admin-more-item-growth")).toBeDefined();
      expect(screen.getByTestId("admin-more-item-blacklist")).toBeDefined();
      expect(screen.getByTestId("admin-more-item-infra")).toBeDefined();
    });

    it("closes when the close button is clicked", () => {
      const handleClose = vi.fn();
      render(
        <AdminMobileMoreSheet
          isOpen={true}
          onClose={handleClose}
          activeTab="dashboard"
          onSelectTab={vi.fn()}
          onLogout={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId("admin-more-close-btn"));
      expect(handleClose).toHaveBeenCalled();
    });

    it("closes when the backdrop is clicked", () => {
      const handleClose = vi.fn();
      render(
        <AdminMobileMoreSheet
          isOpen={true}
          onClose={handleClose}
          activeTab="dashboard"
          onSelectTab={vi.fn()}
          onLogout={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId("admin-more-backdrop"));
      expect(handleClose).toHaveBeenCalled();
    });

    it("closes when Escape key is pressed", () => {
      const handleClose = vi.fn();
      render(
        <AdminMobileMoreSheet
          isOpen={true}
          onClose={handleClose}
          activeTab="dashboard"
          onSelectTab={vi.fn()}
          onLogout={vi.fn()}
        />
      );

      fireEvent.keyDown(window, { key: "Escape" });
      expect(handleClose).toHaveBeenCalled();
    });

    it("calls onSelectTab and closes sheet when an item is selected", () => {
      const handleSelectTab = vi.fn();
      const handleClose = vi.fn();
      render(
        <AdminMobileMoreSheet
          isOpen={true}
          onClose={handleClose}
          activeTab="dashboard"
          onSelectTab={handleSelectTab}
          onLogout={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId("admin-more-item-fulfillment"));
      expect(handleSelectTab).toHaveBeenCalledWith("fulfillment");
      expect(handleClose).toHaveBeenCalled();
    });

    it("triggers onLogout when sign out button is clicked", () => {
      const handleLogout = vi.fn();
      const handleClose = vi.fn();
      render(
        <AdminMobileMoreSheet
          isOpen={true}
          onClose={handleClose}
          activeTab="dashboard"
          onSelectTab={vi.fn()}
          onLogout={handleLogout}
        />
      );

      fireEvent.click(screen.getByTestId("admin-more-logout-btn"));
      expect(handleClose).toHaveBeenCalled();
      expect(handleLogout).toHaveBeenCalled();
    });
  });

  describe("AdminShell Integration & Desktop Preservation", () => {
    it("renders desktop sidebar and mobile navigation components without mutating business logic", () => {
      render(<AdminShell />);

      // Desktop sidebar brand elements exist
      expect(screen.getAllByText("Clout").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Flow").length).toBeGreaterThan(0);

      // Mobile header and bottom navigation exist
      expect(screen.getByTestId("admin-mobile-header")).toBeDefined();
      expect(screen.getByTestId("admin-bottom-navigation")).toBeDefined();
    });

    it("updates URL query parameter on tab navigation without reloading page", () => {
      render(<AdminShell />);

      // Click Orders in bottom nav
      fireEvent.click(screen.getByTestId("admin-bottom-nav-orders"));

      expect(pushMock).toHaveBeenCalledWith("/admin/dashboard?tab=orders", { scroll: false });
    });
  });
});
