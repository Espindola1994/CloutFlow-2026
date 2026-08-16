import React from "react";
import { Grid3X3, Heart, Bookmark, Repeat2, UserPlus, MoreHorizontal, ArrowLeft } from "lucide-react";
import { TikTokVerifiedProfile } from "@/lib/social/types";

function formatCount(num: number): string {
  if (num === undefined || num === null) return "0";
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return num.toLocaleString();
}

function hasValue(val: any): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === "string" && val.trim() === "") return false;
  if (Array.isArray(val) && val.length === 0) return false;
  return true;
}

export function TikTokPreview({ profile, onClose }: { profile: TikTokVerifiedProfile; onClose: () => void }) {
  const videos = hasValue(profile.videos) ? profile.videos.slice(0, 3) : [];

  return (
    <div className="w-full bg-[#ffffff] text-[#161823] rounded-[24px] overflow-hidden border border-neutral-200/90 shadow-sm select-none font-sans">
      {/* Top Header: Back Arrow | Actions */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="text-neutral-900 p-1 -ml-1 active:opacity-70"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>
        <div className="flex items-center gap-3 text-neutral-900">
          <MoreHorizontal className="w-5 h-5 stroke-[2.2]" />
        </div>
      </div>

      {/* Main Profile Header: Name & Handle on Left + Huge Avatar on Right (01 Reference) */}
      <div className="px-5 pt-1 pb-3 flex items-start justify-between gap-3">
        {/* Left Column: Big Bold Name & @username */}
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[24px] font-black text-neutral-900 leading-tight tracking-tight truncate">
              {profile.full_name || profile.username}
            </h2>
            {profile.is_verified && (
              <span className="w-[18px] h-[18px] rounded-full bg-[#20D5EC] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                ✓
              </span>
            )}
          </div>
          <span className="text-[13.5px] text-neutral-500 font-medium block truncate mt-0.5">
            @{profile.username}
          </span>
        </div>

        {/* Right Column: Large Circular Avatar with border */}
        <div className="relative flex-shrink-0">
          <div className="w-[88px] h-[88px] rounded-full p-[2.5px] bg-gradient-to-tr from-neutral-200 via-neutral-100 to-neutral-300 shadow-sm">
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-full h-full object-cover rounded-full bg-neutral-100"
            />
          </div>
        </div>
      </div>

      {/* Horizontal Counters (Following | Followers | Likes) - 01 Reference */}
      <div className="px-5 py-1.5 flex items-center gap-7 text-left">
        <div>
          <b className="text-[18px] font-black text-neutral-900 block leading-tight tracking-tight">
            {formatCount(profile.following_count)}
          </b>
          <span className="text-[11.5px] font-normal text-neutral-500 block mt-0.5">Following</span>
        </div>
        <div>
          <b className="text-[18px] font-black text-neutral-900 block leading-tight tracking-tight">
            {formatCount(profile.followers_count)}
          </b>
          <span className="text-[11.5px] font-normal text-neutral-500 block mt-0.5">Followers</span>
        </div>
        <div>
          <b className="text-[18px] font-black text-neutral-900 block leading-tight tracking-tight">
            {formatCount(profile.likes_count)}
          </b>
          <span className="text-[11.5px] font-normal text-neutral-500 block mt-0.5">Likes</span>
        </div>
      </div>

      {/* Action Buttons: Follow (Red/Pink) | Message | Add Person */}
      <div className="px-5 py-2.5 flex items-center gap-2">
        <button
          type="button"
          className="flex-1 h-[40px] rounded-[6px] bg-[#FE2C55] text-white text-[14px] font-bold flex items-center justify-center hover:bg-[#ea264c] active:opacity-90 transition-colors shadow-sm"
        >
          Follow
        </button>
        <button
          type="button"
          className="flex-1 h-[40px] rounded-[6px] bg-[#F1F1F2] text-neutral-900 text-[14px] font-semibold flex items-center justify-center hover:bg-[#e4e4e6] active:opacity-90 transition-colors"
        >
          Message
        </button>
        <button
          type="button"
          aria-label="Add person"
          className="w-[40px] h-[40px] rounded-[6px] bg-[#F1F1F2] text-neutral-900 flex items-center justify-center hover:bg-[#e4e4e6] active:opacity-90 transition-colors flex-shrink-0"
        >
          <UserPlus className="w-4 h-4 stroke-[2]" />
        </button>
      </div>

      {/* Bio Section */}
      {hasValue(profile.bio) && (
        <div className="px-5 pt-1 text-[13.5px] text-neutral-800 leading-snug line-clamp-2">
          {profile.bio}
        </div>
      )}

      {/* Bio Link */}
      {hasValue(profile.link) && (
        <div className="px-5 pt-1.5 pb-1 text-[13px] font-semibold text-[#161823] flex items-center gap-1.5">
          <span className="text-[12px] opacity-70">🔗</span>
          <span className="truncate hover:underline text-[#2b5ba8]">{profile.link?.replace(/^https?:\/\//, "")}</span>
        </div>
      )}

      {/* Visual Navigation Tabs */}
      <div className="flex items-center justify-around border-b border-neutral-100 mt-2.5 text-neutral-400">
        <div className="flex-1 py-2.5 flex justify-center text-neutral-900 border-b-[2px] border-neutral-900">
          <Grid3X3 className="w-[19px] h-[19px] stroke-[2.2]" />
        </div>
        <div className="flex-1 py-2.5 flex justify-center text-neutral-400">
          <Repeat2 className="w-[19px] h-[19px] stroke-[2]" />
        </div>
        <div className="flex-1 py-2.5 flex justify-center text-neutral-400">
          <Bookmark className="w-[19px] h-[19px] stroke-[2]" />
        </div>
        <div className="flex-1 py-2.5 flex justify-center text-neutral-400">
          <Heart className="w-[19px] h-[19px] stroke-[2]" />
        </div>
      </div>

      {/* 3-Column Video Grid (Vertical Aspect 3:4 with views in lower left) */}
      <div className="grid grid-cols-3 gap-[2px] p-[2px] bg-neutral-100">
        {videos.length > 0 ? (
          videos.map((vid, idx) => (
            <div key={vid.id || idx} className="relative aspect-[3/4] bg-neutral-900 overflow-hidden">
              {vid.thumbnail_url ? (
                <img src={vid.thumbnail_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-950 flex items-center justify-center text-white/20">
                  <Grid3X3 className="w-6 h-6" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
              <span className="absolute left-1.5 bottom-1.5 text-[11px] font-bold text-white flex items-center gap-1 drop-shadow-md">
                <span className="text-[10px]">▷</span> {formatCount(vid.views_count)}
              </span>
            </div>
          ))
        ) : (
          <div className="col-span-3 py-6 text-center text-xs text-neutral-400 bg-white">
            {profile.is_private ? "Esta conta é privada" : "Nenhum vídeo recente"}
          </div>
        )}
      </div>
    </div>
  );
}
