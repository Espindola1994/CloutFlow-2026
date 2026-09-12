import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminTooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function AdminTooltip({
  content,
  children,
  className,
  side = "top",
}: AdminTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sideClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-white border-x-transparent border-b-transparent border-t-[5px] border-x-[5px]",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-white border-x-transparent border-t-transparent border-b-[5px] border-x-[5px]",
    left: "left-full top-1/2 -translate-y-1/2 border-l-white border-y-transparent border-r-transparent border-l-[5px] border-y-[5px]",
    right: "right-full top-1/2 -translate-y-1/2 border-r-white border-y-transparent border-l-transparent border-r-[5px] border-y-[5px]",
  };

  return (
    <div
      className={cn("relative inline-flex items-center group", className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {children || (
        <span
          tabIndex={0}
          role="button"
          aria-label="More information"
          className="text-[#8A979D] hover:text-[#0F8F8A] transition-colors cursor-help p-0.5"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </span>
      )}

      {isOpen && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 pointer-events-none w-max max-w-[260px] px-3 py-2 text-[11.5px] leading-relaxed text-[#142126] bg-[#FFFFFF] border border-[#D9E2E3] rounded-[8px] shadow-[0_4px_16px_rgba(10,35,42,0.12)] animate-in fade-in zoom-in-95 duration-150",
            sideClasses[side]
          )}
        >
          {content}
          <div className={cn("absolute w-0 h-0 border-solid drop-shadow-[0_1px_1px_rgba(10,35,42,0.08)]", arrowClasses[side])} />
        </div>
      )}
    </div>
  );
}
