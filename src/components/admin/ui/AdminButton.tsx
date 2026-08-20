import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary:
        "bg-[#0F8F8A] text-white border border-[#0B7A76] hover:bg-[#0B7A76] shadow-sm",
      secondary:
        "bg-[#FFFFFF] text-[#142126] border border-[#E3E8EA] hover:bg-[#FBFCFC] hover:border-[#D1D9DC] shadow-sm",
      outline:
        "bg-transparent text-[#0F8F8A] border border-[#0F8F8A] hover:bg-[#E7F5F4]",
      ghost:
        "bg-transparent text-[#65737A] border border-transparent hover:bg-[#F7F9FA] hover:text-[#142126]",
      danger:
        "bg-[#EF4444] text-white border border-[#DC2626] hover:bg-[#DC2626] shadow-sm",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-[12px]",
      md: "h-9 px-4 text-[13px]",
      lg: "h-10 px-5 text-[14px]",
      icon: "h-9 w-9 flex items-center justify-center p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[8px] font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#0F8F8A]/20 disabled:opacity-50 disabled:pointer-events-none select-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="w-4 h-4 mr-1.5 animate-spin opacity-70"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
AdminButton.displayName = "AdminButton";

export const AdminIconButton = forwardRef<HTMLButtonElement, AdminButtonProps>(
  ({ className, size = "icon", variant = "ghost", ...props }, ref) => {
    return (
      <AdminButton
        ref={ref}
        size={size}
        variant={variant}
        className={cn("rounded-[8px]", className)}
        {...props}
      />
    );
  }
);
AdminIconButton.displayName = "AdminIconButton";
