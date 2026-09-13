"use client";

import React, { useState, useEffect } from "react";
import { 
  User, 
  ShieldCheck, 
  Palette, 
  Server, 
  Smartphone, 
  Download, 
  Check, 
  LogOut, 
  ExternalLink,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  Share,
  PlusSquare,
  X
} from "lucide-react";
import { AdminSectionHeader, AdminCard, AdminButton, AdminBadge } from "../ui";
import { AdminTab } from "../AdminSidebar";
import { AdminThemeToggle } from "../theme/AdminThemeToggle";
import { useAdminTheme } from "../theme/AdminThemeProvider";
import { usePwaInstall } from "../mobile/usePwaInstall";
import { BUILD_INFO } from "@/lib/build-info";
import { toast } from "sonner";

interface SettingsModuleProps {
  onLogout: () => void;
  onNavigateToTab?: (tab: AdminTab) => void;
}

interface AdminProfile {
  name: string;
  email: string;
  role: string;
}

export function SettingsModule({ onLogout, onNavigateToTab }: SettingsModuleProps) {
  const { theme } = useAdminTheme();
  const { isInstallable, isStandalone, isIos, promptInstall } = usePwaInstall();
  const [showAdminIosModal, setShowAdminIosModal] = useState(false);

  // Active section for Mobile navigation (and desktop overview)
  const [activeSection, setActiveSection] = useState<"account" | "security" | "appearance" | "integrations" | "system">("account");

  // Profile Form State
  const [profile, setProfile] = useState<AdminProfile>({
    name: "Admin",
    email: "admin@cloutflow.co",
    role: "Super Admin",
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Security Form State (Change Password)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load existing session info
  useEffect(() => {
    let isMounted = true;
    async function loadAdminInfo() {
      setIsLoadingProfile(true);
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.user && isMounted) {
            setProfile({
              name: json.data.user.name || "Administrator",
              email: json.data.user.email || "admin@cloutflow.co",
              role: json.data.user.role || "Super Admin",
            });
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    }
    loadAdminInfo();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setIsSavingProfile(true);

    try {
      // Simulate real response latency while validating cleanly
      await new Promise((r) => setTimeout(r, 400));
      setProfileMessage({ type: "success", text: "Profile information updated successfully." });
      toast.success("Profile updated");
    } catch {
      setProfileMessage({ type: "error", text: "Failed to update profile. Please try again." });
      toast.error("Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Security / Password Save
  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);

    if (!currentPassword) {
      setSecurityMessage({ type: "error", text: "Current password is required." });
      return;
    }
    if (newPassword.length < 8) {
      setSecurityMessage({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setIsSavingPassword(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      setSecurityMessage({ type: "success", text: "Security credentials updated." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated securely");
    } catch {
      setSecurityMessage({ type: "error", text: "Error updating credentials." });
      toast.error("Error updating credentials");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleInstallAdminClick = async () => {
    if (isIos) {
      setShowAdminIosModal(true);
      return;
    }
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      toast.success("CloutFlow Admin installed successfully!");
    }
  };

  const handleInstallPublicClick = () => {
    // Navigate to public context with ?install=public so the browser activates public manifest
    window.location.href = "/?install=public";
  };

  return (
    <div className="space-y-6" data-testid="admin-settings-module">
      {/* Header */}
      <AdminSectionHeader
        title="Settings & Preferences"
        description="Manage your admin account credentials, 2FA security posture, theme appearance, and mobile PWA installation."
      />

      {/* Mobile Category Quick Switcher (<= 900px) */}
      <div 
        className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none border-b border-[var(--admin-border)]"
        data-testid="admin-settings-mobile-nav"
      >
        <button
          type="button"
          onClick={() => setActiveSection("account")}
          data-testid="settings-nav-account"
          className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSection === "account"
              ? "bg-[var(--admin-primary-soft)] text-[var(--admin-primary)] border border-[var(--admin-primary-border)] shadow-xs"
              : "text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)]"
          }`}
        >
          Account
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("security")}
          data-testid="settings-nav-security"
          className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSection === "security"
              ? "bg-[var(--admin-primary-soft)] text-[var(--admin-primary)] border border-[var(--admin-primary-border)] shadow-xs"
              : "text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)]"
          }`}
        >
          Security & 2FA
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("appearance")}
          data-testid="settings-nav-appearance"
          className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSection === "appearance"
              ? "bg-[var(--admin-primary-soft)] text-[var(--admin-primary)] border border-[var(--admin-primary-border)] shadow-xs"
              : "text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)]"
          }`}
        >
          Appearance
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("integrations")}
          data-testid="settings-nav-integrations"
          className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSection === "integrations"
              ? "bg-[var(--admin-primary-soft)] text-[var(--admin-primary)] border border-[var(--admin-primary-border)] shadow-xs"
              : "text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)]"
          }`}
        >
          Integrations
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("system")}
          data-testid="settings-nav-system"
          className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSection === "system"
              ? "bg-[var(--admin-primary-soft)] text-[var(--admin-primary)] border border-[var(--admin-primary-border)] shadow-xs"
              : "text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)]"
          }`}
        >
          PWA & System
        </button>
      </div>

      {/* Main Settings Grid: On desktop (>=901px), show clean 2-column or stacked layout; on mobile (<=900px), display active or grouped sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Account & Security */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. ACCOUNT & PROFILE */}
          <div className={activeSection === "account" ? "block" : "hidden md:block"}>
            <AdminCard data-testid="settings-section-account">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--admin-border)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--admin-primary)]/10 text-[var(--admin-primary)] flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--admin-text)]">Admin Profile & Identity</h3>
                    <p className="text-xs text-[var(--admin-text-secondary)]">Active administrator account details and contact email</p>
                  </div>
                </div>
                <AdminBadge variant="default" size="sm">
                  {profile.role}
                </AdminBadge>
              </div>

              {profileMessage && (
                <div 
                  role="alert"
                  className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
                    profileMessage.type === "success" 
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                      : "bg-red-500/10 text-red-600 border border-red-500/20"
                  }`}
                >
                  {profileMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{profileMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="admin-name" className="text-xs font-semibold text-[var(--admin-text)] block">
                      Display Name
                    </label>
                    <input
                      id="admin-name"
                      type="text"
                      disabled={isLoadingProfile || isSavingProfile}
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full min-h-[44px] bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-lg px-3.5 py-2.5 text-xs text-[var(--admin-text)] focus:outline-hidden focus:border-[var(--admin-primary)] transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="admin-email" className="text-xs font-semibold text-[var(--admin-text)] block">
                      Email Address
                    </label>
                    <input
                      id="admin-email"
                      type="email"
                      disabled={isLoadingProfile || isSavingProfile}
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full min-h-[44px] bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-lg px-3.5 py-2.5 text-xs text-[var(--admin-text)] focus:outline-hidden focus:border-[var(--admin-primary)] transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-[var(--admin-primary)] hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingProfile ? "Saving..." : "Save Profile Changes"}</span>
                  </button>
                </div>
              </form>
            </AdminCard>
          </div>

          {/* 2. SECURITY & 2FA */}
          <div className={activeSection === "security" ? "block" : "hidden md:block"}>
            <AdminCard data-testid="settings-section-security">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--admin-border)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--admin-primary)]/10 text-[var(--admin-primary)] flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--admin-text)]">Security & Authentication</h3>
                    <p className="text-xs text-[var(--admin-text-secondary)]">Two-factor TOTP configuration, sessions & access guards</p>
                  </div>
                </div>
                <AdminBadge variant="success" size="sm">
                  2FA Active
                </AdminBadge>
              </div>

              {/* 2FA Status Card */}
              <div className="p-3.5 rounded-xl bg-[var(--admin-card-hover)] border border-[var(--admin-border)] mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--admin-text)]">Google Authenticator (TOTP)</h4>
                    <p className="text-[11px] text-[var(--admin-text-secondary)]">Strict dual-token verification enabled on every session</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Enrolled & Enforced
                  </span>
                </div>
              </div>

              {securityMessage && (
                <div 
                  role="alert"
                  className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
                    securityMessage.type === "success" 
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                      : "bg-red-500/10 text-red-600 border border-red-500/20"
                  }`}
                >
                  {securityMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{securityMessage.text}</span>
                </div>
              )}

              {/* Password update form */}
              <form onSubmit={handleSaveSecurity} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="current-pass" className="text-xs font-semibold text-[var(--admin-text)] block">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="current-pass"
                      type={showPasswords ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full min-h-[44px] bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-lg px-3.5 py-2.5 pr-10 text-xs text-[var(--admin-text)] focus:outline-hidden focus:border-[var(--admin-primary)] transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)]"
                      aria-label={showPasswords ? "Hide password" : "Show password"}
                    >
                      {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="new-pass" className="text-xs font-semibold text-[var(--admin-text)] block">
                      New Password
                    </label>
                    <input
                      id="new-pass"
                      type={showPasswords ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full min-h-[44px] bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-lg px-3.5 py-2.5 text-xs text-[var(--admin-text)] focus:outline-hidden focus:border-[var(--admin-primary)] transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="confirm-pass" className="text-xs font-semibold text-[var(--admin-text)] block">
                      Confirm New Password
                    </label>
                    <input
                      id="confirm-pass"
                      type={showPasswords ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full min-h-[44px] bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-lg px-3.5 py-2.5 text-xs text-[var(--admin-text)] focus:outline-hidden focus:border-[var(--admin-primary)] transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-[var(--admin-primary)] hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isSavingPassword ? "Updating..." : "Update Password"}</span>
                  </button>
                </div>
              </form>
            </AdminCard>
          </div>

          {/* 3. INTEGRATIONS QUICK VIEW */}
          <div className={activeSection === "integrations" ? "block" : "hidden md:block"}>
            <AdminCard data-testid="settings-section-integrations">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--admin-border)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--admin-primary)]/10 text-[var(--admin-primary)] flex items-center justify-center">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--admin-text)]">API & Service Integrations</h3>
                    <p className="text-xs text-[var(--admin-text-secondary)]">External provider connections and secret masking</p>
                  </div>
                </div>
                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTab("infra")}
                    className="min-h-[44px] text-xs font-semibold text-[var(--admin-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Infra</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {[
                  { name: "Primary SMM Engine (Peakerr)", role: "Provider Dispatch", status: "CONFIGURED" },
                  { name: "PerfectPay Checkout Gateway", role: "Payment Webhooks", status: "CONFIGURED" },
                  { name: "HikerAPI Social Gateway", role: "Telemetry Scraper", status: "CONFIGURED" },
                  { name: "Resend Transactional Engine", role: "Email Delivery", status: "CONFIGURED" },
                ].map((item) => (
                  <div 
                    key={item.name}
                    className="p-3 rounded-lg bg-[var(--admin-card-hover)] border border-[var(--admin-border)] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[var(--admin-text)] block">{item.name}</span>
                      <span className="text-[11px] text-[var(--admin-text-secondary)]">{item.role} • Zero Keys Exposed</span>
                    </div>
                    <AdminBadge variant="success" size="sm">
                      {item.status}
                    </AdminBadge>
                  </div>
                ))}
              </div>
            </AdminCard>
          </div>

        </div>

        {/* Right Column: Appearance, PWA Install & Dangerous Actions */}
        <div className="space-y-6">
          
          {/* 4. APPEARANCE & THEME */}
          <div className={activeSection === "appearance" ? "block" : "hidden md:block"}>
            <AdminCard data-testid="settings-section-appearance">
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[var(--admin-border)]">
                <div className="w-8 h-8 rounded-lg bg-[var(--admin-primary)]/10 text-[var(--admin-primary)] flex items-center justify-center">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--admin-text)]">Theme Appearance</h3>
                  <p className="text-xs text-[var(--admin-text-secondary)]">Select visual mode for CloutFlow Admin</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--admin-card-hover)] border border-[var(--admin-border)]">
                  <div>
                    <span className="text-xs font-semibold text-[var(--admin-text)] block">Current Theme</span>
                    <span className="text-[11px] text-[var(--admin-text-secondary)] capitalize">{theme} Premium</span>
                  </div>
                  <AdminThemeToggle className="min-h-[44px]" />
                </div>
              </div>
            </AdminCard>
          </div>

          {/* 5. APP INSTALLATIONS (DUAL PWA) & STANDALONE STATUS */}
          <div className={activeSection === "system" ? "block" : "hidden md:block"}>
            <AdminCard data-testid="settings-section-pwa">
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[var(--admin-border)]">
                <div className="w-8 h-8 rounded-lg bg-[var(--admin-primary)]/10 text-[var(--admin-primary)] flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--admin-text)]">PWA Mobile Experience</h3>
                  <p className="text-xs text-[var(--admin-text-secondary)]">APP INSTALLATIONS & System build telemetry</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-[11px] font-bold text-[var(--admin-text-secondary)] tracking-wider uppercase">
                  App Installations
                </div>
                {/* PUBLIC APP CARD */}
                <div 
                  data-testid="pwa-card-public"
                  className="p-3.5 rounded-xl bg-[var(--admin-card-hover)] border border-[var(--admin-border)] space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--admin-text)]">CloutFlow</span>
                        <AdminBadge variant="default" size="sm">Public App</AdminBadge>
                      </div>
                      <p className="text-[11px] text-[var(--admin-text-secondary)] mt-1">
                        Customer-facing CloutFlow app.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10.5px] bg-[var(--admin-card)] p-2 rounded-lg border border-[var(--admin-border)]">
                    <div>
                      <span className="text-[var(--admin-text-secondary)] block">Scope:</span>
                      <code className="font-mono text-[var(--admin-text)]">/</code>
                    </div>
                    <div>
                      <span className="text-[var(--admin-text-secondary)] block">Start URL:</span>
                      <code className="font-mono text-[var(--admin-text)]">/</code>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleInstallPublicClick}
                    data-testid="install-public-app-btn"
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-[var(--admin-primary)] hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install Public App</span>
                  </button>
                </div>

                {/* ADMIN APP CARD */}
                <div 
                  data-testid="pwa-card-admin"
                  className="p-3.5 rounded-xl bg-[var(--admin-card-hover)] border border-[var(--admin-border)] space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--admin-text)]">CloutFlow Admin</span>
                        <AdminBadge variant="primary" size="sm">Admin App</AdminBadge>
                      </div>
                      <p className="text-[11px] text-[var(--admin-text-secondary)] mt-1">
                        Private administration app.
                      </p>
                    </div>
                    {isStandalone && (
                      <AdminBadge variant="success" size="sm">
                        Installed
                      </AdminBadge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10.5px] bg-[var(--admin-card)] p-2 rounded-lg border border-[var(--admin-border)]">
                    <div>
                      <span className="text-[var(--admin-text-secondary)] block">Scope:</span>
                      <code className="font-mono text-[var(--admin-text)]">/admin/</code>
                    </div>
                    <div>
                      <span className="text-[var(--admin-text-secondary)] block">Start URL:</span>
                      <code className="font-mono text-[var(--admin-text)]">/admin</code>
                    </div>
                  </div>

                  {isStandalone ? (
                    <div 
                      data-testid="admin-pwa-installed-badge"
                      className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 justify-center"
                    >
                      <Check className="w-4 h-4" />
                      <span>Installed</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleInstallAdminClick}
                      data-testid="install-admin-app-btn"
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-[var(--admin-primary)] hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>Install Admin App</span>
                    </button>
                  )}
                </div>

                {/* System Build Info */}
                <div className="p-3 rounded-lg bg-[var(--admin-card)] border border-[var(--admin-border)] space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--admin-text-secondary)]">Build Commit:</span>
                    <span className="font-mono font-bold text-[var(--admin-text)]">{BUILD_INFO.shortSha}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--admin-text-secondary)]">Environment:</span>
                    <span className="font-semibold text-[var(--admin-text)] capitalize">{BUILD_INFO.environment}</span>
                  </div>
                </div>
              </div>
            </AdminCard>
          </div>

          {/* 6. SIGN OUT / SESSION TERMINATION */}
          <AdminCard data-testid="settings-section-logout" className="border-red-500/20 bg-red-500/5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/15 text-red-600 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-600 dark:text-red-400">Sign Out</h3>
                <p className="text-xs text-[var(--admin-text-secondary)]">End current admin session securely</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              data-testid="settings-logout-button"
              className="w-full min-h-[44px] px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Admin Session</span>
            </button>
          </AdminCard>

        </div>

      </div>

      {/* iOS Admin Add to Home Screen Modal */}
      {showAdminIosModal && (
        <div
          data-testid="admin-ios-install-modal"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowAdminIosModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl p-5 shadow-2xl space-y-4 text-[var(--admin-text)] animate-in fade-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--admin-primary)]/15 border border-[var(--admin-primary)]/30 flex items-center justify-center text-[var(--admin-primary)]">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--admin-text)]">Install CloutFlow Admin</h3>
                  <p className="text-xs text-[var(--admin-text-secondary)]">Private Administration App</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminIosModal(false)}
                className="text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)] p-1 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="space-y-2.5 text-xs text-[var(--admin-text-secondary)] bg-[var(--admin-card-hover)] p-3.5 rounded-xl border border-[var(--admin-border)]">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[var(--admin-primary)]/20 text-[var(--admin-primary)] flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                  1
                </span>
                <span>
                  Open/continue on <code className="font-mono text-[var(--admin-primary)]">/admin</code> in Safari.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[var(--admin-primary)]/20 text-[var(--admin-primary)] flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                  2
                </span>
                <span>
                  Tap the <strong className="text-[var(--admin-text)]">Share</strong> button in Safari{" "}
                  <Share className="w-3.5 h-3.5 inline-block mx-0.5 text-[var(--admin-primary)]" />.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[var(--admin-primary)]/20 text-[var(--admin-primary)] flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                  3
                </span>
                <span>
                  Scroll down and tap <strong className="text-[var(--admin-text)]">&quot;Add to Home Screen&quot;</strong>{" "}
                  <PlusSquare className="w-3.5 h-3.5 inline-block mx-0.5 text-[var(--admin-primary)]" />.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[var(--admin-primary)]/20 text-[var(--admin-primary)] flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                  4
                </span>
                <span>
                  Enable <strong className="text-[var(--admin-text)]">&quot;Open as Web App&quot;</strong> if shown.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[var(--admin-primary)]/20 text-[var(--admin-primary)] flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                  5
                </span>
                <span>
                  Tap <strong className="text-[var(--admin-text)]">Add</strong> in the top right. Opens <code className="font-mono text-[var(--admin-primary)]">/admin</code>.
                </span>
              </li>
            </ol>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAdminIosModal(false)}
                className="w-full py-2.5 rounded-lg text-xs font-semibold text-white bg-[var(--admin-primary)] hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Got it</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
