import React from "react";
import { TrafficSourceItem, DeviceBreakdownItem, BrowserBreakdownItem } from "@/types/admin-analytics";
import { Globe, Smartphone, Laptop } from "lucide-react";

interface TrafficAndDevicesCardProps {
  sources: TrafficSourceItem[];
  devices: DeviceBreakdownItem[];
  browsers: BrowserBreakdownItem[];
}

export function TrafficAndDevicesCard({ sources, devices, browsers }: TrafficAndDevicesCardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Traffic Sources */}
      <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03)] space-y-3">
        <div className="flex items-center gap-2 border-b border-[#EEF2F3] pb-3">
          <div className="p-1.5 rounded-[6px] bg-[#0F8F8A]/10 text-[#0F8F8A]">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-[#142126]">Traffic Sources</h3>
            <p className="text-[11px] text-[#65737A]">UTM & Referrer breakdown</p>
          </div>
        </div>

        <div className="space-y-2">
          {sources.length === 0 ? (
            <p className="text-[12px] text-[#94A3B8] italic">No traffic source events yet</p>
          ) : (
            sources.slice(0, 6).map((src) => (
              <div key={src.source} className="flex items-center justify-between text-[12px]">
                <span className="font-medium text-[#142126] truncate max-w-[150px]">{src.source}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[#65737A]">{src.sessions} sess.</span>
                  <span className="font-bold text-[#0F8F8A]">{src.share}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Device Breakdown */}
      <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03)] space-y-3">
        <div className="flex items-center gap-2 border-b border-[#EEF2F3] pb-3">
          <div className="p-1.5 rounded-[6px] bg-[#0F8F8A]/10 text-[#0F8F8A]">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-[#142126]">Device Category</h3>
            <p className="text-[11px] text-[#65737A]">Screen & viewport distribution</p>
          </div>
        </div>

        <div className="space-y-2">
          {devices.length === 0 ? (
            <p className="text-[12px] text-[#94A3B8] italic">No device data yet</p>
          ) : (
            devices.map((dev) => (
              <div key={dev.device} className="flex items-center justify-between text-[12px]">
                <span className="font-medium text-[#142126]">{dev.device}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[#65737A]">{dev.sessions} sess.</span>
                  <span className="font-bold text-[#0F8F8A]">{dev.share}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Browser Family */}
      <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03)] space-y-3">
        <div className="flex items-center gap-2 border-b border-[#EEF2F3] pb-3">
          <div className="p-1.5 rounded-[6px] bg-[#0F8F8A]/10 text-[#0F8F8A]">
            <Laptop className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-[#142126]">Browser Family</h3>
            <p className="text-[11px] text-[#65737A]">Top user browsers</p>
          </div>
        </div>

        <div className="space-y-2">
          {browsers.length === 0 ? (
            <p className="text-[12px] text-[#94A3B8] italic">No browser data yet</p>
          ) : (
            browsers.map((b) => (
              <div key={b.browser} className="flex items-center justify-between text-[12px]">
                <span className="font-medium text-[#142126]">{b.browser}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[#65737A]">{b.sessions} sess.</span>
                  <span className="font-bold text-[#0F8F8A]">{b.share}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
