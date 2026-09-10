"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, Check, CheckCircle2, Loader2, Mail, RotateCcw, Search, ScanSearch } from "lucide-react";
import instagramIcon from "@/assets/home-icons-vector/instagram.svg";
import tiktokIcon from "@/assets/home-icons-vector/tiktok.svg";
import twitterIcon from "@/assets/home-icons-vector/twitter.svg";
import youtubeIcon from "@/assets/home-icons-vector/youtube.svg";
import { Platform, Service } from "@/config/service-sales.config";
import { PLATFORM_SERVICES, CommercialPlatform, CommercialService } from "@/services/commercial-offer.resolver";
import { validateEmailFormat, buildCanonicalProfileUrl } from "@/lib/social/normalize";
import type { VerifiedSocialProfile } from "@/lib/social/types";
import { useFunnelStore } from "@/stores/funnel.store";
import { InstagramPreview, TikTokPreview, TwitterPreview, YouTubePreview } from "./social-preview";

type PlatformId = CommercialPlatform;
type Goal = CommercialService;
type Stage = "idle" | "analyzing" | "result";

const META = {
  instagram: { label: "Instagram", icon: instagramIcon, accent: "#E1306C", iconMain: "#E1306C", iconAlt: "#833AB4", iconSoft: "#FFF0F6" },
  tiktok: { label: "TikTok", icon: tiktokIcon, accent: "#FE2C55", iconMain: "#FE2C55", iconAlt: "#25F4EE", iconSoft: "#F1FFFE" },
  youtube: { label: "YouTube", icon: youtubeIcon, accent: "#FF0000", iconMain: "#FF0000", iconAlt: "#FF5A5F", iconSoft: "#FFF1F1" },
  twitter: { label: "X (Twitter)", icon: twitterIcon, accent: "#111111", iconMain: "#111111", iconAlt: "#65707D", iconSoft: "#F4F5F6" },
} as const;

function ServiceGlyph({ type }: { type: Goal | "email" | "setup" }) {
  if (type === "followers") return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="cf-pb-glyph">
      <circle className="depth" cx="11" cy="10.5" r="4.1"/><circle className="main" cx="11" cy="9" r="4.1"/>
      <circle className="depth alt" cx="21.5" cy="12" r="3.5"/><circle className="alt" cx="21.5" cy="10.8" r="3.5"/>
      <path className="depth" d="M3.6 26.4c.4-5.4 3.4-8.4 7.7-8.4 4.5 0 7.4 3 7.8 8.4H3.6Z"/>
      <path className="main" d="M3.6 24.7c.4-5.4 3.4-8.4 7.7-8.4 4.5 0 7.4 3 7.8 8.4H3.6Z"/>
      <path className="depth alt" d="M16.7 26.4c.4-4.5 2.8-7 6.3-7 3.6 0 5.8 2.5 6.2 7h-12.5Z"/>
      <path className="alt" d="M16.7 25c.4-4.5 2.8-7 6.3-7 3.6 0 5.8 2.5 6.2 7h-12.5Z"/>
    </svg>
  );
  if (type === "likes") return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="cf-pb-glyph">
      <path className="depth" d="M16 27.2S4.1 20.2 4.1 11.8c0-4 3-6.8 6.8-6.8 2.4 0 4.2 1.1 5.1 2.8C17 6.1 18.8 5 21.2 5 25 5 28 7.8 28 11.8c0 8.4-12 15.4-12 15.4Z"/>
      <path className="main" d="M16 25.3S4.1 18.3 4.1 9.9c0-4 3-6.8 6.8-6.8 2.4 0 4.2 1.1 5.1 2.8.9-1.7 2.8-2.8 5.2-2.8C25 3.1 28 5.9 28 9.9c0 8.4-12 15.4-12 15.4Z"/>
      <path className="shine" d="M8.1 8.4c1.2-2.1 3.8-2.7 5.8-1.3"/>
    </svg>
  );
  if (type === "views") return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="cf-pb-glyph cf-pb-glyph-bars">
      <rect className="depth" x="4" y="19" width="5" height="8" rx="1.5"/><rect className="main" x="4" y="17" width="5" height="8" rx="1.5"/>
      <rect className="depth alt" x="13.5" y="13" width="5" height="14" rx="1.5"/><rect className="alt" x="13.5" y="11" width="5" height="14" rx="1.5"/>
      <rect className="depth" x="23" y="6" width="5" height="21" rx="1.5"/><rect className="main" x="23" y="4" width="5" height="21" rx="1.5"/>
    </svg>
  );
  if (type === "email") return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="cf-pb-glyph">
      <rect className="depth" x="3.5" y="7.5" width="25" height="18.5" rx="3.3"/>
      <rect className="soft" x="3.5" y="5.5" width="25" height="18.5" rx="3.3"/>
      <path className="main-line" d="M5.8 8.2 16 16.1 26.2 8.2M5.7 21.1l7.1-6M26.3 21.1l-7.1-6"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="cf-pb-glyph cf-pb-glyph-setup">
      <path className="depth" d="M7 6h18v4H7zM7 14h18v4H7zM7 22h18v4H7z"/>
      <path className="main" d="M7 4h18v4H7zM7 12h18v4H7zM7 20h18v4H7z"/>
      <circle className="alt depth" cx="12" cy="8" r="3.3"/><circle className="alt" cx="12" cy="6" r="3.3"/>
      <circle className="alt depth" cx="21" cy="16" r="3.3"/><circle className="alt" cx="21" cy="14" r="3.3"/>
      <circle className="alt depth" cx="15" cy="24" r="3.3"/><circle className="alt" cx="15" cy="22" r="3.3"/>
    </svg>
  );
}

function ServiceIcon({ type, compact = false }: { type: Goal | "email" | "setup"; compact?: boolean }) {
  return <span className={`cf-pb-service-icon cf-pb-service-${type}${compact ? " is-compact" : ""}`}><ServiceGlyph type={type}/></span>;
}

function GoalIcon({ goal, premium = false }: { goal: Goal; premium?: boolean }) {
  return premium ? <ServiceIcon type={goal}/> : <ServiceGlyph type={goal}/>;
}

function PlatformIcon({ src }: { src: typeof instagramIcon }) {
  return <span className="cf-pb-platform-icon" aria-hidden="true"><Image src={src} alt="" width={28} height={28} /></span>;
}


function previewSvg(label: string, from: string, to: string, text = "ffffff") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="720" height="720" rx="64" fill="url(#g)"/><circle cx="360" cy="280" r="112" fill="#ffffff" fill-opacity=".18"/><text x="360" y="405" text-anchor="middle" font-family="Arial,sans-serif" font-size="72" font-weight="700" fill="#${text}">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function makePreviewProfile(platform: PlatformId): VerifiedSocialProfile {
  if (platform === "instagram") return {
    platform: "instagram", username: "cloutflow.preview", full_name: "CloutFlow Creator",
    avatar_url: previewSvg("CF", "#833AB4", "#FD1D1D"), posts_count: 248, followers_count: 78600, following_count: 932,
    bio: "Creator • lifestyle • growth\nBuilding something people notice ✨", link: "cloutflow.co", is_private: false, is_verified: true, has_active_story: true,
    posts: [
      { id: "ig-1", thumbnail_url: previewSvg("POST", "#ff9966", "#ff5e62") },
      { id: "ig-2", thumbnail_url: previewSvg("REEL", "#667eea", "#764ba2"), is_video: true },
      { id: "ig-3", thumbnail_url: previewSvg("POST", "#43cea2", "#185a9d") },
    ],
  };
  if (platform === "tiktok") return {
    platform: "tiktok", username: "cloutflow.preview", full_name: "CloutFlow Creator", avatar_url: previewSvg("CF", "#25F4EE", "#FE2C55"),
    following_count: 67, followers_count: 55800, likes_count: 2400000, bio: "Daily creator tips • growth • trends", link: "cloutflow.co", is_private: false, is_verified: true,
    videos: [
      { id: "tt-1", thumbnail_url: previewSvg("3.1K", "#141e30", "#243b55"), views_count: 3100 },
      { id: "tt-2", thumbnail_url: previewSvg("12K", "#FE2C55", "#5b247a"), views_count: 12300 },
      { id: "tt-3", thumbnail_url: previewSvg("5.3K", "#25F4EE", "#1f4037"), views_count: 5300 },
    ],
  };
  if (platform === "youtube") return {
    platform: "youtube", channel_id: "UC_PREVIEW_CLOUTFLOW", username: "@cloutflowpreview", full_name: "CloutFlow Creator",
    avatar_url: previewSvg("CF", "#FF0000", "#8B0000"), cover_url: previewSvg("CLOUTFLOW", "#101010", "#FF0000"), followers_count: 14300, video_count: 2600, total_views: 3200000,
    bio: "Creator channel focused on social growth, content and community.", link: "youtube.com/@cloutflowpreview", is_verified: true,
    videos: [{ id: "yt-1", title: "Creator Growth", thumbnail_url: previewSvg("VIDEO", "#ff416c", "#ff4b2b"), views_count: 91300 }],
  };
  return {
    platform: "twitter", username: "CloutFlowPreview", full_name: "CloutFlow Creator", avatar_url: previewSvg("CF", "#111111", "#65707D"), cover_url: previewSvg("CLOUTFLOW", "#111827", "#374151"),
    followers_count: 2100000, following_count: 1000, bio: "Ideas, growth and creator tools.", location: "New York, NY", link: "cloutflow.co", is_verified: true, is_private: false,
    pinned_tweet: { id: "x-1", text: "Build, analyze and grow with clarity.", like_count: 18400, retweet_count: 3200, reply_count: 640 },
  };
}

function NativePreview({ profile, onBack }: { profile: VerifiedSocialProfile; onBack: () => void }) {
  if (profile.platform === "instagram") return <InstagramPreview profile={profile} onClose={onBack} />;
  if (profile.platform === "tiktok") return <TikTokPreview profile={profile} onClose={onBack} />;
  if (profile.platform === "twitter") return <TwitterPreview profile={profile} onClose={onBack} />;
  if (profile.platform === "youtube") return <YouTubePreview profile={profile} onClose={onBack} />;
  return null;
}

class DevPreviewBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV === "development") console.error("[CloutFlow preview test]", error);
  }
  render() {
    if (this.state.failed) {
      return <div className="cf-pb-dev-preview-fallback"><b>Preview component failed</b><small>Check the localhost console for the exact component error.</small></div>;
    }
    return this.props.children;
  }
}

// V268: independent desktop surfaces + adaptive right-side workflow card.
export default function GrowthPackageBuilder({
  initialPlatform,
  initialGoal,
  resetToken,
  onPlatformChange,
  onGoalChange,
  onContinue,
  onStartAnalysis,
}: {
  initialPlatform: PlatformId;
  initialGoal: Goal;
  resetToken?: number;
  onPlatformChange: (platform: PlatformId) => void;
  onGoalChange: (goal: Goal) => void;
  onContinue: () => void;
  onStartAnalysis?: () => void;
}) {
  const [platform, setPlatformLocal] = useState<PlatformId>(initialPlatform);
  const [goal, setGoalLocal] = useState<Goal>(initialGoal);
  const [identifier, setIdentifier] = useState(() => useFunnelStore.getState().draftIdentifier || "");
  const [email, setEmail] = useState(() => useFunnelStore.getState().email || "");
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [analysisPhase, setAnalysisPhase] = useState<"starting" | "finding_content" | "loading_profile" | "compiling">("starting");
  const [creatorLabel, setCreatorLabel] = useState<string | null>(null);
  const [profile, setProfile] = useState<VerifiedSocialProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const polling = useRef(false);
  const previewTimers = useRef<number[]>([]);
  const analysisRunId = useRef(0);
  const [devScene, setDevScene] = useState<1 | 2 | 3 | null>(null);
  const { setUsername, setEmail: setStoreEmail, setDraftIdentifier, setProfileData } = useFunnelStore();

  // Mobile guided flow refs & consumed guards (Strictly <= 900px)
  const mobileAnalyzePanelRef = useRef<HTMLDivElement>(null);
  const mobileResultPanelRef = useRef<HTMLDivElement>(null);
  const mobileAnalyzeScrollConsumed = useRef(false);
  const mobileResultScrollConsumed = useRef(false);

  useEffect(() => setPlatformLocal(initialPlatform), [initialPlatform]);
  useEffect(() => setGoalLocal(initialGoal), [initialGoal]);
  useEffect(() => {
    if (!resetToken) return;
    polling.current = false;
    analysisRunId.current += 1;
    previewTimers.current.forEach(window.clearTimeout);
    previewTimers.current = [];
    mobileAnalyzeScrollConsumed.current = false;
    mobileResultScrollConsumed.current = false;
    const funnel = useFunnelStore.getState();
    setStage("idle");
    setProgress(0);
    setAnalysisPhase("starting");
    setCreatorLabel(null);
    setProfile(null);
    setError(null);
    setDevScene(null);
    setIdentifier(funnel.draftIdentifier || "");
    setEmail(funnel.email || "");
  }, [resetToken]);
  useEffect(() => () => {
    polling.current = false;
    analysisRunId.current += 1;
    previewTimers.current.forEach(window.clearTimeout);
  }, []);

  const isContent = goal === "likes" || goal === "views";
  const meta = META[platform];
  const frozenPreviewProfile = useMemo(
    () => (process.env.NODE_ENV === "development" && devScene === 3 ? makePreviewProfile(platform) : null),
    [devScene, platform]
  );
  const displayStage: Stage =
    process.env.NODE_ENV === "development" && devScene
      ? devScene === 1 ? "idle" : devScene === 2 ? "analyzing" : "result"
      : stage;
  const displayProgress =
    process.env.NODE_ENV === "development" && devScene === 2 ? 68 : progress;
  const displayAnalysisPhase =
    process.env.NODE_ENV === "development" && devScene === 2 ? "loading_profile" : analysisPhase;
  const displayProfile =
    process.env.NODE_ENV === "development" && devScene === 3 ? frozenPreviewProfile : profile;
  const progressRows = useMemo(() => {
    if (isContent) {
      const contentDone = displayAnalysisPhase === "loading_profile" || displayAnalysisPhase === "compiling";
      const profileDone = displayAnalysisPhase === "compiling";
      const creator = creatorLabel ? `Identifying @${creatorLabel.replace(/^@+/, "")}` : "Identifying @creator";
      return [
        { label: platform === "youtube" || platform === "tiktok" ? "Finding your video" : "Finding your content", state: contentDone ? "done" : "current", status: contentDone ? "Found ✓" : "In progress" },
        { label: "Content found", state: contentDone ? "done" : "pending", status: contentDone ? "Completed" : "Pending" },
        { label: creator, state: contentDone ? "done" : "pending", status: contentDone ? "Completed" : "Pending" },
        { label: "Loading profile", state: profileDone ? "done" : contentDone ? "current" : "pending", status: profileDone ? "Completed" : contentDone ? "In progress" : "Pending" },
      ] as const;
    }

    const profileDone = displayAnalysisPhase === "compiling";
    return [
      { label: "Checking profile address", state: "done", status: "Completed" },
      { label: "Searching social profile", state: profileDone ? "done" : "current", status: profileDone ? "Completed" : "In progress" },
      { label: "Loading public profile data", state: profileDone ? "done" : "pending", status: profileDone ? "Completed" : "Pending" },
      { label: "Compiling results", state: profileDone ? "current" : "pending", status: profileDone ? "In progress" : "Pending" },
    ] as const;
  }, [creatorLabel, displayAnalysisPhase, isContent, platform]);

  const scrollMobileToElement = useCallback((targetElement: HTMLElement | null, offsetPadding: number = 16) => {
    if (typeof window === "undefined" || window.innerWidth > 900 || !targetElement) {
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    const elementTop = rect.top + currentScrollY;

    // Detect header height if sticky/fixed
    const headerElement = document.querySelector<HTMLElement>(".cf-plans-header");
    const headerHeight = headerElement ? headerElement.getBoundingClientRect().height : 62;

    const targetY = Math.max(0, elementTop - headerHeight - offsetPadding);
    const viewportHeight = window.innerHeight;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
    const safeTargetY = Math.min(Math.round(targetY), maxScroll);

    const prefersReducedMotion = typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
      top: safeTargetY,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, []);

  // TRIGGER B: Analysis completed + valid result + result DOM mounted -> scrollToResult()
  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth > 900) return;
    if (stage !== "result" || !profile) return;
    if (mobileResultScrollConsumed.current) return;

    let frameId: number | null = null;
    let attempts = 0;
    const maxAttempts = 60;

    const attemptScrollToResult = () => {
      attempts += 1;
      const element = mobileResultPanelRef.current || document.querySelector<HTMLElement>(".cf-premium-builder-result");
      if (!element || element.getBoundingClientRect().height === 0) {
        if (attempts < maxAttempts) {
          frameId = window.requestAnimationFrame(attemptScrollToResult);
        }
        return;
      }

      mobileResultScrollConsumed.current = true;
      scrollMobileToElement(element, 14);
    };

    frameId = window.requestAnimationFrame(() => {
      frameId = window.requestAnimationFrame(attemptScrollToResult);
    });

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [stage, profile, scrollMobileToElement]);

  const choosePlatform = (next: PlatformId) => {
    if (stage === "analyzing") return;
    analysisRunId.current += 1;
    mobileAnalyzeScrollConsumed.current = false;
    mobileResultScrollConsumed.current = false;
    setPlatformLocal(next); setProfile(null); setStage("idle"); setError(null); setIdentifier(""); setDraftIdentifier("");
    useFunnelStore.getState().setPlatform(next);
    const validServices = PLATFORM_SERVICES[next] || ['followers'];
    let safeGoal = goal;
    if (!validServices.includes(goal)) {
      safeGoal = validServices[0] as Goal;
      setGoalLocal(safeGoal);
      useFunnelStore.getState().setService(safeGoal);
      onGoalChange(safeGoal);
    }
    onPlatformChange(next);
  };
  const chooseGoal = (next: Goal) => {
    if (stage === "analyzing") return;
    analysisRunId.current += 1;
    mobileAnalyzeScrollConsumed.current = false;
    mobileResultScrollConsumed.current = false;
    const validServices = PLATFORM_SERVICES[platform] || ['followers'];
    if (!validServices.includes(next)) return;
    setGoalLocal(next); setProfile(null); setStage("idle"); setError(null); setIdentifier(""); setDraftIdentifier("");
    useFunnelStore.getState().setService(next);
    onGoalChange(next);
  };

  const resetSearch = () => {
    polling.current = false;
    analysisRunId.current += 1;
    previewTimers.current.forEach(window.clearTimeout);
    previewTimers.current = [];
    mobileAnalyzeScrollConsumed.current = false;
    mobileResultScrollConsumed.current = false;
    setStage("idle"); setProgress(0); setAnalysisPhase("starting"); setCreatorLabel(null); setProfile(null); setError(null); setIdentifier(""); setDraftIdentifier("");
    useFunnelStore.getState().resetTarget();
  };

  const persistTarget = (found: VerifiedSocialProfile, isConfirmed: boolean = false) => {
    const cleanEmail = email.trim().toLowerCase();
    const normalizedUsername = found.username.replace(/^@+/, "").trim();
    const canonicalProfileUrl = buildCanonicalProfileUrl(platform, normalizedUsername);
    const profileUrl = canonicalProfileUrl;
    const targetUrl = isContent ? identifier.trim() : canonicalProfileUrl;
    const targetType = isContent
      ? ((platform === "youtube" || platform === "tiktok" || (platform === "twitter" && goal === "views") || (platform === "instagram" && goal === "views")) ? "video" : "post")
      : (platform === "youtube" ? "channel" : "profile");
    useFunnelStore.getState().setEmail(cleanEmail);
    useFunnelStore.getState().setTarget({
      targetType,
      targetValue: isContent ? identifier.trim() : normalizedUsername,
      targetUrl,
      socialUsername: normalizedUsername,
      profileUrl,
      email: cleanEmail,
      verifiedTargetData: isConfirmed ? (found as unknown as Record<string, unknown>) : null,
      verificationStatus: isConfirmed ? "success" : "idle",
    });
    if (!isContent) setUsername(normalizedUsername);
    setProfileData(found as unknown as Record<string, unknown>);
  };

  const finish = (found: VerifiedSocialProfile, runId: number) => {
    if (!polling.current || analysisRunId.current !== runId) return;
    // Stage 1: Result found. Target is valid, but NOT yet verified until user explicitly confirms!
    persistTarget(found, false);
    setProfile(found); setProgress(100);
    setStage("result");
    polling.current = false;
  };

  const confirmDisplayedProfile = () => {
    // Stage 2: User explicitly clicked "Yes, this is my profile".
    // ONLY THIS ACTION promotes targetVerified to true and unlocks the plans!
    if (displayProfile) {
      persistTarget(displayProfile, true);
    }
    onContinue();
  };

  const analyze = async () => {
    setError(null);
    const emailCheck = validateEmailFormat(email);
    if (!emailCheck.isValid) { setError("Enter a valid email address to continue."); return; }
    if (!identifier.trim()) { setError(isContent ? "Paste the exact public post or video link." : "Enter an @username or profile/channel link."); return; }
    if (isContent) {
      try {
        const u = new URL(identifier.trim());
        if (!/^https?:$/.test(u.protocol)) throw new Error();

        const hostname = u.hostname.toLowerCase();
        const pathname = u.pathname.toLowerCase();

        if (platform === "instagram") {
          const isStory = pathname.includes("/stories/");
          const isPost = pathname.includes("/p/");
          const isVideo = pathname.includes("/reel/") || pathname.includes("/reels/") || pathname.includes("/tv/");

          if (isStory || (goal === "views" ? !isVideo : !(isPost || isVideo))) {
            setError(
              goal === "views"
                ? "Instagram Views accepts only public video/reel links. Photo posts and Stories are not accepted."
                : "Instagram Likes accepts public feed posts, videos and reels. Stories are not accepted."
            );
            return;
          }
        }

        if (platform === "tiktok") {
          const isVideo = pathname.includes("/video/") || hostname === "vm.tiktok.com" || hostname === "vt.tiktok.com";
          if (!isVideo) {
            setError("TikTok Likes or Views requires a direct public video link.");
            return;
          }
        }

        if (platform === "twitter") {
          const isPost = pathname.includes("/status/") || pathname.includes("/statuses/");
          if (!isPost) {
            setError("X / Twitter Likes or Views requires a direct post/video status link.");
            return;
          }
        }

        if (platform === "youtube") {
          const isChannel = pathname.includes("/channel/") || pathname.includes("/@") || pathname.includes("/c/") || pathname.includes("/user/");
          const isVideo = pathname.includes("/watch") || hostname === "youtu.be" || pathname.includes("/shorts/");
          if (isChannel || !isVideo) {
            setError("YouTube Likes or Views requires a direct video or Shorts link. Channel links are not accepted.");
            return;
          }
        }
      } catch {
        setError("For Likes or Views, paste a valid public post/video URL.");
        return;
      }
    }

    // The service is a selection input, not analysis output. Re-associate it
    // only when a new analysis actually starts after a checkout return.
    const runId = ++analysisRunId.current;
    mobileAnalyzeScrollConsumed.current = false;
    mobileResultScrollConsumed.current = false;
    onStartAnalysis?.();

    // TRIGGER A (Mobile <= 900px): Immediately scroll to the Analyze profile section
    if (typeof window !== "undefined" && window.innerWidth <= 900) {
      mobileAnalyzeScrollConsumed.current = true;
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const analyzeEl = mobileAnalyzePanelRef.current || document.querySelector<HTMLElement>(".cf-pb-analyze");
          scrollMobileToElement(analyzeEl, 14);
        });
      });
    }

    useFunnelStore.getState().setPlatform(platform);
    useFunnelStore.getState().setService(goal);
    polling.current = true; setStage("analyzing"); setProgress(isContent ? 12 : 18); setAnalysisPhase(isContent ? "finding_content" : "loading_profile"); setCreatorLabel(null); setProfile(null);
    // Email is intentionally captured before social resolution so a valid lead is not lost.
    void fetch("/api/leads/capture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim().toLowerCase(), platform, service: goal, identifier: identifier.trim() }) });
    const isCurrentRun = () => polling.current && analysisRunId.current === runId;
    previewTimers.current = [];
    try {
      const res = await fetch("/api/search/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: identifier.trim(), selectedPlatform: platform, service: goal }) });
      const data = await res.json();
      if (res.ok && data.success && data.data && data.resolvedType === "profile") {
        setAnalysisPhase("compiling"); setProgress(96);
        await new Promise(r => setTimeout(r, 220));
        finish(data.data, runId); return;
      }
      if (res.ok && data.success && data.status === "pending" && data.requestId) {
        let requestId = data.requestId;
        const started = Date.now();
        const maxPollingMs = 10 * 60 * 1000; // Supports chained Bright Data content -> profile jobs.

        while (polling.current && Date.now() - started < maxPollingMs) {
          await new Promise(r => setTimeout(r, 2500));
          if (!isCurrentRun()) return;

          const statusRes = await fetch(
            `/api/search/status?requestId=${encodeURIComponent(requestId)}&service=${encodeURIComponent(goal)}`,
            { cache: "no-store" }
          );
          const status = await statusRes.json().catch(() => null);

          if (!statusRes.ok) {
            throw new Error(status?.message || "Search failed. Please try again.");
          }
          if (!status) {
            throw new Error("Invalid search response. Please try again.");
          }

          if (status.status === "pending") {
            const phase = status.phase === "loading_profile" ? "loading_profile" : status.phase === "finding_content" ? "finding_content" : null;
            if (typeof status.creator === "string" && status.creator.trim()) {
              setCreatorLabel(status.creator.trim().replace(/^@+/, ""));
            }

            if (phase === "loading_profile") {
              setAnalysisPhase("loading_profile");
              setProgress(current => Math.min(92, Math.max(current, isContent ? 62 : 36) + 2));
            } else if (phase === "finding_content") {
              setAnalysisPhase("finding_content");
              setProgress(current => Math.min(52, current + 3));
            } else {
              setProgress(current => Math.min(isContent ? 52 : 88, current + 2));
            }

            if (typeof status.requestId === "string" && status.requestId.length > 0) {
              requestId = status.requestId;
            }
            continue;
          }

          if (status.status === "complete" && status.data) {
            setAnalysisPhase("compiling");
            setProgress(96);
            await new Promise(r => setTimeout(r, 220));
            finish(status.data, runId);
            return;
          }

          if (status.status === "failed" || status.success === false) {
            throw new Error(status.message || "We couldn't find this profile.");
          }

          throw new Error("Invalid search status. Please try again.");
        }

        throw new Error("The search is taking longer than expected. Please try again.");
      }
      throw new Error(data.message || "We couldn't find this profile. Check the @ or link and try again.");
    } catch (e) {
      if (polling.current) {
        polling.current = false;
        setStage("idle"); setProgress(0); setError(e instanceof Error ? e.message : "Search failed. Please try again.");
      }
    } finally { previewTimers.current.forEach(window.clearTimeout); previewTimers.current = []; }
  };

  const getInputPlaceholder = () => {
    if (goal === "followers") {
      if (platform === "youtube") return "@username or channel link...";
      return "@username or profile link...";
    }
    // Likes or Views
    switch (platform) {
      case "tiktok":
        return "https://www.tiktok.com/@username/video/...";
      case "twitter":
        return "https://x.com/username/status/...";
      case "youtube":
        return "https://www.youtube.com/watch?v=...";
      case "instagram":
      default:
        return "https://www.instagram.com/p/... or /reel/...";
    }
  };

  const getInputLabel = () => {
    if (goal === "followers") {
      return platform === "youtube" ? "Channel username or link" : "Username or profile link";
    }
    switch (platform) {
      case "tiktok":
        return "TikTok video link";
      case "twitter":
        return "X / Twitter post link";
      case "youtube":
        return "YouTube video link";
      case "instagram":
      default:
        return "Instagram post / reel link";
    }
  };

  return (
    <section id="growth-package-builder" className="cf-premium-builder" data-platform={platform} aria-label="Build your growth package" style={{"--pb-icon-main": meta.iconMain, "--pb-icon-alt": meta.iconAlt, "--pb-icon-soft": meta.iconSoft, "--pb-network-accent": meta.accent} as React.CSSProperties}>
      <div className="cf-premium-builder-head"><small>✦ &nbsp; START HERE &nbsp; ✦</small><h2>Build Your <em>Growth</em> Package</h2><p>Three quick steps. Analyze. Choose. Grow.</p></div>
      <div className="cf-premium-builder-grid">
        <div className="cf-premium-builder-controls">
          <div className="cf-pb-step"><div className="cf-pb-label"><i>1</i><div><b>Choose your goal</b><small>What do you want to achieve?</small></div></div><div className="cf-pb-goals">{((PLATFORM_SERVICES[platform] || ["followers", "likes", "views"]) as Goal[]).map(g => <button key={g} className={goal===g?"active":""} onClick={()=>chooseGoal(g)}><GoalIcon goal={g} premium/><b>{g[0].toUpperCase()+g.slice(1)}</b>{goal===g&&<Check/>}</button>)}</div></div>
          <div className="cf-pb-step"><div className="cf-pb-label"><i>2</i><div><b>Choose the network</b><small>We support all 4 platforms below</small></div></div><div className="cf-pb-platforms">{(Object.entries(META) as [PlatformId, typeof META[PlatformId]][]).map(([id,item]) => <button key={id} className={platform===id?"active":""} style={{"--pb-accent":item.accent} as React.CSSProperties} onClick={()=>choosePlatform(id)}><PlatformIcon src={item.icon}/><b>{item.label}</b>{platform===id&&<Check/>}</button>)}</div>
            <label className="cf-pb-field-label">{getInputLabel()}</label><div className="cf-pb-input"><ScanSearch/><input value={identifier} onChange={e=>{setIdentifier(e.target.value);setDraftIdentifier(e.target.value);}} placeholder={getInputPlaceholder()}/></div>
            <label className="cf-pb-field-label">Email <strong>(required)</strong></label><div className="cf-pb-input"><Mail/><input type="email" value={email} onChange={e=>{setEmail(e.target.value);setStoreEmail(e.target.value);}} placeholder="Enter your email address"/></div><p className="cf-pb-privacy"><span className="cf-pb-privacy-text-desktop">We safely store your searches, orders and updates.</span><span className="cf-pb-privacy-text-mobile">We use this email to safely save your search and orders.</span></p>
          </div>
          <div ref={mobileAnalyzePanelRef} className="cf-pb-step cf-pb-analyze"><div className="cf-pb-label"><i>3</i><div><b>Analyze profile</b><small>We'll fetch public data and confirm your profile.</small></div></div>{error&&<div className="cf-pb-error">{error}</div>}<button className="cf-pb-analyze-btn" disabled={stage==="analyzing"} onClick={analyze}>{stage==="analyzing"?<Loader2 className="spin"/>:<ScanSearch/>}{stage==="analyzing"?"Analyzing...":"Analyze Profile"}</button></div>
        </div>

        <div ref={mobileResultPanelRef} className={`cf-premium-builder-result cf-pb-result-${displayStage}`} aria-busy={displayStage === "analyzing"}>
          <div className="cf-pb-package-head"><b><ServiceIcon type="setup" compact/>Your Growth Setup</b><span className={`state-${displayStage}`}>{displayStage==="analyzing"?"Analyzing...":displayStage==="result"?"✓ Analyzed":"Ready"}</span></div>
          <div className="cf-pb-summary"><div><PlatformIcon src={meta.icon}/><span><b>{meta.label}</b><small>Platform</small></span></div><div><GoalIcon goal={goal} premium/><span><b>{goal[0].toUpperCase()+goal.slice(1)}</b><small>Goal</small></span></div><div><ServiceIcon type="email"/><span><b>{email.trim() || "Email required"}</b><small>Email</small></span></div></div>

          {displayStage === "idle" && <><div className="cf-pb-empty"><span>✦</span><h3>Ready when you are</h3><p>Select your goal and network, then enter your profile/content and email to start.</p></div><div className="cf-pb-ready-guide" aria-label="What happens next"><div><i>1</i><span><b>Analyze</b><small>We check real public data.</small></span></div><div><i>2</i><span><b>Confirm</b><small>Review the exact profile or content.</small></span></div><div><i>3</i><span><b>Choose</b><small>Continue straight to your plans.</small></span></div></div></>}
          {displayStage === "analyzing" && <div className="cf-pb-loading"><div className="cf-pb-progress" style={{"--progress":`${displayProgress*3.6}deg`} as React.CSSProperties}><b>{displayProgress}%</b></div><div><h3>{isContent ? "Analyzing content..." : "Analyzing profile..."}</h3><p>{isContent ? "We’re finding the content and loading its creator profile." : "Please wait while we fetch public data."}</p><div className="cf-pb-statuses">{progressRows.map((row)=><div key={row.label} className={row.state === "pending" ? "" : row.state}><span>{row.state === "done"?<Check/>:<i/>}</span><b>{row.label}</b><small>{row.status}</small></div>)}</div></div></div>}
          {displayStage === "result" && displayProfile && <><div className={`cf-pb-native-stage cf-pb-native-${displayProfile.platform}`}><div className="cf-pb-native-mobile"><NativePreview profile={displayProfile} onBack={resetSearch}/></div></div><div className="cf-pb-result-actions"><button onClick={resetSearch}><RotateCcw/> Search again</button><button onClick={confirmDisplayedProfile}>{isContent ? "Yes, this is my content" : "Yes, this is my profile"} <ArrowRight/></button></div></>}
        </div>
      </div>
      {process.env.NODE_ENV === "development" && (
        <div className="cf-pb-dev-scenes" aria-label="Local frozen preview scenes">
          <button type="button" className={devScene === 1 ? "active" : ""} onClick={() => setDevScene(1)}>
            <b>1</b><span>Ready</span>
          </button>
          <button type="button" className={devScene === 2 ? "active" : ""} onClick={() => setDevScene(2)}>
            <b>2</b><span>Analyze</span>
          </button>
          <button type="button" className={devScene === 3 ? "active" : ""} onClick={() => setDevScene(3)}>
            <b>3</b><span>Profile</span>
          </button>
          <button type="button" className="reset" onClick={() => setDevScene(null)} title="Return to real state">×</button>
        </div>
      )}
    </section>
  );
}
