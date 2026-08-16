import React from "react";
import { ArrowLeft, Search, MoreHorizontal, Bell, MapPin, Link2, Calendar } from "lucide-react";
import { TwitterVerifiedProfile } from "@/lib/social/types";

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

export function TwitterPreview({ profile, onClose }: { profile: TwitterVerifiedProfile; onClose: () => void }) {
  const hasCover = hasValue(profile.cover_url);

  return (
    <div className="w-full bg-[#000000] text-[#e7e9ea] rounded-2xl overflow-hidden border border-neutral-800 shadow-sm select-none font-sans">
      {/* Dark Cover / Header with Top Controls */}
      <div className="relative h-24 w-full bg-[#1e2732] overflow-hidden">
        {hasCover ? (
          <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover opacity-85" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900" />
        )}

        {/* Top Floating Controls */}
        <div className="absolute top-0 inset-x-0 flex items-center justify-between px-3 py-2 text-white z-10">
          <button type="button" onClick={onClose} aria-label="Back" className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
              <Search className="w-3.5 h-3.5 text-white" />
            </span>
            <span className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
              <MoreHorizontal className="w-3.5 h-3.5 text-white" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Profile Info with Overlapping Avatar */}
      <div className="px-4 pb-3 relative">
        {/* Avatar & Action Button Row */}
        <div className="flex items-end justify-between -mt-10 mb-2">
          <div className="w-[72px] h-[72px] rounded-full p-[3px] bg-black shadow-lg">
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-full h-full object-cover rounded-full bg-neutral-800"
            />
          </div>

          {/* Action Buttons: Follow / Notification */}
          <div className="flex items-center gap-1.5 pb-0.5">
            <button
              type="button"
              className="h-8 px-4 rounded-full bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors shadow-sm"
            >
              Follow
            </button>
          </div>
        </div>

        {/* Display Name & Handle */}
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="text-base font-bold text-white leading-tight truncate">
              {profile.full_name || profile.username}
            </h3>
            {profile.is_verified && (
              <span className="w-3.5 h-3.5 rounded-full bg-[#1D9BF0] text-white flex items-center justify-center text-[9px] font-bold">
                ✓
              </span>
            )}
          </div>
          <span className="text-xs text-neutral-500 font-medium block truncate">
            @{profile.username}
          </span>
        </div>

        {/* Bio */}
        {hasValue(profile.bio) && (
          <p className="text-xs mt-2 text-[#e7e9ea] leading-snug line-clamp-3 whitespace-pre-line">
            {profile.bio}
          </p>
        )}

        {/* Meta Info: Location, Link */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-neutral-500">
          {hasValue(profile.location) && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-neutral-400" />
              <span>{profile.location}</span>
            </div>
          )}
          {hasValue(profile.link) && (
            <div className="flex items-center gap-1 text-[#1D9BF0]">
              <Link2 className="w-3 h-3" />
              <span className="truncate max-w-[170px] hover:underline">{profile.link?.replace(/^https?:\/\//, "")}</span>
            </div>
          )}
        </div>

        {/* Following / Followers Counter Row */}
        <div className="flex items-center gap-4 mt-2.5 text-xs">
          <div>
            <b className="font-bold text-white">{formatCount(profile.following_count)}</b>{" "}
            <span className="text-neutral-500 font-normal">Following</span>
          </div>
          <div>
            <b className="font-bold text-white">{formatCount(profile.followers_count)}</b>{" "}
            <span className="text-neutral-500 font-normal">Followers</span>
          </div>
        </div>

        {/* Tabs: Posts | Replies | Highlights | Media */}
        <div className="flex items-center justify-around border-b border-neutral-800 mt-3 text-xs">
          <div className="py-2 text-white font-bold border-b-2 border-[#1D9BF0]">
            Posts
          </div>
          <div className="py-2 text-neutral-500 font-medium hover:text-neutral-300">
            Replies
          </div>
          <div className="py-2 text-neutral-500 font-medium hover:text-neutral-300">
            Media
          </div>
        </div>

        {/* Pinned Tweet (Apenas se existir real) */}
        {profile.pinned_tweet && hasValue(profile.pinned_tweet.text) && (
          <div className="mt-2 p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80 text-xs">
            <div className="font-semibold text-[#1D9BF0] mb-0.5 text-[11px] flex items-center gap-1">
              <span>📌</span> Pinned Tweet
            </div>
            <p className="text-neutral-300 leading-snug line-clamp-2">{profile.pinned_tweet.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}
