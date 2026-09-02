"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CircleAlert,
  Link2,
  LockKeyhole,
  Mail,
  X,
} from "lucide-react";

import instagramIcon from "@/assets/home-icons-vector/instagram.svg";
import tiktokIcon from "@/assets/home-icons-vector/tiktok.svg";
import twitterIcon from "@/assets/home-icons-vector/twitter.svg";
import youtubeIcon from "@/assets/home-icons-vector/youtube.svg";
import { useFunnelStore } from "@/stores/funnel.store";

import {
  VerifiedSocialProfile,
} from "@/lib/social/types";
import { validateEmailFormat } from "@/lib/social/normalize";

type PlatformId = "instagram" | "tiktok" | "twitter" | "youtube";
type SearchMode = "username" | "link";
type Step = 1 | 2 | 3;

type Props = {
  platform: PlatformId;
  service: string;
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
};

const platformMeta = {
  instagram: {
    label: "Instagram",
    color: "#E1306C",
    soft: "#FFF0F5",
    icon: instagramIcon,
    button: "linear-gradient(90deg, #833AB4 0%, #C13584 26%, #E1306C 50%, #F56040 74%, #FCAF45 100%)",
  },
  tiktok: {
    label: "TikTok",
    color: "#FE2C55",
    soft: "#F2FFFF",
    icon: tiktokIcon,
    button: "linear-gradient(110deg, #080808 0%, #0a0d0e 30%, #155054 66%, #9b2948 100%)",
  },
  twitter: {
    label: "X / Twitter",
    color: "#0F1419",
    soft: "#f7f9fa",
    icon: twitterIcon,
    button: "linear-gradient(110deg, #050505 0%, #101010 28%, #242424 58%, #151515 78%, #050505 100%)",
  },
  youtube: {
    label: "YouTube",
    color: "#ff0000",
    soft: "#fff0f0",
    icon: youtubeIcon,
    button: "linear-gradient(110deg, #C9000B 0%, #E6000C 28%, #FF0000 55%, #F21822 76%, #D5000C 100%)",
  },
} as const;

import {
  InstagramPreview,
  TikTokPreview,
  YouTubePreview,
  TwitterPreview,
} from "./social-preview";


const DEV_AVATAR_DATA_URI = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8B5CF6"/><stop offset=".5" stop-color="#EC4899"/><stop offset="1" stop-color="#FB923C"/></linearGradient></defs>
  <rect width="160" height="160" rx="80" fill="url(#g)"/>
  <circle cx="80" cy="62" r="28" fill="white" fill-opacity=".94"/>
  <path d="M30 142c8-34 28-50 50-50s42 16 50 50" fill="white" fill-opacity=".94"/>
</svg>`);

function createDevPreviewProfile(platform: PlatformId, username: string): VerifiedSocialProfile {
  const clean = (username || "preview_user").replace(/^@+/, "");
  if (platform === "instagram") {
    return {
      platform: "instagram", username: clean, full_name: "Preview Profile", avatar_url: DEV_AVATAR_DATA_URI,
      posts_count: 128, followers_count: 24800, following_count: 612, bio: "Local preview profile for Step 3.",
      is_private: false, is_verified: true, has_active_story: true, posts: [],
    };
  }
  if (platform === "tiktok") {
    return {
      platform: "tiktok", username: clean, full_name: "Preview Profile", avatar_url: DEV_AVATAR_DATA_URI,
      following_count: 412, followers_count: 58200, likes_count: 310000, bio: "Local preview profile for Step 3.",
      is_private: false, is_verified: true, has_active_story: true, videos: [],
    };
  }
  if (platform === "twitter") {
    return {
      platform: "twitter", username: clean, full_name: "Preview Profile", avatar_url: DEV_AVATAR_DATA_URI,
      followers_count: 36700, following_count: 845, bio: "Local preview profile for Step 3.",
      is_private: false, is_verified: true, pinned_tweet: null,
    };
  }
  return {
    platform: "youtube", channel_id: "UC_LOCAL_PREVIEW", username: `@${clean}`, full_name: "Preview Channel",
    avatar_url: DEV_AVATAR_DATA_URI, followers_count: 124000, video_count: 86, total_views: 7800000,
    bio: "Local preview channel for Step 3.", is_private: false, is_restricted: false, is_verified: true, videos: [],
  };
}

function ProfileFound({ platform, profile, onClose }: { platform: PlatformId; profile: VerifiedSocialProfile; onClose: () => void }) {
  if (platform === "instagram" && profile.platform === "instagram") {
    return <InstagramPreview profile={profile} onClose={onClose} />;
  }
  if (platform === "tiktok" && profile.platform === "tiktok") {
    return <TikTokPreview profile={profile} onClose={onClose} />;
  }
  if (platform === "twitter" && profile.platform === "twitter") {
    return <TwitterPreview profile={profile} onClose={onClose} />;
  }
  if (platform === "youtube" && profile.platform === "youtube") {
    return <YouTubePreview profile={profile} onClose={onClose} />;
  }
  return null;
}

export default function ProfileLookupModal({ platform, service, open, onClose, onContinue }: Props) {
  const meta = platformMeta[platform];
  const [step, setStep] = useState<Step>(1);
  const isContentService = service === "likes" || service === "views" || service === "comments";
  const [mode, setMode] = useState<SearchMode>(isContentService ? "link" : "username");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedProfile, setVerifiedProfile] = useState<VerifiedSocialProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocalStepPreview, setShowLocalStepPreview] = useState(false);

  const { setUsername, setProfileData } = useFunnelStore();

  const pollingRef = React.useRef({ active: false });

  const handle = useMemo(() => {
    const raw = identifier.trim().replace(/^@/, "");
    if (!raw) return "username";
    if (mode === "link") {
      const clean = raw.replace(/https?:\/\//, "").split("/").filter(Boolean);
      return (clean[clean.length - 1] || "username").replace(/[?&#].*$/, "");
    }
    return raw;
  }, [identifier, mode]);

  const handleClose = () => {
    resetState();
    onClose();
  };
  const resetState = () => {
    pollingRef.current.active = false;
    setStep(1);
    setProgress(0);
    setErrorMessage(null);
    setVerifiedProfile(null);
    setIsLoading(false);
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (isContentService) setMode("link");
  }, [isContentService, service]);

  useEffect(() => {
    if (!open) {
      pollingRef.current.active = false;
      // We do not reset visual state synchronously in the effect to avoid cascading renders,
      // it should be reset when closing intentionally or unmounting.
    }
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV === "production") {
      setShowLocalStepPreview(false);
      return;
    }
    const host = window.location.hostname;
    setShowLocalStepPreview(host === "localhost" || host === "127.0.0.1" || host === "::1");
  }, []);

  const previewLocalStep = (targetStep: Step) => {
    if (!showLocalStepPreview) return;
    pollingRef.current.active = false;
    setErrorMessage(null);
    setIsLoading(false);
    setIsSubmitting(false);
    if (!identifier.trim()) setIdentifier("preview_user");
    if (!email.trim()) setEmail("preview@localhost.test");

    if (targetStep === 3) {
      const mock = createDevPreviewProfile(platform, identifier.trim() || "preview_user");
      setVerifiedProfile(mock);
      setUsername(mock.username.replace(/^@+/, ""));
      setProfileData(mock as unknown as Record<string, unknown>);
      setProgress(4);
    } else {
      setVerifiedProfile(null);
      setProgress(targetStep === 2 ? 2 : 0);
    }
    setStep(targetStep);
  };

  const isProfileRestricted = useMemo(() => {
    if (!verifiedProfile) return false;
    if (verifiedProfile.platform === "instagram") {
      return Boolean(verifiedProfile.is_private);
    }
    if (verifiedProfile.platform === "tiktok") {
      return Boolean(verifiedProfile.is_private || (verifiedProfile as unknown as Record<string, unknown>).private_account || (verifiedProfile as unknown as Record<string, unknown>).privateAccount);
    }
    if (verifiedProfile.platform === "twitter") {
      return Boolean((verifiedProfile as unknown as Record<string, unknown>).is_protected || (verifiedProfile as unknown as Record<string, unknown>).protected);
    }
    if (verifiedProfile.platform === "youtube") {
      return Boolean((verifiedProfile as unknown as Record<string, unknown>).is_private || (verifiedProfile as unknown as Record<string, unknown>).is_hidden);
    }
    return false;
  }, [verifiedProfile]);

  const ctaLabel = useMemo(() => {
    if (!isProfileRestricted) return isContentService ? "Use this content" : "Use this profile";
    if (platform === "instagram" || platform === "tiktok") {
      return "Make profile public to continue";
    }
    if (platform === "twitter") {
      return "Make account public to continue";
    }
    return "Channel unavailable";
  }, [isProfileRestricted, isContentService, platform]);

  const handleSearchAnotherProfile = () => {
    resetState();
  };

  const handleContinue = () => {
    if (isProfileRestricted || !verifiedProfile || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    // Persist the verified purchase target. Followers target a profile/channel;
    // likes/views target the exact public content URL entered by the customer.
    const normalizedUsername = verifiedProfile.username.replace(/^@+/, '').trim();
    const isYouTube = platform === 'youtube';
    const cleanEmail = email.trim().toLowerCase();
    const profileCandidate = ((verifiedProfile as unknown as Record<string, unknown>).profile_url as string | undefined)
      || ((verifiedProfile as unknown as Record<string, unknown>).link as string | undefined)
      || null;
    const resolvedTargetType = isContentService
      ? ((platform === 'youtube' || platform === 'tiktok') ? 'video' : 'post')
      : (isYouTube ? 'channel' : 'profile');
    const exactContentUrl = isContentService ? identifier.trim() : null;
    const fallbackProfileUrl = profileCandidate || `https://${platform === 'twitter' ? 'x.com' : platform === 'youtube' ? 'youtube.com/@' : `${platform}.com/`}${normalizedUsername}`;

    useFunnelStore.getState().setEmail(cleanEmail);
    useFunnelStore.getState().setTarget({
      targetType: resolvedTargetType,
      targetValue: isContentService ? exactContentUrl : normalizedUsername,
      targetUrl: isContentService ? exactContentUrl : fallbackProfileUrl,
      socialUsername: normalizedUsername,
      profileUrl: fallbackProfileUrl,
      email: cleanEmail,
      verifiedTargetData: verifiedProfile as unknown as Record<string, unknown>,
    });

    onContinue();
  };

  const handleStartSearch = async () => {
    setErrorMessage(null);
    pollingRef.current.active = true;

    // 1. Email format local validation
    const emailRes = validateEmailFormat(email);
    if (!emailRes.isValid) {
      setErrorMessage("Enter a valid email address to continue.");
      return;
    }

    if (!identifier.trim()) {
      setErrorMessage(isContentService
        ? `Paste the exact ${meta.label} content link you want to boost.`
        : "Please enter your @username or profile/channel link.");
      return;
    }

    if (isContentService) {
      try {
        const parsed = new URL(identifier.trim());
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("invalid");
      } catch {
        setErrorMessage(`For ${service}, paste a valid public post/video URL.`);
        return;
      }
    }

    // Go to Step 2 (Analysis)
    setStep(2);
    setProgress(0);
    setIsLoading(true);

    const progressTimer1 = setTimeout(() => setProgress(1), 350);
    const progressTimer2 = setTimeout(() => setProgress(2), 800);
    const progressTimer3 = setTimeout(() => setProgress(3), 1300);

    try {
      const res = await fetch("/api/search/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: identifier.trim(),
          selectedPlatform: platform,
        }),
      });

      const data = await res.json();

      // Caso 1: Retorno imediato completo
      if (res.ok && data.success && data.data && data.resolvedType === "profile") {
        setVerifiedProfile(data.data);
        setUsername(data.data.username);
        setProfileData(data.data);
        setProgress(4);
        setTimeout(() => {
          setStep(3);
          setIsLoading(false);
        }, 600);
        return;
      }

      // Caso 2: Processamento assíncrono com Polling controlado
      if (res.ok && data.success && data.status === "pending" && data.requestId) {
        let currentRequestId = data.requestId;
        const startTime = Date.now();
        const maxPollDuration = 45000;

        while (pollingRef.current.active && Date.now() - startTime < maxPollDuration) {
          await new Promise((r) => setTimeout(r, 2500));
          if (!pollingRef.current.active) break;

          const statusRes = await fetch(`/api/search/status?requestId=${encodeURIComponent(currentRequestId)}`);
          const statusJson = await statusRes.json().catch(() => null);

          if (!statusJson) continue;

          if (statusJson.status === "pending" && statusJson.requestId) {
            currentRequestId = statusJson.requestId;
          }

          if (statusJson.status === "complete" && statusJson.data) {
            setVerifiedProfile(statusJson.data);
            setUsername(statusJson.data.username);
            setProfileData(statusJson.data);
            setProgress(4);
            setTimeout(() => {
              setStep(3);
              setIsLoading(false);
            }, 600);
            return;
          }

          if (statusJson.status === "failed") {
            setErrorMessage(statusJson.message || "We couldn't find this profile. Check the @ or link and try again.");
            setStep(1);
            setIsLoading(false);
            return;
          }
        }

        if (pollingRef.current.active) {
          setErrorMessage("The search is taking longer than expected. Please try again.");
          setStep(1);
          setIsLoading(false);
        }
        return;
      }

      // Caso 3: Erro / não encontrado
      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);
      setErrorMessage(data.message || "We couldn't find this profile. Check the @ or link and try again.");
      setStep(1);
      setIsLoading(false);
    } catch {
      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);
      setErrorMessage("The search is taking longer than expected. Please try again.");
      setStep(1);
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="pl-overlay" role="dialog" aria-modal="true" aria-label={`${meta.label} profile lookup`}>
      <div className={`pl-modal pl-${platform} pl-step-${step}`} style={{ "--pl-accent": meta.color, "--pl-soft": meta.soft, "--pl-button": meta.button } as React.CSSProperties}>
        {/* Subtle Ambient Background Watermark (CloutFlow Brand Signature) */}
        <div className="pl-ambient-bg" aria-hidden="true">
          <span className="pl-amb-dotgrid top-right" />
          
          <span className="pl-amb-social ig bottom-left">◎</span>
          <span className="pl-amb-social tk bottom-left">♪</span>
          <span className="pl-amb-social x bottom-right">X</span>
          
          <span className="pl-amb-dashpath bottom-left" />
          <span className="pl-amb-dotgrid bottom-left" />
        </div>

        {step === 1 && (
          <div className="pl-step-container">
            <div className="pl-platform-badge">
              <Image src={meta.icon} alt="" width={18} height={18} />
              <span>{meta.label}</span>
            </div>
            <button className="pl-close" type="button" onClick={handleClose} aria-label="Close"><X /></button>
            <div className="pl-heading">
              <span className="pl-step-tag">STEP 1 OF 3</span>
              <h2>Almost there!</h2>
              <p className="pl-sub">
                {isContentService
                  ? `Paste the exact ${meta.label} post or video you want to boost.`
                  : platform === "youtube"
                    ? "Enter your YouTube channel to see your personalized growth plan."
                    : `Enter your ${meta.label} profile to see your personalized followers plan.`}
              </p>
            </div>

            <div className="pl-form-card">
              {/* Form Navigation Tabs: Username | Profile Link */}
              <div className={`pl-tabs-nav ${isContentService ? "pl-tabs-nav-single" : ""}`}>
                {!isContentService && <button
                  type="button"
                  className={`pl-tab-btn ${mode === "username" ? "active" : ""}`}
                  onClick={() => setMode("username")}
                >
                  {platform === "youtube" ? "@ Handle" : "Username"}
                </button>}
                <button
                  type="button"
                  className={`pl-tab-btn ${mode === "link" ? "active" : ""}`}
                  onClick={() => setMode("link")}
                >
                  {isContentService ? `${service === "views" ? "Views" : service === "likes" ? "Likes" : "Engagement"} Content Link` : (platform === "youtube" ? "Channel / Video Link" : "Profile Link")}
                </button>
              </div>

              <div className="pl-inputs-group">
                <label className="pl-label">
                  {isContentService
                    ? `${meta.label} ${service === "views" ? "Video / Post" : "Post / Video"} Link`
                    : mode === "username"
                      ? (platform === "youtube" ? "YouTube Handle / Channel" : `${meta.label} Username`)
                      : (platform === "youtube" ? "YouTube Channel Link" : `${meta.label} Profile Link`)}
                </label>
                <div className="pl-field">
                  {mode === "username" ? <span className="pl-field-prefix">@</span> : <Link2 className="pl-field-icon" />}
                  <input
                    value={identifier}
                    onChange={(e)=>setIdentifier(e.target.value)}
                    placeholder={
                      mode === "username"
                        ? (platform === "youtube" ? "MrBeast" : "yourusername")
                        : isContentService
                          ? (platform === "youtube" ? "https://youtube.com/watch?v=..." : platform === "twitter" ? "https://x.com/user/status/..." : `https://${platform}.com/...`)
                          : (platform === "youtube" ? "https://youtube.com/@MrBeast" : `https://${platform}.com/...`)
                    }
                  />
                </div>

                <label className="pl-label">Email Address</label>
                <div className={`pl-field ${errorMessage ? "pl-field-error" : ""}`}>
                  <Mail className="pl-field-icon" />
                  <input
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    type="email"
                    placeholder="you@example.com"
                  />
                </div>
                
                {errorMessage ? (
                  <div className="pl-field-message">
                    <CircleAlert className="w-[13px] h-[13px] flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                ) : (
                  <small className="pl-help">We&apos;ll use this to send your plan details and order confirmation.</small>
                )}

                <button className="pl-primary-btn" type="button" onClick={handleStartSearch} disabled={isLoading}>
                  {isLoading ? "Searching..." : (isContentService ? "Find this content" : "Find my profile")} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>


            <div className="pl-global-footer">
              <span>We only use public data · No password needed</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="pl-step-container">
            <button className="pl-close" type="button" onClick={handleClose} aria-label="Close"><X /></button>
            <div className="pl-heading">
              <span className="pl-step-tag">STEP 2 OF 3</span>
              <h2>Searching...</h2>
              <p className="pl-sub">This will only take a few moments.</p>
            </div>

            <div className="pl-loading-card">
              {/* Central Radar / Search Animation */}
              <div className="pl-radar-wrap">
                <div className="pl-radar-ring pl-radar-ring-3" />
                <div className="pl-radar-ring pl-radar-ring-2" />
                <div className="pl-radar-ring pl-radar-ring-1" />
                <div className="pl-radar-core">
                  <Image src={meta.icon} alt="" width={44} height={44} />
                </div>
              </div>

              <h3 className="pl-searching-title">
                {isContentService ? <>Validating your <span>{service}</span> destination</> : <>Looking for <span>@{handle}</span></>}
              </h3>
              <p className="pl-searching-sub">{isContentService ? `Checking this public ${meta.label} content and its owner...` : `Scanning profile data across ${meta.label}...`}</p>

              {/* Progress Checklist */}
              <div className="pl-status-list">
                {(isContentService ? [
                  "Checking content link",
                  "Finding the content owner",
                  "Verifying public content",
                  "Preparing purchase target",
                ] : [
                  "Checking username availability",
                  "Searching social profiles",
                  "Verifying profile data",
                  "Compiling results",
                ]).map((label, index) => (
                  <div className={`pl-status-item ${progress > index ? "done" : progress === index ? "active" : ""}`} key={label}>
                    <span className="pl-status-dot">
                      {progress > index ? <Check className="w-3 h-3 text-white stroke-[3]" /> : progress === index ? <span className="pl-status-spinner" /> : ""}
                    </span>
                    <span className="pl-status-label">{label}</span>
                    <span className="pl-status-pill">
                      {progress > index ? "Completed" : progress === index ? "In progress" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            </div>


            <div className="pl-global-footer">
              <span>We only use public data · No password needed</span>
            </div>
          </div>
        )}

        {step === 3 && verifiedProfile && (
          <div className="pl-step-container">
            <div className="pl-heading">
              <span className="pl-step-tag">STEP 3 OF 3</span>
              <h2>Profile Found</h2>
              <p className="pl-sub">Review <strong>@{verifiedProfile.username.replace(/^@+/, '')}</strong> before continuing.</p>
            </div>

            <div className="pl-preview-wrapper">
              <ProfileFound platform={platform} profile={verifiedProfile} onClose={onClose} />
            </div>

            <div className="pl-confirm-block">
              <button
                className={`pl-confirm-btn ${isSubmitting ? 'opacity-70' : ''}`}
                type="button"
                onClick={handleContinue}
                disabled={isProfileRestricted || isSubmitting}
              >
                {!isProfileRestricted && !isSubmitting && <Check className="w-4 h-4 text-white stroke-[2.5]" />}
                <span>{isSubmitting ? "Continuing..." : ctaLabel}</span>
                {!isProfileRestricted && <ArrowRight className="w-4 h-4 text-white stroke-[2.2]" />}
              </button>

              <button className="pl-search-another-btn" type="button" onClick={handleSearchAnotherProfile}>
                Search another profile
              </button>
            </div>
          </div>
        )}
      </div>

      {showLocalStepPreview && (
        <div className="pl-local-preview-toolbar" role="group" aria-label="Local step preview">
          <span>LOCAL PREVIEW</span>
          <button type="button" onClick={() => previewLocalStep(1)}>Step 1</button>
          <button type="button" onClick={() => previewLocalStep(2)}>Step 2</button>
          <button type="button" onClick={() => previewLocalStep(3)}>Step 3</button>
        </div>
      )}

      <style jsx global>{`
        .pl-overlay{
          position:fixed;inset:0;z-index:9999;
          display:grid;place-items:center;
          padding:16px;
          background:rgba(9,15,30,.58);
          backdrop-filter:blur(12px);
          overflow-y:auto;
        }

        .pl-local-preview-toolbar{
          position:fixed;right:16px;bottom:16px;z-index:10020;
          display:flex;align-items:center;gap:6px;padding:7px 8px;
          border:1px solid rgba(255,255,255,.3);border-radius:12px;
          background:rgba(15,23,42,.88);box-shadow:0 10px 30px rgba(0,0,0,.24);
          backdrop-filter:blur(10px);font-family:system-ui,sans-serif;
        }
        .pl-local-preview-toolbar span{font-size:9px;font-weight:800;letter-spacing:.08em;color:#cbd5e1;margin-right:2px}
        .pl-local-preview-toolbar button{
          border:1px solid rgba(255,255,255,.18);border-radius:8px;background:rgba(255,255,255,.08);
          color:#fff;font-size:11px;font-weight:700;padding:6px 9px;cursor:pointer;
        }
        .pl-local-preview-toolbar button:hover{background:rgba(255,255,255,.16)}

        /* Standardized modal container across Step 1, Step 2, Step 3 and all 4 platforms */
        .pl-modal{
          --pl-accent:#1376ff;--pl-soft:#eef5ff;
          width:min(100%, 440px) !important;
          max-width:440px !important;
          min-width:320px;
          min-height:520px;
          margin:auto;
          position:relative;
          border-radius:19px;
          background:
            radial-gradient(circle at 10% 0%,color-mix(in srgb,var(--pl-accent) 7%,transparent),transparent 28%),
            #ffffff;
          color:#101827;
          padding:22px 20px 20px;
          box-shadow:0 28px 75px rgba(8,17,38,.28), 0 0 0 1px rgba(226,232,240,.8);
          border:1px solid rgba(214,222,234,.9);
          font-family:var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          box-sizing:border-box;
          display:flex;
          flex-direction:column;
          justify-content:space-between;
          isolation:isolate;
          overflow:hidden;
        }

        @media (max-width: 480px) {
          .pl-overlay {
            padding: 12px 10px;
          }
          .pl-modal {
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto;
            padding: 18px 16px 18px;
            border-radius: 19px;
          }
        }

        /* Ambient Background Layer: The CloutFlow brand signature behind a clean white surface */
        .pl-ambient-bg{
          position:absolute;
          inset:0;
          z-index:1;
          pointer-events:none;
          overflow:hidden;
          border-radius:inherit;
          transition:opacity .3s ease;
        }

        .pl-modal.pl-step-1 .pl-ambient-bg,
        .pl-modal.pl-step-2 .pl-ambient-bg{
          opacity:0.075;
        }

        .pl-modal.pl-step-3 .pl-ambient-bg{
          opacity:0.045;
        }

        /* V90 — Step 2 dot-grid visibility matched to Step 1 */
        .pl-modal.pl-step-2 .pl-ambient-bg{opacity:.10!important;}
        .pl-modal.pl-step-2 .pl-amb-dotgrid.top-right,
        .pl-modal.pl-step-2 .pl-amb-dotgrid.bottom-left{opacity:1!important;}

        .pl-amb-dotgrid{
          position:absolute;
          width:70px;
          height:50px;
          background-image:radial-gradient(#4e86ff 1.8px, transparent 1.8px);
          background-size:10px 10px;
        }
        .pl-amb-dotgrid.top-right{right:12px;top:54px}
        .pl-amb-dotgrid.bottom-left{left:12px;bottom:12px}

        .pl-amb-social{
          position:absolute;
          font-weight:900;
          line-height:1;
        }
        .pl-amb-social.ig{left:16px;bottom:68px;font-size:26px;color:#ff4d9a}
        .pl-amb-social.tk{left:52px;bottom:26px;font-size:24px;color:#25f4ee}
        .pl-amb-social.x{right:18px;bottom:64px;font-size:22px;color:#111111}

        .pl-amb-dashpath{
          position:absolute;
          left:-20px;
          bottom:20px;
          width:130px;
          height:150px;
          border:1.8px dashed #557cff;
          border-right-color:transparent;
          border-radius:55% 40%;
          transform:rotate(-16deg);
        }

        .pl-modal.pl-tiktok.pl-step-1{
          background:
            radial-gradient(circle at 12% 8%, rgba(37, 244, 238, 0.07), transparent 34%),
            radial-gradient(circle at 88% 10%, rgba(254, 44, 85, 0.055), transparent 36%),
            #ffffff !important;
        }

        .pl-step-container{
          display:flex;
          flex-direction:column;
          flex:1;
          justify-content:space-between;
          width:100%;
          position:relative;
          z-index:2;
          background:transparent;
        }

        /* Platform Badge (Step 1 Top-Left Context Badge) */
        .pl-platform-badge{
          position:absolute;
          left:0;
          top:0;
          height:30px;
          padding:0 10px 0 6px;
          border-radius:10px;
          display:inline-flex;
          align-items:center;
          gap:7px;
          font-size:12.5px;
          font-weight:650;
          line-height:1;
          z-index:20;
          background:#f8fafc;
          border:1px solid #e2e8f0;
          color:#0f172a;
          box-shadow:0 1px 3px rgba(15,23,42,.04);
          user-select:none;
        }
        .pl-platform-badge img{
          width:19px!important;
          height:19px!important;
          object-fit:contain;
          flex-shrink:0;
        }

        /* Subtle platform accents for badge */
        .pl-modal.pl-instagram .pl-platform-badge{
          background:rgba(225,48,108,.035);
          border-color:rgba(225,48,108,.16);
          color:#0f172a;
        }
        .pl-modal.pl-tiktok .pl-platform-badge{
          background:rgba(0,0,0,.025);
          border-color:rgba(0,0,0,.08);
          color:#0f172a;
        }
        .pl-modal.pl-twitter .pl-platform-badge{
          background:rgba(15,20,25,.025);
          border-color:rgba(15,20,25,.14);
          color:#0f172a;
        }
        .pl-modal.pl-youtube .pl-platform-badge{
          background:rgba(255,0,0,.025);
          border-color:rgba(255,0,0,.15);
          color:#0f172a;
        }

        @media (max-width: 480px) {
          .pl-platform-badge{
            height:28px;
            padding:0 8px 0 5px;
            font-size:11.5px;
            gap:5px;
          }
          .pl-platform-badge img{
            width:17px!important;
            height:17px!important;
          }
        }

        .pl-close{
          position:absolute;right:0;top:0;width:32px;height:32px;border:0;background:rgba(241,245,249,.8);border-radius:50%;display:grid;place-items:center;color:#4b5565;cursor:pointer;z-index:20;transition:background .2s;
        }
        .pl-close:hover{background:#e2e8f0}
        .pl-close svg{width:16px;height:16px}

        /* Standardized Header across Step 1, 2, 3 */
        .pl-heading{
          text-align:center;
          margin-bottom:14px;
        }
        .pl-step-tag{
          display:inline-block;
          font-size:11px;
          font-weight:700;
          letter-spacing:.6px;
          color:var(--pl-accent);
          text-transform:uppercase;
          margin-bottom:3px;
        }
        .pl-heading h2{
          margin:0;
          font-size:25px;
          font-weight:700;
          letter-spacing:-.4px;
          color:#0f172a;
        }
        .pl-sub{
          font-size:13.5px;
          color:#64748b;
          line-height:1.45;
          margin:5px auto 0;
          max-width:320px;
        }

        /* Step 1 Form Card */
        .pl-form-card{
          background:#fafbfc;
          border:1px solid #eef2f6;
          border-radius:20px;
          padding:16px;
          margin-bottom:6px;
        }

        /* Step 1 Tabs Navigation (Clean underline or soft card) */
        .pl-tabs-nav{
          display:flex;
          align-items:center;
          border-bottom:1.5px solid #e2e8f0;
          margin-bottom:14px;
        }
        .pl-tab-btn{
          flex:1;
          background:transparent;
          border:0;
          padding:8px 0 10px;
          font-size:13.5px;
          font-weight:600;
          color:#64748b;
          cursor:pointer;
          position:relative;
          transition:color .2s;
        }
        .pl-tab-btn.active{
          color:var(--pl-accent);
          font-weight:700;
        }
        .pl-tab-btn.active::after{
          content:"";
          position:absolute;
          left:15%;
          right:15%;
          bottom:-1.5px;
          height:2.5px;
          background:var(--pl-accent);
          border-radius:99px;
        }

        .pl-inputs-group{
          display:flex;
          flex-direction:column;
        }
        .pl-label{
          display:block;
          font-size:13px;
          font-weight:600;
          color:#334155;
          margin:0 0 5px;
        }
        .pl-field{
          height:46px;
          border:1px solid #cbd5e1;
          border-radius:13px;
          display:flex;
          align-items:center;
          gap:8px;
          padding:0 12px;
          background:#ffffff;
          margin-bottom:11px;
          transition:border-color 160ms ease, box-shadow 160ms ease;
        }
        .pl-field:focus-within{
          border-color:var(--pl-accent);
          box-shadow:0 0 0 3px color-mix(in srgb,var(--pl-accent) 15%,transparent);
        }
        .pl-modal.pl-tiktok .pl-field:focus-within{
          border-color:#111111;
          box-shadow:
            0 0 0 1px rgba(37, 244, 238, 0.45),
            0 0 0 3px rgba(254, 44, 85, 0.22);
        }
        .pl-field.pl-field-error{
          border-color:var(--pl-accent) !important;
          box-shadow:0 0 0 3px color-mix(in srgb, var(--pl-accent) 8%, transparent) !important;
          margin-bottom:0 !important;
        }
        .pl-modal.pl-tiktok .pl-field.pl-field-error{
          border-color:#fe2c55 !important;
          box-shadow:0 0 0 3px rgba(254, 44, 85, 0.16) !important;
        }
        .pl-field-message{
          display:flex;
          align-items:center;
          gap:5px;
          margin:6px 0 12px 0;
          padding-left:3px;
          font-size:12px;
          font-weight:500;
          line-height:1.3;
          color:var(--pl-accent);
          animation:plInlineError 180ms ease-out forwards;
        }
        @keyframes plInlineError{
          from{opacity:0;transform:translateY(-2px)}
          to{opacity:1;transform:translateY(0)}
        }
        .pl-field-icon{width:16px;height:16px;color:#94a3b8}
        .pl-field-prefix{font-weight:700;color:#94a3b8;font-size:15px}
        .pl-field input{width:100%;border:0;outline:0;background:transparent;font:inherit;font-size:14px;color:#0f172a}
        .pl-field input::placeholder{color:#94a3b8}
        .pl-help{display:block;color:#64748b;font-size:12px;margin:-4px 0 12px;line-height:1.35}

        .pl-primary-btn{
          width:100%;
          min-height:46px;
          border:0;
          border-radius:11px;
          color:#ffffff;
          font-size:14.5px;
          font-weight:700;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:7px;
          cursor:pointer;
          box-sizing:border-box;
        }

        /* Dynamic CTA Themes by Platform */
        .pl-modal.pl-instagram .pl-primary-btn,
        .pl-modal.pl-instagram .pl-confirm-btn{
          background:linear-gradient(90deg, #833AB4 0%, #C13584 26%, #E1306C 50%, #F56040 74%, #FCAF45 100%) !important;
          box-shadow:0 6px 16px rgba(225, 48, 108, 0.18) !important;
          transition:transform 180ms ease, box-shadow 180ms ease, filter 180ms ease !important;
        }
        .pl-modal.pl-instagram .pl-primary-btn:hover,
        .pl-modal.pl-instagram .pl-confirm-btn:hover{
          background:linear-gradient(90deg, #7734A4 0%, #B83279 26%, #D82D66 50%, #EA593C 74%, #F2A63F 100%) !important;
          transform:translateY(-1px);
          filter:none !important;
          box-shadow:0 8px 20px rgba(225, 48, 108, 0.24) !important;
        }

        .pl-modal.pl-tiktok .pl-primary-btn,
        .pl-modal.pl-tiktok .pl-confirm-btn{
          background:linear-gradient(110deg, #080808 0%, #0a0d0e 30%, #155054 66%, #9b2948 100%) !important;
          box-shadow:none !important;
          filter:none !important;
          transition:transform 180ms ease !important;
        }
        .pl-modal.pl-tiktok .pl-primary-btn:hover,
        .pl-modal.pl-tiktok .pl-confirm-btn:hover{
          background:linear-gradient(110deg, #080808 0%, #0a0d0e 30%, #155054 66%, #9b2948 100%) !important;
          transform:translateY(-1px) !important;
          filter:none !important;
          box-shadow:none !important;
        }
        .pl-modal.pl-tiktok .pl-primary-btn:active,
        .pl-modal.pl-tiktok .pl-confirm-btn:active{
          filter:none !important;
          transform:translateY(1px) !important;
        }

        .pl-modal.pl-twitter .pl-primary-btn,
        .pl-modal.pl-twitter .pl-confirm-btn{
          background:linear-gradient(110deg, #050505 0%, #101010 28%, #242424 58%, #151515 78%, #050505 100%) !important;
          box-shadow:none !important;
          filter:none !important;
          transition:transform 180ms ease !important;
        }
        .pl-modal.pl-twitter .pl-primary-btn:hover,
        .pl-modal.pl-twitter .pl-confirm-btn:hover{
          background:linear-gradient(110deg, #050505 0%, #101010 28%, #242424 58%, #151515 78%, #050505 100%) !important;
          transform:translateY(-1px) !important;
          filter:none !important;
          box-shadow:none !important;
        }

        .pl-modal.pl-youtube .pl-primary-btn,
        .pl-modal.pl-youtube .pl-confirm-btn{
          background:linear-gradient(110deg, #C9000B 0%, #E6000C 28%, #FF0000 55%, #F21822 76%, #D5000C 100%) !important;
          box-shadow:none !important;
          filter:none !important;
          transition:transform 180ms ease !important;
        }
        .pl-modal.pl-youtube .pl-primary-btn:hover,
        .pl-modal.pl-youtube .pl-confirm-btn:hover{
          background:linear-gradient(110deg, #C9000B 0%, #E6000C 28%, #FF0000 55%, #F21822 76%, #D5000C 100%) !important;
          transform:translateY(-1px) !important;
          filter:none !important;
          box-shadow:none !important;
        }

        .pl-primary-btn:active,
        .pl-confirm-btn:active{
          transform:translateY(0) !important;
        }

        /* Step 3 Confirmation & CTA Area (Compact, Dynamic Color, Centered) */
        .pl-confirm-block{
          margin-top:10px;
          display:flex;
          flex-direction:column;
          align-items:center;
          width:100%;
        }

        .pl-confirm-btn{
          width:75%;
          max-width:300px;
          height:42px;
          border:0;
          border-radius:11px;
          color:#ffffff;
          font-size:13.5px;
          font-weight:700;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          margin:0 auto;
          cursor:pointer;
          box-sizing:border-box;
        }
        
        .pl-confirm-btn:disabled {
          cursor: not-allowed !important;
          opacity: 0.55 !important;
          transform: none !important;
          filter: none !important;
          box-shadow: none !important;
        }

        .pl-search-another-btn{
          background:transparent!important;
          border:0!important;
          color:#64748b!important;
          font-size:13px!important;
          font-weight:600!important;
          margin:16px auto 0!important;
          padding:0!important;
          cursor:pointer!important;
          display:block!important;
          transition:color .18s;
        }
        .pl-search-another-btn:hover{
          color:#0f172a!important;
          text-decoration:underline;
        }



        /* V69 — Step 1 visual parity with the approved reference artwork.
           Scoped to Step 1 only so Steps 2/3 and all functional behavior remain untouched. */
        .pl-modal.pl-step-1{
          width:min(94vw, 860px) !important;
          max-width:860px !important;
          min-height:0 !important;
          padding:34px 40px 28px !important;
          border-radius:46px !important;
          border:1px solid rgba(255,255,255,.92) !important;
          background:
            radial-gradient(circle at 8% 12%, color-mix(in srgb,var(--pl-accent) 8%,transparent), transparent 25%),
            radial-gradient(circle at 92% 84%, rgba(116,74,255,.055), transparent 30%),
            rgba(255,255,255,.975) !important;
          box-shadow:
            0 42px 100px rgba(8,17,38,.30),
            0 10px 28px rgba(15,23,42,.12),
            inset 0 1px 0 rgba(255,255,255,.96) !important;
          overflow:visible !important;
        }

        .pl-modal.pl-step-1 .pl-step-container{
          min-height:680px;
          overflow:visible;
        }

        .pl-modal.pl-step-1 .pl-ambient-bg{
          opacity:.10 !important;
          overflow:hidden;
          border-radius:46px;
        }
        .pl-modal.pl-step-1 .pl-amb-dotgrid{width:96px;height:76px;background-size:12px 12px}
        .pl-modal.pl-step-1 .pl-amb-dotgrid.top-right{right:34px;top:92px}
        .pl-modal.pl-step-1 .pl-amb-dotgrid.bottom-left{left:28px;bottom:26px}
        .pl-modal.pl-step-1 .pl-amb-social,
        .pl-modal.pl-step-1 .pl-amb-dashpath{display:none}

        .pl-modal.pl-step-1 .pl-platform-badge{
          left:0;top:0;
          height:56px;
          padding:0 24px 0 14px;
          border-radius:28px;
          gap:12px;
          font-size:20px;
          font-weight:750;
          background:rgba(255,255,255,.78);
          border:1px solid color-mix(in srgb,var(--pl-accent) 18%,#eef2f7);
          box-shadow:0 12px 22px color-mix(in srgb,var(--pl-accent) 13%,transparent), 0 2px 6px rgba(15,23,42,.06);
          backdrop-filter:blur(10px);
        }
        .pl-modal.pl-step-1 .pl-platform-badge img{
          width:36px!important;height:36px!important;
        }

        .pl-modal.pl-step-1 .pl-close{
          right:0;top:0;
          width:56px;height:56px;
          background:rgba(248,250,252,.92);
          border:1px solid #e4eaf2;
          box-shadow:0 10px 22px rgba(15,23,42,.12);
        }
        .pl-modal.pl-step-1 .pl-close svg{width:27px;height:27px;stroke-width:2.7}

        .pl-modal.pl-step-1 .pl-heading{
          margin:8px auto 28px;
          padding:0 80px;
        }
        .pl-modal.pl-step-1 .pl-step-tag{
          font-size:15px;
          font-weight:800;
          letter-spacing:.7px;
          margin-bottom:10px;
          padding:8px 18px;
          border-radius:999px;
          background:#fff;
          box-shadow:0 6px 15px rgba(15,23,42,.09);
          border:1px solid #eef2f7;
        }
        .pl-modal.pl-step-1 .pl-heading h2{
          font-size:50px;
          line-height:1.02;
          font-weight:800;
          letter-spacing:-1.8px;
          text-shadow:0 5px 12px rgba(15,23,42,.14);
        }
        .pl-modal.pl-step-1 .pl-sub{
          max-width:610px;
          font-size:24px;
          line-height:1.45;
          margin-top:14px;
          color:#66789a;
        }

        .pl-modal.pl-step-1 .pl-form-card{
          width:100%;
          box-sizing:border-box;
          padding:34px 40px 36px;
          margin:0 0 22px;
          border-radius:40px;
          background:rgba(255,255,255,.78);
          border:1px solid #e4e9f2;
          box-shadow:0 18px 38px rgba(15,23,42,.12), inset 0 1px 0 rgba(255,255,255,.98);
          backdrop-filter:blur(10px);
        }
        .pl-modal.pl-step-1 .pl-tabs-nav{
          margin-bottom:30px;
          border-bottom:2px solid #dde4ee;
        }
        .pl-modal.pl-step-1 .pl-tab-btn{
          padding:10px 0 18px;
          font-size:22px;
          font-weight:700;
        }
        .pl-modal.pl-step-1 .pl-tab-btn.active::after{
          left:18%;right:18%;bottom:-2px;height:5px;
        }
        .pl-modal.pl-step-1 .pl-label{
          font-size:19px;
          font-weight:750;
          margin-bottom:10px;
          color:#16223a;
        }
        .pl-modal.pl-step-1 .pl-field{
          height:78px;
          border-radius:26px;
          padding:0 20px;
          gap:14px;
          margin-bottom:28px;
          border:1.5px solid #cfd8e8;
          box-shadow:0 8px 18px rgba(15,23,42,.06);
        }
        .pl-modal.pl-step-1 .pl-field:first-of-type{
          border-color:color-mix(in srgb,var(--pl-accent) 34%,#d7dfeb);
        }
        .pl-modal.pl-step-1 .pl-field-icon{width:28px;height:28px;color:var(--pl-accent)}
        .pl-modal.pl-step-1 .pl-field-prefix{
          width:46px;height:46px;border-radius:15px;
          display:grid;place-items:center;
          font-size:28px;font-weight:850;color:var(--pl-accent);
          background:color-mix(in srgb,var(--pl-accent) 5%,#fff);
          box-shadow:0 8px 18px color-mix(in srgb,var(--pl-accent) 12%,transparent), inset 0 1px 0 #fff;
        }
        .pl-modal.pl-step-1 .pl-field input{font-size:21px;font-weight:500}
        .pl-modal.pl-step-1 .pl-help{
          font-size:18px;
          line-height:1.45;
          margin:-12px 0 26px;
          color:#66789a;
        }
        .pl-modal.pl-step-1 .pl-field-message{font-size:15px;margin:8px 0 18px}

        .pl-modal.pl-step-1 .pl-primary-btn{
          min-height:88px;
          border-radius:25px;
          font-size:27px;
          font-weight:800;
          gap:18px;
          box-shadow:0 16px 28px color-mix(in srgb,var(--pl-accent) 24%,rgba(15,23,42,.10)) !important;
        }
        .pl-modal.pl-step-1 .pl-primary-btn svg{
          width:34px!important;height:34px!important;
          padding:8px;
          border-radius:50%;
          box-sizing:content-box;
          background:rgba(255,255,255,.10);
          box-shadow:0 6px 14px rgba(15,23,42,.14);
        }

        .pl-modal.pl-step-1 .pl-global-footer{
          position:relative;
          z-index:3;
          margin:0 auto;
          min-height:42px;
          display:flex;align-items:center;justify-content:center;gap:12px;
          font-size:17px;
          color:#66789a;
        }
        .pl-modal.pl-step-1 .pl-global-footer svg{
          width:26px!important;height:26px!important;
          padding:6px;
          border-radius:9px;
          color:var(--pl-accent);
          background:#fff;
          box-shadow:0 6px 15px color-mix(in srgb,var(--pl-accent) 14%,rgba(15,23,42,.06));
          box-sizing:content-box;
        }

        .pl-step1-orb{position:absolute;z-index:4;border-radius:50%;pointer-events:none}
        .pl-step1-orb-left{
          width:50px;height:50px;left:-62px;top:46%;
          background:linear-gradient(145deg,#ff76ca 0%,#ff5a7d 50%,#ff8d35 100%);
          box-shadow:0 14px 24px rgba(255,75,112,.34);
        }
        .pl-step1-orb-top{
          width:34px;height:34px;right:12px;top:176px;
          background:linear-gradient(145deg,#ff72d8,#8e3dff);
          box-shadow:0 10px 20px rgba(149,62,255,.36);
        }
        .pl-step1-orb-bottom{
          width:54px;height:54px;right:-12px;bottom:10px;
          background:linear-gradient(145deg,#ff6fe5,#7f48ff 68%);
          box-shadow:0 14px 24px rgba(127,72,255,.34);
        }

        @media (max-width: 900px){
          .pl-modal.pl-step-1{width:min(96vw,700px)!important;padding:28px 28px 24px!important;border-radius:34px!important}
          .pl-modal.pl-step-1 .pl-step-container{min-height:620px}
          .pl-modal.pl-step-1 .pl-heading h2{font-size:42px}
          .pl-modal.pl-step-1 .pl-sub{font-size:20px}
          .pl-modal.pl-step-1 .pl-form-card{padding:28px 30px 30px;border-radius:32px}
        }

        @media (max-width: 600px){
          .pl-overlay{padding:12px 10px}
          .pl-modal.pl-step-1{
            width:100%!important;max-width:440px!important;
            padding:20px 18px 18px!important;
            border-radius:24px!important;
            overflow:hidden!important;
          }
          .pl-modal.pl-step-1 .pl-step-container{min-height:0}
          .pl-modal.pl-step-1 .pl-platform-badge{height:34px;padding:0 10px 0 7px;border-radius:13px;font-size:12px;gap:6px}
          .pl-modal.pl-step-1 .pl-platform-badge img{width:20px!important;height:20px!important}
          .pl-modal.pl-step-1 .pl-close{width:34px;height:34px}
          .pl-modal.pl-step-1 .pl-close svg{width:18px;height:18px}
          .pl-modal.pl-step-1 .pl-heading{padding:0 28px;margin:2px auto 14px}
          .pl-modal.pl-step-1 .pl-step-tag{font-size:10px;padding:4px 8px;margin-bottom:5px}
          .pl-modal.pl-step-1 .pl-heading h2{font-size:27px;letter-spacing:-.7px;text-shadow:none}
          .pl-modal.pl-step-1 .pl-sub{font-size:13px;line-height:1.45;margin-top:7px;max-width:300px}
          .pl-modal.pl-step-1 .pl-form-card{padding:18px 16px 18px;border-radius:22px;margin-bottom:12px;box-shadow:0 10px 24px rgba(15,23,42,.08)}
          .pl-modal.pl-step-1 .pl-tabs-nav{margin-bottom:15px}
          .pl-modal.pl-step-1 .pl-tab-btn{font-size:13px;padding:7px 0 10px}
          .pl-modal.pl-step-1 .pl-tab-btn.active::after{height:3px}
          .pl-modal.pl-step-1 .pl-label{font-size:12px;margin-bottom:6px}
          .pl-modal.pl-step-1 .pl-field{height:46px;border-radius:12px;padding:0 12px;gap:8px;margin-bottom:12px;box-shadow:none}
          .pl-modal.pl-step-1 .pl-field-prefix{width:auto;height:auto;background:none;box-shadow:none;font-size:15px}
          .pl-modal.pl-step-1 .pl-field-icon{width:16px;height:16px}
          .pl-modal.pl-step-1 .pl-field input{font-size:14px}
          .pl-modal.pl-step-1 .pl-help{font-size:11.5px;margin:-4px 0 12px}
          .pl-modal.pl-step-1 .pl-primary-btn{min-height:47px;border-radius:11px;font-size:14px;gap:8px;box-shadow:0 7px 16px color-mix(in srgb,var(--pl-accent) 20%,transparent)!important}
          .pl-modal.pl-step-1 .pl-primary-btn svg{width:16px!important;height:16px!important;padding:0;background:none;box-shadow:none}
          .pl-modal.pl-step-1 .pl-global-footer{font-size:11.5px;gap:7px;min-height:28px}
          .pl-modal.pl-step-1 .pl-global-footer svg{width:14px!important;height:14px!important;padding:3px;border-radius:6px}
          .pl-step1-orb{display:none}
        }

                /* V70 — Step 1 portrait/pixel-parity correction against approved reference. */
        /* V71 — Step 1: reduce the complete desktop composition by 30% without changing internal proportions. */
        @media (min-width: 901px){
          .pl-modal.pl-step-1{
            transform:scale(.70) !important;
            transform-origin:center center !important;
            width:min(92vw, 690px) !important;
            max-width:690px !important;
            padding:34px 38px 30px !important;
            border-radius:42px !important;
          }
          .pl-modal.pl-step-1 .pl-step-container{min-height:820px !important}
          .pl-modal.pl-step-1 .pl-platform-badge{height:54px;padding:0 22px 0 13px;font-size:19px}
          .pl-modal.pl-step-1 .pl-platform-badge img{width:34px!important;height:34px!important}
          .pl-modal.pl-step-1 .pl-close{width:54px;height:54px}
          .pl-modal.pl-step-1 .pl-heading{margin:8px auto 30px;padding:0 70px}
          .pl-modal.pl-step-1 .pl-step-tag{font-size:14px;padding:7px 16px;margin-bottom:11px}
          .pl-modal.pl-step-1 .pl-heading h2{font-size:46px;line-height:1.03;letter-spacing:-1.5px}
          .pl-modal.pl-step-1 .pl-sub{max-width:520px;font-size:21px;line-height:1.45;margin-top:14px}
          .pl-modal.pl-step-1 .pl-form-card{padding:36px 38px 38px;border-radius:38px;margin:0 0 24px}
          .pl-modal.pl-step-1 .pl-tabs-nav{margin-bottom:32px}
          .pl-modal.pl-step-1 .pl-tab-btn{font-size:20px;padding:10px 0 17px}
          .pl-modal.pl-step-1 .pl-label{font-size:18px;margin-bottom:10px}
          .pl-modal.pl-step-1 .pl-field{height:72px;border-radius:24px;padding:0 18px;gap:13px;margin-bottom:27px}
          .pl-modal.pl-step-1 .pl-field-prefix{width:44px;height:44px;font-size:26px}
          .pl-modal.pl-step-1 .pl-field input{font-size:20px}
          .pl-modal.pl-step-1 .pl-help{font-size:17px;margin:-11px 0 25px}
          .pl-modal.pl-step-1 .pl-primary-btn{min-height:82px;border-radius:24px;font-size:25px}
          .pl-modal.pl-step-1 .pl-global-footer{font-size:16px;min-height:42px}
          .pl-modal.pl-step-1 .pl-amb-dotgrid.top-right{right:26px;top:105px}
          .pl-step1-orb-left{left:-58px;top:48%}
          .pl-step1-orb-top{right:5px;top:185px}
          .pl-step1-orb-bottom{right:-10px;bottom:8px}
        }

        /* Step 2 Loading Card */
        .pl-loading-card{
          background:#fafbfc;
          border:1px solid #eef2f6;
          border-radius:20px;
          padding:20px 16px;
          text-align:center;
          display:flex;
          flex-direction:column;
          align-items:center;
        }

        .pl-radar-wrap{
          position:relative;
          width:86px;
          height:86px;
          margin:0 auto 12px;
          display:grid;
          place-items:center;
        }
        .pl-radar-core{
          width:64px;
          height:64px;
          border-radius:50%;
          background:var(--pl-soft);
          display:grid;
          place-items:center;
          z-index:2;
          box-shadow:0 4px 14px rgba(0,0,0,.06);
        }
        .pl-radar-ring{
          position:absolute;
          inset:0;
          border-radius:50%;
          border:1.5px solid color-mix(in srgb,var(--pl-accent) 25%,transparent);
          animation:plPulse 2s cubic-bezier(.215,.61,.355,1) infinite;
        }
        .pl-radar-ring-2{
          animation-delay:.7s;
        }
        @keyframes plPulse{
          0%{transform:scale(.7);opacity:.9}
          100%{transform:scale(1.3);opacity:0}
        }

        .pl-searching-title{
          font-size:17px;
          font-weight:800;
          color:#0f172a;
          margin:0 0 2px;
        }
        .pl-searching-title span{
          color:var(--pl-accent);
        }
        .pl-searching-sub{
          font-size:12.5px;
          color:#64748b;
          margin:0 0 14px;
        }

        .pl-status-list{
          width:100%;
          background:#ffffff;
          border:1px solid #e2e8f0;
          border-radius:14px;
          padding:10px 14px;
          display:flex;
          flex-direction:column;
          gap:8px;
          text-align:left;
        }
        .pl-status-item{
          display:flex;
          align-items:center;
          gap:10px;
          font-size:12.5px;
          color:#94a3b8;
          font-weight:500;
        }
        .pl-status-item.active{
          color:#0f172a;
          font-weight:700;
        }
        .pl-status-item.done{
          color:#334155;
          font-weight:600;
        }
        .pl-status-dot{
          width:18px;
          height:18px;
          border-radius:50%;
          border:1.5px solid #cbd5e1;
          display:grid;
          place-items:center;
          flex-shrink:0;
        }
        .pl-status-item.done .pl-status-dot{
          background:#10b981;
          border-color:#10b981;
        }
        .pl-status-item.active .pl-status-dot{
          border-color:var(--pl-accent);
          background:transparent;
        }
        .pl-status-spinner{
          width:8px;
          height:8px;
          border-radius:50%;
          background:var(--pl-accent);
          animation:plPing 1s ease infinite;
        }
        @keyframes plPing{
          0%,100%{transform:scale(.7);opacity:.5}
          50%{transform:scale(1.1);opacity:1}
        }


        /* V85 — Step 2: reference-accurate searching experience. Desktop only. */
        @media (min-width: 901px){
          .pl-modal.pl-step-2{
            width:min(92vw,760px)!important;
            max-width:760px!important;
            min-height:940px!important;
            padding:42px 44px 34px!important;
            border-radius:42px!important;
            background:
              radial-gradient(circle at 12% 8%,rgba(225,48,108,.08),transparent 30%),
              radial-gradient(circle at 92% 94%,rgba(139,61,255,.09),transparent 22%),
              #fff!important;
            box-shadow:0 36px 90px rgba(10,18,38,.34),0 0 0 2px rgba(255,255,255,.75),0 0 0 3px color-mix(in srgb,var(--pl-accent) 18%,transparent)!important;
            overflow:visible!important;
          }
          .pl-modal.pl-step-2 .pl-step-container{min-height:860px!important}
          .pl-modal.pl-step-2 .pl-close{
            width:54px;height:54px;right:0;top:0;
            background:linear-gradient(145deg,#fff,#eef2f8);
            box-shadow:0 9px 18px rgba(49,64,96,.18),inset 0 1px 0 rgba(255,255,255,.95);
          }
          .pl-modal.pl-step-2 .pl-close svg{width:27px;height:27px;stroke-width:2.7}
          .pl-modal.pl-step-2 .pl-heading{margin:12px auto 34px;padding:0 70px}
          .pl-modal.pl-step-2 .pl-step-tag{
            font-size:18px;font-weight:800;letter-spacing:.045em;
            padding:8px 18px;margin-bottom:20px;border-radius:999px;
            background:#fff;box-shadow:0 8px 18px color-mix(in srgb,var(--pl-accent) 18%,rgba(15,23,42,.08));
          }
          .pl-modal.pl-step-2 .pl-heading h2{
            font-size:54px;line-height:1;letter-spacing:-2.2px;font-weight:850;
            text-shadow:0 8px 16px rgba(19,39,82,.14);
          }
          .pl-modal.pl-step-2 .pl-sub{font-size:22px;line-height:1.4;margin-top:22px;max-width:520px}
          .pl-modal.pl-step-2 .pl-loading-card{
            flex:0 0 auto;
            background:linear-gradient(180deg,rgba(255,255,255,.97),rgba(252,252,255,.98));
            border:1px solid rgba(213,219,235,.9);
            border-radius:38px;
            padding:34px 40px 36px;
            box-shadow:0 22px 42px rgba(35,42,76,.14),inset 0 1px 0 rgba(255,255,255,.95);
          }
          .pl-modal.pl-step-2 .pl-radar-wrap{width:170px;height:170px;margin:0 auto 28px}
          .pl-modal.pl-step-2 .pl-radar-core{
            width:108px;height:108px;
            background:radial-gradient(circle,#fff 10%,color-mix(in srgb,var(--pl-accent) 12%,#fff) 68%,#fff 100%);
            box-shadow:0 15px 30px color-mix(in srgb,var(--pl-accent) 22%,rgba(15,23,42,.10));
          }
          .pl-modal.pl-step-2 .pl-radar-core img{width:72px!important;height:72px!important;filter:drop-shadow(0 8px 10px rgba(0,0,0,.12))}
          .pl-modal.pl-step-2 .pl-radar-ring{border-width:3px;border-color:color-mix(in srgb,var(--pl-accent) 55%,#fff);box-shadow:0 0 18px color-mix(in srgb,var(--pl-accent) 18%,transparent)}
          .pl-modal.pl-step-2 .pl-radar-ring-1{inset:10px}
          .pl-modal.pl-step-2 .pl-radar-ring-2{inset:0}
          .pl-modal.pl-step-2 .pl-searching-title{font-size:29px;line-height:1.2;margin:0 0 12px;font-weight:850;letter-spacing:-.7px}
          .pl-modal.pl-step-2 .pl-searching-title span{font-size:30px}
          .pl-modal.pl-step-2 .pl-searching-sub{font-size:20px;line-height:1.4;margin:0 0 30px}
          .pl-modal.pl-step-2 .pl-status-list{
            border:1px solid #dce3f0;border-radius:28px;padding:12px 24px;gap:0;
            box-shadow:inset 0 1px 0 rgba(255,255,255,.9);
          }
          .pl-modal.pl-step-2 .pl-status-item{
            min-height:76px;gap:16px;font-size:20px;font-weight:650;position:relative;
            border-bottom:1px solid #e5e9f2;
          }
          .pl-modal.pl-step-2 .pl-status-item:last-child{border-bottom:0}
          .pl-modal.pl-step-2 .pl-status-item.done{color:#17213a;font-weight:700}
          .pl-modal.pl-step-2 .pl-status-item.active{color:#17213a;font-weight:800}
          .pl-modal.pl-step-2 .pl-status-dot{width:36px;height:36px;border-width:2.5px;box-shadow:0 5px 13px rgba(38,50,84,.09)}
          .pl-modal.pl-step-2 .pl-status-item.done .pl-status-dot{
            background:#19c58e;border-color:#19c58e;box-shadow:0 0 18px rgba(25,197,142,.42);
          }
          .pl-modal.pl-step-2 .pl-status-item.done .pl-status-dot svg{width:20px!important;height:20px!important}
          .pl-modal.pl-step-2 .pl-status-item.active .pl-status-dot{border-color:var(--pl-accent);box-shadow:0 0 16px color-mix(in srgb,var(--pl-accent) 35%,transparent)}
          .pl-modal.pl-step-2 .pl-status-spinner{width:18px;height:18px;background:var(--pl-accent);box-shadow:0 0 12px color-mix(in srgb,var(--pl-accent) 45%,transparent)}
          .pl-modal.pl-step-2 .pl-status-label{flex:1;min-width:0}
          .pl-modal.pl-step-2 .pl-status-pill{
            flex:0 0 auto;padding:8px 17px;border-radius:999px;font-size:15px;font-weight:750;line-height:1;
            color:#73809f;background:linear-gradient(180deg,#fff,#f6f7fb);
            border:1px solid #e5e8f0;box-shadow:0 5px 12px rgba(35,42,76,.10);
          }
          .pl-modal.pl-step-2 .pl-status-item.done .pl-status-pill{
            color:#0ba774;background:#e9fbf4;border-color:#c8f3e3;box-shadow:0 5px 12px rgba(16,185,129,.12);
          }
          .pl-modal.pl-step-2 .pl-status-item.active .pl-status-pill{
            color:var(--pl-accent);background:color-mix(in srgb,var(--pl-accent) 8%,#fff);
            border-color:color-mix(in srgb,var(--pl-accent) 22%,#fff);
            box-shadow:0 5px 14px color-mix(in srgb,var(--pl-accent) 14%,transparent);
          }
          .pl-modal.pl-step-2 .pl-global-footer{font-size:18px;gap:12px;margin-top:30px;min-height:48px}
          .pl-modal.pl-step-2 .pl-global-footer svg{width:28px!important;height:28px!important;padding:7px;border-radius:10px;background:#fff;box-shadow:0 6px 14px color-mix(in srgb,var(--pl-accent) 15%,rgba(15,23,42,.08));color:var(--pl-accent)}
          .pl-modal.pl-step-2 .pl-amb-dotgrid.top-right{width:120px;height:110px;right:10px;top:92px;background-size:15px 15px;opacity:.55}
          .pl-modal.pl-step-2 .pl-amb-dotgrid.bottom-left{width:125px;height:105px;left:10px;bottom:35px;background-size:15px 15px;opacity:.42}
        }

                /* Step 3 Preview Wrapper */
        .pl-preview-wrapper{
          width:100%;
          box-sizing:border-box;
        }

        /* Global Uniform Footer for Step 1 & 2 */
        .pl-global-footer{
          display:flex;
          align-items:center;
          justify-content:center;
          gap:6px;
          color:#64748b;
          font-size:11.5px;
          margin-top:14px;
          text-align:center;
        }
        .pl-global-footer svg{
          color:#94a3b8;
        }

        /* V72 — Step 1 Instagram CTA: clone Home Instagram card button colors/effects. */
        .pl-modal.pl-step-1.pl-instagram .pl-primary-btn{
          background:linear-gradient(90deg,#ff2d69 0%,#ef5574 42%,#7565ed 100%) !important;
          border:1px solid color-mix(in srgb,#E1306C 70%,#fff) !important;
          box-shadow:0 10px 14px color-mix(in srgb,#E1306C 24%,rgba(20,28,60,.18)),inset 0 1px 0 rgba(255,255,255,.28) !important;
          filter:none !important;
          transition:transform .18s ease,box-shadow .18s ease !important;
        }
        .pl-modal.pl-step-1.pl-instagram .pl-primary-btn:hover{
          background:linear-gradient(90deg,#ff2d69 0%,#ef5574 42%,#7565ed 100%) !important;
          transform:translateY(-2px) !important;
          box-shadow:0 13px 20px color-mix(in srgb,#E1306C 31%,rgba(20,28,60,.18)) !important;
          filter:none !important;
        }
        .pl-modal.pl-step-1.pl-instagram .pl-primary-btn:active{
          transform:translateY(0) !important;
        }

        /* V83 — Desktop-only proportional reduction for all funnel steps.
           Step 1 already uses the approved 70% base scale; reduce it by only 8%
           (0.70 × 0.92 = 0.644). Steps 2 and 3 use the same 8% reduction.
           Mobile remains untouched. */
        @media (min-width: 901px){
          .pl-modal.pl-step-1{
            transform:scale(.644) !important;
            transform-origin:center center !important;
          }
          .pl-modal.pl-step-2,
          .pl-modal.pl-step-3{
            transform:scale(.92) !important;
            transform-origin:center center !important;
          }
        }

        /* V86 — Step 2 surgical parity pass from the supplied master reference. */
        @media (min-width: 901px){
          .pl-modal.pl-step-2{
            width:760px!important;max-width:760px!important;min-height:980px!important;
            padding:46px 46px 38px!important;border-radius:46px!important;
            background:
              radial-gradient(circle at 10% 10%,rgba(255,102,154,.10),transparent 31%),
              radial-gradient(circle at 93% 92%,rgba(131,72,255,.11),transparent 23%),#fff!important;
            box-shadow:0 38px 92px rgba(13,22,44,.36),inset 0 -5px 0 rgba(236,98,185,.18),0 0 0 2px rgba(255,255,255,.86),0 0 0 3px rgba(188,117,255,.20)!important;
          }
          .pl-modal.pl-step-2 .pl-step-container{min-height:892px!important}
          .pl-modal.pl-step-2 .pl-heading{margin:14px auto 38px!important;padding:0 72px!important}
          .pl-modal.pl-step-2 .pl-step-tag{font-size:18px!important;padding:9px 20px!important;margin-bottom:23px!important;box-shadow:0 8px 18px rgba(225,48,108,.16)!important}
          .pl-modal.pl-step-2 .pl-heading h2{font-size:58px!important;line-height:.98!important;letter-spacing:-2.5px!important;text-shadow:0 8px 14px rgba(22,39,78,.16)!important}
          .pl-modal.pl-step-2 .pl-sub{font-size:23px!important;margin-top:24px!important;line-height:1.35!important}
          .pl-modal.pl-step-2 .pl-close{width:58px!important;height:58px!important;right:0!important;top:0!important;border:1px solid #e4eaf3!important;border-radius:50%!important;box-shadow:0 10px 20px rgba(39,53,85,.18)!important}
          .pl-modal.pl-step-2 .pl-loading-card{
            border-radius:42px!important;padding:38px 48px 42px!important;
            background:linear-gradient(180deg,#fff 0%,#fefeff 100%)!important;
            border:1.5px solid #dce2ee!important;box-shadow:0 24px 45px rgba(33,40,74,.15),inset 0 1px 0 #fff!important;
          }
          .pl-modal.pl-step-2 .pl-radar-wrap{width:184px!important;height:184px!important;margin:0 auto 30px!important}
          .pl-modal.pl-step-2 .pl-radar-core{width:116px!important;height:116px!important;background:radial-gradient(circle,#fff 12%,#fff0f6 54%,#fff 78%)!important;box-shadow:0 18px 34px rgba(225,48,108,.18)!important}
          .pl-modal.pl-step-2 .pl-radar-core img{width:78px!important;height:78px!important;filter:drop-shadow(0 9px 11px rgba(213,55,108,.20))!important}
          .pl-modal.pl-step-2 .pl-radar-ring{animation:none!important;border:3px solid rgba(239,79,164,.58)!important;box-shadow:0 0 18px rgba(225,48,108,.12),inset 0 0 18px rgba(225,48,108,.06)!important}
          .pl-modal.pl-step-2 .pl-radar-ring-1{inset:12px!important;border-color:rgba(255,91,161,.34)!important}
          .pl-modal.pl-step-2 .pl-radar-ring-2{inset:0!important;border-color:rgba(213,70,240,.60)!important}
          .pl-modal.pl-step-2 .pl-searching-title{font-size:31px!important;line-height:1.18!important;margin:0 0 13px!important;letter-spacing:-.75px!important}
          .pl-modal.pl-step-2 .pl-searching-title span{font-size:32px!important;color:#f12670!important}
          .pl-modal.pl-step-2 .pl-searching-sub{font-size:21px!important;margin:0 0 32px!important;color:#697b9f!important}
          .pl-modal.pl-step-2 .pl-status-list{border:1.5px solid #d8deeb!important;border-radius:30px!important;padding:12px 28px!important;background:rgba(255,255,255,.92)!important;box-shadow:inset 0 1px 0 #fff!important}
          .pl-modal.pl-step-2 .pl-status-item{min-height:82px!important;gap:18px!important;font-size:21px!important;border-bottom:1px solid #e1e6ef!important}
          .pl-modal.pl-step-2 .pl-status-dot{width:40px!important;height:40px!important;border:2.5px solid #d8d9ef!important;background:#fff!important;box-shadow:0 5px 12px rgba(38,50,84,.08)!important}
          .pl-modal.pl-step-2 .pl-status-item.done .pl-status-dot{background:#19c58e!important;border-color:#19c58e!important;box-shadow:0 0 20px rgba(25,197,142,.45)!important}
          .pl-modal.pl-step-2 .pl-status-item.active .pl-status-dot{background:#fff!important;border:3px solid #ff2b80!important;box-shadow:0 0 18px rgba(255,43,128,.34)!important}
          .pl-modal.pl-step-2 .pl-status-spinner{width:19px!important;height:19px!important;background:#f62b7b!important;animation:none!important;box-shadow:none!important}
          .pl-modal.pl-step-2 .pl-status-label{font-weight:750!important;color:#14203a!important}
          .pl-modal.pl-step-2 .pl-status-item:not(.done):not(.active) .pl-status-label{color:#7d8cab!important;font-weight:650!important}
          .pl-modal.pl-step-2 .pl-status-pill{padding:9px 19px!important;font-size:16px!important;border-radius:999px!important;box-shadow:0 6px 13px rgba(35,42,76,.10)!important}
          .pl-modal.pl-step-2 .pl-status-item.done .pl-status-pill{color:#08aa76!important;background:#e8fbf4!important;border-color:#c5f1e1!important}
          .pl-modal.pl-step-2 .pl-status-item.active .pl-status-pill{color:#f12773!important;background:#fff0f6!important;border-color:#ffd1e2!important;box-shadow:0 6px 15px rgba(241,39,115,.14)!important}
          .pl-modal.pl-step-2 .pl-global-footer{font-size:19px!important;gap:13px!important;margin-top:34px!important;min-height:52px!important;color:#687da4!important}
          .pl-modal.pl-step-2 .pl-global-footer svg{width:30px!important;height:30px!important;padding:7px!important;color:#9b38ef!important;background:#fff!important;border-radius:10px!important;box-shadow:0 7px 16px rgba(142,55,228,.16)!important}
          .pl-modal.pl-step-2 .pl-amb-dotgrid.top-right{width:132px!important;height:122px!important;right:7px!important;top:105px!important;background-size:16px 16px!important;opacity:.58!important}
          .pl-modal.pl-step-2 .pl-amb-dotgrid.bottom-left{width:135px!important;height:112px!important;left:5px!important;bottom:31px!important;background-size:16px 16px!important;opacity:.45!important}
        }


        /* V110 — Step 3 Instagram master-reference redesign. Desktop only.
           Visual-only: live profile data, search flow and actions remain untouched. */
        @media (min-width: 901px){
          .pl-modal.pl-step-3.pl-instagram{
            width:min(92vw,650px)!important;
            max-width:650px!important;
            min-width:320px!important;
            height:auto!important;
            min-height:0!important;
            padding:34px 38px 30px!important;
            border-radius:42px!important;
            overflow:visible!important;
            transform-origin:50%!important;
            transform:scale(.644)!important;
            background:
              radial-gradient(circle at 8% 8%,rgba(255,117,157,.12),transparent 29%),
              radial-gradient(circle at 96% 88%,rgba(122,72,255,.12),transparent 24%),
              linear-gradient(180deg,#fffefe 0%,#fff 68%,#fefcff 100%)!important;
            border:2px solid rgba(255,255,255,.96)!important;
            box-shadow:
              0 34px 86px rgba(13,22,45,.37),
              0 0 0 2px rgba(255,193,224,.34),
              0 0 0 4px rgba(158,112,255,.15),
              inset 0 -5px 0 rgba(235,102,185,.20)!important;
          }
          .pl-modal.pl-step-3.pl-instagram::before,
          .pl-modal.pl-step-3.pl-instagram::after{
            content:none!important;
            display:none!important;
          }
          .pl-modal.pl-step-3.pl-instagram .pl-step-container{min-height:942px!important;justify-content:flex-start!important}
          .pl-modal.pl-step-3.pl-instagram .pl-heading{margin:8px auto 24px!important;padding:0 58px!important;text-align:center!important}
          .pl-modal.pl-step-3.pl-instagram .pl-step-tag{
            margin-bottom:11px!important;padding:7px 16px!important;border-radius:999px!important;
            font-size:18px!important;font-weight:800!important;letter-spacing:.2px!important;color:#f12670!important;
            background:rgba(255,255,255,.92)!important;border:1px solid rgba(241,38,112,.08)!important;
            box-shadow:0 8px 18px rgba(219,48,114,.17),inset 0 1px 0 #fff!important;
          }
          .pl-modal.pl-step-3.pl-instagram .pl-heading h2{
            margin:0!important;font-size:46px!important;line-height:1!important;letter-spacing:-2.3px!important;
            font-weight:800!important;color:#071126!important;text-shadow:0 6px 12px rgba(13,27,58,.18)!important;
          }
          .pl-modal.pl-step-3.pl-instagram .pl-sub{
            max-width:570px!important;margin:13px auto 0!important;font-size:20px!important;line-height:1.35!important;
            color:#58688b!important;font-weight:450!important;
          }
          .pl-modal.pl-step-3.pl-instagram .pl-sub strong{font-weight:750!important;color:#536183!important}
          .pl-modal.pl-step-3.pl-instagram .pl-close{
            width:48px!important;height:48px!important;right:5px!important;top:4px!important;border-radius:50%!important;
            border:1px solid #e3e8f2!important;background:#f9fbff!important;
            box-shadow:0 10px 21px rgba(34,49,82,.18),inset 0 1px 0 #fff!important;
          }
          .pl-modal.pl-step-3.pl-instagram .pl-close svg{width:24px!important;height:24px!important;stroke-width:2.35!important}
          .pl-modal.pl-step-3.pl-instagram .pl-ambient-bg{opacity:.13!important}
          .pl-modal.pl-step-3.pl-instagram .pl-amb-dotgrid.top-right{
            width:118px!important;height:100px!important;right:0!important;top:96px!important;background-size:15px 15px!important;opacity:.48!important;
          }
          .pl-modal.pl-step-3.pl-instagram .pl-amb-dotgrid.bottom-left{
            width:130px!important;height:104px!important;left:6px!important;bottom:22px!important;background-size:15px 15px!important;opacity:.35!important;
          }
          .pl-modal.pl-step-3.pl-instagram .pl-preview-wrapper{
            width:100%!important;margin-top:2px!important;padding:0!important;border-radius:32px!important;
            background:rgba(255,255,255,.56)!important;box-shadow:0 24px 42px rgba(44,45,84,.10)!important;
          }
          .pl-modal.pl-step-3.pl-instagram .ig-preview-ref{
            border-radius:32px!important;border:1.5px solid #e3e2ec!important;overflow:hidden!important;
            background:linear-gradient(180deg,rgba(255,255,255,.99),rgba(255,253,255,.99))!important;
            box-shadow:0 24px 42px rgba(43,47,88,.13),inset 0 1px 0 #fff!important;
          }
          .pl-modal.pl-step-3.pl-instagram .ig-topbar{
            height:76px!important;padding:0 26px!important;grid-template-columns:54px minmax(0,1fr) auto!important;
            border-bottom:1px solid #e7e5ee!important;background:rgba(255,255,255,.96)!important;
          }
          .pl-modal.pl-step-3.pl-instagram .ig-topbar>button:first-child,
          .pl-modal.pl-step-3.pl-instagram .ig-topbar>div:last-child>button{
            width:46px!important;height:46px!important;border-radius:15px!important;display:flex!important;align-items:center!important;justify-content:center!important;
            background:linear-gradient(180deg,#fff,#fdfbff)!important;border:1px solid #ebe7f0!important;
            box-shadow:0 9px 18px rgba(45,47,83,.11),0 8px 14px rgba(240,82,167,.08)!important;
          }
          .pl-modal.pl-step-3.pl-instagram .ig-topbar>div:last-child{gap:12px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-topbar>div:nth-child(2) span{font-size:23px!important;font-weight:750!important;color:#0b1328!important}
          .pl-modal.pl-step-3.pl-instagram .ig-topbar svg{width:27px!important;height:27px!important;stroke-width:2.25!important}
          .pl-modal.pl-step-3.pl-instagram .ig-profile-main{
            grid-template-columns:178px minmax(0,1fr)!important;column-gap:28px!important;align-items:center!important;
            padding:30px 28px 16px!important;
          }
          .pl-modal.pl-step-3.pl-instagram .ig-avatar-ring{
            width:158px!important;height:158px!important;padding:4px!important;
            box-shadow:0 13px 26px rgba(225,48,108,.18)!important;
          }
          .pl-modal.pl-step-3.pl-instagram .ig-avatar-ring>div{padding:5px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-avatar-wrap>div:not(.ig-avatar-ring){width:158px!important;height:158px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-display-name{
            margin-top:0!important;font-size:28px!important;line-height:1.1!important;font-weight:720!important;letter-spacing:-.6px!important;color:#071126!important;
          }
          .pl-modal.pl-step-3.pl-instagram .ig-metrics{margin-top:27px!important;gap:8px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-metrics b{font-size:27px!important;font-weight:700!important;color:#071126!important;letter-spacing:-.5px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-metrics span{margin-top:8px!important;font-size:17px!important;line-height:1!important;color:#59658a!important}
          .pl-modal.pl-step-3.pl-instagram .ig-actions{
            grid-template-columns:minmax(0,1fr) minmax(0,1fr) 72px!important;gap:14px!important;padding:0 28px!important;margin:0 0 22px!important;
          }
          .pl-modal.pl-step-3.pl-instagram .ig-actions button{
            height:66px!important;border-radius:20px!important;background:linear-gradient(180deg,#fff,#fdfbff)!important;
            border:1px solid #e7e4ee!important;color:#0a142d!important;font-size:20px!important;font-weight:700!important;
            box-shadow:0 13px 22px rgba(46,47,85,.10),0 11px 18px rgba(228,67,169,.08),inset 0 1px 0 #fff!important;
          }
          .pl-modal.pl-step-3.pl-instagram .ig-actions button:last-child{width:72px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-actions svg{width:25px!important;height:25px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-tabs{
            height:70px!important;padding:0 20px!important;border-bottom:0!important;background:rgba(255,255,255,.78)!important;
          }
          .pl-modal.pl-step-3.pl-instagram .ig-tabs>div{margin:6px 18px!important;border-radius:16px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-tabs>div:not(:first-child){background:linear-gradient(180deg,#fff,#fdfbff)!important;border:1px solid #ece9f1!important;box-shadow:0 8px 15px rgba(47,50,86,.08)!important}
          .pl-modal.pl-step-3.pl-instagram .ig-tabs>div:first-child{background:linear-gradient(180deg,#fff,#fdfbff)!important;border:1px solid #ece9f1!important;box-shadow:0 8px 15px rgba(47,50,86,.09)!important}
          .pl-modal.pl-step-3.pl-instagram .ig-tabs svg{width:29px!important;height:29px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-tabs>div:first-child>div{width:64px!important;height:4px!important;bottom:-8px!important;border-radius:999px!important;background:linear-gradient(90deg,#ff2d87,#c533ff)!important;box-shadow:0 4px 8px rgba(216,46,194,.25)!important}
          .pl-modal.pl-step-3.pl-instagram .ig-media-grid{
            gap:6px!important;margin:8px 20px 20px!important;width:calc(100% - 40px)!important;padding:9px!important;border-radius:20px!important;
            background:#fff!important;border:1px solid #e6e3ed!important;box-shadow:0 12px 22px rgba(45,47,84,.10)!important;overflow:hidden!important;
          }
          .pl-modal.pl-step-3.pl-instagram .ig-media-grid>div{border-radius:12px!important;overflow:hidden!important;aspect-ratio:1.08/1!important}
          .pl-modal.pl-step-3.pl-instagram .pl-confirm-block{margin-top:24px!important;width:100%!important}
          .pl-modal.pl-step-3.pl-instagram .pl-confirm-btn{
            width:72%!important;max-width:440px!important;height:64px!important;border-radius:20px!important;
            font-size:21px!important;font-weight:780!important;gap:16px!important;
            background:linear-gradient(100deg,#8535f7 0%,#d82fc2 42%,#ff315a 65%,#ff9a35 100%)!important;
            border:1px solid rgba(225,48,108,.35)!important;
            box-shadow:0 15px 24px rgba(225,48,108,.27),inset 0 1px 0 rgba(255,255,255,.34)!important;
          }
          .pl-modal.pl-step-3.pl-instagram .pl-confirm-btn svg{width:26px!important;height:26px!important}
          .pl-modal.pl-step-3.pl-instagram .pl-search-another-btn{
            margin:20px auto 0!important;font-size:18px!important;font-weight:520!important;color:#58618b!important;
          }
        }

        /* V87 — Step 2 master-reference parity. Desktop only. */
        @media (min-width: 901px){
          .pl-modal.pl-step-2{
            width:820px!important;max-width:820px!important;min-height:1045px!important;
            padding:48px 52px 42px!important;border-radius:48px!important;overflow:visible!important;
            background:
              radial-gradient(circle at 8% 10%,rgba(255,98,147,.12),transparent 30%),
              radial-gradient(circle at 96% 90%,rgba(126,76,255,.12),transparent 24%),
              #fff!important;
            border:2px solid rgba(255,255,255,.95)!important;
            box-shadow:
              0 38px 92px rgba(12,23,51,.38),
              0 0 0 2px rgba(245,182,225,.30),
              0 0 0 4px rgba(155,104,255,.18),
              inset 0 -5px 0 rgba(236,98,185,.18)!important;
          }
          .pl-modal.pl-step-2 .pl-step-container{min-height:950px!important;position:relative!important}
          .pl-modal.pl-step-2 .pl-heading{margin:7px auto 38px!important;padding:0 82px!important}
          .pl-modal.pl-step-2 .pl-step-tag{
            font-size:20px!important;font-weight:850!important;letter-spacing:.25px!important;
            padding:10px 24px!important;margin-bottom:27px!important;border-radius:999px!important;
            background:#fff!important;color:#f12670!important;border:1px solid rgba(241,38,112,.08)!important;
            box-shadow:0 9px 22px rgba(225,48,108,.18),inset 0 1px 0 #fff!important;
          }
          .pl-modal.pl-step-2 .pl-heading h2{font-size:64px!important;line-height:.97!important;letter-spacing:-3px!important;font-weight:850!important;color:#0d1730!important;text-shadow:0 8px 16px rgba(19,36,72,.18)!important}
          .pl-modal.pl-step-2 .pl-sub{font-size:24px!important;line-height:1.35!important;margin-top:26px!important;color:#68799b!important}
          .pl-modal.pl-step-2 .pl-close{width:62px!important;height:62px!important;right:1px!important;top:1px!important;border:1px solid #e2e8f2!important;border-radius:50%!important;background:#f9fbff!important;box-shadow:0 12px 24px rgba(35,48,80,.20),inset 0 1px 0 #fff!important}
          .pl-modal.pl-step-2 .pl-close svg{width:29px!important;height:29px!important;stroke-width:2.4!important}

          .pl-modal.pl-step-2 .pl-loading-card{
            min-height:735px!important;border-radius:44px!important;padding:38px 48px 44px!important;
            background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(254,253,255,.98))!important;
            border:1.5px solid #d9e0ec!important;
            box-shadow:0 28px 52px rgba(32,41,79,.17),inset 0 1px 0 #fff!important;
          }
          .pl-modal.pl-step-2 .pl-radar-wrap{width:218px!important;height:218px!important;margin:0 auto 30px!important;position:relative!important}
          .pl-modal.pl-step-2 .pl-radar-ring{position:absolute!important;border-radius:50%!important;animation:none!important;pointer-events:none!important}
          .pl-modal.pl-step-2 .pl-radar-ring-3{inset:0!important;border:4px solid rgba(203,81,247,.76)!important;box-shadow:0 0 22px rgba(204,74,239,.18),inset 0 0 16px rgba(255,68,151,.05)!important}
          .pl-modal.pl-step-2 .pl-radar-ring-2{inset:10px!important;border:3px solid rgba(255,84,151,.48)!important;box-shadow:0 0 14px rgba(255,83,151,.12)!important}
          .pl-modal.pl-step-2 .pl-radar-ring-1{inset:28px!important;border:2px solid rgba(255,121,168,.30)!important;background:radial-gradient(circle,rgba(255,255,255,.72) 0 46%,rgba(255,237,246,.66) 47% 100%)!important;box-shadow:inset 0 0 26px rgba(235,84,151,.10)!important}
          .pl-modal.pl-step-2 .pl-radar-core{width:126px!important;height:126px!important;position:absolute!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;border-radius:50%!important;background:radial-gradient(circle,#fff 5%,#fff2f8 58%,#fff 84%)!important;box-shadow:0 16px 36px rgba(225,48,108,.21),inset 0 0 22px rgba(255,102,163,.10)!important;z-index:4!important}
          .pl-modal.pl-step-2 .pl-radar-core img{width:103px!important;height:103px!important;filter:drop-shadow(0 10px 13px rgba(213,55,108,.22))!important}

          .pl-modal.pl-step-2 .pl-searching-title{font-size:35px!important;line-height:1.16!important;margin:0 0 13px!important;letter-spacing:-1px!important;font-weight:820!important;color:#0f1a34!important}
          .pl-modal.pl-step-2 .pl-searching-title span{font-size:36px!important;color:#f12670!important;font-weight:850!important}
          .pl-modal.pl-step-2 .pl-searching-sub{font-size:23px!important;margin:0 0 34px!important;color:#6a7b9e!important;line-height:1.35!important}

          .pl-modal.pl-step-2 .pl-status-list{
            border:1.5px solid #d7deeb!important;border-radius:31px!important;padding:8px 30px!important;
            background:rgba(255,255,255,.96)!important;box-shadow:inset 0 1px 0 #fff,0 10px 24px rgba(46,58,92,.05)!important;
          }
          .pl-modal.pl-step-2 .pl-status-item{min-height:94px!important;gap:22px!important;font-size:23px!important;border-bottom:1px solid #dfe5ef!important;padding:0!important}
          .pl-modal.pl-step-2 .pl-status-item:last-child{border-bottom:0!important}
          .pl-modal.pl-step-2 .pl-status-label{font-weight:780!important;color:#13203b!important;letter-spacing:-.25px!important}
          .pl-modal.pl-step-2 .pl-status-item:not(.done):not(.active) .pl-status-label{color:#7c8cac!important;font-weight:680!important}
          .pl-modal.pl-step-2 .pl-status-dot{width:48px!important;height:48px!important;flex:0 0 48px!important;border-radius:50%!important;border:3px solid #d8dcf0!important;background:#fff!important;box-shadow:0 6px 15px rgba(39,51,87,.09)!important}
          .pl-modal.pl-step-2 .pl-status-item.done .pl-status-dot{background:#18c58e!important;border-color:#18c58e!important;box-shadow:0 0 0 7px rgba(24,197,142,.07),0 0 24px rgba(24,197,142,.48)!important}
          .pl-modal.pl-step-2 .pl-status-item.done .pl-status-dot svg{width:26px!important;height:26px!important;stroke-width:3.2!important}
          .pl-modal.pl-step-2 .pl-status-item.active .pl-status-dot{background:#fff!important;border:4px solid #ff2b80!important;box-shadow:0 0 0 7px rgba(255,43,128,.06),0 0 22px rgba(255,43,128,.42)!important}
          .pl-modal.pl-step-2 .pl-status-spinner{width:22px!important;height:22px!important;border-radius:50%!important;background:#f82b7c!important;animation:none!important;box-shadow:0 0 13px rgba(248,43,124,.30)!important}
          .pl-modal.pl-step-2 .pl-status-pill{min-width:132px!important;text-align:center!important;padding:10px 20px!important;font-size:17px!important;font-weight:800!important;border-radius:999px!important;border:1px solid #e5e8f1!important;background:#f7f8fb!important;color:#7181a2!important;box-shadow:0 7px 15px rgba(35,42,76,.11),inset 0 1px 0 #fff!important}
          .pl-modal.pl-step-2 .pl-status-item.done .pl-status-pill{color:#08aa76!important;background:#e9fbf5!important;border-color:#c4f0e0!important;box-shadow:0 7px 16px rgba(8,170,118,.12),inset 0 1px 0 #fff!important}
          .pl-modal.pl-step-2 .pl-status-item.active .pl-status-pill{color:#f12773!important;background:#fff0f6!important;border-color:#ffd1e2!important;box-shadow:0 7px 16px rgba(241,39,115,.15),inset 0 1px 0 #fff!important}

          /* V91 — Step 2 progress block: 2.5D treatment matched to reference */
          .pl-modal.pl-step-2 .pl-status-list{
            background:linear-gradient(180deg,rgba(255,255,255,.985),rgba(252,253,255,.965))!important;
            border:1.7px solid #d7dfed!important;
            box-shadow:0 12px 30px rgba(35,49,82,.075),inset 0 1px 0 rgba(255,255,255,1),inset 0 -1px 0 rgba(218,226,239,.32)!important;
          }
          .pl-modal.pl-step-2 .pl-status-item{position:relative!important}
          .pl-modal.pl-step-2 .pl-status-dot{
            background:linear-gradient(145deg,#fff,#f9fbff)!important;
            border-color:#d4dcef!important;
            box-shadow:0 7px 14px rgba(45,60,94,.10),inset 0 2px 3px rgba(255,255,255,.95),inset 0 -2px 4px rgba(211,220,238,.18)!important;
          }
          .pl-modal.pl-step-2 .pl-status-item.done .pl-status-dot{
            background:linear-gradient(145deg,#23d3a0 0%,#0fba83 100%)!important;
            border-color:#20c995!important;
            box-shadow:0 0 0 7px rgba(28,205,151,.10),0 8px 17px rgba(13,177,124,.24),0 0 24px rgba(25,207,151,.36),inset 0 2px 3px rgba(255,255,255,.25),inset 0 -3px 5px rgba(0,119,82,.12)!important;
          }
          .pl-modal.pl-step-2 .pl-status-item.active .pl-status-dot{
            background:linear-gradient(145deg,#fff,#fff8fb)!important;
            border:4px solid #ff2d82!important;
            box-shadow:0 0 0 7px rgba(255,45,130,.09),0 8px 17px rgba(230,32,111,.16),0 0 25px rgba(255,45,130,.38),inset 0 2px 4px rgba(255,255,255,.95)!important;
          }
          .pl-modal.pl-step-2 .pl-status-spinner{
            background:linear-gradient(145deg,#ff4a98,#ef1f70)!important;
            box-shadow:0 4px 8px rgba(224,25,101,.20),0 0 14px rgba(255,43,128,.32),inset 0 2px 3px rgba(255,255,255,.24)!important;
          }
          .pl-modal.pl-step-2 .pl-status-pill{
            background:linear-gradient(180deg,#fbfcff 0%,#f4f6fb 100%)!important;
            border-color:#e1e6f0!important;
            box-shadow:0 8px 17px rgba(42,54,88,.11),inset 0 2px 2px rgba(255,255,255,.95),inset 0 -2px 3px rgba(213,220,235,.18)!important;
          }
          .pl-modal.pl-step-2 .pl-status-item.done .pl-status-pill{
            background:linear-gradient(180deg,#effdf8 0%,#e4faf2 100%)!important;
            border-color:#bdeedc!important;
            box-shadow:0 8px 17px rgba(10,172,119,.13),0 0 13px rgba(44,213,158,.07),inset 0 2px 2px rgba(255,255,255,.95)!important;
          }
          .pl-modal.pl-step-2 .pl-status-item.active .pl-status-pill{
            background:linear-gradient(180deg,#fff5f9 0%,#ffedf4 100%)!important;
            border-color:#ffcadd!important;
            box-shadow:0 8px 17px rgba(239,37,113,.14),0 0 13px rgba(255,68,139,.07),inset 0 2px 2px rgba(255,255,255,.95)!important;
          }

          .pl-modal.pl-step-2 .pl-global-footer{font-size:20px!important;gap:14px!important;margin-top:35px!important;min-height:56px!important;color:#6b7da1!important}
          /* V94 — Step 2 footer lock: 2.5D outline treatment only */
          .pl-modal.pl-step-2 .pl-global-footer svg{
            width:34px!important;
            height:34px!important;
            padding:7px!important;
            color:#d72faf!important;
            fill:none!important;
            stroke:currentColor!important;
            stroke-width:2.15!important;
            background:linear-gradient(145deg,#ffffff 0%,#fff9fd 58%,#f9f3ff 100%)!important;
            border:1px solid rgba(220,74,187,.16)!important;
            border-radius:11px!important;
            box-shadow:
              0 8px 16px rgba(199,46,170,.15),
              0 2px 5px rgba(112,58,188,.10),
              inset 0 2px 2px rgba(255,255,255,.98),
              inset 0 -2px 4px rgba(218,184,241,.18)!important;
            filter:drop-shadow(0 1px 0 rgba(255,255,255,.95)) drop-shadow(0 2px 2px rgba(164,45,172,.10))!important;
            transform:translateY(-1px)!important;
          }

          .pl-modal.pl-step-2 .pl-amb-dotgrid.top-right{width:148px!important;height:132px!important;right:12px!important;top:104px!important;background-size:17px 17px!important;opacity:.87!important}
          .pl-modal.pl-step-2 .pl-amb-dotgrid.bottom-left{width:145px!important;height:125px!important;left:12px!important;bottom:28px!important;background-size:17px 17px!important;opacity:.81!important}
          .pl-modal.pl-step-2 .pl-step2-orb{position:absolute!important;border-radius:50%!important;z-index:6!important;pointer-events:none!important}
          .pl-modal.pl-step-2 .pl-step2-orb-left{width:60px!important;height:60px!important;left:-76px!important;top:52%!important;background:linear-gradient(145deg,#ff6eb4,#ff465c 58%,#ff8b37)!important;box-shadow:0 14px 26px rgba(255,72,99,.30),0 0 22px rgba(255,95,160,.20)!important}
          .pl-modal.pl-step-2 .pl-step2-orb-top{width:46px!important;height:46px!important;right:2px!important;top:188px!important;background:linear-gradient(145deg,#ff6bd7,#8237ff)!important;box-shadow:0 12px 24px rgba(139,56,255,.34),0 0 18px rgba(222,74,255,.22)!important}
          .pl-modal.pl-step-2 .pl-step2-orb-bottom{width:64px!important;height:64px!important;right:-2px!important;bottom:6px!important;background:linear-gradient(145deg,#d85fff,#713aff 70%)!important;box-shadow:0 14px 27px rgba(113,58,255,.34),0 0 22px rgba(209,80,255,.22)!important}
          .pl-modal.pl-step-2 .pl-amb-social{display:none!important}
          .pl-modal.pl-step-2 .pl-amb-dashpath{display:none!important}

          /* V97 — Step 2: exact outer frame/position parity with Step 1.
             Important: only the modal frame is matched; children are reflowed inside it,
             never independently transformed (prevents the V96 overflow/misalignment). */
          .pl-modal.pl-step-2{
            width:min(92vw,690px)!important;
            max-width:690px!important;
            min-width:320px!important;
            height:884px!important;
            min-height:884px!important;
            max-height:884px!important;
            padding:34px 38px 30px!important;
            border-radius:42px!important;
            transform:scale(.644)!important;
            transform-origin:center center!important;
            overflow:visible!important;
            margin:auto!important;
          }
          .pl-modal.pl-step-2 .pl-step-container{
            width:100%!important;
            height:820px!important;
            min-height:820px!important;
            max-height:820px!important;
            overflow:visible!important;
          }
          .pl-modal.pl-step-2 .pl-ambient-bg{border-radius:42px!important;overflow:hidden!important}
          .pl-modal.pl-step-2 .pl-close{right:0!important;top:0!important;width:54px!important;height:54px!important}
          .pl-modal.pl-step-2 .pl-heading{margin:8px auto 22px!important;padding:0 70px!important}
          .pl-modal.pl-step-2 .pl-step-tag{font-size:14px!important;padding:7px 16px!important;margin-bottom:11px!important}
          .pl-modal.pl-step-2 .pl-heading h2{font-size:46px!important;line-height:1.03!important;letter-spacing:-1.5px!important}
          .pl-modal.pl-step-2 .pl-sub{font-size:21px!important;line-height:1.45!important;margin-top:14px!important}
          .pl-modal.pl-step-2 .pl-loading-card{
            width:100%!important;
            flex:1 1 auto!important;
            min-height:0!important;
            box-sizing:border-box!important;
            padding:24px 30px 26px!important;
            border-radius:38px!important;
            overflow:hidden!important;
          }
          .pl-modal.pl-step-2 .pl-radar-wrap{width:150px!important;height:150px!important;margin:0 auto 18px!important}
          .pl-modal.pl-step-2 .pl-radar-core{width:104px!important;height:104px!important}
          .pl-modal.pl-step-2 .pl-radar-core img{width:84px!important;height:84px!important}
          .pl-modal.pl-step-2 .pl-radar-ring-1{inset:24px!important}
          .pl-modal.pl-step-2 .pl-radar-ring-2{inset:8px!important}
          .pl-modal.pl-step-2 .pl-radar-ring-3{inset:0!important}
          .pl-modal.pl-step-2 .pl-searching-title{font-size:28px!important;line-height:1.16!important;margin:0 0 8px!important}
          .pl-modal.pl-step-2 .pl-searching-title span{font-size:29px!important}
          .pl-modal.pl-step-2 .pl-searching-sub{font-size:18px!important;margin:0 0 22px!important}
          .pl-modal.pl-step-2 .pl-status-list{padding:7px 22px!important;border-radius:27px!important}
          .pl-modal.pl-step-2 .pl-status-item{min-height:70px!important;gap:16px!important;font-size:18px!important}
          .pl-modal.pl-step-2 .pl-status-dot{width:38px!important;height:38px!important;flex:0 0 38px!important}
          .pl-modal.pl-step-2 .pl-status-item.done .pl-status-dot svg{width:21px!important;height:21px!important}
          .pl-modal.pl-step-2 .pl-status-spinner{width:17px!important;height:17px!important}
          .pl-modal.pl-step-2 .pl-status-pill{min-width:108px!important;padding:8px 15px!important;font-size:14px!important}
          .pl-modal.pl-step-2 .pl-global-footer{font-size:16px!important;gap:12px!important;margin-top:20px!important;min-height:42px!important}
          .pl-modal.pl-step-2 .pl-global-footer svg{width:26px!important;height:26px!important;padding:6px!important;border-radius:9px!important}
          .pl-modal.pl-step-2 .pl-step2-orb-left{width:50px!important;height:50px!important;left:-58px!important;top:48%!important}
          .pl-modal.pl-step-2 .pl-step2-orb-top{width:34px!important;height:34px!important;right:5px!important;top:185px!important}
          .pl-modal.pl-step-2 .pl-step2-orb-bottom{width:54px!important;height:54px!important;right:-10px!important;bottom:8px!important}
          .pl-modal.pl-step-2 .pl-amb-dotgrid.top-right{right:26px!important;top:105px!important;width:96px!important;height:76px!important;background-size:12px 12px!important}
          .pl-modal.pl-step-2 .pl-amb-dotgrid.bottom-left{left:28px!important;bottom:26px!important;width:96px!important;height:76px!important;background-size:12px 12px!important}
        }

        /* V98 — Step 2 final sizing/alignment fix.
           Match Step 1 outer geometry and keep every Step 2 element INSIDE that frame. */
        @media (min-width: 901px){
          .pl-modal.pl-step-2{
            width:min(92vw,690px)!important;
            max-width:690px!important;
            min-width:320px!important;
            height:auto!important;
            min-height:0!important;
            max-height:none!important;
            padding:34px 38px 30px!important;
            border-radius:42px!important;
            transform:scale(.644)!important;
            transform-origin:center center!important;
            overflow:visible!important;
            margin:auto!important;
          }
          .pl-modal.pl-step-2 .pl-step-container{
            width:100%!important;
            height:820px!important;
            min-height:820px!important;
            max-height:820px!important;
            display:flex!important;
            flex-direction:column!important;
            justify-content:flex-start!important;
            overflow:visible!important;
            box-sizing:border-box!important;
          }
          .pl-modal.pl-step-2 .pl-heading{
            flex:0 0 164px!important;
            height:164px!important;
            margin:0 auto 16px!important;
            padding:0 70px!important;
            display:flex!important;
            flex-direction:column!important;
            align-items:center!important;
            justify-content:flex-start!important;
            box-sizing:border-box!important;
          }
          .pl-modal.pl-step-2 .pl-step-tag{font-size:14px!important;padding:7px 16px!important;margin:0 0 11px!important}
          .pl-modal.pl-step-2 .pl-heading h2{font-size:46px!important;line-height:1.03!important;letter-spacing:-1.5px!important;margin:0!important}
          .pl-modal.pl-step-2 .pl-sub{font-size:21px!important;line-height:1.35!important;margin:12px 0 0!important}
          .pl-modal.pl-step-2 .pl-close{right:0!important;top:0!important;width:54px!important;height:54px!important}

          .pl-modal.pl-step-2 .pl-loading-card{
            flex:0 0 582px!important;
            height:582px!important;
            min-height:582px!important;
            max-height:582px!important;
            width:100%!important;
            padding:20px 30px 22px!important;
            border-radius:38px!important;
            overflow:hidden!important;
            box-sizing:border-box!important;
            display:flex!important;
            flex-direction:column!important;
            justify-content:flex-start!important;
          }
          .pl-modal.pl-step-2 .pl-radar-wrap{width:146px!important;height:146px!important;flex:0 0 146px!important;margin:0 auto 12px!important}
          .pl-modal.pl-step-2 .pl-radar-core{width:102px!important;height:102px!important}
          .pl-modal.pl-step-2 .pl-radar-core img{width:82px!important;height:82px!important}
          .pl-modal.pl-step-2 .pl-radar-ring-1{inset:23px!important}
          .pl-modal.pl-step-2 .pl-radar-ring-2{inset:8px!important}
          .pl-modal.pl-step-2 .pl-radar-ring-3{inset:0!important}
          .pl-modal.pl-step-2 .pl-searching-title{font-size:27px!important;line-height:1.12!important;margin:0 0 6px!important}
          .pl-modal.pl-step-2 .pl-searching-title span{font-size:28px!important}
          .pl-modal.pl-step-2 .pl-searching-sub{font-size:17px!important;line-height:1.3!important;margin:0 0 16px!important}
          .pl-modal.pl-step-2 .pl-status-list{
            width:100%!important;
            flex:0 0 284px!important;
            height:284px!important;
            min-height:284px!important;
            max-height:284px!important;
            padding:6px 20px!important;
            border-radius:26px!important;
            box-sizing:border-box!important;
            overflow:hidden!important;
          }
          .pl-modal.pl-step-2 .pl-status-item{min-height:67px!important;height:67px!important;gap:14px!important;font-size:17px!important;padding:0!important}
          .pl-modal.pl-step-2 .pl-status-dot{width:36px!important;height:36px!important;flex:0 0 36px!important}
          .pl-modal.pl-step-2 .pl-status-item.done .pl-status-dot svg{width:20px!important;height:20px!important}
          .pl-modal.pl-step-2 .pl-status-spinner{width:16px!important;height:16px!important}
          .pl-modal.pl-step-2 .pl-status-label{line-height:1.22!important}
          .pl-modal.pl-step-2 .pl-status-pill{min-width:104px!important;padding:7px 14px!important;font-size:13px!important}

          .pl-modal.pl-step-2 .pl-global-footer{
            flex:0 0 42px!important;
            height:42px!important;
            min-height:42px!important;
            margin:16px 0 0!important;
            font-size:16px!important;
            gap:12px!important;
            align-self:center!important;
          }
          .pl-modal.pl-step-2 .pl-global-footer svg{width:26px!important;height:26px!important;padding:6px!important;border-radius:9px!important}
          .pl-modal.pl-step-2 .pl-ambient-bg{border-radius:42px!important;overflow:hidden!important}
          .pl-modal.pl-step-2 .pl-step2-orb-left{width:50px!important;height:50px!important;left:-58px!important;top:48%!important}
          .pl-modal.pl-step-2 .pl-step2-orb-top{width:34px!important;height:34px!important;right:5px!important;top:185px!important}
          .pl-modal.pl-step-2 .pl-step2-orb-bottom{width:54px!important;height:54px!important;right:-10px!important;bottom:8px!important}
          .pl-modal.pl-step-2 .pl-amb-dotgrid.top-right{right:26px!important;top:105px!important;width:96px!important;height:76px!important;background-size:12px 12px!important}
          .pl-modal.pl-step-2 .pl-amb-dotgrid.bottom-left{left:28px!important;bottom:26px!important;width:96px!important;height:76px!important;background-size:12px 12px!important}
        }

        /* V99 — Step 2 internal rhythm/alignment refinement.
           Preserve the approved Step 1-sized outer frame, but restore the airy
           proportions from the Step 2 reference so the content no longer feels compressed. */
        @media (min-width: 901px){
          .pl-modal.pl-step-2 .pl-step-container{
            height:820px!important;
            min-height:820px!important;
            max-height:820px!important;
          }
          .pl-modal.pl-step-2 .pl-heading{
            flex:0 0 154px!important;
            height:154px!important;
            margin:0 auto 18px!important;
            padding:0 72px!important;
          }
          .pl-modal.pl-step-2 .pl-step-tag{
            margin-bottom:13px!important;
          }
          .pl-modal.pl-step-2 .pl-heading h2{
            font-size:45px!important;
            line-height:1.02!important;
          }
          .pl-modal.pl-step-2 .pl-sub{
            font-size:20px!important;
            line-height:1.4!important;
            margin-top:13px!important;
          }
          .pl-modal.pl-step-2 .pl-loading-card{
            flex:0 0 592px!important;
            height:592px!important;
            min-height:592px!important;
            max-height:592px!important;
            padding:26px 32px 28px!important;
            border-radius:38px!important;
            overflow:hidden!important;
          }
          .pl-modal.pl-step-2 .pl-radar-wrap{
            width:150px!important;
            height:150px!important;
            flex:0 0 150px!important;
            margin:0 auto 16px!important;
          }
          .pl-modal.pl-step-2 .pl-radar-core{width:104px!important;height:104px!important}
          .pl-modal.pl-step-2 .pl-radar-core img{width:82px!important;height:82px!important}
          .pl-modal.pl-step-2 .pl-searching-title{
            font-size:27px!important;
            line-height:1.16!important;
            margin:0 0 8px!important;
          }
          .pl-modal.pl-step-2 .pl-searching-title span{font-size:28px!important}
          .pl-modal.pl-step-2 .pl-searching-sub{
            font-size:17px!important;
            line-height:1.35!important;
            margin:0 0 20px!important;
          }
          .pl-modal.pl-step-2 .pl-status-list{
            flex:0 0 300px!important;
            height:300px!important;
            min-height:300px!important;
            max-height:300px!important;
            padding:8px 18px!important;
            border-radius:28px!important;
            overflow:hidden!important;
          }
          .pl-modal.pl-step-2 .pl-status-item{
            min-height:71px!important;
            height:71px!important;
            gap:12px!important;
            font-size:16px!important;
            padding:0 2px!important;
          }
          .pl-modal.pl-step-2 .pl-status-dot{
            width:32px!important;
            height:32px!important;
            flex:0 0 32px!important;
          }
          .pl-modal.pl-step-2 .pl-status-item.done .pl-status-dot svg{width:18px!important;height:18px!important}
          .pl-modal.pl-step-2 .pl-status-spinner{width:14px!important;height:14px!important}
          .pl-modal.pl-step-2 .pl-status-label{
            flex:1 1 auto!important;
            min-width:0!important;
            white-space:nowrap!important;
            line-height:1.2!important;
          }
          .pl-modal.pl-step-2 .pl-status-pill{
            min-width:92px!important;
            padding:7px 12px!important;
            font-size:12.5px!important;
            line-height:1!important;
          }
          .pl-modal.pl-step-2 .pl-global-footer{
            flex:0 0 40px!important;
            height:40px!important;
            min-height:40px!important;
            margin:16px 0 0!important;
          }
        }


        /* V102 — Step 2 progress readability pass.
           Keep modal geometry unchanged; give only the progress block more visual breathing room. */
        @media (min-width: 901px){
          .pl-modal.pl-step-2 .pl-loading-card{
            padding-left:26px!important;
            padding-right:26px!important;
          }
          .pl-modal.pl-step-2 .pl-status-list{
            width:100%!important;
            flex:0 0 318px!important;
            height:318px!important;
            min-height:318px!important;
            max-height:318px!important;
            padding:8px 16px!important;
            border-radius:30px!important;
            border:1.7px solid #d6dfed!important;
            box-shadow:0 14px 32px rgba(35,49,82,.09),inset 0 1px 0 #fff,inset 0 -1px 0 rgba(218,226,239,.34)!important;
          }
          .pl-modal.pl-step-2 .pl-status-item{
            min-height:75px!important;
            height:75px!important;
            gap:15px!important;
            padding:0 4px!important;
            font-size:18px!important;
          }
          .pl-modal.pl-step-2 .pl-status-dot{
            width:38px!important;
            height:38px!important;
            flex:0 0 38px!important;
          }
          .pl-modal.pl-step-2 .pl-status-item.done .pl-status-dot svg{
            width:21px!important;
            height:21px!important;
          }
          .pl-modal.pl-step-2 .pl-status-spinner{
            width:17px!important;
            height:17px!important;
          }
          .pl-modal.pl-step-2 .pl-status-label{
            flex:1 1 auto!important;
            min-width:0!important;
            white-space:nowrap!important;
            line-height:1.2!important;
            font-size:18px!important;
            letter-spacing:-.15px!important;
          }
          .pl-modal.pl-step-2 .pl-status-pill{
            flex:0 0 auto!important;
            min-width:104px!important;
            padding:9px 15px!important;
            font-size:13.5px!important;
            line-height:1!important;
          }
          .pl-modal.pl-step-2 .pl-searching-sub{
            margin-bottom:23px!important;
          }
        }


        /* V103 — rebalance Step 2 after the readability pass.
           Preserve the larger progress controls, but keep the complete loading card
           inside its fixed height so the lower section no longer gets pushed down. */
        @media (min-width: 901px){
          .pl-modal.pl-step-2 .pl-loading-card{
            padding:20px 26px 22px!important;
          }
          .pl-modal.pl-step-2 .pl-radar-wrap{
            width:140px!important;
            height:140px!important;
            flex:0 0 140px!important;
            margin:0 auto 12px!important;
          }
          .pl-modal.pl-step-2 .pl-radar-core{width:100px!important;height:100px!important}
          .pl-modal.pl-step-2 .pl-radar-core img{width:80px!important;height:80px!important}
          .pl-modal.pl-step-2 .pl-searching-title{
            margin:0 0 6px!important;
          }
          .pl-modal.pl-step-2 .pl-searching-sub{
            margin:0 0 16px!important;
          }
          .pl-modal.pl-step-2 .pl-status-list{
            flex:0 0 292px!important;
            height:292px!important;
            min-height:292px!important;
            max-height:292px!important;
            padding:8px 16px!important;
          }
          .pl-modal.pl-step-2 .pl-status-item{
            min-height:68px!important;
            height:68px!important;
          }
          .pl-modal.pl-step-2 .pl-global-footer{
            margin-top:16px!important;
          }
        }

        /* V104 — Step 2 progress labels weight only */
        @media (min-width: 901px){
          .pl-modal.pl-step-2 .pl-status-label,
          .pl-modal.pl-step-2 .pl-status-item:not(.done):not(.active) .pl-status-label{
            font-weight:550!important;
          }
        }

        /* V105 — Step 2 status pills text weight only */
        @media (min-width: 901px){
          .pl-modal.pl-step-2 .pl-status-pill,
          .pl-modal.pl-step-2 .pl-status-item.done .pl-status-pill,
          .pl-modal.pl-step-2 .pl-status-item.active .pl-status-pill{
            font-weight:550!important;
          }
        }

        /* V106 — Step 1 + Step 2 step labels: remove white pill, keep text only */
        .pl-modal.pl-step-1 .pl-step-tag,
        .pl-modal.pl-step-2 .pl-step-tag{
          background:transparent!important;
          border:0!important;
          box-shadow:none!important;
          border-radius:0!important;
          padding:0!important;
        }

        /* V107 — Requested desktop-only Step 1 / Step 2 sizing */
        @media (min-width: 901px){
          .pl-modal.pl-step-2{
            transform-origin:50%!important;
            border-radius:42px!important;
            width:min(92vw,650px)!important;
            min-width:320px!important;
            max-width:650px!important;
          }
          .pl-modal.pl-step-1{
            transform-origin:50%!important;
            border-radius:42px!important;
            width:min(92vw,650px)!important;
            max-width:650px!important;
          }
          .pl-modal.pl-step-1 .pl-sub{
            max-width:520px;
            margin-top:14px;
            font-size:20px;
          }
          .pl-modal.pl-step-1 .pl-step-tag{
            margin-bottom:11px;
            padding:7px 16px!important;
            font-size:18px;
          }
          .pl-modal.pl-step-1 .pl-platform-badge{
            font-weight:550;
            border-radius:20px;
          }
          .pl-modal.pl-step-1 .pl-label{font-weight:600;}
          .pl-modal.pl-step-1 .pl-primary-btn{
            border-radius:20px;
            min-height:82px;
            font-size:22px;
          }

          /* V109 — Requested desktop-only Step 2 typography */
          .pl-modal.pl-step-2 .pl-heading h2{
            font-size:46px!important;
            font-weight:700!important;
          }
          .pl-modal.pl-step-2 .pl-sub{
            font-size:20px!important;
          }
          .pl-modal.pl-step-2 .pl-step-tag{
            margin-bottom:11px!important;
            font-size:18px!important;
          }
          .pl-modal.pl-step-2 .pl-searching-sub{
            font-size:18px!important;
          }
        }
        /* V112 — Step 3 exact desktop outer-size parity with Step 1.
           Keep the Step 3 reference styling, but use the same desktop scale as
           the approved Step 1 so the modal is neither wider nor off-center. */
        @media (min-width: 901px){
          .pl-modal.pl-step-3.pl-instagram{
            width:min(92vw,650px)!important;
            min-width:320px!important;
            max-width:650px!important;
            min-height:0!important;
            height:auto!important;
            padding:24px 30px 22px!important;
            border-radius:42px!important;
            transform:scale(.644)!important;
            transform-origin:center center!important;
          }
          .pl-modal.pl-step-3.pl-instagram .pl-step-container{
            min-height:0!important;
            height:auto!important;
          }
          .pl-modal.pl-step-3.pl-instagram .pl-heading{
            margin:2px auto 16px!important;
            padding:0 54px!important;
          }
          .pl-modal.pl-step-3.pl-instagram .pl-step-tag{
            margin-bottom:11px!important;
            padding:7px 16px!important;
            font-size:18px!important;
          }
          .pl-modal.pl-step-3.pl-instagram .pl-heading h2{
            font-size:43px!important;
            line-height:1!important;
            letter-spacing:-2.3px!important;
            color:#071126!important;
            text-shadow:0 6px 12px #0d1b3a2e!important;
            margin:0!important;
            font-weight:700!important;
          }
          .pl-modal.pl-step-3.pl-instagram .pl-sub{
            margin-top:14px!important;
            font-size:20px!important;
          }
          .pl-modal.pl-step-3.pl-instagram .pl-close{
            width:44px!important;height:44px!important;top:1px!important;right:2px!important;
          }
          .pl-modal.pl-step-3.pl-instagram .pl-preview-wrapper,
          .pl-modal.pl-step-3.pl-instagram .ig-preview-ref{border-radius:26px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-topbar{
            height:62px!important;padding:0 22px!important;grid-template-columns:46px minmax(0,1fr) auto!important;
          }
          .pl-modal.pl-step-3.pl-instagram .ig-topbar>button:first-child,
          .pl-modal.pl-step-3.pl-instagram .ig-topbar>div:last-child>button{
            width:39px!important;height:39px!important;border-radius:13px!important;
          }
          .pl-modal.pl-step-3.pl-instagram .ig-topbar>div:nth-child(2) span{font-size:20px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-topbar svg{width:23px!important;height:23px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-profile-main{
            grid-template-columns:138px minmax(0,1fr)!important;column-gap:22px!important;padding:20px 24px 10px!important;
          }
          .pl-modal.pl-step-3.pl-instagram .ig-avatar-ring,
          .pl-modal.pl-step-3.pl-instagram .ig-avatar-wrap>div:not(.ig-avatar-ring){
            width:124px!important;height:124px!important;
          }
          .pl-modal.pl-step-3.pl-instagram .ig-display-name{font-size:24px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-metrics{margin-top:18px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-metrics b{font-size:23px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-metrics span{margin-top:5px!important;font-size:15px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-actions{
            grid-template-columns:minmax(0,1fr) minmax(0,1fr) 60px!important;gap:12px!important;padding:0 24px!important;margin:0 0 14px!important;
          }
          .pl-modal.pl-step-3.pl-instagram .ig-actions button{height:52px!important;border-radius:17px!important;font-size:18px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-actions button:last-child{width:60px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-tabs{height:56px!important;padding:0 16px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-tabs>div{margin:4px 16px!important;border-radius:14px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-tabs svg{width:25px!important;height:25px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-media-grid{
            gap:5px!important;margin:6px 16px 14px!important;width:calc(100% - 32px)!important;padding:7px!important;border-radius:17px!important;
          }
          .pl-modal.pl-step-3.pl-instagram .ig-media-grid>div{border-radius:10px!important;aspect-ratio:1.28/1!important}
          .pl-modal.pl-step-3.pl-instagram .pl-confirm-block{margin-top:15px!important}
          .pl-modal.pl-step-3.pl-instagram .pl-confirm-btn{
            width:72%!important;max-width:420px!important;height:54px!important;border-radius:20px!important;font-size:22px!important;font-weight:700!important;
          }
          .pl-modal.pl-step-3.pl-instagram .pl-search-another-btn{margin:13px auto 0!important;font-size:19px!important}
        }


        /* V121 — Step 3 keeps each platform's native preview structure and data logic.
           Only the approved modal geometry, heading finish, shadows and platform identity are shared. */
        @media (min-width: 901px){
          .pl-modal.pl-step-3:is(.pl-tiktok,.pl-twitter,.pl-youtube){
            transform-origin:50% 50%!important;
            border-radius:42px!important;
            width:min(92vw,650px)!important;
            min-width:320px!important;
            max-width:650px!important;
            height:auto!important;
            min-height:0!important;
            padding:24px 30px 22px!important;
            transform:scale(.644)!important;
            overflow:visible!important;
            border:2px solid rgba(255,255,255,.96)!important;
          }
          .pl-modal.pl-step-3.pl-tiktok{
            background:radial-gradient(circle at 8% 8%,rgba(37,244,238,.10),transparent 29%),radial-gradient(circle at 96% 88%,rgba(254,44,85,.12),transparent 24%),#fff!important;
            box-shadow:0 34px 86px rgba(13,22,45,.34),0 0 0 2px rgba(37,244,238,.18),0 0 0 4px rgba(254,44,85,.11),inset 0 -5px 0 rgba(254,44,85,.14)!important;
          }
          .pl-modal.pl-step-3.pl-twitter{
            background:radial-gradient(circle at 8% 8%,rgba(15,20,25,.06),transparent 29%),radial-gradient(circle at 96% 88%,rgba(90,100,115,.08),transparent 24%),#fff!important;
            box-shadow:0 34px 86px rgba(9,13,18,.36),0 0 0 2px rgba(15,20,25,.10),0 0 0 4px rgba(255,255,255,.34),inset 0 -5px 0 rgba(15,20,25,.07)!important;
          }
          .pl-modal.pl-step-3.pl-youtube{
            background:radial-gradient(circle at 8% 8%,rgba(255,0,0,.08),transparent 29%),radial-gradient(circle at 96% 88%,rgba(255,87,87,.07),transparent 24%),#fff!important;
            box-shadow:0 34px 86px rgba(38,18,18,.34),0 0 0 2px rgba(255,0,0,.12),0 0 0 4px rgba(255,160,160,.08),inset 0 -5px 0 rgba(255,0,0,.12)!important;
          }
          .pl-modal.pl-step-3:is(.pl-tiktok,.pl-twitter,.pl-youtube)::before,
          .pl-modal.pl-step-3:is(.pl-tiktok,.pl-twitter,.pl-youtube)::after{content:none!important;display:none!important}
          .pl-modal.pl-step-3:is(.pl-tiktok,.pl-twitter,.pl-youtube) .pl-step-container{min-height:0!important;height:auto!important;justify-content:flex-start!important}
          .pl-modal.pl-step-3:is(.pl-tiktok,.pl-twitter,.pl-youtube) .pl-heading{margin:2px auto 16px!important;padding:0 54px!important;text-align:center!important}
          .pl-modal.pl-step-3:is(.pl-tiktok,.pl-twitter,.pl-youtube) .pl-step-tag{margin-bottom:11px!important;padding:7px 16px!important;font-size:18px!important;font-weight:800!important;background:transparent!important;border-color:transparent!important;box-shadow:none!important}
          .pl-modal.pl-step-3:is(.pl-tiktok,.pl-twitter,.pl-youtube) .pl-heading h2{font-size:43px!important;line-height:1!important;letter-spacing:-2.3px!important;color:#071126!important;text-shadow:0 6px 12px #0d1b3a2e!important;margin:0!important;font-weight:700!important}
          .pl-modal.pl-step-3:is(.pl-tiktok,.pl-twitter,.pl-youtube) .pl-sub{margin-top:14px!important;font-size:20px!important;max-width:570px!important;line-height:1.35!important;color:#58688b!important}
          .pl-modal.pl-step-3:is(.pl-tiktok,.pl-twitter,.pl-youtube) .pl-preview-wrapper{width:100%!important;margin-top:2px!important;padding:0!important;border-radius:26px!important;box-shadow:0 24px 42px rgba(44,45,84,.10)!important}
          .pl-modal.pl-step-3:is(.pl-tiktok,.pl-twitter,.pl-youtube) .pl-preview-wrapper>div{border-radius:26px!important;box-shadow:0 18px 34px rgba(43,47,88,.10)!important}
          .pl-modal.pl-step-3:is(.pl-tiktok,.pl-twitter,.pl-youtube) .pl-confirm-block{margin-top:15px!important;width:100%!important}
          .pl-modal.pl-step-3:is(.pl-tiktok,.pl-twitter,.pl-youtube) .pl-confirm-btn{width:72%!important;max-width:420px!important;height:54px!important;border-radius:20px!important;font-size:22px!important;font-weight:700!important}
          .pl-modal.pl-step-3:is(.pl-tiktok,.pl-twitter,.pl-youtube) .pl-search-another-btn{margin:13px auto 0!important;font-size:19px!important}
          .pl-modal.pl-step-3.pl-tiktok .pl-step-tag{color:#FE2C55!important}
          .pl-modal.pl-step-3.pl-twitter .pl-step-tag{color:#0F1419!important}
          .pl-modal.pl-step-3.pl-youtube .pl-step-tag{color:#FF0000!important}
          .pl-modal.pl-step-3.pl-tiktok .pl-confirm-btn{background:linear-gradient(100deg,#111 0%,#111 42%,#159e9a 73%,#c92548 100%)!important;box-shadow:0 8px 16px rgba(254,44,85,.13)!important;filter:saturate(.86) brightness(.92)!important}
          .pl-modal.pl-step-3.pl-twitter .pl-confirm-btn{background:linear-gradient(100deg,#050505,#111,#282828)!important;box-shadow:0 12px 22px rgba(15,20,25,.22)!important}
          .pl-modal.pl-step-3.pl-youtube .pl-confirm-btn{background:linear-gradient(100deg,#c90000,#ff0000,#ff3b30)!important;box-shadow:0 12px 22px rgba(255,0,0,.22)!important}
        }

        /* Platform-specific Step 2 identity while preserving the approved geometry. */
        @media (min-width: 901px){
          .pl-modal.pl-step-2.pl-tiktok .pl-radar-ring-3{border-color:rgba(37,244,238,.74)!important;box-shadow:0 0 22px rgba(37,244,238,.18)!important}
          .pl-modal.pl-step-2.pl-tiktok .pl-radar-ring-2{border-color:rgba(254,44,85,.58)!important}
          .pl-modal.pl-step-2.pl-tiktok .pl-radar-ring-1{border-color:rgba(37,244,238,.28)!important;background:radial-gradient(circle,rgba(255,255,255,.76) 0 46%,rgba(239,255,255,.72) 47% 100%)!important}
          .pl-modal.pl-step-2.pl-tiktok .pl-radar-core{box-shadow:0 16px 36px rgba(254,44,85,.14),0 0 28px rgba(37,244,238,.10)!important}
          .pl-modal.pl-step-2.pl-tiktok .pl-searching-title span{color:#fe2c55!important}
          .pl-modal.pl-step-2.pl-tiktok .pl-status-item.active .pl-status-dot{border-color:#fe2c55!important;box-shadow:0 0 0 7px rgba(37,244,238,.05),0 0 22px rgba(254,44,85,.34)!important}
          .pl-modal.pl-step-2.pl-tiktok .pl-status-spinner{background:#fe2c55!important}
          .pl-modal.pl-step-2.pl-tiktok .pl-status-item.active .pl-status-pill{color:#e91f49!important;background:#fff1f4!important;border-color:#ffd0da!important}

          .pl-modal.pl-step-2.pl-twitter .pl-radar-ring-3{border-color:rgba(15,20,25,.72)!important;box-shadow:0 0 20px rgba(15,20,25,.12)!important}
          .pl-modal.pl-step-2.pl-twitter .pl-radar-ring-2{border-color:rgba(92,101,111,.42)!important}
          .pl-modal.pl-step-2.pl-twitter .pl-radar-ring-1{border-color:rgba(15,20,25,.20)!important;background:radial-gradient(circle,#fff 0 46%,#f4f5f6 47% 100%)!important}
          .pl-modal.pl-step-2.pl-twitter .pl-radar-core{box-shadow:0 16px 36px rgba(15,20,25,.14)!important}
          .pl-modal.pl-step-2.pl-twitter .pl-searching-title span{color:#0f1419!important}
          .pl-modal.pl-step-2.pl-twitter .pl-status-item.active .pl-status-dot{border-color:#0f1419!important;box-shadow:0 0 0 7px rgba(15,20,25,.04),0 0 20px rgba(15,20,25,.22)!important}
          .pl-modal.pl-step-2.pl-twitter .pl-status-spinner{background:#0f1419!important}
          .pl-modal.pl-step-2.pl-twitter .pl-status-item.active .pl-status-pill{color:#0f1419!important;background:#f3f4f5!important;border-color:#dfe2e5!important}

          .pl-modal.pl-step-2.pl-youtube .pl-radar-ring-3{border-color:rgba(255,0,0,.68)!important;box-shadow:0 0 22px rgba(255,0,0,.15)!important}
          .pl-modal.pl-step-2.pl-youtube .pl-radar-ring-2{border-color:rgba(255,68,68,.46)!important}
          .pl-modal.pl-step-2.pl-youtube .pl-radar-ring-1{border-color:rgba(255,0,0,.22)!important;background:radial-gradient(circle,#fff 0 46%,#fff3f3 47% 100%)!important}
          .pl-modal.pl-step-2.pl-youtube .pl-radar-core{box-shadow:0 16px 36px rgba(255,0,0,.16)!important}
          .pl-modal.pl-step-2.pl-youtube .pl-searching-title span{color:#ff0000!important}
          .pl-modal.pl-step-2.pl-youtube .pl-status-item.active .pl-status-dot{border-color:#ff0000!important;box-shadow:0 0 0 7px rgba(255,0,0,.04),0 0 22px rgba(255,0,0,.28)!important}
          .pl-modal.pl-step-2.pl-youtube .pl-status-spinner{background:#ff0000!important}
          .pl-modal.pl-step-2.pl-youtube .pl-status-item.active .pl-status-pill{color:#e00000!important;background:#fff1f1!important;border-color:#ffd1d1!important}
        }

        /* V192 — Instagram Step 3 CTA uses the exact same color sequence as the approved Get Started Now button. Color only; existing effects remain unchanged. */
        .pl-modal.pl-step-3.pl-instagram .pl-confirm-btn,
        .pl-modal.pl-step-3.pl-instagram .pl-confirm-btn:hover{
          background:linear-gradient(90deg,#ff2d69 0%,#ef5574 42%,#7565ed 100%) !important;
        }

        /* V234 — MOBILE-ONLY modal pass for Step 1, Step 2 and Step 3. Desktop untouched. */
        @media (max-width: 900px){
          .pl-overlay{
            padding:max(10px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left))!important;
            align-items:flex-start!important;
            overflow-y:auto!important;
            overscroll-behavior:contain!important;
          }
          .pl-modal,
          .pl-modal.pl-step-1,
          .pl-modal.pl-step-2,
          .pl-modal.pl-step-3{
            width:100%!important;
            max-width:480px!important;
            min-width:0!important;
            min-height:0!important;
            height:auto!important;
            max-height:none!important;
            margin:auto!important;
            padding:18px 14px 16px!important;
            border-radius:24px!important;
            transform:none!important;
            overflow:hidden!important;
          }
          .pl-modal .pl-step-container{min-height:0!important;height:auto!important;justify-content:flex-start!important}
          .pl-modal .pl-close{width:36px!important;height:36px!important;right:0!important;top:0!important;border-radius:50%!important}
          .pl-modal .pl-close svg{width:18px!important;height:18px!important}
          .pl-modal .pl-heading{margin:4px auto 14px!important;padding:0 38px!important;text-align:center!important}
          .pl-modal .pl-step-tag{font-size:10px!important;padding:5px 9px!important;margin-bottom:7px!important}
          .pl-modal .pl-heading h2{font-size:28px!important;line-height:1.03!important;letter-spacing:-1px!important;text-shadow:none!important;margin:0!important}
          .pl-modal .pl-sub{max-width:330px!important;margin:8px auto 0!important;font-size:13px!important;line-height:1.4!important}
          .pl-modal .pl-global-footer{margin-top:12px!important;min-height:24px!important;font-size:10.5px!important;text-align:center!important}

          /* Step 1 */
          .pl-modal.pl-step-1 .pl-platform-badge{height:32px!important;padding:0 9px 0 6px!important;border-radius:12px!important;font-size:11px!important;gap:5px!important}
          .pl-modal.pl-step-1 .pl-platform-badge img{width:19px!important;height:19px!important}
          .pl-modal.pl-step-1 .pl-form-card{width:100%!important;margin:0!important;padding:17px 14px 16px!important;border-radius:19px!important;box-shadow:0 9px 22px rgba(15,23,42,.07)!important}
          .pl-modal.pl-step-1 .pl-tabs-nav{margin-bottom:13px!important}
          .pl-modal.pl-step-1 .pl-tab-btn{font-size:12px!important;padding:6px 2px 9px!important;white-space:normal!important;line-height:1.2!important}
          .pl-modal.pl-step-1 .pl-label{font-size:11.5px!important;margin-bottom:5px!important}
          .pl-modal.pl-step-1 .pl-field{height:47px!important;border-radius:12px!important;padding:0 11px!important;gap:8px!important;margin-bottom:11px!important}
          .pl-modal.pl-step-1 .pl-field-prefix{font-size:15px!important}
          .pl-modal.pl-step-1 .pl-field-icon{width:16px!important;height:16px!important}
          .pl-modal.pl-step-1 .pl-field input{min-width:0!important;font-size:14px!important}
          .pl-modal.pl-step-1 .pl-help{font-size:10.5px!important;line-height:1.35!important;margin:-3px 0 11px!important}
          .pl-modal.pl-step-1 .pl-field-message{font-size:10.5px!important;line-height:1.3!important;margin:5px 0 11px!important}
          .pl-modal.pl-step-1 .pl-primary-btn{width:100%!important;min-height:48px!important;border-radius:12px!important;font-size:14px!important;gap:7px!important}
          .pl-step1-orb{display:none!important}

          /* Step 2 */
          .pl-modal.pl-step-2{padding-top:18px!important}
          .pl-modal.pl-step-2 .pl-heading{margin-bottom:14px!important}
          .pl-modal.pl-step-2 .pl-loading-card{width:100%!important;padding:17px 13px!important;border-radius:20px!important;margin:0!important}
          .pl-modal.pl-step-2 .pl-radar-wrap{width:128px!important;height:128px!important;margin:2px auto 15px!important}
          .pl-modal.pl-step-2 .pl-radar-ring-2{inset:8px!important}
          .pl-modal.pl-step-2 .pl-radar-ring-1{inset:21px!important}
          .pl-modal.pl-step-2 .pl-radar-core{width:76px!important;height:76px!important}
          .pl-modal.pl-step-2 .pl-radar-core img{width:35px!important;height:35px!important}
          .pl-modal.pl-step-2 .pl-searching-title{font-size:18px!important;line-height:1.15!important;margin:0!important;text-align:center!important}
          .pl-modal.pl-step-2 .pl-searching-sub{font-size:11px!important;line-height:1.35!important;margin:6px auto 14px!important;text-align:center!important}
          .pl-modal.pl-step-2 .pl-status-list{width:100%!important;gap:7px!important}
          .pl-modal.pl-step-2 .pl-status-item{min-height:42px!important;padding:7px 8px!important;grid-template-columns:24px minmax(0,1fr) auto!important;gap:7px!important;border-radius:11px!important}
          .pl-modal.pl-step-2 .pl-status-dot{width:22px!important;height:22px!important}
          .pl-modal.pl-step-2 .pl-status-label{font-size:10.5px!important;line-height:1.2!important}
          .pl-modal.pl-step-2 .pl-status-pill{font-size:8.5px!important;padding:4px 6px!important;white-space:nowrap!important}

          /* Step 3 — shared */
          .pl-modal.pl-step-3{padding:17px 12px 15px!important}
          .pl-modal.pl-step-3 .pl-heading{margin-bottom:12px!important}
          .pl-modal.pl-step-3 .pl-preview-wrapper{width:100%!important;max-width:100%!important;margin:0!important;padding:0!important;border-radius:18px!important;overflow:hidden!important;box-shadow:0 10px 26px rgba(31,42,75,.10)!important}
          .pl-modal.pl-step-3 .pl-preview-wrapper>div{max-width:100%!important;border-radius:18px!important}
          .pl-modal.pl-step-3 .pl-confirm-block{width:100%!important;margin-top:13px!important}
          .pl-modal.pl-step-3 .pl-confirm-btn{width:100%!important;max-width:none!important;height:49px!important;border-radius:13px!important;font-size:14px!important;font-weight:750!important}
          .pl-modal.pl-step-3 .pl-search-another-btn{margin:10px auto 0!important;font-size:12px!important}

          /* Instagram native preview scales to phone width */
          .pl-modal.pl-step-3.pl-instagram .ig-preview-ref{width:100%!important;max-width:100%!important;border-radius:18px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-topbar{height:48px!important;padding:0 10px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-topbar>button:first-child,
          .pl-modal.pl-step-3.pl-instagram .ig-topbar>div:last-child>button{width:34px!important;height:34px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-topbar svg{width:19px!important;height:19px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-topbar>div:nth-child(2) span{font-size:14px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-profile-main{padding:13px 12px 8px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-avatar-ring{width:88px!important;height:88px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-avatar-wrap>div:not(.ig-avatar-ring){width:82px!important;height:82px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-display-name{font-size:13px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-metrics{gap:4px!important;margin-top:12px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-metrics b{font-size:15px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-metrics span{font-size:9px!important;margin-top:3px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-actions{grid-template-columns:minmax(0,1fr) minmax(0,1fr) 38px!important;gap:6px!important;padding:0 10px!important;margin:0 0 9px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-actions button{height:38px!important;border-radius:10px!important;font-size:11px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-actions button:last-child{width:38px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-tabs{height:42px!important;padding:0 7px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-tabs svg{width:19px!important;height:19px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-media-grid{gap:3px!important;margin:4px 7px 8px!important;width:calc(100% - 14px)!important;padding:4px!important;border-radius:12px!important}
          .pl-modal.pl-step-3.pl-instagram .ig-media-grid>div{border-radius:6px!important}
        }

        @media (max-width: 390px){
          .pl-overlay{padding-left:7px!important;padding-right:7px!important}
          .pl-modal,.pl-modal.pl-step-1,.pl-modal.pl-step-2,.pl-modal.pl-step-3{padding-left:10px!important;padding-right:10px!important;border-radius:21px!important}
          .pl-modal .pl-heading{padding-left:32px!important;padding-right:32px!important}
          .pl-modal .pl-heading h2{font-size:25px!important}
          .pl-modal .pl-sub{font-size:12px!important}
          .pl-modal.pl-step-2 .pl-status-item{grid-template-columns:22px minmax(0,1fr) auto!important;padding-left:6px!important;padding-right:6px!important}
          .pl-modal.pl-step-2 .pl-status-label{font-size:9.8px!important}
          .pl-modal.pl-step-2 .pl-status-pill{font-size:8px!important;padding:3px 5px!important}
        }

        @media (width >= 901px){
          .pl-modal.pl-step-3.pl-instagram .pl-step-tag,
          .pl-modal.pl-step-3.pl-tiktok .pl-step-tag,
          .pl-modal.pl-step-3.pl-twitter .pl-step-tag,
          .pl-modal.pl-step-3.pl-youtube .pl-step-tag{
            background:transparent!important;
            border-color:transparent!important;
            box-shadow:none!important;
          }
        }
      `}</style>
    </div>
  );
}
