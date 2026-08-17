import React from "react";
import { Lock } from "lucide-react";

interface RestrictedProfileNoticeProps {
  title: string;
  description: string;
  className?: string;
}

export function RestrictedProfileNotice({
  title,
  description,
  className = "",
}: RestrictedProfileNoticeProps) {
  return (
    <div
      className={`w-full bg-[#F7F7F7] border border-[#E8E8E8] rounded-[10px] p-[10px_12px] flex items-start gap-[8px] select-none text-left ${className}`}
    >
      <Lock size={16} strokeWidth={2} className="text-[#64748B] shrink-0 mt-[2px]" />
      <div className="min-w-0 flex-1">
        <strong className="text-[13px] font-[600] text-[#111827] block leading-tight">
          {title}
        </strong>
        <p className="text-[12px] font-[400] text-[#64748B] leading-[1.3] mt-[3px] m-0">
          {description}
        </p>
      </div>
    </div>
  );
}
