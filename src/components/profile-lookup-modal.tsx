"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Link2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react";

import instagramIcon from "@/assets/home-icons-vector/instagram.svg";
import tiktokIcon from "@/assets/home-icons-vector/tiktok.svg";
import twitterIcon from "@/assets/home-icons-vector/twitter.svg";
import youtubeIcon from "@/assets/home-icons-vector/youtube.svg";
import { useFunnelStore } from "@/stores/funnel.store";

import {
  InstagramVerifiedProfile,
  TikTokVerifiedProfile,
  TwitterVerifiedProfile,
  YouTubeVerifiedProfile,
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
    color: "#000000",
    soft: "#fff0f3",
    icon: tiktokIcon,
    button: "#000000",
  },
  twitter: {
    label: "X / Twitter",
    color: "#0F1419",
    soft: "#f7f9fa",
    icon: twitterIcon,
    button: "#0F1419",
  },
  youtube: {
    label: "YouTube",
    color: "#ff0000",
    soft: "#fff0f0",
    icon: youtubeIcon,
    button: "linear-gradient(90deg,#ff0000,#cc0000)",
  },
} as const;

import {
  InstagramPreview,
  TikTokPreview,
  YouTubePreview,
  TwitterPreview,
} from "./social-preview";

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
  const [mode, setMode] = useState<SearchMode>("username");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedProfile, setVerifiedProfile] = useState<VerifiedSocialProfile | null>(null);

  const { setUsername, setProfileData } = useFunnelStore();

  const pollingRef = useMemo(() => ({ active: false }), []);

  const handle = useMemo(() => {
    const raw = identifier.trim().replace(/^@/, "");
    if (!raw) return "username";
    if (mode === "link") {
      const clean = raw.replace(/https?:\/\//, "").split("/").filter(Boolean);
      return (clean[clean.length - 1] || "username").replace(/[?&#].*$/, "");
    }
    return raw;
  }, [identifier, mode]);

  useEffect(() => {
    if (!open) {
      pollingRef.active = false;
      setStep(1);
      setProgress(0);
      setErrorMessage(null);
      setVerifiedProfile(null);
      setIsLoading(false);
    }
  }, [open, pollingRef]);

  const handleStartSearch = async () => {
    setErrorMessage(null);
    pollingRef.active = true;

    // 1. Email format local validation
    const emailRes = validateEmailFormat(email);
    if (!emailRes.isValid) {
      setErrorMessage("Enter a valid email address to continue.");
      return;
    }

    if (!identifier.trim()) {
      setErrorMessage("Por favor, informe seu @username ou link de canal/perfil/publicação.");
      return;
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

        while (pollingRef.active && Date.now() - startTime < maxPollDuration) {
          await new Promise((r) => setTimeout(r, 2500));
          if (!pollingRef.active) break;

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
            setErrorMessage(statusJson.message || "Não encontramos esse perfil. Confira o @ ou link e tente novamente.");
            setStep(1);
            setIsLoading(false);
            return;
          }
        }

        if (pollingRef.active) {
          setErrorMessage("Não foi possível concluir esta busca agora. Tente novamente.");
          setStep(1);
          setIsLoading(false);
        }
        return;
      }

      // Caso 3: Erro / não encontrado
      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);
      setErrorMessage(data.message || "Não encontramos esse perfil. Confira o @ ou link e tente novamente.");
      setStep(1);
      setIsLoading(false);
    } catch (err) {
      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);
      setErrorMessage("A consulta demorou mais que o esperado ou falhou. Tente novamente.");
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
          <span className="pl-amb-chip top-left">👥 +1K</span>
          <span className="pl-amb-heart top-left">♥</span>
          <span className="pl-amb-growth-bars top-right"><i /><i /><i /><i /></span>
          <span className="pl-amb-dotgrid top-right" />
          
          <span className="pl-amb-social ig bottom-left">◎</span>
          <span className="pl-amb-social tk bottom-left">♪</span>
          <span className="pl-amb-social yt bottom-right">▶</span>
          <span className="pl-amb-social x bottom-right">X</span>
          
          <span className="pl-amb-dashpath bottom-left" />
          <span className="pl-amb-chip bottom-right">👥 +2.5K</span>
          <span className="pl-amb-dotgrid bottom-left" />
        </div>

        {step === 1 && (
          <div className="pl-step-container">
            <button className="pl-close" type="button" onClick={onClose} aria-label="Close"><X /></button>
            <div className="pl-heading">
              <span className="pl-step-tag">STEP 1 OF 3</span>
              <h2>Almost there!</h2>
              <p className="pl-sub">
                {platform === "youtube"
                  ? "Enter your YouTube channel to see your personalized growth plan."
                  : `Enter your ${meta.label} profile to see your personalized ${service} plan.`}
              </p>
            </div>

            <div className="pl-form-card">
              {/* Form Navigation Tabs: Username | Profile Link */}
              <div className="pl-tabs-nav">
                <button
                  type="button"
                  className={`pl-tab-btn ${mode === "username" ? "active" : ""}`}
                  onClick={() => setMode("username")}
                >
                  {platform === "youtube" ? "@ Handle" : "Username"}
                </button>
                <button
                  type="button"
                  className={`pl-tab-btn ${mode === "link" ? "active" : ""}`}
                  onClick={() => setMode("link")}
                >
                  {platform === "youtube" ? "Channel / Video Link" : "Profile Link"}
                </button>
              </div>

              <div className="pl-inputs-group">
                <label className="pl-label">
                  {mode === "username"
                    ? (platform === "youtube" ? "YouTube Handle / Channel" : `${meta.label} Username`)
                    : (platform === "youtube" ? "YouTube Channel or Video Link" : `${meta.label} Profile or Content Link`)}
                </label>
                <div className="pl-field">
                  {mode === "username" ? <span className="pl-field-prefix">@</span> : <Link2 className="pl-field-icon" />}
                  <input
                    value={identifier}
                    onChange={(e)=>setIdentifier(e.target.value)}
                    placeholder={
                      mode === "username"
                        ? (platform === "youtube" ? "MrBeast" : "yourusername")
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
                  {isLoading ? "Searching..." : "Find my profile"} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="pl-global-footer">
              <LockKeyhole className="w-3.5 h-3.5" />
              <span>We only use public data · No password needed</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="pl-step-container">
            <button className="pl-close" type="button" onClick={onClose} aria-label="Close"><X /></button>
            <div className="pl-heading">
              <span className="pl-step-tag">STEP 2 OF 3</span>
              <h2>Searching...</h2>
              <p className="pl-sub">This will only take a few moments.</p>
            </div>

            <div className="pl-loading-card">
              {/* Central Radar / Search Animation */}
              <div className="pl-radar-wrap">
                <div className="pl-radar-ring pl-radar-ring-2" />
                <div className="pl-radar-ring pl-radar-ring-1" />
                <div className="pl-radar-core">
                  <Image src={meta.icon} alt="" width={44} height={44} />
                </div>
              </div>

              <h3 className="pl-searching-title">
                Looking for <span>@{handle}</span>
              </h3>
              <p className="pl-searching-sub">Scanning profile data across {meta.label}...</p>

              {/* Progress Checklist */}
              <div className="pl-status-list">
                {[
                  "Checking username availability",
                  "Searching social profiles",
                  "Verifying profile data",
                  "Compiling results",
                ].map((label, index) => (
                  <div className={`pl-status-item ${progress > index ? "done" : progress === index ? "active" : ""}`} key={label}>
                    <span className="pl-status-dot">
                      {progress > index ? <Check className="w-3 h-3 text-white stroke-[3]" /> : progress === index ? <span className="pl-status-spinner" /> : ""}
                    </span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pl-global-footer">
              <LockKeyhole className="w-3.5 h-3.5" />
              <span>We only use public data · No password needed</span>
            </div>
          </div>
        )}

        {step === 3 && verifiedProfile && (
          <div className="pl-step-container">
            <div className="pl-heading">
              <span className="pl-step-tag">STEP 3 OF 3</span>
              <h2>Profile Found</h2>
              <p className="pl-sub">We found <strong>@{verifiedProfile.username.replace(/^@+/, '')}</strong>. Review the details.</p>
            </div>

            <div className="pl-preview-wrapper">
              <ProfileFound platform={platform} profile={verifiedProfile} onClose={onClose} />
            </div>

            <div className="pl-confirm-block">
              <button className="pl-confirm-btn" type="button" onClick={onContinue}>
                <Check className="w-4 h-4 text-white stroke-[2.5]" />
                <span>Use this profile</span>
                <ArrowRight className="w-4 h-4 text-white stroke-[2.2]" />
              </button>

              <button className="pl-search-another-btn" type="button" onClick={() => setStep(1)}>
                Search another profile
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .pl-overlay{
          position:fixed;inset:0;z-index:9999;
          display:grid;place-items:center;
          padding:16px;
          background:rgba(9,15,30,.58);
          backdrop-filter:blur(12px);
          overflow-y:auto;
        }

        /* Standardized modal container across Step 1, Step 2, Step 3 and all 4 platforms */
        .pl-modal{
          --pl-accent:#1376ff;--pl-soft:#eef5ff;
          width:min(100%, 440px) !important;
          max-width:440px !important;
          min-width:320px;
          min-height:520px;
          margin:auto;
          position:relative;
          border-radius:26px;
          background:
            radial-gradient(circle at 10% 0%,color-mix(in srgb,var(--pl-accent) 7%,transparent),transparent 28%),
            #ffffff;
          color:#101827;
          padding:22px 20px 20px;
          box-shadow:0 28px 75px rgba(8,17,38,.28), 0 0 0 1px rgba(226,232,240,.8);
          border:1px solid rgba(214,222,234,.9);
          font-family:Arial,Helvetica,sans-serif;
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
            border-radius: 22px;
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

        .pl-amb-chip{
          position:absolute;
          font-size:11px;
          font-weight:800;
          color:#1376ff;
          border:1px solid #1376ff;
          border-radius:999px;
          padding:2px 8px;
          line-height:1.2;
        }
        .pl-amb-chip.top-left{left:14px;top:18px}
        .pl-amb-chip.bottom-right{right:16px;bottom:18px}

        .pl-amb-heart{
          position:absolute;
          left:105px;
          top:20px;
          color:#ff2d78;
          font-size:18px;
          line-height:1;
        }

        .pl-amb-growth-bars{
          position:absolute;
          right:18px;
          top:16px;
          display:flex;
          align-items:flex-end;
          gap:3px;
          height:32px;
        }
        .pl-amb-growth-bars i{
          width:5px;
          background:#3378ff;
          border-radius:2px 2px 0 0;
          display:block;
        }
        .pl-amb-growth-bars i:nth-child(1){height:10px}
        .pl-amb-growth-bars i:nth-child(2){height:16px}
        .pl-amb-growth-bars i:nth-child(3){height:23px}
        .pl-amb-growth-bars i:nth-child(4){height:30px}

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
        .pl-amb-social.yt{
          right:58px;bottom:28px;width:26px;height:26px;
          border:1.5px solid #ff0000;border-radius:50%;
          display:grid;place-items:center;font-size:13px;color:#ff0000;padding-left:2px;
        }
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

        .pl-close{
          position:absolute;right:16px;top:16px;width:32px;height:32px;border:0;background:rgba(241,245,249,.8);border-radius:50%;display:grid;place-items:center;color:#4b5565;cursor:pointer;z-index:20;transition:background .2s;
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
          font-size:10.5px;
          font-weight:900;
          letter-spacing:.6px;
          color:var(--pl-accent);
          text-transform:uppercase;
          margin-bottom:3px;
        }
        .pl-heading h2{
          margin:0;
          font-size:25px;
          font-weight:900;
          letter-spacing:-.6px;
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
          font-weight:800;
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
          font-weight:750;
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
          transition:border-color .2s, box-shadow .2s;
        }
        .pl-field:focus-within{
          border-color:var(--pl-accent);
          box-shadow:0 0 0 3px color-mix(in srgb,var(--pl-accent) 15%,transparent);
        }
        .pl-field.pl-field-error{
          border-color:var(--pl-accent) !important;
          box-shadow:0 0 0 3px color-mix(in srgb, var(--pl-accent) 8%, transparent) !important;
          margin-bottom:0 !important;
        }
        .pl-field-message{
          display:flex;
          align-items:center;
          gap:5px;
          margin:6px 0 12px 0;
          padding-left:3px;
          font-size:11.5px;
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
        .pl-field-prefix{font-weight:800;color:#94a3b8;font-size:15px}
        .pl-field input{width:100%;border:0;outline:0;background:transparent;font:inherit;font-size:14px;color:#0f172a}
        .pl-field input::placeholder{color:#94a3b8}
        .pl-help{display:block;color:#64748b;font-size:11.5px;margin:-4px 0 12px;line-height:1.35}

        .pl-primary-btn{
          width:100%;
          min-height:46px;
          border:0;
          border-radius:13px;
          color:#ffffff;
          font-size:14.5px;
          font-weight:850;
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
          background:#000000 !important;
          box-shadow:0 6px 18px rgba(37, 244, 238, 0.18), 0 6px 18px rgba(254, 44, 85, 0.18) !important;
          transition:background 180ms ease, transform 180ms ease, box-shadow 180ms ease !important;
        }
        .pl-modal.pl-tiktok .pl-primary-btn:hover,
        .pl-modal.pl-tiktok .pl-confirm-btn:hover{
          background:#111111 !important;
          transform:translateY(-1px);
          box-shadow:0 8px 24px rgba(37, 244, 238, 0.28), 0 8px 24px rgba(254, 44, 85, 0.28) !important;
        }

        .pl-modal.pl-twitter .pl-primary-btn,
        .pl-modal.pl-twitter .pl-confirm-btn{
          background:#0F1419 !important;
          box-shadow:0 7px 18px rgba(15, 20, 25, 0.18) !important;
          transition:background 180ms ease, transform 180ms ease, box-shadow 180ms ease !important;
        }
        .pl-modal.pl-twitter .pl-primary-btn:hover,
        .pl-modal.pl-twitter .pl-confirm-btn:hover{
          background:#272C30 !important;
          transform:translateY(-1px);
          box-shadow:0 9px 22px rgba(15, 20, 25, 0.26) !important;
        }

        .pl-modal.pl-youtube .pl-primary-btn,
        .pl-modal.pl-youtube .pl-confirm-btn{
          background:#FF0000 !important;
          box-shadow:0 7px 18px rgba(255, 0, 0, 0.20) !important;
          transition:background 180ms ease, transform 180ms ease, box-shadow 180ms ease !important;
        }
        .pl-modal.pl-youtube .pl-primary-btn:hover,
        .pl-modal.pl-youtube .pl-confirm-btn:hover{
          background:#E60000 !important;
          transform:translateY(-1px);
          box-shadow:0 9px 24px rgba(255, 0, 0, 0.32) !important;
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
          border-radius:12px;
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

        .pl-search-another-btn{
          background:transparent!important;
          border:0!important;
          color:#64748b!important;
          font-size:12.5px!important;
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
      `}</style>
    </div>
  );
}
