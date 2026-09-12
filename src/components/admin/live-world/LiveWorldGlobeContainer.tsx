"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { LiveWorldLocationItem, LiveWorldRecentPurchase } from "@/types/admin-live-world";

const DynamicGlobe = dynamic(
  () => import("./LiveWorldGlobe"),
  {
    ssr: false,
    loading: () => (
      <div 
        data-testid="globe-loading-placeholder"
        className="w-full h-full min-h-[440px] flex flex-col items-center justify-center bg-[#071D26] rounded-[12px] border border-[#11313B] p-8 text-center animate-pulse"
      >
        <div className="w-10 h-10 rounded-full border-2 border-[#0F8F8A] border-t-transparent animate-spin mb-3" />
        <span className="text-[#8A979D] text-[13px] font-medium tracking-wide">
          Initializing 3D Live Globe...
        </span>
      </div>
    ),
  }
);

interface LiveWorldGlobeContainerProps {
  locations: LiveWorldLocationItem[];
  recentPurchases: LiveWorldRecentPurchase[];
  newPurchaseOrderIds: Set<string>;
  onHoverLocation?: (location: LiveWorldLocationItem | null) => void;
  onHoverPurchase?: (purchase: LiveWorldRecentPurchase | null) => void;
}

export function LiveWorldGlobeContainer(props: LiveWorldGlobeContainerProps) {
  return <DynamicGlobe {...props} />;
}
