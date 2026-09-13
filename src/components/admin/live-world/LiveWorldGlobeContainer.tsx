"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { LiveWorldGlobeProps } from "./LiveWorldGlobe";

const DynamicGlobe = dynamic(
  () => import("./LiveWorldGlobe"),
  {
    ssr: false,
    loading: () => (
      <div 
        data-testid="globe-loading-placeholder"
        className="w-full h-full min-h-[560px] flex flex-col items-center justify-center rounded-[12px] p-8 text-center"
      >
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
          <div className="absolute w-6 h-6 rounded-full bg-cyan-400/10 animate-ping" />
        </div>
        <span className="text-cyan-200/80 text-[13px] font-semibold tracking-wider uppercase">
          Initializing 3D Live Globe...
        </span>
        <span className="text-sky-300/40 text-[11px] mt-1 font-mono">
          Loading telemetry and WebGL viewport
        </span>
      </div>
    ),
  }
);

export function LiveWorldGlobeContainer(props: LiveWorldGlobeProps) {
  return <DynamicGlobe {...props} />;
}
