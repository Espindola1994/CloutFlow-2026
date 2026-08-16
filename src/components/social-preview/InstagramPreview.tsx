import React from "react";
import { ArrowLeft, Bell, MoreHorizontal, ChevronDown, UserPlus, Grid3X3, Film, Bookmark, UserCheck } from "lucide-react";
import { InstagramVerifiedProfile } from "@/lib/social/types";

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

  return (
    <div className="w-full bg-[#ffffff] text-[#262626] rounded-2xl overflow-hidden border border-neutral-200/80 shadow-sm select-none font-sans">
      {/* Top Bar: Back | Username | Bell | Menu */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100">
        <div className="flex items-center gap-2 min-w-0">
          <ArrowLeft className="w-4 h-4 text-neutral-800 flex-shrink-0 cursor-pointer" onClick={onClose} />
          <strong className="text-sm font-bold text-neutral-900 truncate max-w-[180px]">
            {profile.username}
          </strong>
          {profile.is_verified && (
            <span className="w-3.5 h-3.5 rounded-full bg-[#0095F6] text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">
              ✓
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-neutral-800">
          <Bell className="w-4 h-4" />
          <MoreHorizontal className="w-4 h-4" />
        </div>
      </div>

      {/* Main Profile Row: Avatar (Left) + Stats (Right) */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-5">
        {/* Left: Avatar with Subtle Ring */}
        <div className="relative flex-shrink-0">
          <div className="w-[76px] h-[76px] rounded-full p-[2px] bg-gradient-to-tr from-neutral-200 to-neutral-300">
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-full h-full object-cover rounded-full bg-neutral-100"
            />
          </div>
        </div>

        {/* Right: Counters */}
        <div className="flex-1 flex items-center justify-around text-center">
          <div>
            <b className="text-sm font-bold text-neutral-900 block leading-tight">
              {formatCount(profile.posts_count)}
            </b>
            <span className="text-[11px] text-neutral-600 font-normal">posts</span>
          </div>
          <div>
            <b className="text-sm font-bold text-neutral-900 block leading-tight">
              {formatCount(profile.followers_count)}
            </b>
            <span className="text-[11px] text-neutral-600 font-normal">seguidores</span>
          </div>
          <div>
            <b className="text-sm font-bold text-neutral-900 block leading-tight">
              {formatCount(profile.following_count)}
            </b>
            <span className="text-[11px] text-neutral-600 font-normal">seguindo</span>
          </div>
        </div>
      </div>

      {/* Full Name & Bio */}
      <div className="px-4 py-1 text-xs">
        <strong className="font-semibold text-neutral-900 block truncate">
          {profile.full_name || profile.username}
        </strong>

        {hasValue(profile.bio) && (
          <p className="text-neutral-800 mt-0.5 leading-snug line-clamp-3 whitespace-pre-line">
            {profile.bio}
          </p>
        )}

        {hasValue(profile.link) && (
          <div className="mt-1 flex items-center gap-1 font-semibold text-[#00376B] truncate">
            <span>🔗</span>
            <span className="truncate hover:underline">{profile.link?.replace(/^https?:\/\//, "")}</span>
          </div>
        )}
      </div>

      {/* Action Buttons: Following / Follow | Message | Add Person */}
      <div className="px-4 py-2 flex items-center gap-1.5">
        <button
          type="button"
          className="flex-1 h-7 rounded-lg bg-neutral-100 text-neutral-900 text-xs font-semibold flex items-center justify-center gap-1 hover:bg-neutral-200 transition-colors"
        >
          <span>Seguindo</span>
          <ChevronDown className="w-3 h-3 text-neutral-600" />
        </button>
        <button
          type="button"
          className="flex-1 h-7 rounded-lg bg-neutral-100 text-neutral-900 text-xs font-semibold flex items-center justify-center hover:bg-neutral-200 transition-colors"
        >
          Mensagem
        </button>
        <button
          type="button"
          aria-label="Add person"
          className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center hover:bg-neutral-200 transition-colors flex-shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Visual Navigation Tabs */}
      <div className="flex items-center justify-around border-b border-neutral-200 mt-1">
        <div className="flex-1 py-2 flex justify-center text-neutral-900 border-b-2 border-neutral-900">
          <Grid3X3 className="w-4 h-4" />
        </div>
        <div className="flex-1 py-2 flex justify-center text-neutral-400 hover:text-neutral-600">
          <Film className="w-4 h-4" />
        </div>
        <div className="flex-1 py-2 flex justify-center text-neutral-400 hover:text-neutral-600">
          <UserCheck className="w-4 h-4" />
        </div>
      </div>

      {/* Square Media Grid (3 columns, exact square aspect-ratio) */}
      <div className="grid grid-cols-3 gap-0.5 p-0.5 bg-neutral-100">
        {posts.length > 0 ? (
          posts.map((post, i) => (
            <div className="relative aspect-square bg-neutral-200 overflow-hidden" key={post.id || i}>
              <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
              {post.is_video && (
                <span className="absolute top-1.5 right-1.5 text-white drop-shadow">
                  <Film className="w-3 h-3" />
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-3 py-6 text-center text-xs text-neutral-400 bg-white">
            {profile.is_private ? "Esta conta é privada" : "Nenhuma publicação recente"}
          </div>
        )}
      </div>
    </div>
  );
}
