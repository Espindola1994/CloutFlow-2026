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
    <div className="w-full bg-[#ffffff] text-[#262626] rounded-[24px] overflow-hidden border border-neutral-200/90 shadow-sm select-none font-sans">
      {/* Top Bar: Back | Centered Username | Bell & Menu (03 Reference) */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
        <button type="button" onClick={onClose} aria-label="Back" className="p-1 -ml-1 text-neutral-900">
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>
        <div className="flex items-center gap-1.5 min-w-0">
          <strong className="text-[17px] font-bold text-neutral-900 truncate max-w-[200px]">
            {profile.username}
          </strong>
          {profile.is_verified && (
            <span className="w-3.5 h-3.5 rounded-full bg-[#0095F6] text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">
              ✓
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-neutral-900">
          <Bell className="w-5 h-5 stroke-[2]" />
          <MoreHorizontal className="w-5 h-5 stroke-[2]" />
        </div>
      </div>

      {/* Main Profile Row (03 Reference): Large Avatar (Left) + Stats (Right) */}
      <div className="px-5 pt-3 pb-2 flex items-center gap-6">
        {/* Left: Large Avatar (86px) with Subtle Ring */}
        <div className="relative flex-shrink-0">
          <div className="w-[86px] h-[86px] rounded-full p-[3px] bg-gradient-to-tr from-neutral-200 via-neutral-100 to-neutral-300 shadow-sm">
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-full h-full object-cover rounded-full bg-neutral-100"
            />
          </div>
        </div>

        {/* Right: Numbers with bolder hierarchy */}
        <div className="flex-1 flex items-center justify-around text-center">
          <div>
            <b className="text-[18px] font-bold text-neutral-900 block leading-tight">
              {formatCount(profile.posts_count)}
            </b>
            <span className="text-[13px] text-neutral-600 font-normal mt-0.5 block">posts</span>
          </div>
          <div>
            <b className="text-[18px] font-bold text-neutral-900 block leading-tight">
              {formatCount(profile.followers_count)}
            </b>
            <span className="text-[13px] text-neutral-600 font-normal mt-0.5 block">seguidores</span>
          </div>
          <div>
            <b className="text-[18px] font-bold text-neutral-900 block leading-tight">
              {formatCount(profile.following_count)}
            </b>
            <span className="text-[13px] text-neutral-600 font-normal mt-0.5 block">seguindo</span>
          </div>
        </div>
      </div>

      {/* Full Name & Bio Section (03 Reference) */}
      <div className="px-5 py-1 text-[13.5px]">
        <strong className="font-bold text-neutral-900 block text-[14.5px] truncate">
          {profile.full_name || profile.username}
        </strong>

        {hasValue(profile.bio) && (
          <p className="text-neutral-800 mt-1 leading-snug line-clamp-3 whitespace-pre-line">
            {profile.bio}
          </p>
        )}

        {hasValue(profile.link) && (
          <div className="mt-1 flex items-center gap-1 font-semibold text-[#00376B] text-[13px] truncate">
            <span>🔗</span>
            <span className="truncate hover:underline">{profile.link?.replace(/^https?:\/\//, "")}</span>
          </div>
        )}
      </div>

      {/* Action Buttons: Following / Follow | Message | Add Person */}
      <div className="px-5 py-2.5 flex items-center gap-2">
        <button
          type="button"
          className="flex-1 h-[34px] rounded-[8px] bg-neutral-100 text-neutral-900 text-[13.5px] font-semibold flex items-center justify-center gap-1 hover:bg-neutral-200 active:opacity-80 transition-colors"
        >
          <span>Seguindo</span>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-600" />
        </button>
        <button
          type="button"
          className="flex-1 h-[34px] rounded-[8px] bg-neutral-100 text-neutral-900 text-[13.5px] font-semibold flex items-center justify-center hover:bg-neutral-200 active:opacity-80 transition-colors"
        >
          Mensagem
        </button>
        <button
          type="button"
          aria-label="Add person"
          className="w-[34px] h-[34px] rounded-[8px] bg-neutral-100 text-neutral-800 flex items-center justify-center hover:bg-neutral-200 active:opacity-80 transition-colors flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Visual Navigation Tabs */}
      <div className="flex items-center justify-around border-b border-neutral-200 mt-1">
        <div className="flex-1 py-2.5 flex justify-center text-neutral-900 border-b-[2px] border-neutral-900">
          <Grid3X3 className="w-[19px] h-[19px] stroke-[2.2]" />
        </div>
        <div className="flex-1 py-2.5 flex justify-center text-neutral-400 hover:text-neutral-600">
          <Film className="w-[19px] h-[19px] stroke-[2]" />
        </div>
        <div className="flex-1 py-2.5 flex justify-center text-neutral-400 hover:text-neutral-600">
          <UserCheck className="w-[19px] h-[19px] stroke-[2]" />
        </div>
      </div>

      {/* Media Grid or Private Message */}
      {profile.is_private ? (
        <div className="py-10 text-center px-4 bg-white">
          <div className="w-12 h-12 rounded-full border-2 border-neutral-300 flex items-center justify-center mx-auto mb-2 text-neutral-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <strong className="text-[15px] font-bold text-neutral-900 block">Esta conta é privada</strong>
          <span className="text-[13px] text-neutral-500 block mt-1">Siga esta conta para ver suas fotos e vídeos.</span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-[1.5px] p-[1.5px] bg-neutral-100">
          {posts.length > 0 ? (
            posts.map((post, i) => (
              <div className="relative aspect-square bg-neutral-200 overflow-hidden" key={post.id || i}>
                <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
                {post.is_video && (
                  <span className="absolute top-1.5 right-1.5 text-white drop-shadow">
                    <Film className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-3 py-6 text-center text-xs text-neutral-400 bg-white">
              Nenhuma publicação recente
            </div>
          )}
        </div>
      )}
    </div>
  );
}
