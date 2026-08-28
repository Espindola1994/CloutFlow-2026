import React from "react";
import { ArrowLeft, Bell, MoreVertical, ChevronDown, UserPlus, Grid3X3, PlaySquare, Repeat2, UserRound } from "lucide-react";
import type { TikTokVerifiedProfile, TwitterVerifiedProfile, YouTubeVerifiedProfile } from "@/lib/social/types";
import { VerifiedBadge } from "./VerifiedBadge";

type Profile = TikTokVerifiedProfile | TwitterVerifiedProfile | YouTubeVerifiedProfile;
type Platform = "tiktok" | "twitter" | "youtube";

function formatCount(num?: number): string {
  if (num === undefined || num === null) return "0";
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return num.toLocaleString();
}

function getMetrics(platform: Platform, profile: Profile) {
  if (platform === "tiktok" && profile.platform === "tiktok") {
    return [
      [formatCount(profile.following_count), "following"],
      [formatCount(profile.followers_count), "followers"],
      [formatCount(profile.likes_count), "likes"],
    ];
  }
  if (platform === "twitter" && profile.platform === "twitter") {
    return [
      [formatCount(profile.following_count), "following"],
      [formatCount(profile.followers_count), "followers"],
      [profile.is_verified ? "Yes" : "—", "verified"],
    ];
  }
  const yt = profile as YouTubeVerifiedProfile;
  return [
    [formatCount(yt.video_count), "videos"],
    [formatCount(yt.followers_count), "subscribers"],
    [formatCount(yt.total_views), "views"],
  ];
}

function getMedia(profile: Profile): string[] {
  if (profile.platform === "tiktok") return (profile.videos || []).slice(0, 3).map((v) => v.thumbnail_url).filter(Boolean);
  if (profile.platform === "youtube") return (profile.videos || []).slice(0, 3).map((v) => v.thumbnail_url).filter(Boolean);
  return [];
}

export function StandardPlatformPreview({ platform, profile, onClose }: { platform: Platform; profile: Profile; onClose: () => void }) {
  const metrics = getMetrics(platform, profile);
  const media = getMedia(profile);
  const verified = Boolean(profile.is_verified);
  const displayUsername = profile.username.replace(/^@+/, "");
  const primaryAction = platform === "youtube" ? "Subscribed" : "Following";
  const secondaryAction = platform === "youtube" ? "Channel" : "Message";

  return (
    <div className={`ig-preview-ref sp-preview sp-${platform} w-full bg-white text-[#111827] rounded-[24px] overflow-hidden border border-neutral-200/90 shadow-sm select-none font-sans`}>
      <div className="ig-topbar grid grid-cols-[40px_minmax(0,1fr)_auto] items-center px-[14px] h-[52px] w-full border-b border-[#EFEFEF] bg-white">
        <button type="button" onClick={onClose} aria-label="Back" className="flex items-center justify-start active:opacity-70">
          <ArrowLeft size={25} strokeWidth={2.2} />
        </button>
        <div className="flex items-center justify-center gap-[5px] min-w-0 px-1">
          <span className="text-[16px] font-[700] leading-none truncate">{displayUsername}</span>
          {verified && <VerifiedBadge platform={platform} size={16} />}
        </div>
        <div className="flex items-center justify-end gap-[15px]">
          <button type="button" aria-label="Notifications" className="flex items-center active:opacity-70"><Bell size={25} strokeWidth={2.1} /></button>
          <button type="button" aria-label="More options" className="flex items-center active:opacity-70"><MoreVertical size={25} strokeWidth={2.3} /></button>
        </div>
      </div>

      <div className="ig-profile-main w-full grid px-[16px] pt-[18px] pb-[8px]" style={{ gridTemplateColumns: "104px minmax(0, 1fr)", columnGap: "18px", alignItems: "start" }}>
        <div className="ig-avatar-wrap relative flex-shrink-0 flex items-center justify-center">
          <div className="ig-avatar-ring sp-avatar-ring rounded-full flex items-center justify-center p-[3px] w-[96px] h-[96px]">
            <div className="w-full h-full rounded-full bg-white p-[3px] flex items-center justify-center">
              <img src={profile.avatar_url} alt={displayUsername} className="w-full h-full object-cover rounded-full bg-neutral-100" />
            </div>
          </div>
        </div>
        <div className="ig-profile-info min-w-0 flex flex-col justify-start">
          <h2 className="ig-display-name text-[17px] font-[600] leading-[1.15] mt-[4px] truncate">{profile.full_name || displayUsername}</h2>
          <div className="ig-metrics grid grid-cols-3 w-full mt-[14px] text-center whitespace-nowrap">
            {metrics.map(([value, label]) => (
              <div key={label}>
                <b className="text-[18px] font-[600] leading-none block">{value}</b>
                <span className="text-[12px] font-[400] leading-[1.15] text-[#59658a] block mt-[4px]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {profile.bio && <div className="sp-bio px-[16px] mt-[10px] mb-[12px] text-left"><p className="text-[13.5px] leading-[1.38] line-clamp-2">{profile.bio}</p></div>}

      <div className="ig-actions px-[16px] mb-[14px] grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_42px] gap-[8px] w-full">
        <button type="button" className="flex items-center justify-center gap-[5px] h-[42px] rounded-[10px] bg-[#f5f5f6] text-[14px] font-[600] border-0 cursor-pointer">{primaryAction}<ChevronDown size={15} strokeWidth={2} /></button>
        <button type="button" className="flex items-center justify-center h-[42px] rounded-[10px] bg-[#f5f5f6] text-[14px] font-[600] border-0 cursor-pointer">{secondaryAction}</button>
        <button type="button" aria-label="Profile action" className="flex items-center justify-center w-[42px] h-[42px] rounded-[10px] bg-[#f5f5f6] border-0 cursor-pointer"><UserPlus size={20} strokeWidth={2} /></button>
      </div>

      <div className="ig-tabs grid grid-cols-4 w-full h-[44px] border-b border-[#EFEFEF]">
        {[Grid3X3, PlaySquare, Repeat2, UserRound].map((Icon, index) => (
          <div key={index} className="relative flex items-center justify-center h-full">
            <Icon className="w-[22px] h-[22px]" strokeWidth={index === 0 ? 2.5 : 2} />
            {index === 0 && <div className="sp-active-tab absolute left-1/2 -translate-x-1/2 bottom-0 w-[44px] h-[2.5px] rounded-full" />}
          </div>
        ))}
      </div>

      <div className="ig-media-grid sp-media-grid grid grid-cols-3 gap-[3px] w-full bg-white">
        {[0, 1, 2].map((index) => (
          <div key={index} className="sp-media-cell relative overflow-hidden aspect-square bg-[#f4f5f7]">
            {media[index] ? (
              <img src={media[index]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="sp-media-placeholder w-full h-full flex items-center justify-center"><PlaySquare className="w-8 h-8 opacity-30" /></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
