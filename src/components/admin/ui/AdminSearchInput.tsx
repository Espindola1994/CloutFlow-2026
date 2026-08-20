import React, { forwardRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminSearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const AdminSearchInput = forwardRef<HTMLInputElement, AdminSearchInputProps>(
  ({ className, value, onChange, onClear, placeholder = "Search...", ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full max-w-sm">
        <Search className="absolute left-3 w-4 h-4 text-[#8A979D] pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            "w-full h-9 pl-9 pr-8 rounded-[8px] bg-[#FFFFFF] border border-[#E3E8EA] text-[#142126] text-[13px] placeholder:text-[#8A979D] focus:outline-none focus:border-[#0F8F8A] focus:ring-2 focus:ring-[#0F8F8A]/10 transition-all",
            className
          )}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 p-0.5 rounded text-[#8A979D] hover:text-[#142126] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }
);
AdminSearchInput.displayName = "AdminSearchInput";
