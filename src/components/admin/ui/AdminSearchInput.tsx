import React, { forwardRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminNeonIcon } from "./AdminNeonIcon";

export interface AdminSearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const AdminSearchInput = forwardRef<HTMLInputElement, AdminSearchInputProps>(
  ({ className, value, onChange, onClear, placeholder = "Search...", ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full max-w-sm">
        <AdminNeonIcon color="cyan" icon={Search} className="absolute left-3 w-4 h-4 pointer-events-none opacity-80" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            "w-full h-9 pl-9 pr-8 rounded-[8px] bg-[var(--admin-card)] border border-[var(--admin-border)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-muted)] focus:outline-none focus:border-[var(--admin-primary)] focus:ring-2 focus:ring-[var(--admin-primary)]/10 transition-all",
            className
          )}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 p-0.5 rounded text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] transition-colors cursor-pointer"
          >
            <AdminNeonIcon color="amber" icon={X} className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }
);
AdminSearchInput.displayName = "AdminSearchInput";
