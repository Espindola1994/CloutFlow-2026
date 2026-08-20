import React from "react";
import { cn } from "@/lib/utils";
import { 
  FaInstagram, 
  FaTiktok, 
  FaXTwitter, 
  FaYoutube 
} from "react-icons/fa6";

export type PlatformType = "instagram" | "tiktok" | "x" | "youtube" | string;

export interface PlatformIconProps extends React.HTMLAttributes<HTMLDivElement> {
  platform: PlatformType;
  size?: number;
  showBackground?: boolean;
}

export function PlatformIcon({
  platform,
  size = 20,
  showBackground = true,
  className,
  ...props
}: PlatformIconProps) {
  const normalized = platform.toLowerCase();
  
  const getPlatformConfig = () => {
    switch (normalized) {
      case "instagram":
        return {
          icon: FaInstagram,
          bgClass: "bg-gradient-to-tr from-[#FCAF45] via-[#E1306C] to-[#833AB4]",
          iconColor: "text-white",
          fallbackColor: "#E1306C",
        };
      case "tiktok":
        return {
          icon: FaTiktok,
          bgClass: "bg-black",
          iconColor: "text-white drop-shadow-[1px_1px_0_#FE2C55] drop-shadow-[-1px_-1px_0_#25F4EE]",
          fallbackColor: "#000000",
        };
      case "x":
      case "twitter":
        return {
          icon: FaXTwitter,
          bgClass: "bg-black",
          iconColor: "text-white",
          fallbackColor: "#000000",
        };
      case "youtube":
        return {
          icon: FaYoutube,
          bgClass: "bg-[#FF0000]",
          iconColor: "text-white",
          fallbackColor: "#FF0000",
        };
      default:
        return {
          icon: null,
          bgClass: "bg-[#E3E8EA]",
          iconColor: "text-[#65737A]",
          fallbackColor: "#65737A",
        };
    }
  };

  const config = getPlatformConfig();
  const IconComponent = config.icon;

  if (!IconComponent) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center font-bold text-[10px] uppercase rounded-md", 
          config.bgClass,
          config.iconColor,
          className
        )}
        style={{ width: size, height: size }}
        {...props}
      >
        {normalized.substring(0, 1)}
      </div>
    );
  }

  if (showBackground) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-[25%]",
          config.bgClass,
          className
        )}
        style={{ width: size, height: size }}
        {...props}
      >
        <IconComponent
          className={cn(config.iconColor)}
          style={{ width: size * 0.58, height: size * 0.58 }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn("flex items-center justify-center", className)}
      style={{ width: size, height: size, color: config.fallbackColor }}
      {...props}
    >
      <IconComponent
        style={{ width: size, height: size }}
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
  const displayLabel = label || normalized.charAt(0).toUpperCase() + normalized.slice(1);
  
  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] bg-[#FFFFFF] border border-[#E3E8EA] text-[12px] font-medium text-[#142126] shadow-sm select-none",
        className
      )}
      {...props}
    >
      <PlatformIcon platform={normalized} size={14} showBackground={false} />
      <span>{displayLabel}</span>
    </div>
  );
}
