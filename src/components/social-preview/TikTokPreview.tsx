import React from "react";
import { Grid3X3, Heart, Lock, Bookmark, Repeat2, UserPlus, MessageCircle, ChevronDown, Check } from "lucide-react";
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
    <div className="w-full bg-[#ffffff] text-[#161823] rounded-2xl overflow-hidden border border-neutral-200/80 shadow-sm select-none font-sans">
      {/* Top Header / Username Centered */}
      <div className="flex items-center justify-center relative py-2.5 px-4 border-b border-neutral-100">
        <h4 className="text-sm font-bold text-neutral-900 truncate max-w-[200px]">
          {profile.full_name || profile.username}
        </h4>
      </div>

      {/* Profile Header: Avatar & Info */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-3">
        {/* Name & Handle */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h3 className="text-lg font-black text-neutral-900 leading-tight truncate">
              {profile.full_name || profile.username}
            </h3>
            {profile.is_verified && (
              <span className="w-4 h-4 rounded-full bg-[#20D5EC] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                ✓
              </span>
            )}
          </div>
          <span className="text-xs text-neutral-500 font-medium block truncate mt-0.5">
            @{profile.username}
          </span>
        </div>

        {/* Large Circular Avatar on Right with visual border */}
        <div className="relative flex-shrink-0">
          <div className="w-[72px] h-[72px] rounded-full p-[2px] bg-gradient-to-tr from-neutral-200 to-neutral-300 shadow-inner">
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-full h-full object-cover rounded-full bg-neutral-100"
            />
          </div>
        </div>
      </div>

      {/* Horizontal Counters (Following | Followers | Likes) */}
      <div className="px-4 py-2 flex items-center gap-6 text-left">
        <div>
          <b className="text-sm font-extrabold text-neutral-900 block leading-tight">
            {formatCount(profile.following_count)}
          </b>
          <span className="text-[11px] font-medium text-neutral-500 block">Following</span>
        </div>
        <div>
          <b className="text-sm font-extrabold text-neutral-900 block leading-tight">
            {formatCount(profile.followers_count)}
          </b>
          <span className="text-[11px] font-medium text-neutral-500 block">Followers</span>
        </div>
        <div>
          <b className="text-sm font-extrabold text-neutral-900 block leading-tight">
            {formatCount(profile.likes_count)}
          </b>
          <span className="text-[11px] font-medium text-neutral-500 block">Likes</span>
        </div>
      </div>

      {/* Action Buttons: Follow (Red) | Message | Add Person */}
      <div className="px-4 py-1.5 flex items-center gap-1.5">
        <button
          type="button"
          className="flex-1 h-8 rounded-md bg-[#FE2C55] text-white text-xs font-bold flex items-center justify-center hover:bg-[#e0264b] transition-colors shadow-sm"
        >
          Follow
        </button>
        <button
          type="button"
          className="flex-1 h-8 rounded-md bg-neutral-100 text-neutral-900 text-xs font-semibold flex items-center justify-center hover:bg-neutral-200 transition-colors"
        >
          Message
        </button>
        <button
          type="button"
          aria-label="Add person"
          className="w-8 h-8 rounded-md bg-neutral-100 text-neutral-800 flex items-center justify-center hover:bg-neutral-200 transition-colors flex-shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bio Section */}
      {hasValue(profile.bio) && (
        <div className="px-4 pt-2 text-xs text-neutral-700 leading-snug line-clamp-2">
          {profile.bio}
        </div>
      )}

      {/* Bio Link */}
      {hasValue(profile.link) && (
        <div className="px-4 pt-1 pb-1.5 text-xs font-semibold text-[#FE2C55] flex items-center gap-1">
          <span>🔗</span>
          <span className="truncate hover:underline">{profile.link?.replace(/^https?:\/\//, "")}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-around border-b border-neutral-100 mt-2 text-neutral-400">
        <div className="flex-1 py-2 flex justify-center text-neutral-900 border-b-2 border-neutral-900">
          <Grid3X3 className="w-4 h-4" />
        </div>
        <div className="flex-1 py-2 flex justify-center hover:text-neutral-600">
          <Repeat2 className="w-4 h-4" />
        </div>
        <div className="flex-1 py-2 flex justify-center hover:text-neutral-600">
          <Bookmark className="w-4 h-4" />
        </div>
        <div className="flex-1 py-2 flex justify-center hover:text-neutral-600">
          <Heart className="w-4 h-4" />
        </div>
      </div>

      {/* 3-Column Video Grid */}
      <div className="grid grid-cols-3 gap-0.5 p-0.5 bg-neutral-100">
        {videos.length > 0 ? (
          videos.map((vid, idx) => (
            <div key={vid.id || idx} className="relative aspect-[3/4] bg-neutral-900 overflow-hidden">
              <img src={vid.thumbnail_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <span className="absolute left-1.5 bottom-1.5 text-[10px] font-bold text-white flex items-center gap-0.5 drop-shadow">
                <span>▷</span> {formatCount(vid.views_count)}
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
