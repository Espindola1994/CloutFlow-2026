import React from "react";

interface VerifiedBadgeProps {
  platform: "instagram" | "tiktok" | "twitter" | "youtube";
  size?: number;
  className?: string;
}

export function VerifiedBadge({ platform, size = 16, className = "" }: VerifiedBadgeProps) {
  if (platform === "instagram") {
    return (
      <span
        className={`rounded-full bg-[#0095F6] text-white flex items-center justify-center shrink-0 ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
        aria-label="Verified"
      >
        <svg viewBox="0 0 24 24" className="w-[60%] h-[60%] fill-current" aria-hidden="true">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M19.707 6.293a1 1 0 010 1.414l-10 10a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 15.586 18.293 6.293a1 1 0 011.414 0z"
            fill="#FFFFFF"
          />
        </svg>
      </span>
    );
  }

  if (platform === "tiktok") {
    return (
      <span
        className={`rounded-full bg-[#20D5EC] text-white flex items-center justify-center shrink-0 ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
        aria-label="Verified"
      >
        <svg viewBox="0 0 24 24" className="w-[60%] h-[60%] fill-current" aria-hidden="true">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M19.707 6.293a1 1 0 010 1.414l-10 10a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 15.586 18.293 6.293a1 1 0 011.414 0z"
            fill="#FFFFFF"
          />
        </svg>
      </span>
    );
  }

  if (platform === "twitter") {
    return (
      <span
        className={`rounded-full bg-[#1D9BF0] text-white flex items-center justify-center shrink-0 ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
        aria-label="Verified"
      >
        <svg viewBox="0 0 24 24" className="w-[60%] h-[60%] fill-current" aria-hidden="true">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M19.707 6.293a1 1 0 010 1.414l-10 10a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 15.586 18.293 6.293a1 1 0 011.414 0z"
            fill="#FFFFFF"
          />
        </svg>
      </span>
    );
  }

  if (platform === "youtube") {
    return (
      <span
        className={`rounded-full bg-[#606060] text-white flex items-center justify-center shrink-0 ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
        aria-label="Verified"
      >
        <svg viewBox="0 0 24 24" className="w-[60%] h-[60%] fill-current" aria-hidden="true">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M19.707 6.293a1 1 0 010 1.414l-10 10a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 15.586 18.293 6.293a1 1 0 011.414 0z"
            fill="#FFFFFF"
          />
        </svg>
      </span>
    );
  }

  return null;
}
