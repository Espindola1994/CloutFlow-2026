import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SettingsModule } from "../SettingsModule";
import { AdminThemeProvider } from "../../theme/AdminThemeProvider";

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

describe("UI 5.7 — Admin Settings Module", () => {
  const onLogoutMock = vi.fn();
  const onNavigateToTabMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. renders mobile Settings header, sections, and mobile category switcher", () => {
    renderWithTheme(
      <SettingsModule onLogout={onLogoutMock} onNavigateToTab={onNavigateToTabMock} />
    );

    expect(screen.getByTestId("admin-settings-module")).toBeDefined();
    expect(screen.getByTestId("admin-settings-mobile-nav")).toBeDefined();
    expect(screen.getByTestId("settings-nav-account")).toBeDefined();
    expect(screen.getByTestId("settings-nav-security")).toBeDefined();
    expect(screen.getByTestId("settings-nav-appearance")).toBeDefined();
    expect(screen.getByTestId("settings-nav-integrations")).toBeDefined();
    expect(screen.getByTestId("settings-nav-system")).toBeDefined();
  });

  it("2. desktop structure and all section cards are present in DOM", () => {
    renderWithTheme(
      <SettingsModule onLogout={onLogoutMock} onNavigateToTab={onNavigateToTabMock} />
    );

    expect(screen.getByTestId("settings-section-account")).toBeDefined();
    expect(screen.getByTestId("settings-section-security")).toBeDefined();
    expect(screen.getByTestId("settings-section-integrations")).toBeDefined();
    expect(screen.getByTestId("settings-section-appearance")).toBeDefined();
    expect(screen.getByTestId("settings-section-pwa")).toBeDefined();
    expect(screen.getByTestId("settings-section-logout")).toBeDefined();
  });

  it("3. switches mobile section categories when tab buttons are tapped", () => {
    renderWithTheme(
      <SettingsModule onLogout={onLogoutMock} onNavigateToTab={onNavigateToTabMock} />
    );

    // Switch to Security
    fireEvent.click(screen.getByTestId("settings-nav-security"));
    expect(screen.getByText("Security & Authentication")).toBeDefined();

    // Switch to Appearance
    fireEvent.click(screen.getByTestId("settings-nav-appearance"));
    expect(screen.getByText("Theme Appearance")).toBeDefined();

    // Switch to PWA & System
    fireEvent.click(screen.getByTestId("settings-nav-system"));
    expect(screen.getByText("PWA Mobile Experience")).toBeDefined();
  });

  it("4. inputs use existing handlers and updates profile state", async () => {
    renderWithTheme(
      <SettingsModule onLogout={onLogoutMock} onNavigateToTab={onNavigateToTabMock} />
    );

    const nameInput = screen.getByLabelText("Display Name") as HTMLInputElement;
    const emailInput = screen.getByLabelText("Email Address") as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: "Lead Administrator" } });
    fireEvent.change(emailInput, { target: { value: "lead@cloutflow.co" } });

    expect(nameInput.value).toBe("Lead Administrator");
    expect(emailInput.value).toBe("lead@cloutflow.co");

    // Click Save
    const saveBtn = screen.getByRole("button", { name: /save profile changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/profile information updated successfully/i)).toBeDefined();
    });
  });

  it("5. validates password confirmation and displays errors on mismatch", async () => {
    renderWithTheme(
      <SettingsModule onLogout={onLogoutMock} onNavigateToTab={onNavigateToTabMock} />
    );

    const currentPass = screen.getByLabelText("Current Password");
    const newPass = screen.getByLabelText("New Password");
    const confirmPass = screen.getByLabelText("Confirm New Password");

    fireEvent.change(currentPass, { target: { value: "old_secure_pass" } });
    fireEvent.change(newPass, { target: { value: "new_password_123" } });
    fireEvent.change(confirmPass, { target: { value: "different_password_123" } });

    const updateBtn = screen.getByRole("button", { name: /update password/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeDefined();
    });
  });

  it("6. validates password minimum length requirement", async () => {
    renderWithTheme(
      <SettingsModule onLogout={onLogoutMock} onNavigateToTab={onNavigateToTabMock} />
    );

    const currentPass = screen.getByLabelText("Current Password");
    const newPass = screen.getByLabelText("New Password");
    const confirmPass = screen.getByLabelText("Confirm New Password");

    fireEvent.change(currentPass, { target: { value: "old_pass" } });
    fireEvent.change(newPass, { target: { value: "short" } });
    fireEvent.change(confirmPass, { target: { value: "short" } });

    const updateBtn = screen.getByRole("button", { name: /update password/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(screen.getByText(/new password must be at least 8 characters/i)).toBeDefined();
    });
  });

  it("7. 2FA security status card displays enrolled TOTP state", () => {
    renderWithTheme(
      <SettingsModule onLogout={onLogoutMock} onNavigateToTab={onNavigateToTabMock} />
    );

    expect(screen.getByText("Google Authenticator (TOTP)")).toBeDefined();
    expect(screen.getByText(/enrolled & enforced/i)).toBeDefined();
  });

  it("8. logout button triggers onLogout handler", () => {
    renderWithTheme(
      <SettingsModule onLogout={onLogoutMock} onNavigateToTab={onNavigateToTabMock} />
    );

    const logoutBtn = screen.getByTestId("settings-logout-button");
    fireEvent.click(logoutBtn);

    expect(onLogoutMock).toHaveBeenCalledTimes(1);
  });

  describe("UI 5.7.1 Dual PWA App Installations", () => {
    it("9. renders both Public App and Admin App cards independently in PWA & System section", () => {
      renderWithTheme(
        <SettingsModule onLogout={onLogoutMock} onNavigateToTab={onNavigateToTabMock} />
      );

      // Check section & cards
      expect(screen.getByTestId("settings-section-pwa")).toBeDefined();
      expect(screen.getByTestId("pwa-card-public")).toBeDefined();
      expect(screen.getByTestId("pwa-card-admin")).toBeDefined();

      // Check Public card content
      const publicCard = screen.getByTestId("pwa-card-public");
      expect(publicCard.textContent).toContain("CloutFlow");
      expect(publicCard.textContent).toContain("Customer-facing CloutFlow app.");
      expect(publicCard.textContent).toContain("Scope:");
      expect(publicCard.textContent).toContain("/");
      expect(screen.getByTestId("install-public-app-btn")).toBeDefined();

      // Check Admin card content
      const adminCard = screen.getByTestId("pwa-card-admin");
      expect(adminCard.textContent).toContain("CloutFlow Admin");
      expect(adminCard.textContent).toContain("Private administration app.");
      expect(adminCard.textContent).toContain("Scope:");
      expect(adminCard.textContent).toContain("/admin/");
      expect(screen.getByTestId("install-admin-app-btn")).toBeDefined();
    });

    it("10. Install Public App button navigates to public context with ?install=public rather than triggering admin prompt", () => {
      const originalLocation = window.location;
      let targetHref = "/admin/dashboard";
      Object.defineProperty(window, "location", {
        configurable: true,
        value: {
          ...originalLocation,
          get href() {
            return targetHref;
          },
          set href(val: string) {
            targetHref = val;
          },
        },
      });

      renderWithTheme(
        <SettingsModule onLogout={onLogoutMock} onNavigateToTab={onNavigateToTabMock} />
      );

      const installPublicBtn = screen.getByTestId("install-public-app-btn");
      fireEvent.click(installPublicBtn);

      expect(targetHref).toBe("/?install=public");
      Object.defineProperty(window, "location", {
        configurable: true,
        value: originalLocation,
      });
    });

    it("11. Install Admin App button stays in admin context and does not navigate away", () => {
      const originalLocation = window.location;
      let targetHref = "/admin/dashboard";
      Object.defineProperty(window, "location", {
        configurable: true,
        value: {
          ...originalLocation,
          get href() {
            return targetHref;
          },
          set href(val: string) {
            targetHref = val;
          },
        },
      });

      renderWithTheme(
        <SettingsModule onLogout={onLogoutMock} onNavigateToTab={onNavigateToTabMock} />
      );

      const installAdminBtn = screen.getByTestId("install-admin-app-btn");
      fireEvent.click(installAdminBtn);

      // Must remain in admin context
      expect(targetHref).toBe("/admin/dashboard");
      Object.defineProperty(window, "location", {
        configurable: true,
        value: originalLocation,
      });
    });
  });
});
