import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import instagramIcon from "@/assets/home-icons-vector/instagram.svg";
import tiktokIcon from "@/assets/home-icons-vector/tiktok.svg";
import twitterIcon from "@/assets/home-icons-vector/twitter.svg";
import youtubeIcon from "@/assets/home-icons-vector/youtube.svg";

export type PlatformType = "instagram" | "tiktok" | "x" | "twitter" | "youtube" | string;

export interface PlatformIconProps extends React.HTMLAttributes<HTMLDivElement> {
  platform: PlatformType;
  size?: number;
  showBackground?: boolean;
}

const HOME_PLATFORMS = {
  instagram: {
    icon: instagramIcon,
    label: "Instagram",
    fallbackColor: "#E1306C",
  },
  tiktok: {
    icon: tiktokIcon,
    label: "TikTok",
    fallbackColor: "#050608",
  },
  twitter: {
    icon: twitterIcon,
    label: "X (Twitter)",
    fallbackColor: "#11161D",
  },
  x: {
    icon: twitterIcon,
    label: "X (Twitter)",
    fallbackColor: "#11161D",
  },
  youtube: {
    icon: youtubeIcon,
    label: "YouTube",
    fallbackColor: "#CC0000",
  },
} as const;

export function PlatformIcon({
  platform,
  size = 20,
  showBackground = true,
  className,
  ...props
}: PlatformIconProps) {
  const normalized = platform.toLowerCase();
  const config = HOME_PLATFORMS[normalized as keyof typeof HOME_PLATFORMS];

  if (!config) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center font-bold text-[10px] uppercase rounded-full bg-[#E3E8EA] text-[#65737A] select-none",
          className
        )}
        style={{ width: size, height: size }}
        {...props}
      >
        {normalized.substring(0, 1)}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center shrink-0 select-none",
        className
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      <Image
        src={config.icon}
        alt={config.label}
        width={size}
        height={size}
        className="w-full h-full object-contain pointer-events-none"
      />
    </div>
  );
}

export interface PlatformBadgeProps extends Omit<PlatformIconProps, "size" | "showBackground"> {
  label?: string;
}

export function PlatformBadge({
  platform,
  label,
  className,
  ...props
}: PlatformBadgeProps) {
  const normalized = platform.toLowerCase();
  const displayLabel = label || (normalized === "twitter" ? "X (Twitter)" : normalized === "x" ? "X" : normalized.charAt(0).toUpperCase() + normalized.slice(1));
  
  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] bg-[#FFFFFF] border border-[#E3E8EA] text-[12px] font-medium text-[#142126] shadow-xs select-none",
        className
      )}
      {...props}
    >
      <PlatformIcon platform={normalized} size={16} />
      <span>{displayLabel}</span>
    </div>
  );
}

