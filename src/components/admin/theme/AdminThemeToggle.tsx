"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useAdminTheme } from "./AdminThemeProvider";
import { AdminNeonIcon } from "../ui/AdminNeonIcon";

export function AdminThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useAdminTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to Light Premium" : "Switch to Dark Premium"}
      aria-label="Toggle Admin Theme"
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-[7px] text-[12px] font-medium transition-all cursor-pointer border ${
        isDark
          ? "bg-[var(--admin-card-hover)] border-[var(--admin-border)] text-[var(--admin-text)] hover:border-[var(--admin-primary-border)] hover:bg-[var(--admin-sidebar-secondary)]"
          : "bg-[var(--admin-card)] border-[var(--admin-border)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)]"
      } ${className || ""}`}
    >
      <div className="w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <AdminNeonIcon color="amber" icon={Sun} className="w-4 h-4" />
        ) : (
          <AdminNeonIcon color="cyan" icon={Moon} className="w-4 h-4" />
        )}
      </div>
      <span className="capitalize text-[11px] font-semibold tracking-wide">
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
}
