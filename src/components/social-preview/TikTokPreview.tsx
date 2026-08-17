import React from "react";
import { Grid3X3, Bookmark, Repeat2, UserPlus, ArrowLeft, Bell, Share2, Link2, Play } from "lucide-react";
import { TikTokVerifiedProfile } from "@/lib/social/types";
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

export function TikTokPreview({ profile, onClose }: { profile: TikTokVerifiedProfile; onClose: () => void }) {
  const videos = hasValue(profile.videos) ? profile.videos.slice(0, 3) : [];
  const isVerified = Boolean(profile.is_verified || (profile as any).verified || (profile as any).isVerified);
  const hasStory = Boolean(profile.has_active_story || (profile as any).has_story || (profile as any).has_stories || (profile as any).story_available);

  return (
    <div className="w-full bg-[#ffffff] text-[#161823] rounded-[24px] overflow-hidden border border-neutral-200/90 shadow-sm select-none font-sans">
      {/* Top Header: Back Arrow | Actions */}
      <div className="flex items-center justify-between px-[18px] pt-[14px]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="active:opacity-70"
        >
          <ArrowLeft size={26} strokeWidth={2.1} color="#111111" />
        </button>
        <div className="flex items-center gap-[18px]">
          <Bell size={26} strokeWidth={2.1} color="#111111" />
          <Share2 size={27} strokeWidth={2.1} color="#111111" />
        </div>
      </div>

      {/* Main Profile Header: Identity, Avatar, Metrics in CSS Grid */}
      <div
        className="px-[18px] mt-[18px] mb-[12px] w-full grid"
        style={{
          gridTemplateColumns: "minmax(0, 1fr) 82px",
          gridTemplateAreas: `
            "identity avatar"
            "metrics  avatar"
          `,
          columnGap: "12px",
        }}
      >
        {/* Left Top: Identity */}
        <div style={{ gridArea: "identity" }} className="min-w-0 flex flex-col justify-end">
          <div className="flex items-center gap-[5px]">
            <h2 className="text-[20px] min-[390px]:text-[21px] min-[430px]:text-[22px] font-[800] leading-[1.05] text-[#111111] truncate">
              {profile.full_name || profile.username}
            </h2>
            {isVerified && <VerifiedBadge platform="tiktok" size={16} />}
          </div>
          <span className="text-[12.5px] font-[500] leading-[1.2] text-[#8A8A8A] mt-[4px] block truncate">
            @{profile.username}
          </span>
        </div>

        {/* Right: Avatar with Conditional Story Ring */}
        <div
          className="justify-self-end self-start rounded-full shrink-0 flex items-center justify-center"
          style={{ gridArea: "avatar" }}
        >
          {hasStory ? (
            <div
              className="rounded-full flex items-center justify-center p-[4px] w-[76px] h-[76px] min-[390px]:w-[78px] min-[390px]:h-[78px] min-[430px]:w-[82px] min-[430px]:h-[82px]"
              style={{
                background: "conic-gradient(from 0deg, #25F4EE, #20D5EC, #2AD5C4, #25F4EE)",
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
            <div className="w-[76px] h-[76px] min-[390px]:w-[78px] min-[390px]:h-[78px] min-[430px]:w-[82px] min-[430px]:h-[82px] rounded-full p-[1px] border border-[#E5E5E5] bg-white flex items-center justify-center">
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-full h-full object-cover rounded-full bg-neutral-100"
              />
            </div>
          )}
        </div>

        {/* Left Bottom: Metrics */}
        <div
          style={{ gridArea: "metrics" }}
          className="grid grid-cols-3 w-full whitespace-nowrap mt-[14px]"
        >
          <div className="text-left">
            <b className="text-[16.5px] font-[800] leading-none text-[#111111] block">
              {formatCount(profile.following_count)}
            </b>
            <span className="text-[10.5px] font-[400] leading-[1.1] text-[#8A8A8A] block mt-[3px]">
              Following
            </span>
          </div>
          <div className="text-center">
            <b className="text-[16.5px] font-[800] leading-none text-[#111111] block">
              {formatCount(profile.followers_count)}
            </b>
            <span className="text-[10.5px] font-[400] leading-[1.1] text-[#8A8A8A] block mt-[3px]">
              Followers
            </span>
          </div>
          <div className="text-center">
            <b className="text-[16.5px] font-[800] leading-none text-[#111111] block">
              {formatCount(profile.likes_count)}
            </b>
            <span className="text-[10.5px] font-[400] leading-[1.1] text-[#8A8A8A] block mt-[3px]">
              Likes
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons: Follow | Message | User+ */}
      <div className="px-[18px] mb-[16px] grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px] gap-[7px] w-full">
        <button
          type="button"
          className="h-[40px] rounded-[10px] bg-[#FE2C55] text-[#FFFFFF] text-[13.5px] font-[700] leading-none flex items-center justify-center border-0 cursor-pointer whitespace-nowrap hover:bg-[#E9274D] hover:-translate-y-[1px] active:opacity-90 transition-all duration-[180ms] ease-out"
        >
          Follow
        </button>
        <button
          type="button"
          className="h-[40px] rounded-[10px] bg-[#F1F1F2] text-[#111111] text-[13.5px] font-[600] leading-none flex items-center justify-center border-0 cursor-pointer whitespace-nowrap hover:bg-[#E7E7E9] active:opacity-90 transition-colors duration-[180ms] ease-out"
        >
          Message
        </button>
        <button
          type="button"
          aria-label="Add person"
          className="w-[40px] h-[40px] rounded-[10px] bg-[#F1F1F2] text-[#111111] flex items-center justify-center border-0 cursor-pointer hover:bg-[#E7E7E9] active:opacity-90 transition-colors duration-[180ms] ease-out shrink-0"
        >
          <UserPlus size={19} strokeWidth={2} color="#111111" />
        </button>
      </div>

      {/* Bio Section & Bio Link */}
      {(hasValue(profile.bio) || hasValue(profile.link)) && (
        <div className="px-[18px] mb-[20px] text-left">
          {hasValue(profile.bio) && (
            <div className="text-[13.5px] min-[390px]:text-[14px] min-[430px]:text-[14.5px] leading-[1.38] font-[400] text-[#171717] whitespace-pre-line line-clamp-4">
              {profile.bio}
            </div>
          )}
          {hasValue(profile.link) && (
            <div className="mt-[6px] flex items-center gap-[6px] text-[13.5px] min-[390px]:text-[14px] font-[600] text-[#2b5ba8]">
              <Link2 size={16} strokeWidth={2} className="shrink-0" />
              <span className="truncate hover:underline">
                {profile.link?.replace(/^https?:\/\//, "")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Visual Navigation Tabs */}
      <div className="grid grid-cols-2 w-full h-[42px] border-b border-[#EFEFEF]">
        {/* Posts Tab */}
        <div className="relative flex items-center justify-center h-full">
          {/* Custom 3-column x 3-row TikTok posts icon */}
          <div className="w-[22px] h-[22px] flex items-center justify-center">
            <div className="grid grid-cols-3 gap-[2px] w-[18px] h-[19px]">
              <span className="w-[4.5px] h-[5px] bg-[#111111] rounded-[1px]" />
              <span className="w-[4.5px] h-[5px] bg-[#111111] rounded-[1px]" />
              <span className="w-[4.5px] h-[5px] bg-[#111111] rounded-[1px]" />

              <span className="w-[4.5px] h-[5px] bg-[#111111] rounded-[1px]" />
              <span className="w-[4.5px] h-[5px] bg-[#111111] rounded-[1px]" />
              <span className="w-[4.5px] h-[5px] bg-[#111111] rounded-[1px]" />

              <span className="w-[4.5px] h-[5px] bg-[#111111] rounded-[1px]" />
              <span className="w-[4.5px] h-[5px] bg-[#111111] rounded-[1px]" />
              <span className="w-[4.5px] h-[5px] bg-[#111111] rounded-[1px]" />
            </div>
          </div>
          <div className="absolute bottom-0 w-[32px] h-[3px] bg-[#111111] rounded-[2px]" />
        </div>

        {/* Repost Tab */}
        <div className="flex items-center justify-center h-full">
          <Repeat2 size={21} strokeWidth={2} color="#8A8A8A" />
        </div>
      </div>

      {/* 3-Column Video Grid or Private Notice */}
      {profile.is_private && videos.length === 0 ? (
        <div className="p-[16px] bg-white">
          <RestrictedProfileNotice
            title="This profile is private"
            description="Make your profile public to continue."
          />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-[1px] w-full mt-[1px] bg-white">
          {videos.length > 0 ? (
            videos.map((vid: any, idx) => (
              <div key={vid.id || idx} className="relative w-full aspect-[3/4] overflow-hidden rounded-[0px] bg-neutral-900">
                {vid.thumbnail_url ? (
                  <img src={vid.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-white/20">
                    <Grid3X3 className="w-6 h-6" />
                  </div>
                )}

                {/* Pinned Badge (rendered only if real data indicates pinned) */}
                {Boolean(vid.is_pinned || vid.pinned || vid.isPinned || vid.is_top || vid.isTop) && (
                  <div className="absolute top-[6px] left-[6px] bg-[#FE2C55] text-[#FFFFFF] text-[10px] min-[390px]:text-[10.5px] font-[700] px-[6px] py-[3px] rounded-[3.5px] leading-none select-none pointer-events-none">
                    Pinned
                  </div>
                )}

                {/* Views Counter */}
                <div
                  className="absolute left-[6px] bottom-[5px] flex items-center gap-[4px] text-[#FFFFFF] text-[12px] font-[600] leading-none pointer-events-none"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.45)" }}
                >
                  <Play size={11} className="fill-[#FFFFFF] text-[#FFFFFF]" />
                  <span>{formatCount(vid.views_count ?? vid.play_count ?? vid.views ?? 0)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 py-6 text-center text-xs text-neutral-400 bg-white">
              {profile.is_private ? "This account is private" : "No recent videos"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
