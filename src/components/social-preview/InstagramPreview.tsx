import React from "react";
import { ArrowLeft, Bell, MoreVertical, ChevronDown, UserPlus, Link2, Film, Lock } from "lucide-react";
import { InstagramVerifiedProfile } from "@/lib/social/types";
import { VerifiedBadge } from "./VerifiedBadge";
import { RestrictedProfileNotice } from "./RestrictedProfileNotice";

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

export function InstagramPreview({ profile, onClose }: { profile: InstagramVerifiedProfile; onClose: () => void }) {
  const posts = hasValue(profile.posts) ? profile.posts.slice(0, 3) : [];
  const isVerified = Boolean(profile.is_verified || (profile as any).verified || (profile as any).isVerified);
  const hasStory = Boolean(profile.has_active_story || (profile as any).has_story || (profile as any).has_stories || (profile as any).story_available);

  return (
    <div className="w-full bg-[#ffffff] text-[#262626] rounded-[24px] overflow-hidden border border-neutral-200/90 shadow-sm select-none font-sans">
      {/* Top Bar: Back | Centered Username | Bell & Menu */}
      <div className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center px-[14px] h-[52px] w-full border-b border-[#EFEFEF] bg-[#ffffff]">
        {/* Left: Back Arrow */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="flex items-center justify-start text-[#111111] active:opacity-70"
        >
          <ArrowLeft size={25} strokeWidth={2.2} color="#111111" />
        </button>

        {/* Center: Username + Verified Badge */}
        <div className="flex items-center justify-center gap-[4px] min-w-0 px-1">
          <span className="text-[15px] min-[390px]:text-[15.5px] min-[430px]:text-[16px] font-[700] leading-none text-[#111111] truncate">
            {profile.username}
          </span>
          {isVerified && <VerifiedBadge platform="instagram" size={16} />}
        </div>

        {/* Right: Bell + MoreVertical */}
        <div className="flex items-center justify-end gap-[15px] text-[#111111]">
          <button type="button" aria-label="Notifications" className="flex items-center active:opacity-70">
            <Bell size={25} strokeWidth={2.1} color="#111111" />
          </button>
          <button type="button" aria-label="More options" className="flex items-center active:opacity-70">
            <MoreVertical size={25} strokeWidth={2.3} color="#111111" />
          </button>
        </div>
      </div>

      {/* Main Profile Block: Avatar (Left) + Display Name & Stats (Right) */}
      <div
        className="w-full grid px-[16px] pt-[18px] pb-[8px]"
        style={{
          gridTemplateColumns: "104px minmax(0, 1fr)",
          columnGap: "18px",
          alignItems: "start",
        }}
      >
        {/* Left Column: Avatar (96px desktop) with Conditional Story Ring */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          {hasStory ? (
            <div
              className="rounded-full flex items-center justify-center p-[3px] w-[86px] h-[86px] min-[390px]:w-[90px] min-[390px]:h-[90px] min-[430px]:w-[94px] min-[430px]:h-[94px] min-[440px]:w-[96px] min-[440px]:w-[96px]"
              style={{
                background: "conic-gradient(from 0deg, #FEDA75, #FA7E1E, #D62976, #962FBF, #4F5BD5, #FEDA75)",
              }}
            >
              <div className="w-full h-full rounded-full bg-white p-[3px] flex items-center justify-center">
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-full h-full object-cover rounded-full bg-neutral-100"
                />
              </div>
            </div>
          ) : (
            <div className="w-[86px] h-[86px] min-[390px]:w-[90px] min-[390px]:h-[90px] min-[430px]:w-[94px] min-[430px]:h-[94px] min-[440px]:w-[96px] min-[440px]:h-[96px] rounded-full p-[1px] border border-[#DBDBDB] bg-white flex items-center justify-center">
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-full h-full object-cover rounded-full bg-neutral-100"
              />
            </div>
          )}
        </div>

        {/* Right Column: Display Name + 3-Column Metrics */}
        <div className="min-w-0 flex flex-col justify-start">
          {/* Display Name */}
          <h2 className="text-[16px] min-[390px]:text-[16.5px] min-[430px]:text-[17px] font-[600] leading-[1.15] text-[#111111] mt-[4px] truncate">
            {profile.full_name || profile.username}
          </h2>

          {/* Metrics */}
          <div className="grid grid-cols-3 w-full mt-[14px] text-center whitespace-nowrap">
            <div>
              <b className="text-[16.5px] min-[390px]:text-[17px] min-[430px]:text-[18px] font-[600] leading-none text-[#111111] block">
                {formatCount(profile.posts_count)}
              </b>
              <span className="text-[11.5px] min-[390px]:text-[12px] font-[400] leading-[1.15] text-[#555555] block mt-[4px]">
                posts
              </span>
            </div>
            <div>
              <b className="text-[16.5px] min-[390px]:text-[17px] min-[430px]:text-[18px] font-[600] leading-none text-[#111111] block">
                {formatCount(profile.followers_count)}
              </b>
              <span className="text-[11.5px] min-[390px]:text-[12px] font-[400] leading-[1.15] text-[#555555] block mt-[4px]">
                followers
              </span>
            </div>
            <div>
              <b className="text-[16.5px] min-[390px]:text-[17px] min-[430px]:text-[18px] font-[600] leading-none text-[#111111] block">
                {formatCount(profile.following_count)}
              </b>
              <span className="text-[11.5px] min-[390px]:text-[12px] font-[400] leading-[1.15] text-[#555555] block mt-[4px]">
                following
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bio & Website Section */}
      {(hasValue(profile.bio) || hasValue(profile.link)) && (
        <div className="px-[16px] mt-[12px] mb-[12px] text-left">
          {hasValue(profile.bio) && (
            <p className="text-[13px] min-[390px]:text-[13.5px] min-[430px]:text-[14px] font-[400] leading-[1.38] text-[#171717] whitespace-pre-line line-clamp-4">
              {profile.bio}
            </p>
          )}

          {hasValue(profile.link) && (
            <div className="mt-[6px] flex items-center gap-[6px] text-[13px] min-[390px]:text-[13.5px] min-[430px]:text-[14px] font-[600] leading-[1.2] text-[#00376B]">
              <Link2 size={16} strokeWidth={2} className="shrink-0" />
              <span className="truncate hover:underline">
                {profile.link?.replace(/^https?:\/\//, "")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons: Following | Message | User+ */}
      <div className="px-[16px] mb-[14px] grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px] min-[430px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_42px] gap-[6px] min-[390px]:gap-[7px] min-[430px]:gap-[8px] w-full">
        <button
          type="button"
          className="flex items-center justify-center gap-[5px] h-[40px] min-[430px]:h-[42px] rounded-[10px] bg-[#EFEFEF] text-[#111111] text-[14px] font-[600] leading-none hover:bg-[#E5E5E5] transition-colors duration-[160ms] ease-out border-0 cursor-pointer"
        >
          Following
          <ChevronDown size={15} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="flex items-center justify-center h-[40px] min-[430px]:h-[42px] rounded-[10px] bg-[#EFEFEF] text-[#111111] text-[14px] font-[600] leading-none hover:bg-[#E5E5E5] transition-colors duration-[160ms] ease-out border-0 cursor-pointer"
        >
          Message
        </button>
        <button
          type="button"
          aria-label="Add person"
          className="flex items-center justify-center shrink-0 w-[40px] min-[430px]:w-[42px] h-[40px] min-[430px]:h-[42px] rounded-[10px] bg-[#EFEFEF] text-[#111111] hover:bg-[#E5E5E5] transition-colors duration-[160ms] ease-out border-0 cursor-pointer"
        >
          <UserPlus size={20} strokeWidth={2} color="#111111" />
        </button>
      </div>

      {/* Visual Navigation Tabs: 4 Uniform Tabs (Posts, Reels, Reposts, Tagged) */}
      <div className="grid grid-cols-4 w-full h-[44px] border-b border-[#EFEFEF]">
        {/* 1. Posts / Grid (Active) */}
        <div className="relative flex items-center justify-center h-full text-[#111111]">
          <svg
            viewBox="0 0 24 24"
            className="w-[21px] h-[21px] min-[390px]:w-[22px] min-[390px]:h-[22px] fill-current"
            aria-hidden="true"
          >
            <rect x="2.5" y="2.5" width="5" height="5" rx="0.75" />
            <rect x="9.5" y="2.5" width="5" height="5" rx="0.75" />
            <rect x="16.5" y="2.5" width="5" height="5" rx="0.75" />
            <rect x="2.5" y="9.5" width="5" height="5" rx="0.75" />
            <rect x="9.5" y="9.5" width="5" height="5" rx="0.75" />
            <rect x="16.5" y="9.5" width="5" height="5" rx="0.75" />
            <rect x="2.5" y="16.5" width="5" height="5" rx="0.75" />
            <rect x="9.5" y="16.5" width="5" height="5" rx="0.75" />
            <rect x="16.5" y="16.5" width="5" height="5" rx="0.75" />
          </svg>
          <div className="absolute bottom-0 w-[40px] h-[2.5px] bg-[#111111] rounded-t-[1px]" />
        </div>

        {/* 2. Reels */}
        <div className="flex items-center justify-center h-full text-[#8E8E8E]">
          <svg
            viewBox="0 0 24 24"
            className="w-[22px] h-[22px] min-[390px]:w-[23px] min-[390px]:h-[23px] fill-none stroke-current stroke-[1.9]"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="3" x2="7.5" y2="9" />
            <line x1="16.5" y1="3" x2="15" y2="9" />
            <polygon points="10,12 15,15 10,18" fill="currentColor" stroke="none" />
          </svg>
        </div>

        {/* 3. Reposts */}
        <div className="flex items-center justify-center h-full text-[#8E8E8E]">
          <svg
            viewBox="0 0 24 24"
            className="w-[22px] h-[22px] min-[390px]:w-[23px] min-[390px]:h-[23px] fill-none stroke-current stroke-[2]"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M17 2l4 4-4 4" />
            <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
            <path d="M7 22l-4-4 4-4" />
            <path d="M21 13v1a4 4 0 0 1-4 4H3" />
          </svg>
        </div>

        {/* 4. Tagged */}
        <div className="flex items-center justify-center h-full text-[#8E8E8E]">
          <svg
            viewBox="0 0 24 24"
            className="w-[22px] h-[22px] min-[390px]:w-[23px] min-[390px]:h-[23px] fill-none stroke-current stroke-[1.9]"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <circle cx="12" cy="10" r="3" />
            <path d="M6.5 18.5c.8-2.3 3.1-3.5 5.5-3.5s4.7 1.2 5.5 3.5" />
          </svg>
        </div>
      </div>

      {/* Media Grid or Private Message */}
      {profile.is_private && posts.length === 0 ? (
        <div className="p-[16px] bg-white">
          <RestrictedProfileNotice
            title="This profile is private"
            description="Make your profile public to continue."
          />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-[1px] w-full mt-[1px] bg-white">
          {posts.length > 0 ? (
            posts.map((post, i) => (
              <div className="relative aspect-square w-full bg-neutral-100 overflow-hidden rounded-[0px]" key={post.id || i}>
                <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
                {post.is_video && (
                  <span
                    className="absolute top-[6px] right-[6px] text-[#FFFFFF] pointer-events-none"
                    style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))" }}
                  >
                    <Film className="w-[14px] h-[14px] min-[390px]:w-[15px] min-[390px]:h-[15px] stroke-[2.2]" />
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-3 py-8 text-center text-[12.5px] text-neutral-400 bg-white">
              No posts yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
