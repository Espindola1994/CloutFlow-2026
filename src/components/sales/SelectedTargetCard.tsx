"use client";

import React from "react";
import { CheckCircle2, User, Video, Link2, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { PlatformTheme } from "@/config/service-sales.config";
import { FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

interface SelectedTargetCardProps {
  platform: string;
  service: string;
  theme: PlatformTheme;
  targetType: string | null;
  targetValue: string | null;
  targetUrl: string | null;
  socialUsername: string | null;
  profileUrl: string | null;
  verifiedTargetData: Record<string, any> | null;
  onSelectTarget: () => void;
}

function PlatformBadgeIcon({ platform }: { platform: string }) {
  if (platform === "instagram") return <FaInstagram className="w-3.5 h-3.5 text-pink-500" />;
  if (platform === "tiktok") return <FaTiktok className="w-3.5 h-3.5 text-cyan-400" />;
  if (platform === "twitter") return <FaXTwitter className="w-3.5 h-3.5 text-neutral-200" />;
  return <FaYoutube className="w-3.5 h-3.5 text-red-500" />;
}

export function SelectedTargetCard({
  platform,
  service,
  theme,
  targetType,
  targetValue,
  targetUrl,
  socialUsername,
  profileUrl,
  verifiedTargetData,
  onSelectTarget,
}: SelectedTargetCardProps) {
  const isFollowers = service === "followers";
  const hasTarget = Boolean(
    (isFollowers && (socialUsername || targetValue)) ||
    (!isFollowers && (targetUrl || socialUsername || targetValue))
  );

  const displayHandle = (socialUsername || targetValue || "").replace(/^@+/, "");
  const displayName = verifiedTargetData?.full_name || verifiedTargetData?.display_name || verifiedTargetData?.title || null;
  const avatarUrl = verifiedTargetData?.avatar_url || verifiedTargetData?.profile_pic_url || verifiedTargetData?.picture || null;
  const thumbnailUrl = verifiedTargetData?.thumbnail_url || verifiedTargetData?.thumbnail || null;
  
  // Real counts if available
  const followersCount = verifiedTargetData?.follower_count || verifiedTargetData?.followers_count || verifiedTargetData?.subscribers_count || null;
  const postsCount = verifiedTargetData?.media_count || verifiedTargetData?.posts_count || verifiedTargetData?.video_count || null;
  const followingCount = verifiedTargetData?.following_count || null;

  if (!hasTarget) {
    return (
      <div className="w-full max-w-2xl mx-auto p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md text-center space-y-3.5 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20">
          <Sparkles className="w-3 h-3" />
          <span>TARGET SELECTION REQUIRED</span>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm md:text-base font-bold text-white tracking-tight">
            Select your {isFollowers ? "profile" : "content"} to continue
          </h4>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Your growth package will be customized and connected to your verified {platform} {isFollowers ? "handle" : "link"}.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={onSelectTarget}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-lg hover:scale-105"
            style={{ background: theme.gradient }}
          >
            <span>Select {isFollowers ? "Profile Handle" : "Content URL"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl bg-[#0e131f]/90 border border-neutral-800/90 shadow-2xl backdrop-blur-xl p-4 sm:p-5 relative overflow-hidden">
      {/* Subtle top indicator bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: theme.gradient }}
      />

      <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-neutral-800/80">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
            <span>Target Verified</span>
          </span>
          <span className="text-[11px] text-neutral-400 hidden sm:inline-block">
            Ready for growth
          </span>
        </div>

        <button
          type="button"
          onClick={onSelectTarget}
          className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors underline cursor-pointer"
        >
          Change
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Avatar or Thumbnail */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-neutral-800 border-2 border-neutral-700/80 shrink-0 flex items-center justify-center relative shadow-md">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayHandle} className="w-full h-full object-cover" />
            ) : thumbnailUrl ? (
              <img src={thumbnailUrl} alt="Content" className="w-full h-full object-cover" />
            ) : isFollowers ? (
              <User className="w-7 h-7 text-neutral-400" />
            ) : (
              <Video className="w-7 h-7 text-neutral-400" />
            )}
          </div>

          {/* Account Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                {displayHandle ? `@${displayHandle}` : "Selected Destination"}
              </h3>
              <PlatformBadgeIcon platform={platform} />
            </div>

            {displayName && (
              <p className="text-xs text-neutral-300 font-medium truncate">{displayName}</p>
            )}

            {targetUrl && !isFollowers && (
              <p className="text-[11px] text-neutral-400 truncate mt-0.5 max-w-[280px]" title={targetUrl}>
                <Link2 className="w-3 h-3 inline mr-1 text-neutral-500" />
                {targetUrl}
              </p>
            )}
          </div>
        </div>

        {/* Real Stats Pill when available */}
        {followersCount !== null && (
          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-around sm:justify-end px-3 py-2 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-center">
            {postsCount !== null && (
              <div className="px-2">
                <span className="block text-xs font-bold text-white">{Number(postsCount).toLocaleString()}</span>
                <span className="text-[10px] text-neutral-400 uppercase font-medium">Posts</span>
              </div>
            )}
            <div className="px-2 border-l border-neutral-800">
              <span className="block text-xs font-bold text-white">{Number(followersCount).toLocaleString()}</span>
              <span className="text-[10px] text-neutral-400 uppercase font-medium">{service}</span>
            </div>
            {followingCount !== null && (
              <div className="px-2 border-l border-neutral-800">
                <span className="block text-xs font-bold text-white">{Number(followingCount).toLocaleString()}</span>
                <span className="text-[10px] text-neutral-400 uppercase font-medium">Following</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
