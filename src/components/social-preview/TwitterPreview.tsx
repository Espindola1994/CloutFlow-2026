import React from "react";
import { ArrowLeft, Search, MoreHorizontal, Bell, MapPin, Link2, Calendar, Share, Mail } from "lucide-react";
import { TwitterVerifiedProfile } from "@/lib/social/types";
import { VerifiedBadge } from "./VerifiedBadge";
import { RestrictedProfileNotice } from "./RestrictedProfileNotice";

function formatCount(num: number): string {
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

export function TwitterPreview({ profile, onClose }: { profile: TwitterVerifiedProfile; onClose: () => void }) {
  const hasCover = hasValue(profile.cover_url);

  return (
    <div className="w-full bg-[#ffffff] text-[#0f1419] rounded-[24px] overflow-hidden border border-neutral-200/90 shadow-sm select-none font-sans">
      {/* 04 Reference: Light Banner Header with Overlaid Floating Controls */}
      <div className="relative h-[135px] w-full bg-[#cfd9de] overflow-hidden">
        {hasCover ? (
          <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200" />
        )}

        {/* Floating Top Controls (04 Reference): Back (left) | Search & More (right) */}
        <div className="absolute top-0 inset-x-0 flex items-center justify-between px-3.5 py-2.5 text-white z-10">
          <button type="button" onClick={onClose} aria-label="Back" className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center active:opacity-70 transition-opacity">
            <ArrowLeft className="w-4 h-4 text-white stroke-[2.5]" />
          </button>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </span>
            <span className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
              <MoreHorizontal className="w-4 h-4 text-white" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Profile Info Sheet with Overlapping Avatar (04 Reference LIGHT theme) */}
      <div className="px-5 pb-4 relative bg-white">
        {/* Avatar & Action Button Row */}
        <div className="flex items-end justify-between -mt-[46px] mb-2.5">
          <div className="w-[88px] h-[88px] rounded-full p-[3.5px] bg-white shadow-md">
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-full h-full object-cover rounded-full bg-neutral-100"
            />
          </div>

          {/* Action Buttons (04 Reference): Mail & Follow */}
          <div className="flex items-center gap-2 pb-1">
            <button
              type="button"
              className="w-[36px] h-[36px] rounded-full border border-neutral-300 flex items-center justify-center hover:bg-neutral-50 active:opacity-80 transition-colors"
              aria-label="Message"
            >
              <Mail className="w-4 h-4 text-neutral-800" />
            </button>
            <button
              type="button"
              className="h-[36px] px-5 rounded-full bg-[#0f1419] text-white text-[14px] font-bold hover:bg-[#272c30] active:opacity-90 transition-colors shadow-sm"
            >
              Follow
            </button>
          </div>
        </div>

        {/* Display Name & Handle */}
        <div className="min-w-0 pt-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className="text-[21px] font-black text-neutral-900 leading-tight tracking-tight truncate">
              {profile.full_name || profile.username}
            </h2>
            {Boolean(profile.is_verified || (profile as any).verified) && (
              <VerifiedBadge platform="twitter" size={18} />
            )}
          </div>
          <span className="text-[14px] text-neutral-500 font-normal block truncate mt-0.5">
            @{profile.username}
          </span>
        </div>

        {/* Bio (04 Reference) */}
        {hasValue(profile.bio) && (
          <p className="text-[14px] mt-2.5 text-neutral-900 leading-snug line-clamp-3 whitespace-pre-line">
            {profile.bio}
          </p>
        )}

        {/* Meta Info: Location, Link */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-[13px] text-neutral-500">
          {hasValue(profile.location) && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
              <span className="truncate">{profile.location}</span>
            </div>
          )}
          {hasValue(profile.link) && (
            <div className="flex items-center gap-1.5 text-[#1D9BF0]">
              <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate max-w-[180px] hover:underline font-medium">{profile.link?.replace(/^https?:\/\//, "")}</span>
            </div>
          )}
        </div>

        {/* Following / Followers Counter Row (04 Reference) */}
        <div className="flex items-center gap-5 mt-3 text-[14px]">
          <div>
            <b className="font-bold text-neutral-900">{formatCount(profile.following_count)}</b>{" "}
            <span className="text-neutral-500 font-normal">Following</span>
          </div>
          <div>
            <b className="font-bold text-neutral-900">{formatCount(profile.followers_count)}</b>{" "}
            <span className="text-neutral-500 font-normal">Followers</span>
          </div>
        </div>

        {/* Tabs (04 Reference): Posts | Replies | Highlights | Media */}
        <div className="flex items-center justify-around border-b border-neutral-200 mt-3.5 text-[14px]">
          <div className="py-2.5 text-neutral-900 font-bold border-b-[3px] border-[#1D9BF0]">
            Posts
          </div>
          <div className="py-2.5 text-neutral-500 font-medium hover:text-neutral-700">
            Replies
          </div>
          <div className="py-2.5 text-neutral-500 font-medium hover:text-neutral-700">
            Highlights
          </div>
          <div className="py-2.5 text-neutral-500 font-medium hover:text-neutral-700">
            Media
          </div>
        </div>

        {/* Protected-account notice only.
            Public Step 3 preview intentionally ends at the tabs. */}
        {Boolean(profile.is_private || (profile as any).is_protected || (profile as any).protected) && (
          <div className="mt-3">
            <RestrictedProfileNotice
              title="This account is protected"
              description="Make your account public to continue."
            />
          </div>
        )}
      </div>
    </div>
  );
}
