import React from "react";
import { ArrowLeft, Search, MoreHorizontal, Briefcase, GraduationCap, MapPin, Home, Tag, Globe, UserCheck, MessageCircle } from "lucide-react";
import { FacebookVerifiedProfile } from "@/lib/social/types";

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

export function FacebookPreview({ profile, onClose }: { profile: FacebookVerifiedProfile; onClose: () => void }) {
  const hasCover = hasValue(profile.cover_url);
  const hasFollowers = profile.followers_count !== undefined && profile.followers_count > 0;
  const hasFollowing = profile.following_count !== undefined && profile.following_count > 0;
  const details = hasValue(profile.details) ? profile.details! : [];

  return (
    <div className="w-full bg-[#ffffff] text-[#050505] rounded-2xl overflow-hidden border border-neutral-200/80 shadow-sm select-none font-sans">
      {/* Cover Banner with Overlaid Top Bar */}
      <div className="relative h-28 w-full bg-gradient-to-r from-[#1877F2]/20 to-[#1877F2]/40 overflow-hidden">
        {hasCover ? (
          <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-neutral-200/80" />
        )}

        {/* Top Controls Overlay */}
        <div className="absolute top-0 inset-x-0 flex items-center justify-between px-3 py-2 text-white drop-shadow-md z-10">
          <button type="button" onClick={onClose} aria-label="Back" className="p-1 rounded-full bg-black/20 backdrop-blur-sm">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-full bg-black/20 backdrop-blur-sm">
              <Search className="w-3.5 h-3.5 text-white" />
            </span>
            <span className="p-1 rounded-full bg-black/20 backdrop-blur-sm">
              <MoreHorizontal className="w-3.5 h-3.5 text-white" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Profile Info Sheet with Overlapping Avatar */}
      <div className="px-4 pb-3 relative">
        {/* Avatar partially overlapping cover */}
        <div className="-mt-11 mb-2 inline-block">
          <div className="w-[84px] h-[84px] rounded-full p-[3px] bg-white shadow-md">
            <img
              src={profile.avatar_url}
              alt={profile.full_name || profile.username}
              className="w-full h-full object-cover rounded-full bg-neutral-100"
            />
          </div>
        </div>

        {/* Name & Headline */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <h3 className="text-lg font-bold text-neutral-900 leading-tight">
            {profile.full_name || profile.username}
          </h3>
          {profile.is_verified && (
            <span className="w-4 h-4 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[10px] font-bold">
              ✓
            </span>
          )}
        </div>

        {/* Metrics line (Followers, Following if exists) */}
        {hasFollowers && (
          <p className="text-xs text-neutral-600 font-medium mt-0.5">
            <b>{formatCount(profile.followers_count)}</b> seguidores
            {hasFollowing && <span> · <b>{formatCount(profile.following_count)}</b> seguindo</span>}
          </p>
        )}

        {/* Action Buttons: Follow / Friends | Message | More */}
        <div className="mt-2.5 flex items-center gap-1.5">
          <button
            type="button"
            className="flex-1 h-8 rounded-md bg-[#1877F2] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#166fe5] transition-colors shadow-sm"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Seguir</span>
          </button>
          <button
            type="button"
            className="flex-1 h-8 rounded-md bg-[#E4E6EB] text-neutral-900 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#d8dadf] transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-neutral-700" />
            <span>Mensagem</span>
          </button>
          <button
            type="button"
            className="w-8 h-8 rounded-md bg-[#E4E6EB] text-neutral-800 flex items-center justify-center hover:bg-[#d8dadf] transition-colors flex-shrink-0"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Visual Pills: Tudo | Fotos | Reels */}
        <div className="flex items-center gap-2 mt-3 pb-1 border-b border-neutral-100">
          <span className="px-3 py-1 rounded-full bg-[#E7F3FF] text-[#1877F2] text-xs font-semibold">
            Tudo
          </span>
          <span className="px-3 py-1 rounded-full text-neutral-600 text-xs font-medium">
            Fotos
          </span>
          <span className="px-3 py-1 rounded-full text-neutral-600 text-xs font-medium">
            Reels
          </span>
        </div>

        {/* Details Section (Apenas com dados reais) */}
        {details.length > 0 && (
          <div className="mt-2.5 text-xs space-y-1.5 text-neutral-700">
            <h4 className="font-bold text-neutral-900 text-xs mb-1">Dados pessoais</h4>
            {details.map((d, idx) => (
              <div key={idx} className="flex items-center gap-2 text-neutral-700 leading-snug">
                {d.label === "Trabalho" && <Briefcase className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />}
                {d.label === "Educação" && <GraduationCap className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />}
                {d.label === "Cidade" && <MapPin className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />}
                {d.label === "De" && <Home className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />}
                {d.label === "Categoria" && <Tag className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />}
                {d.label === "Website" && <Globe className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />}
                {!["Trabalho", "Educação", "Cidade", "De", "Categoria", "Website"].includes(d.label || "") && (
                  <span className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0 text-center font-bold">·</span>
                )}
                <span className="truncate">
                  {d.label && !["Trabalho", "Educação", "Cidade", "De", "Categoria", "Website"].includes(d.label) ? `${d.label}: ` : ""}
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
