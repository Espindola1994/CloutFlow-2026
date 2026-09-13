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
});
