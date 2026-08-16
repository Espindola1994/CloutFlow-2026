import React from "react";
import { ArrowLeft, Search, MoreVertical, Bell, ChevronRight, Play } from "lucide-react";
import { YouTubeVerifiedProfile } from "@/lib/social/types";

function formatSubscribers(num: number): string {
  if (num === undefined || num === null) return "0";
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "").replace(".", ",") + " mi";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "").replace(".", ",") + " mi";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "").replace(".", ",") + " mil";
  }
  return num.toLocaleString("pt-BR");
}

function formatVideos(num: number): string {
  if (num === undefined || num === null) return "0";
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "").replace(".", ",") + " mi";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "").replace(".", ",") + " mil";
  }
  return num.toLocaleString("pt-BR");
}

function formatViews(num: number): string {
  if (num === undefined || num === null) return "0";
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "").replace(".", ",") + " bi";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "").replace(".", ",") + " mi";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "").replace(".", ",") + " mil";
  }
  return num.toLocaleString("pt-BR");
}

function hasValue(val: any): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === "string" && val.trim() === "") return false;
  if (Array.isArray(val) && val.length === 0) return false;
  return true;
}

export function YouTubePreview({ profile, onClose }: { profile: YouTubeVerifiedProfile; onClose: () => void }) {
  const hasCover = hasValue(profile.cover_url);
  const firstVideo = hasValue(profile.videos) && profile.videos!.length > 0 ? profile.videos![0] : null;

  return (
    <div className="w-full bg-[#ffffff] text-[#0f0f0f] rounded-[24px] overflow-hidden border border-neutral-200/90 shadow-sm select-none font-sans">
      {/* 1. TOP NAVIGATION (04 Reference): Back Arrow on left | Search & MoreVertical on right */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="p-1 -ml-1 text-[#0f0f0f] active:opacity-60 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>
        <div className="flex items-center gap-5 text-[#0f0f0f]">
          <Search className="w-5 h-5 stroke-[2.2]" />
          <MoreVertical className="w-5 h-5 stroke-[2.2]" />
        </div>
      </div>

      {/* 2. LARGE PANORAMIC BANNER (04 Reference: Full width rounded banner) */}
      <div className="px-4 pb-3">
        <div className="relative w-full aspect-[3.4/1] rounded-[14px] overflow-hidden bg-[#212121] shadow-xs">
          {hasCover ? (
            <img
              src={profile.cover_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800" />
          )}
        </div>
      </div>

      {/* 3. CHANNEL IDENTITY & INFO SHEET */}
      <div className="px-5 pb-4 bg-white">
        {/* Avatar + Channel Details (Side-by-side layout from 04 Reference) */}
        <div className="flex items-start gap-4">
          {/* Avatar: Large Circular Avatar (~84px) */}
          <div className="relative flex-shrink-0">
            <div className="w-[84px] h-[84px] rounded-full overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-xs">
              <img
                src={profile.avatar_url}
                alt={profile.full_name || profile.username}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Channel Name, Handle, Subscribers · Video Count */}
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-[21px] font-bold text-[#0f0f0f] leading-tight tracking-tight truncate">
                {profile.full_name || profile.username}
              </h2>
              {profile.is_verified && (
                <span className="w-4 h-4 rounded-full bg-neutral-600 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                  ✓
                </span>
              )}
            </div>

            {/* @handle */}
            <span className="text-[13px] text-[#606060] font-medium block truncate mt-0.5">
              {profile.username}
            </span>

            {/* Subscribers · Videos count line (04 Reference format) */}
            <div className="text-[13px] text-[#606060] font-normal leading-normal mt-0.5 truncate">
              <span>{formatSubscribers(profile.followers_count)} de inscritos</span>
              {profile.video_count !== undefined && profile.video_count > 0 && (
                <span> · {formatVideos(profile.video_count)} vídeos</span>
              )}
            </div>
          </div>
        </div>

        {/* 4. DESCRIPTION (04 Reference: 2 lines with expand hint arrow) */}
        {hasValue(profile.bio) && (
          <div className="mt-3 flex items-center justify-between gap-2 text-[13px] text-[#606060] leading-snug cursor-default">
            <p className="line-clamp-2 flex-1">
              {profile.bio}
            </p>
            <ChevronRight className="w-4 h-4 text-[#606060] flex-shrink-0 opacity-70" />
          </div>
        )}

        {/* Links row (if available) */}
        {hasValue(profile.link) && typeof profile.link === "string" && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-[#065fd4] truncate">
            <span className="text-[11px] opacity-80">🔗</span>
            <span className="truncate hover:underline">{profile.link.replace(/^https?:\/\//, "")}</span>
          </div>
        )}

        {/* 5. ACTION BUTTONS (04 Reference: Two pill buttons side by side - Inscrever-se / Seja membro) */}
        <div className="mt-3.5 flex items-center gap-2">
          <button
            type="button"
            className="flex-1 h-[38px] rounded-full bg-[#f2f2f2] text-[#0f0f0f] text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#e5e5e5] active:opacity-80 transition-colors"
          >
            <Bell className="w-4 h-4 text-[#0f0f0f] fill-[#0f0f0f]/15" />
            <span>Inscrito</span>
          </button>
          <button
            type="button"
            className="flex-1 h-[38px] rounded-full bg-[#f2f2f2] text-[#0f0f0f] text-[14px] font-semibold flex items-center justify-center hover:bg-[#e5e5e5] active:opacity-80 transition-colors"
          >
            <span>Seja membro</span>
          </button>
        </div>

        {/* 6. TABS (04 Reference: Início | Vídeos | Shorts | Ao vivo | Playlists) */}
        <div className="flex items-center justify-between border-b border-neutral-200 mt-4 text-[14px] px-1">
          <div className="pb-2.5 text-[#0f0f0f] font-bold border-b-[2.5px] border-[#0f0f0f]">
            Início
          </div>
          <div className="pb-2.5 text-[#606060] font-medium hover:text-[#0f0f0f] transition-colors">
            Vídeos
          </div>
          <div className="pb-2.5 text-[#606060] font-medium hover:text-[#0f0f0f] transition-colors">
            Shorts
          </div>
          <div className="pb-2.5 text-[#606060] font-medium hover:text-[#0f0f0f] transition-colors">
            Ao vivo
          </div>
          <div className="pb-2.5 text-[#606060] font-medium hover:text-[#0f0f0f] transition-colors">
            Playlists
          </div>
        </div>

        {/* 7. FIRST VIDEO PREVIEW (Se disponível nos dados reais) */}
        {firstVideo ? (
          <div className="mt-3">
            <div className="relative w-full aspect-video rounded-[10px] overflow-hidden bg-neutral-900 shadow-xs">
              <img src={firstVideo.thumbnail_url} alt="" className="w-full h-full object-cover" />
              {firstVideo.views_count !== undefined && (
                <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10.5px] font-bold text-white leading-none">
                  {formatViews(firstVideo.views_count)} visualizações
                </span>
              )}
            </div>
            {hasValue(firstVideo.title) && (
              <h4 className="text-[13.5px] font-semibold text-[#0f0f0f] mt-1.5 line-clamp-2 leading-snug">
                {firstVideo.title}
              </h4>
            )}
          </div>
        ) : (
          <div className="py-3 text-center text-xs text-neutral-400 font-medium">
            Canal verificado com sucesso
          </div>
        )}
      </div>
    </div>
  );
}
