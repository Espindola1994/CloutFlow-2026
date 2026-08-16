"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Bookmark,
  Check,
  ChevronDown,
  Grid3X3,
  Heart,
  Link2,
  Lock,
  LockKeyhole,
  Mail,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Repeat2,
  Search,
  ShieldCheck,
  ShoppingBag,
  SquarePlay,
  UserPlus,
  UserRound,
  UserRoundPlus,
  X,
} from "lucide-react";

import instagramIcon from "@/assets/home-icons-vector/instagram.svg";
import tiktokIcon from "@/assets/home-icons-vector/tiktok.svg";
import twitterIcon from "@/assets/home-icons-vector/twitter.svg";
import facebookIcon from "@/assets/home-icons-vector/facebook.svg";
import avatar1 from "@/assets/facebook-followers/follower-1.jpg";
import avatar2 from "@/assets/facebook-followers/follower-2.jpg";
import avatar3 from "@/assets/facebook-followers/follower-3.jpg";
import avatar4 from "@/assets/facebook-followers/follower-4.jpg";
import { useFunnelStore } from "@/stores/funnel.store";

import {
  InstagramVerifiedProfile,
  TikTokVerifiedProfile,
  TwitterVerifiedProfile,
  FacebookVerifiedProfile,
  VerifiedSocialProfile,
} from "@/lib/social/types";
import { validateEmailFormat } from "@/lib/social/normalize";

type PlatformId = "instagram" | "tiktok" | "twitter" | "facebook";
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
    color: "#ff3b78",
    soft: "#fff1f6",
    icon: instagramIcon,
    button: "linear-gradient(90deg,#ff6a35,#ee2f78 52%,#ad3cff)",
  },
  tiktok: {
    label: "TikTok",
    color: "#fe2c55",
    soft: "#fff0f4",
    icon: tiktokIcon,
    button: "linear-gradient(90deg,#12d7dd,#fe2c55)",
  },
  twitter: {
    label: "X / Twitter",
    color: "#0f1419",
    soft: "#f3f5f7",
    icon: twitterIcon,
    button: "linear-gradient(90deg,#111827,#3f4a5a)",
  },
  facebook: {
    label: "Facebook",
    color: "#1877f2",
    soft: "#eef5ff",
    icon: facebookIcon,
    button: "linear-gradient(90deg,#2d8cff,#1468ea)",
  },
} as const;

import {
  InstagramPreview,
  TikTokPreview,
  FacebookPreview,
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
  if (platform === "facebook" && profile.platform === "facebook") {
    return <FacebookPreview profile={profile} onClose={onClose} />;
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
      setErrorMessage(emailRes.message || "Digite um email válido. Exemplo: nome@email.com");
      return;
    }

    if (!identifier.trim()) {
      setErrorMessage("Por favor, informe seu @username ou link de perfil/publicação.");
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

      // Caso 2: Processamento assíncrono (ex: Facebook / TikTok / Twitter com snapshot) com Polling controlado
      if (res.ok && data.success && data.status === "pending" && data.requestId) {
        let currentRequestId = data.requestId;
        const startTime = Date.now();
        // 240s (4 min) para Facebook, 45s para TikTok e X/Twitter
        const maxPollDuration = platform === "facebook" ? 240000 : 45000;

        while (pollingRef.active && Date.now() - startTime < maxPollDuration) {
          await new Promise((r) => setTimeout(r, 2500)); // 2.5s entre verificações
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
      <div className={`pl-modal pl-${platform}`} style={{ "--pl-accent": meta.color, "--pl-soft": meta.soft, "--pl-button": meta.button } as React.CSSProperties}>
        {step === 1 && (
          <>
            <button className="pl-close" type="button" onClick={onClose}><X /></button>
            <div className="pl-step-head">
              <Image src={meta.icon} alt="" width={38} height={38} />
              <div><strong>{meta.label}</strong><small>Step 1 of 3</small></div>
            </div>
            <h2>Almost there!</h2>
            <p className="pl-sub">Enter your {meta.label} profile to see your personalized {service} plan.</p>
            <div className="pl-switch">
              <button className={mode === "username" ? "active" : ""} onClick={() => setMode("username")}>@ Username</button>
              <button className={mode === "link" ? "active" : ""} onClick={() => setMode("link")}>Profile Link</button>
            </div>
            <label className="pl-label">{mode === "username" ? `${meta.label} Username` : `${meta.label} Profile or Content Link`}</label>
            <div className="pl-field">
              {mode === "username" ? <span>@</span> : <Link2 />}
              <input value={identifier} onChange={(e)=>setIdentifier(e.target.value)} placeholder={mode === "username" ? "yourusername" : `https://${platform}.com/...`} />
            </div>
            <label className="pl-label">Email Address</label>
            <div className="pl-field"><Mail /><input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder="you@example.com" /></div>
            
            {errorMessage ? (
              <div className="p-3 my-2 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-lg text-center">
                {errorMessage}
              </div>
            ) : (
              <small className="pl-help">We&apos;ll use this to send your plan details and order confirmation.</small>
            )}

            <button className="pl-primary" type="button" onClick={handleStartSearch} disabled={isLoading}>
              {isLoading ? "Searching..." : "Find my profile"} <ArrowRight />
            </button>
            <div className="pl-secure"><LockKeyhole /> Safe · No password needed · Takes less than 1 minute</div>
          </>
        )}

        {step === 2 && (
          <div className="pl-analysis">
            <button className="pl-close" type="button" onClick={onClose}><X /></button>
            <div className="pl-analyze-icon"><Image src={meta.icon} alt="" width={58} height={58} /></div>
            <h2>Analyzing <span>@{handle}</span></h2>
            <p className="pl-sub">This will only take a few seconds...</p>
            <div className="pl-progress-list">
              {[
                `Connecting to ${meta.label}...`,
                "Scanning your profile...",
                "Analyzing your audience...",
                "Building your personalized plan...",
              ].map((label,index)=>(
                <div className={progress > index ? "done" : progress === index ? "active" : ""} key={label}>
                  <span className="pl-progress-dot">{progress > index ? <Check /> : ""}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="pl-secure-card"><ShieldCheck /> Secure &amp; Private<br/><small>We only use public profile information.</small></div>
          </div>
        )}

        {step === 3 && verifiedProfile && (
          <div className="pl-found">
            <div className="pl-found-heading">
              <span>STEP 3 OF 3</span>
              <h2>Profile Found</h2>
              <p>We found <strong>@{verifiedProfile.username}</strong>. Review the details below.</p>
            </div>
            <ProfileFound platform={platform} profile={verifiedProfile} onClose={onClose} />
            <button className="pl-primary pl-continue" type="button" onClick={onContinue}>Looks good, continue <ArrowRight /></button>
            <button className="pl-try" type="button" onClick={() => setStep(1)}>Try another profile</button>
            <div className="pl-secure"><LockKeyhole /> We only use public data · No password needed</div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .pl-overlay{
          position:fixed;inset:0;z-index:9999;
          display:grid;place-items:center;
          padding:18px;
          background:rgba(9,15,30,.48);
          backdrop-filter:blur(10px);
        }
        .pl-modal{
          --pl-accent:#1376ff;--pl-soft:#eef5ff;
          width:min(100%,560px);
          max-height:none;
          overflow:visible;
          position:relative;
          border-radius:22px;
          background:
            radial-gradient(circle at 12% 0%,color-mix(in srgb,var(--pl-accent) 8%,transparent),transparent 26%),
            #fff;
          color:#101827;
          padding:24px;
          box-shadow:0 26px 80px rgba(8,17,38,.24);
          border:1px solid rgba(214,222,234,.9);
          font-family:Arial,Helvetica,sans-serif;
        }
        .pl-close{position:absolute;right:14px;top:14px;width:34px;height:34px;border:0;background:transparent;border-radius:50%;display:grid;place-items:center;color:#4b5565;cursor:pointer;z-index:20}
        .pl-close svg{width:18px;height:18px}
        .pl-step-head{display:flex;align-items:center;gap:10px;margin-bottom:18px}
        .pl-step-head img{width:34px!important;height:34px!important}
        .pl-step-head div{display:flex;flex-direction:column}
        .pl-step-head strong{font-size:14px}.pl-step-head small{font-size:10px;color:#8b95a8;margin-top:2px}
        .pl-modal h2{margin:0;text-align:center;font-size:28px;letter-spacing:-.8px}
        .pl-sub{text-align:center;color:#7a8498;font-size:15px;line-height:1.5;margin:8px auto 18px;max-width:320px}
        .pl-switch{display:grid;grid-template-columns:1fr 1fr;padding:4px;background:#f5f7fa;border-radius:12px;margin-bottom:18px}
        .pl-switch button{height:36px;border:0;background:transparent;border-radius:9px;font-size:14px;font-weight:800;color:#6d7789;cursor:pointer}
        .pl-switch button.active{background:#fff;color:var(--pl-accent);box-shadow:0 2px 8px rgba(16,24,39,.08)}
        .pl-label{display:block;font-size:14px;font-weight:800;margin:13px 0 7px}
        .pl-field{height:48px;border:1px solid #dce2ea;border-radius:14px;display:flex;align-items:center;gap:8px;padding:0 13px;background:#fff}
        .pl-field svg{width:16px;height:16px;color:#8d97aa}.pl-field>span{font-weight:800;color:#8d97aa}
        .pl-field input{width:100%;border:0;outline:0;background:transparent;font:inherit;font-size:15px;color:#101827}
        .pl-field input::placeholder{color:#a7b0bf}
        .pl-help{display:block;color:#8c95a6;font-size:12px;margin:8px 0 16px}
        .pl-primary{width:100%;min-height:48px;border:0;border-radius:13px;color:#fff;background:var(--pl-button);font-size:15px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;box-shadow:0 9px 22px color-mix(in srgb,var(--pl-accent) 19%,transparent)}
        .pl-primary svg{width:17px;height:17px}
        .pl-secure{display:flex;align-items:center;justify-content:center;gap:6px;color:#7f899a;font-size:12px;margin-top:16px;text-align:center}
        .pl-secure svg{width:13px;height:13px}

        .pl-analysis{padding:28px 0 4px}
        .pl-analyze-icon{width:88px;height:88px;border-radius:50%;display:grid;place-items:center;margin:0 auto 24px;background:var(--pl-soft);box-shadow:0 0 0 9px color-mix(in srgb,var(--pl-accent) 5%,transparent)}
        .pl-analyze-icon img{width:58px!important;height:58px!important}
        .pl-analysis h2 span{color:var(--pl-accent)}
        .pl-progress-list{border:1px solid #e2e7ee;border-radius:16px;background:#fff;padding:15px;margin-top:18px;box-shadow:0 8px 20px rgba(17,27,49,.06)}
        .pl-progress-list>div{display:flex;align-items:center;gap:10px;min-height:36px;font-size:14px;color:#9ba4b4}
        .pl-progress-list>div.active,.pl-progress-list>div.done{color:#293245}
        .pl-progress-dot{width:19px;height:19px;border:2px solid #e2e7ee;border-radius:50%;display:grid;place-items:center;flex:0 0 19px}
        .pl-progress-list>div.done .pl-progress-dot{border-color:#b74bef;background:#b74bef;color:#fff}
        .pl-progress-list>div.active .pl-progress-dot{border-color:var(--pl-accent);border-right-color:transparent;animation:plspin .8s linear infinite}
        .pl-progress-dot svg{width:11px;height:11px;stroke-width:3}
        @keyframes plspin{to{transform:rotate(360deg)}}
        .pl-secure-card{margin:18px auto 0;width:max-content;max-width:100%;border:1px solid #edf0f5;border-radius:13px;background:#fafbfc;padding:10px 15px;text-align:center;color:#748094;font-size:10px}
        .pl-secure-card svg{width:15px;height:15px;vertical-align:-3px;margin-right:5px;color:var(--pl-accent)}

        .pl-found{padding-top:2px}
        .pl-found-heading{text-align:center;margin-bottom:14px}
        .pl-found-heading>span{color:var(--pl-accent);font-size:10px;font-weight:900;letter-spacing:.4px}
        .pl-found-heading h2{font-size:27px;margin:4px 0}
        .pl-found-heading p{font-size:12px;color:#7a8496;margin:0}
        .pl-found-heading strong{color:var(--pl-accent)}
        .pl-official{border:0;border-radius:18px;overflow:hidden;background:#fff;position:relative;box-shadow:none}
        .pl-topbar{height:52px;display:grid;grid-template-columns:42px 1fr 42px;align-items:center;border-bottom:1px solid #edf0f4;padding:0 8px}
        .pl-topbar strong{text-align:center;font-size:16px}
        .pl-icon-btn{width:34px;height:34px;border:0;background:transparent;display:grid;place-items:center;cursor:pointer}
        .pl-icon-btn svg{width:19px;height:19px}
        .pl-avatar{position:relative;overflow:hidden;border-radius:50%;background:#e9edf2;flex:0 0 auto}
        .pl-avatar img{object-fit:cover}
        .pl-avatar.ig{width:82px;height:82px;border:2px solid #f03c92;padding:2px}
        .pl-avatar.tk{width:84px;height:84px;border:1px solid #42484f}
        .pl-avatar.x{width:88px;height:88px;border:3px solid #0b0f14}
        .pl-avatar.fb{width:88px;height:88px;border:4px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.16)}
        .pl-avatar.tiny{width:36px;height:36px}
        .pl-verified{display:inline-flex;width:15px;height:15px;vertical-align:-2px;margin-left:3px}
        .pl-verified svg{width:100%;height:100%;fill:#1688f8}.pl-verified .pl-check{fill:#fff}
        .pl-name{font-weight:900;font-size:18px;display:flex;align-items:center}
        .pl-muted{color:#7a8496;font-size:13px}
        .pl-copy{padding:0 18px 14px;font-size:14px;line-height:1.5}
        .pl-copy p{margin:8px 0 5px}.pl-copy a{color:#1376ff;text-decoration:none;display:inline-flex;align-items:center;gap:4px}.pl-copy a svg{width:13px;height:13px}
        .pl-actions-row{display:grid;grid-template-columns:1fr 1fr 40px;gap:7px;padding:0 16px 12px}
        .pl-actions-row button{height:40px;border:0;border-radius:8px;background:#eef1f5;color:#111827;font-size:14px;font-weight:850}
        .pl-actions-row button:first-child{background:#1577f6;color:white}
        .pl-actions-row .mini{display:grid;place-items:center}.pl-actions-row .mini svg{width:15px;height:15px}
        .pl-highlights{display:flex;justify-content:space-between;padding:2px 14px 12px}
        .pl-highlights>div{text-align:center;width:56px}.pl-highlights span{width:45px;height:45px;border-radius:50%;overflow:hidden;display:block;position:relative;margin:0 auto 4px;border:1px solid #d4dbe4}.pl-highlights img{object-fit:cover}.pl-highlights small{font-size:11px;color:#586478}
        .pl-tabs{display:flex;align-items:center;border-top:1px solid #eceff3;border-bottom:1px solid #eceff3;min-height:42px}
        .pl-tabs span{flex:1;text-align:center;color:#596579;font-size:13px;position:relative;height:42px;display:flex;align-items:center;justify-content:center}
        .pl-tabs svg{width:19px;height:19px}.pl-tabs span.active{color:#111}.pl-tabs span.active:after{content:"";height:2px;background:currentColor;position:absolute;left:22%;right:22%;bottom:-1px}
        .pl-media-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;padding:2px}
        .pl-media-tile{aspect-ratio:1;position:relative;overflow:hidden;background:#dfe4ea}.pl-media-tile img{object-fit:cover}
        .pl-views{position:absolute;left:5px;bottom:5px;color:#fff;font-size:9px;font-weight:900;text-shadow:0 1px 4px #000}

        .pl-ig-head{display:flex;align-items:center;gap:24px;padding:14px 16px 10px}
        .pl-ig-stats{flex:1;display:grid;grid-template-columns:repeat(3,1fr);text-align:center;gap:8px}
        .pl-ig-stats strong,.pl-tk-stats strong{display:block;font-size:16px}.pl-ig-stats small,.pl-tk-stats small{font-size:11px;color:#657085}
        .pl-tk-head{display:flex;align-items:center;gap:15px;padding:15px 16px 7px}.pl-tk-info{min-width:0}.pl-tk-info .pl-name{font-size:19px}
        .pl-tk-stats{display:grid;grid-template-columns:repeat(3,1fr);text-align:center;padding:4px 15px 10px}
        .pl-actions-row.tk button:first-child{background:#fe2c55}.pl-official.tiktok{background:#fff;color:#111827;border-color:#e2e7ee}.pl-official.tiktok .pl-topbar{border-color:#edf0f4}.pl-official.tiktok .pl-muted{color:#6b7484}.pl-official.tiktok .pl-copy a{color:#111827}.pl-official.tiktok .pl-actions-row button{background:#f1f3f5;color:#111827}.pl-official.tiktok .pl-actions-row button:first-child{background:#fe2c55}.pl-official.tiktok .pl-tabs{border-color:#eceff3}.pl-official.tiktok .pl-tabs span{color:#6b7484}.pl-official.tiktok .pl-tabs span.active{color:#111827}
        .pl-official.twitter{background:#0b1117;color:#fff;border-color:#28333e;padding-top:118px;overflow:hidden}.pl-x-cover{position:absolute;top:0;left:0;right:0;height:122px;background:linear-gradient(155deg,#24384b,#101820 52%,#263846)}.pl-official.twitter .pl-topbar{position:absolute;top:0;left:0;right:0;border:0;color:#fff;background:linear-gradient(#0008,transparent)}.pl-x-profile{display:flex;justify-content:space-between;align-items:flex-start;padding:0 15px;margin-top:-44px;position:relative}.pl-x-follow{margin-top:54px;border:0;background:#fff;color:#0b1117;border-radius:999px;padding:8px 20px;font-size:12px;font-weight:900}.pl-official.twitter .pl-muted{color:#8995a2}.pl-copy.xcopy{padding-top:6px}.pl-x-meta{color:#9aa6b3!important;font-size:10px}.pl-x-count{font-size:11px;color:#8d99a6}.pl-x-count strong{color:#fff}.pl-x-count a{color:#1d9bf0}.pl-x-count+.x{}
        .pl-tabs.x-tabs span{flex:auto;padding:0 7px;color:#9aa6b3}.pl-tabs.x-tabs span.active{color:#fff}.pl-tabs.x-tabs span.active:after{background:#1d9bf0;left:14%;right:14%}.pl-tweet{display:flex;gap:10px;padding:14px 16px 18px;border-bottom:1px solid #25313b;font-size:13px}.pl-tweet p{margin:5px 0 10px}.pl-tweet-actions{display:flex;justify-content:space-between;color:#8995a2}
        .pl-fb-top{height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 15px;color:#1877f2}.pl-fb-top strong{font-size:22px;font-weight:900}.pl-fb-top div{display:flex;gap:14px}.pl-fb-top svg{width:18px;height:18px;color:#111}.pl-fb-cover{height:112px;background:linear-gradient(145deg,#5598df,#cce3f4 42%,#eff7fb 75%,#6cb3e6)}.pl-fb-profile{display:flex;align-items:flex-end;gap:11px;padding:0 16px;margin-top:-40px;position:relative}.pl-fb-profile .pl-name{font-size:20px;margin-bottom:1px}.pl-actions-row.fb{padding-top:12px}.pl-actions-row.fb button:first-child{background:#1877f2}.pl-tabs.fb-tabs{justify-content:flex-start;padding:0 10px}.pl-tabs.fb-tabs span{flex:none;padding:0 11px}.pl-tabs.fb-tabs span.active{color:#1877f2}.pl-tabs.fb-tabs span.active:after{left:8px;right:8px;background:#1877f2}.pl-fb-details{padding:14px 18px 18px;font-size:13px}.pl-fb-details h4{margin:0 0 8px;font-size:15px}.pl-fb-details p{margin:8px 0}.pl-fb-details a{color:#1877f2}.pl-fb-close{position:absolute;right:8px;top:8px;width:34px;height:34px;border:0;background:transparent;display:none}

        .pl-continue{margin-top:14px}
        .pl-try{display:block;margin:12px auto 0;border:0;background:transparent;color:#1376ff;font-weight:800;font-size:11px;cursor:pointer}

        @media(max-width:520px){
          .pl-overlay{padding:0;align-items:end}
          .pl-modal{width:100%;max-height:96vh;border-radius:24px 24px 0 0;padding:18px 16px 20px}
          .pl-found-heading{margin-bottom:10px}
          .pl-found-heading h2{font-size:24px}
          .pl-official{border-radius:16px}
        }
      

        /* V176 — profile popup: clean, legible, responsive, no nested-page feeling */
        .pl-overlay{
          overflow-y:auto;
          padding:24px;
        }

        .pl-modal{
          width:min(100%,620px)!important;
          max-height:none!important;
          overflow:visible!important;
          padding:24px!important;
        }

        .pl-found{
          display:flex;
          flex-direction:column;
          gap:0;
        }

        .pl-found-heading{
          margin-bottom:12px!important;
        }

        .pl-official{
          width:100%;
          border:1px solid #e2e7ee!important;
          border-radius:18px!important;
          box-shadow:0 10px 28px rgba(16,24,40,.08)!important;
        }

        .pl-official.tiktok,
        .pl-official.twitter{
          border-color:#28313a!important;
        }

        .pl-media-grid{
          grid-template-columns:repeat(3,minmax(0,1fr))!important;
          gap:3px!important;
          padding:3px!important;
        }

        .pl-media-tile{
          aspect-ratio:1.08/1!important;
        }

        .pl-highlights{
          overflow:hidden!important;
          gap:8px!important;
        }

        .pl-highlights > div:nth-child(n+5){
          display:none!important;
        }

        .pl-continue{
          min-height:50px!important;
          margin-top:14px!important;
          font-size:15px!important;
        }

        .pl-try{
          font-size:13px!important;
          margin-top:10px!important;
        }

        .pl-secure{
          font-size:11px!important;
          margin-top:12px!important;
        }

        /* Desktop: wider modal, natural scale, no vertical scrollbar inside popup */
        @media (min-width:769px){
          .pl-modal{
            width:min(100%,620px)!important;
          }

          .pl-official{
            max-height:none!important;
          }

          .pl-topbar{
            height:56px!important;
          }

          .pl-name{
            font-size:20px!important;
          }

          .pl-avatar.ig,
          .pl-avatar.tk{
            width:90px!important;
            height:90px!important;
          }

          .pl-avatar.x,
          .pl-avatar.fb{
            width:94px!important;
            height:94px!important;
          }
        }

        /* Mobile: popup becomes the screen itself, optimized for iOS/Android */
        @media (max-width:768px){
          .pl-overlay{
            padding:0!important;
            align-items:stretch!important;
            background:#fff!important;
            backdrop-filter:none!important;
            overflow-y:auto!important;
          }

          .pl-modal{
            width:100%!important;
            min-height:100dvh!important;
            max-height:none!important;
            border:0!important;
            border-radius:0!important;
            padding:16px 14px calc(18px + env(safe-area-inset-bottom))!important;
            box-shadow:none!important;
            overflow:visible!important;
          }

          .pl-step-head{
            padding-top:max(2px, env(safe-area-inset-top))!important;
          }

          .pl-found-heading{
            padding-top:max(4px, env(safe-area-inset-top))!important;
          }

          .pl-found-heading h2{
            font-size:26px!important;
          }

          .pl-found-heading p{
            font-size:13px!important;
          }

          .pl-official{
            border-radius:16px!important;
          }

          .pl-topbar{
            height:52px!important;
          }

          .pl-name{
            font-size:19px!important;
          }

          .pl-copy{
            font-size:13px!important;
            padding-left:14px!important;
            padding-right:14px!important;
          }

          .pl-ig-head,
          .pl-tk-head{
            padding-left:14px!important;
            padding-right:14px!important;
          }

          .pl-actions-row{
            padding-left:14px!important;
            padding-right:14px!important;
          }

          .pl-actions-row button{
            height:40px!important;
            font-size:13px!important;
          }

          .pl-tabs span{
            font-size:12px!important;
          }

          .pl-media-grid{
            grid-template-columns:repeat(3,1fr)!important;
          }

          .pl-media-tile{
            aspect-ratio:1/1!important;
          }

          .pl-fb-details{
            font-size:12px!important;
          }
        }

        @media (max-width:390px){
          .pl-modal{
            padding-left:12px!important;
            padding-right:12px!important;
          }

          .pl-avatar.ig,
          .pl-avatar.tk{
            width:76px!important;
            height:76px!important;
          }

          .pl-avatar.x,
          .pl-avatar.fb{
            width:82px!important;
            height:82px!important;
          }

          .pl-name{
            font-size:18px!important;
          }
        }



        /* V177 — refined Step 3: cleaner, commercial, mobile-first */
        .pl-found-heading{
          margin-bottom:14px!important;
        }

        .pl-found-heading > span{
          font-size:11px!important;
          letter-spacing:.5px!important;
        }

        .pl-found-heading h2{
          font-size:28px!important;
          line-height:1.05!important;
          letter-spacing:-.8px!important;
        }

        .pl-found-heading p{
          font-size:13px!important;
          line-height:1.45!important;
        }

        .pl-official{
          border-radius:20px!important;
          border:1px solid #e3e8ef!important;
          box-shadow:0 12px 32px rgba(16,24,40,.08)!important;
          background:#fff!important;
          color:#101827!important;
        }

        .pl-official.twitter{
          background:#0f1419!important;
          color:#fff!important;
          border-color:#27323d!important;
        }

        .pl-official.tiktok{
          background:#fff!important;
          color:#111827!important;
          border-color:#e3e8ef!important;
        }

        .pl-topbar{
          height:54px!important;
          padding:0 12px!important;
          background:#fff!important;
          border-bottom:1px solid #edf0f4!important;
        }

        .pl-official.twitter .pl-topbar{
          background:transparent!important;
          border-bottom:0!important;
          color:#fff!important;
        }

        .pl-topbar strong{
          font-size:17px!important;
          font-weight:900!important;
          letter-spacing:-.2px!important;
        }

        .pl-icon-btn{
          width:36px!important;
          height:36px!important;
        }

        .pl-icon-btn svg{
          width:20px!important;
          height:20px!important;
        }

        .pl-ig-head,
        .pl-tk-head{
          padding:18px 18px 12px!important;
          gap:16px!important;
        }

        .pl-avatar.ig,
        .pl-avatar.tk{
          width:88px!important;
          height:88px!important;
        }

        .pl-avatar.x,
        .pl-avatar.fb{
          width:92px!important;
          height:92px!important;
        }

        .pl-name{
          font-size:20px!important;
          line-height:1.05!important;
        }

        .pl-muted{
          font-size:12px!important;
        }

        .pl-ig-stats strong,
        .pl-tk-stats strong{
          font-size:17px!important;
        }

        .pl-ig-stats small,
        .pl-tk-stats small{
          font-size:11px!important;
        }

        .pl-copy{
          font-size:14px!important;
          line-height:1.5!important;
          padding:0 18px 14px!important;
        }

        .pl-copy p{
          margin:7px 0 5px!important;
        }

        .pl-actions-row{
          padding:0 18px 14px!important;
          gap:8px!important;
        }

        .pl-actions-row button{
          height:42px!important;
          border-radius:9px!important;
          font-size:14px!important;
          font-weight:850!important;
        }

        .pl-actions-row.tk button:first-child{
          background:#fe2c55!important;
          color:#fff!important;
        }

        .pl-highlights{
          padding:2px 16px 14px!important;
        }

        .pl-highlights > div{
          width:58px!important;
        }

        .pl-highlights span{
          width:48px!important;
          height:48px!important;
        }

        .pl-tabs{
          min-height:44px!important;
        }

        .pl-tabs span{
          height:44px!important;
          font-size:12px!important;
        }

        .pl-media-grid{
          gap:4px!important;
          padding:4px!important;
        }

        .pl-media-tile{
          border-radius:8px!important;
          overflow:hidden!important;
        }

        .pl-continue{
          margin-top:16px!important;
          min-height:50px!important;
          border-radius:12px!important;
          font-size:15px!important;
        }

        .pl-try{
          font-size:13px!important;
          margin-top:11px!important;
        }

        .pl-secure{
          font-size:11px!important;
          margin-top:11px!important;
          color:#7a8495!important;
        }

        /* Facebook stays white, with a flatter official-style profile section. */
        .pl-official.facebook{
          background:#fff!important;
        }

        .pl-fb-cover{
          height:96px!important;
          background:linear-gradient(135deg,#eaf2fb 0%,#cfe1f5 50%,#e9f3fb 100%)!important;
        }

        .pl-fb-profile{
          margin-top:-34px!important;
          padding:0 18px!important;
        }

        .pl-fb-top{
          padding:0 18px!important;
        }

        .pl-fb-details{
          padding:14px 18px 16px!important;
        }

        /* X keeps the official dark language, but tighter and cleaner. */
        .pl-official.twitter{
          padding-top:108px!important;
        }

        .pl-x-cover{
          height:112px!important;
          background:linear-gradient(155deg,#31475e,#1b2733 48%,#2a3a4b)!important;
        }

        .pl-x-profile{
          margin-top:-40px!important;
          padding:0 18px!important;
        }

        .pl-x-follow{
          margin-top:50px!important;
          padding:8px 19px!important;
        }

        .pl-tweet{
          padding:14px 16px 16px!important;
        }

        /* TikTok white variant */
        .pl-official.tiktok .pl-topbar{
          background:#fff!important;
          color:#111827!important;
        }

        .pl-official.tiktok .pl-tabs{
          border-color:#eceff3!important;
        }

        .pl-official.tiktok .pl-tabs span{
          color:#687386!important;
        }

        .pl-official.tiktok .pl-tabs span.active{
          color:#111827!important;
        }

        .pl-official.tiktok .pl-tabs span.active:after{
          background:#111827!important;
        }

        .pl-official.tiktok .pl-copy a{
          color:#111827!important;
        }

        .pl-official.tiktok .pl-actions-row button{
          background:#f0f2f5!important;
          color:#111827!important;
        }

        .pl-official.tiktok .pl-actions-row button:first-child{
          background:#fe2c55!important;
          color:#fff!important;
        }

        @media (max-width:768px){
          .pl-modal{
            padding:14px 12px calc(16px + env(safe-area-inset-bottom))!important;
          }

          .pl-found-heading h2{
            font-size:25px!important;
          }

          .pl-official{
            border-radius:17px!important;
          }

          .pl-ig-head,
          .pl-tk-head{
            padding:16px 14px 10px!important;
          }

          .pl-copy{
            padding-left:14px!important;
            padding-right:14px!important;
          }

          .pl-actions-row{
            padding-left:14px!important;
            padding-right:14px!important;
          }

          .pl-avatar.ig,
          .pl-avatar.tk{
            width:80px!important;
            height:80px!important;
          }

          .pl-avatar.x,
          .pl-avatar.fb{
            width:84px!important;
            height:84px!important;
          }

          .pl-name{
            font-size:19px!important;
          }

          .pl-ig-stats strong,
          .pl-tk-stats strong{
            font-size:16px!important;
          }

          .pl-copy{
            font-size:13px!important;
          }

          .pl-media-tile{
            border-radius:6px!important;
          }

          .pl-continue{
            min-height:48px!important;
          }
        }



        /* V178 — Step 3 based directly on the supplied current mobile profile references */
        .pl-found-heading{display:none!important}
        .pl-found{padding:0!important}
        .pl-found .pl-continue{margin-top:12px!important}
        .native-profile{
          width:100%;overflow:hidden;background:#fff;color:#0d0d0f;
          border-radius:18px;border:1px solid #e5e7eb;
          font-family:Arial,Helvetica,sans-serif;
        }
        .native-profile *{box-sizing:border-box}
        .native-profile h3,.native-profile p{margin:0}
        .native-avatar{position:relative;overflow:hidden;border-radius:50%;flex:0 0 auto}
        .native-avatar img{object-fit:cover}
        .native-avatar.tiny{width:38px;height:38px}
        .native-link{color:#315bb5}
        .native-nav{height:58px;display:grid;grid-template-columns:34px 1fr auto;align-items:center;padding:0 18px}
        .native-nav>svg{width:25px}.native-nav>strong{font-size:22px;margin-left:16px}
        .native-nav-actions{display:flex;gap:18px;align-items:center;font-size:24px}.native-nav-actions svg{width:22px}
        .native-bio{padding:8px 20px;font-size:15px;line-height:1.42}
        .native-buttons{display:grid;gap:8px;padding:10px 20px}
        .native-buttons button{height:43px;border:0;border-radius:11px;font-size:16px;font-weight:800}
        .native-tabs{display:flex;align-items:center;justify-content:space-around;height:54px;border-bottom:1px solid #e5e7eb}
        .native-tabs span{height:54px;min-width:54px;display:grid;place-items:center;font-size:25px;position:relative}
        .native-tabs .active:after{content:"";height:2px;background:currentColor;position:absolute;left:0;right:0;bottom:0}
        .native-profile .pl-media-grid{padding:0!important;gap:2px!important}
        .native-profile .pl-media-tile{border-radius:0!important;aspect-ratio:1/1.12!important}

        /* Instagram */
        .ig-main{display:flex;gap:22px;align-items:center;padding:10px 20px 4px}
        .native-avatar.ig{width:92px;height:92px;border:3px solid #e3e6eb;padding:3px}
        .ig-summary{flex:1}.ig-summary>strong{font-size:17px}
        .ig-numbers{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:13px}
        .ig-numbers div{text-align:left}.ig-numbers b{display:block;font-size:18px}.ig-numbers span{font-size:14px}
        .followed-by{display:flex;align-items:center;gap:10px;padding:7px 20px;font-size:13px;line-height:1.25}
        .mini-faces{display:flex;min-width:66px}.mini-faces span{width:28px;height:28px;border-radius:50%;overflow:hidden;position:relative;border:2px solid #fff;margin-right:-7px}
        .mini-faces img{object-fit:cover}
        .ig-buttons{grid-template-columns:1fr 1fr 48px}.ig-buttons button{background:#f0f2f5}
        .ig-highlight{height:98px;padding:8px 20px;display:flex;flex-direction:column;align-items:flex-start}
        .ig-highlight>span{width:62px;height:62px;border-radius:50%;border:3px solid #e3e6eb;position:relative;overflow:hidden}.ig-highlight img{object-fit:cover}.ig-highlight small{width:62px;text-align:center}
        .ig-tabs span{color:#5f6670}

        /* TikTok — supplied white profile */
        .native-tiktok{background:#fff!important;color:#090909!important}
        .tk-nav{height:62px;display:grid;grid-template-columns:36px 1fr 38px 38px;align-items:center;padding:0 20px}
        .tk-nav svg{width:28px}.tk-nav span{font-size:27px;text-align:center}
        .tk-identity{display:flex;justify-content:space-between;align-items:center;padding:3px 24px}
        .tk-identity h3{font-size:30px;line-height:1.05}.tk-identity>div>span{font-size:15px;color:#8a8a8a}
        .native-avatar.tk{width:102px;height:102px;border:0}
        .tk-stats{display:grid;grid-template-columns:repeat(3,1fr);width:66%;padding:8px 0 12px 24px}
        .tk-stats b{display:block;font-size:19px}.tk-stats span{display:block;font-size:14px;color:#888}
        .tk-buttons{grid-template-columns:1fr 1fr 48px}.tk-buttons button{background:#f1f1f2;color:#111}.tk-buttons button:first-child{background:#ef4057!important;color:#fff!important}
        .tk-bio{padding-top:9px;padding-bottom:12px}
        .tk-tabs{justify-content:center;gap:100px}.tk-tabs span{color:#777}.tk-tabs span.active{color:#111}

        /* X */
        .native-x{background:#000!important;color:#f2f2f2!important;border-color:#202020!important}
        .x-cover{height:155px;position:relative;background:linear-gradient(135deg,#252a35,#0b0d12);padding:0 16px}
        .x-cover:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 65% 30%,#3a4050 0,transparent 34%)}
        .x-top{height:56px;position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center}.x-top>svg{width:22px}.x-top div{display:flex;gap:16px;align-items:center}.x-top div svg{width:21px}.x-top span{font-size:22px}
        .x-cover>p{position:absolute;z-index:2;left:70px;bottom:9px;font-size:13px;line-height:1.15}
        .x-avatar-row{height:49px;display:flex;justify-content:space-between;padding:0 18px;position:relative}
        .native-avatar.x{width:88px;height:88px;border:3px solid #000;margin-top:-33px}.x-share{width:34px;height:34px;border:1px solid #343434;border-radius:50%;display:grid;place-items:center;margin-top:8px}
        .x-copy{padding:0 12px 8px}.x-copy h3{font-size:21px}.x-copy>span,.x-meta,.translated{color:#71767b;font-size:12px}.x-copy>p{font-size:13px;line-height:1.35;margin-top:5px}.translated b{color:#1d9bf0}.x-count b{color:#fff}
        .x-buttons{grid-template-columns:1fr 1fr;padding:8px 10px}.x-buttons button{border-radius:999px;background:#000;color:#fff;border:1px solid #343434}.x-buttons button:last-child{background:#fff;color:#000}
        .x-tabs2{border-color:#222}.x-tabs2 span{font-size:15px;color:#888}.x-tabs2 .active{color:#fff}
        .x-post{display:flex;gap:9px;padding:10px 12px 0;border-bottom:1px solid #222;font-size:12px}.x-post>div:last-child{flex:1}.x-post small,.x-post span{color:#71767b}.x-warning{height:180px;margin-top:10px;border-radius:10px 10px 0 0;background:linear-gradient(135deg,#4d4c51,#6c5b61);display:flex;flex-direction:column;justify-content:flex-end;padding:20px;color:#fff}

        /* Facebook */
        .native-facebook{background:#fff!important}
        .fb-cover{height:185px;position:relative;overflow:hidden}.fb-cover>img{object-fit:cover;filter:brightness(.82)}
        .fb-top{position:absolute;inset:0 0 auto;height:60px;padding:0 20px;display:flex;justify-content:space-between;align-items:center;color:#fff}.fb-top>svg{width:28px}.fb-top>div{display:flex;gap:15px;align-items:center}.fb-top svg{width:25px}.fb-top span{font-size:28px}
        .fb-sheet{position:relative;margin-top:-12px;background:#fff;border-radius:28px 28px 0 0;padding-top:0}
        .fb-head{display:flex;gap:16px;align-items:center;padding:0 20px 8px}.native-avatar.fb{width:96px;height:96px;border:4px solid #fff;margin-top:-35px}.fb-head h3{font-size:24px}.fb-head p{font-size:15px;line-height:1.5;margin-top:5px}
        .fb-line{font-size:15px;font-weight:700;padding:10px 20px 4px}.fb-mutual{padding-top:6px}
        .fb-buttons{grid-template-columns:1fr 1.25fr 48px}.fb-buttons button{background:#e8eaee}.fb-buttons button:nth-child(2){background:#2f6df6;color:#fff}
        .fb-pills{display:flex;gap:10px;padding:8px 20px 16px}.fb-pills span{padding:10px 14px;border-radius:22px;color:#666}.fb-pills .active{background:#e7f1ff;color:#2873d8}
        .fb-details2{padding:0 20px 20px}.fb-details2 h3{font-size:20px;margin:14px 0}.fb-details2 p{display:flex;gap:18px;font-size:22px;margin:15px 0}.fb-details2 p span{font-size:16px;line-height:1.45}.fb-details2 small{color:#666;font-size:14px}

        /* Desktop: keep a mobile-profile proportion, but larger and centered */
        @media(min-width:769px){
          .pl-modal{width:min(100%,560px)!important;padding:20px!important}
          .native-profile{max-width:500px;margin:0 auto}
        }

        /* Mobile: Step 3 uses almost the whole viewport width, no nested scroll area */
        @media(max-width:768px){
          .pl-overlay{background:#fff!important;padding:0!important}
          .pl-modal{padding:8px 8px calc(14px + env(safe-area-inset-bottom))!important;min-height:100dvh!important}
          .native-profile{border-radius:0!important;border-left:0!important;border-right:0!important}
          .pl-found .pl-continue{margin:10px 8px 0!important;width:calc(100% - 16px)!important}
          .pl-try{margin-top:9px!important}
          .pl-secure{margin-bottom:4px!important}
        }



        /* V179 — compact/fixed profile lookup flow, closer to supplied references */
        .pl-overlay{
          overflow:hidden!important;
          padding:18px!important;
          align-items:center!important;
          justify-items:center!important;
        }

        .pl-modal{
          width:min(92vw,440px)!important;
          max-width:440px!important;
          max-height:none!important;
          min-height:0!important;
          overflow:hidden!important;
          border-radius:20px!important;
          padding:20px!important;
        }

        /* STEP 1 */
        .pl-step-head{margin-bottom:14px!important}
        .pl-step-head img{width:30px!important;height:30px!important}
        .pl-step-head strong{font-size:13px!important}
        .pl-step-head small{font-size:9px!important}

        .pl-modal h2{
          font-size:22px!important;
          line-height:1.08!important;
        }

        .pl-sub{
          font-size:12px!important;
          margin:7px auto 14px!important;
          max-width:300px!important;
        }

        .pl-switch{
          margin-bottom:14px!important;
          padding:3px!important;
          border-radius:10px!important;
        }

        .pl-switch button{
          height:32px!important;
          font-size:11px!important;
        }

        .pl-label{
          font-size:11px!important;
          margin:10px 0 6px!important;
        }

        .pl-field{
          height:44px!important;
          border-radius:12px!important;
          padding:0 12px!important;
        }

        .pl-field input{
          font-size:12px!important;
        }

        .pl-help{
          font-size:9.5px!important;
          margin:6px 0 12px!important;
        }

        .pl-primary{
          min-height:44px!important;
          border-radius:11px!important;
          font-size:13px!important;
        }

        .pl-secure{
          font-size:9.5px!important;
          margin-top:12px!important;
        }

        /* STEP 2 */
        .pl-analysis{
          padding:18px 0 2px!important;
        }

        .pl-analyze-icon{
          width:72px!important;
          height:72px!important;
          margin-bottom:18px!important;
          box-shadow:0 0 0 7px color-mix(in srgb,var(--pl-accent) 5%,transparent)!important;
        }

        .pl-analyze-icon img{
          width:48px!important;
          height:48px!important;
        }

        .pl-progress-list{
          padding:12px!important;
          margin-top:14px!important;
          border-radius:14px!important;
        }

        .pl-progress-list>div{
          min-height:31px!important;
          font-size:11px!important;
          gap:9px!important;
        }

        .pl-progress-dot{
          width:17px!important;
          height:17px!important;
          flex-basis:17px!important;
        }

        .pl-secure-card{
          margin-top:14px!important;
          padding:8px 12px!important;
          font-size:9px!important;
        }

        /* STEP 3 base */
        .pl-found{
          width:100%!important;
          overflow:hidden!important;
        }

        .native-profile{
          width:100%!important;
          max-width:100%!important;
          border-radius:16px!important;
          overflow:hidden!important;
        }

        .native-nav{
          height:50px!important;
          padding:0 14px!important;
        }

        .native-nav>svg{
          width:21px!important;
          height:21px!important;
        }

        .native-nav>strong{
          font-size:18px!important;
          margin-left:10px!important;
        }

        .native-nav-actions{
          gap:13px!important;
          font-size:19px!important;
        }

        .native-nav-actions svg{
          width:19px!important;
          height:19px!important;
        }

        .native-avatar.ig{width:76px!important;height:76px!important}
        .native-avatar.tk{width:82px!important;height:82px!important}
        .native-avatar.x{width:76px!important;height:76px!important}
        .native-avatar.fb{width:82px!important;height:82px!important}

        .native-bio{
          padding:6px 14px!important;
          font-size:12px!important;
          line-height:1.35!important;
        }

        .native-buttons{
          padding:8px 14px!important;
          gap:7px!important;
        }

        .native-buttons button{
          height:36px!important;
          border-radius:9px!important;
          font-size:13px!important;
        }

        .native-tabs{
          height:44px!important;
        }

        .native-tabs span{
          height:44px!important;
          min-width:44px!important;
          font-size:20px!important;
        }

        .native-profile .pl-media-grid{
          grid-template-columns:repeat(3,1fr)!important;
          gap:2px!important;
          padding:0!important;
        }

        .native-profile .pl-media-tile{
          aspect-ratio:1/1!important;
        }

        /* Instagram alignment */
        .ig-main{
          gap:16px!important;
          padding:8px 14px 2px!important;
          align-items:center!important;
        }

        .ig-summary>strong{
          font-size:15px!important;
        }

        .ig-numbers{
          gap:10px!important;
          margin-top:9px!important;
        }

        .ig-numbers b{
          font-size:15px!important;
        }

        .ig-numbers span{
          font-size:11px!important;
        }

        .followed-by{
          gap:8px!important;
          padding:5px 14px!important;
          font-size:10.5px!important;
        }

        .mini-faces{
          min-width:56px!important;
        }

        .mini-faces span{
          width:24px!important;
          height:24px!important;
        }

        .ig-highlight{
          height:78px!important;
          padding:6px 14px!important;
        }

        .ig-highlight>span{
          width:50px!important;
          height:50px!important;
        }

        .ig-highlight small{
          width:50px!important;
          font-size:9px!important;
        }

        /* TikTok alignment */
        .tk-nav{
          height:52px!important;
          grid-template-columns:30px 1fr 30px 30px!important;
          padding:0 14px!important;
        }

        .tk-nav svg{
          width:22px!important;
          height:22px!important;
        }

        .tk-nav span{
          font-size:21px!important;
        }

        .tk-identity{
          padding:2px 16px!important;
        }

        .tk-identity h3{
          font-size:23px!important;
        }

        .tk-identity>div>span{
          font-size:12px!important;
        }

        .tk-stats{
          width:70%!important;
          padding:6px 0 9px 16px!important;
        }

        .tk-stats b{
          font-size:15px!important;
        }

        .tk-stats span{
          font-size:11px!important;
        }

        .tk-tabs{
          gap:72px!important;
        }

        /* X alignment */
        .x-cover{
          height:124px!important;
          padding:0 12px!important;
        }

        .x-top{
          height:48px!important;
        }

        .x-top>svg,
        .x-top div svg{
          width:19px!important;
          height:19px!important;
        }

        .x-top div{
          gap:12px!important;
        }

        .x-cover>p{
          left:54px!important;
          bottom:7px!important;
          font-size:10.5px!important;
        }

        .x-avatar-row{
          height:40px!important;
          padding:0 14px!important;
        }

        .native-avatar.x{
          margin-top:-27px!important;
        }

        .x-copy{
          padding:0 10px 6px!important;
        }

        .x-copy h3{
          font-size:18px!important;
        }

        .x-copy>span,
        .x-meta,
        .translated{
          font-size:10px!important;
        }

        .x-copy>p{
          font-size:10.5px!important;
          margin-top:4px!important;
        }

        .x-buttons{
          padding:6px 8px!important;
        }

        .x-tabs2 span{
          font-size:12px!important;
        }

        .x-post{
          gap:7px!important;
          padding:8px 10px 0!important;
          font-size:10px!important;
        }

        .x-warning{
          height:112px!important;
          padding:12px!important;
          font-size:11px!important;
        }

        /* Facebook alignment */
        .fb-cover{
          height:136px!important;
        }

        .fb-top{
          height:50px!important;
          padding:0 14px!important;
        }

        .fb-top>svg,
        .fb-top svg{
          width:21px!important;
          height:21px!important;
        }

        .fb-top span{
          font-size:22px!important;
        }

        .fb-sheet{
          border-radius:22px 22px 0 0!important;
        }

        .fb-head{
          gap:12px!important;
          padding:0 14px 5px!important;
        }

        .native-avatar.fb{
          margin-top:-29px!important;
        }

        .fb-head h3{
          font-size:20px!important;
        }

        .fb-head p{
          font-size:12px!important;
          margin-top:3px!important;
        }

        .fb-line{
          font-size:12px!important;
          padding:7px 14px 3px!important;
        }

        .fb-pills{
          gap:7px!important;
          padding:6px 14px 10px!important;
        }

        .fb-pills span{
          padding:7px 10px!important;
          font-size:11px!important;
        }

        .fb-details2{
          padding:0 14px 12px!important;
        }

        .fb-details2 h3{
          font-size:16px!important;
          margin:10px 0!important;
        }

        .fb-details2 p{
          gap:12px!important;
          font-size:17px!important;
          margin:10px 0!important;
        }

        .fb-details2 p span{
          font-size:12px!important;
        }

        .fb-details2 small{
          font-size:10px!important;
        }

        /* Step-3 controls */
        .pl-found .pl-continue{
          margin:10px 0 0!important;
          min-height:42px!important;
          font-size:12.5px!important;
        }

        .pl-try{
          margin-top:7px!important;
          font-size:10.5px!important;
        }

        .pl-found .pl-secure{
          margin-top:7px!important;
          font-size:9px!important;
        }

        /* Desktop: compact fixed popup */
        @media(min-width:769px){
          .pl-modal{
            width:430px!important;
            max-width:430px!important;
            padding:18px!important;
          }

          .native-profile{
            max-width:394px!important;
            margin:0 auto!important;
          }
        }

        /* Mobile: compact bottom sheet, no internal scrollbar */
        @media(max-width:768px){
          .pl-overlay{
            padding:0!important;
            align-items:end!important;
            overflow:hidden!important;
            background:rgba(9,15,30,.36)!important;
          }

          .pl-modal{
            width:100%!important;
            max-width:none!important;
            min-height:0!important;
            max-height:100dvh!important;
            overflow:hidden!important;
            border-radius:22px 22px 0 0!important;
            padding:14px 12px calc(12px + env(safe-area-inset-bottom))!important;
          }

          .native-profile{
            border-radius:14px!important;
          }
        }

\n        /* V180 — Instagram Step 3 corrected against supplied reference */\n        .ig-reference{font-family:Arial,Helvetica,sans-serif!important;background:#fff!important;color:#080808!important}\n        .ig-reference .ig-native-nav{height:54px!important;padding:0 16px!important;grid-template-columns:28px 1fr auto!important}\n        .ig-reference .ig-native-nav>svg{width:24px!important;height:24px!important;stroke-width:2.2!important}\n        .ig-reference .ig-native-nav>strong{font-size:20px!important;font-weight:700!important;letter-spacing:-.35px!important;margin-left:12px!important}\n        .ig-reference .native-nav-actions{gap:18px!important}\n        .ig-reference .native-nav-actions svg{width:22px!important;height:22px!important;stroke-width:2.15!important}\n        .ig-reference .ig-main{padding:8px 17px 4px!important;gap:18px!important;align-items:center!important}\n        .ig-reference .native-avatar.ig{width:86px!important;height:86px!important;border:3px solid #e4e7eb!important;padding:3px!important;background:#fff!important}\n        .ig-reference .ig-summary{min-width:0!important;flex:1!important}\n        .ig-reference .ig-summary>strong{display:block!important;font-size:16px!important;font-weight:600!important;line-height:1.18!important;margin-bottom:12px!important;white-space:nowrap!important}\n        .ig-reference .ig-numbers{margin:0!important;display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:15px!important}\n        .ig-reference .ig-numbers div{text-align:left!important}\n        .ig-reference .ig-numbers b{font-size:17px!important;line-height:1!important;font-weight:500!important}\n        .ig-reference .ig-numbers span{font-size:13px!important;line-height:1.1!important;margin-top:4px!important;display:block!important}\n        .ig-reference .ig-bio{padding:8px 18px 5px!important;font-size:14px!important;line-height:1.38!important}\n        .ig-reference .ig-bio p{letter-spacing:-.15px!important}\n        .ig-reference .ig-followed{padding:5px 18px 8px!important;gap:10px!important;font-size:12px!important;line-height:1.25!important;align-items:center!important}\n        .ig-reference .ig-followed p{flex:1!important}\n        .ig-reference .mini-faces{min-width:66px!important}\n        .ig-reference .mini-faces span{width:29px!important;height:29px!important;border-width:2px!important}\n        .ig-reference .ig-buttons{grid-template-columns:1fr 1fr 48px!important;padding:8px 16px!important;gap:8px!important}\n        .ig-reference .ig-buttons button{height:42px!important;border-radius:9px!important;background:#f1f2f4!important;color:#080808!important;font-size:15px!important;font-weight:600!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:3px!important}\n        .ig-reference .ig-buttons button svg{width:17px!important;height:17px!important;stroke-width:2.3!important}\n        .ig-reference .ig-buttons button:last-child svg{width:21px!important;height:21px!important}\n        .ig-reference .ig-highlight{height:112px!important;padding:10px 18px 8px!important}\n        .ig-reference .ig-highlight>span{width:66px!important;height:66px!important;border:3px solid #e3e6ea!important;padding:3px!important;background:#fff!important}\n        .ig-reference .ig-highlight small{width:66px!important;font-size:12px!important;margin-top:3px!important}\n        .ig-reference .ig-tabs{height:56px!important;border-bottom:1px solid #e4e6e9!important;justify-content:space-around!important}\n        .ig-reference .ig-tabs span{height:56px!important;min-width:62px!important;color:#687078!important}\n        .ig-reference .ig-tabs span svg{width:26px!important;height:26px!important;stroke-width:2!important}\n        .ig-reference .ig-tabs .active{color:#050505!important}\n        .ig-reference .ig-tabs .active:after{height:2px!important;background:#050505!important;left:0!important;right:0!important}\n        .ig-reference .pl-media-grid{gap:2px!important;padding:0!important}\n        .ig-reference .pl-media-tile{aspect-ratio:1/1!important;border-radius:0!important}\n        @media(min-width:769px){\n          .pl-modal{width:420px!important;max-width:420px!important;padding:14px!important}\n          .ig-reference{max-width:392px!important}\n        }\n        @media(max-width:768px){\n          .ig-reference .ig-native-nav>strong{font-size:19px!important}\n          .ig-reference .ig-summary>strong{font-size:15px!important}\n          .ig-reference .ig-bio{font-size:13px!important}\n          .ig-reference .ig-numbers b{font-size:16px!important}\n          .ig-reference .ig-numbers span{font-size:12px!important}\n        }\n


        /* V181 — Instagram Step 3 corrected against supplied reference */
        .native-instagram{
          background:#fff!important;
          color:#111!important;
          border:1px solid #e5e7eb!important;
          border-radius:14px!important;
          overflow:hidden!important;
        }

        .ig-ref-top{
          height:56px;
          display:grid;
          grid-template-columns:38px 1fr auto;
          align-items:center;
          padding:0 14px;
        }

        .ig-ref-top>strong{
          font-size:18px;
          font-weight:800;
          letter-spacing:-.2px;
          margin-left:7px;
        }

        .ig-ref-actions{
          display:flex;
          align-items:center;
          gap:8px;
        }

        .ig-ref-icon{
          width:32px;
          height:32px;
          border:0;
          background:transparent;
          display:grid;
          place-items:center;
          padding:0;
        }

        .ig-ref-icon svg{
          width:20px;
          height:20px;
          fill:none;
          stroke:#111;
          stroke-width:1.8;
          stroke-linecap:round;
          stroke-linejoin:round;
        }

        .ig-ref-profile-row{
          display:flex;
          align-items:center;
          gap:18px;
          padding:8px 16px 6px;
        }

        .ig-ref-avatar{
          width:82px!important;
          height:82px!important;
          border:3px solid #e6e9ee!important;
          padding:3px!important;
        }

        .ig-ref-profile-main{
          flex:1;
          min-width:0;
        }

        .ig-ref-fullname{
          display:block;
          font-size:15px;
          font-weight:700;
          line-height:1.15;
          margin-bottom:10px;
        }

        .ig-ref-stats{
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:10px;
        }

        .ig-ref-stats div{
          text-align:left;
        }

        .ig-ref-stats b{
          display:block;
          font-size:15px;
          font-weight:700;
          line-height:1.05;
        }

        .ig-ref-stats span{
          display:block;
          margin-top:3px;
          font-size:11px;
          color:#111;
        }

        .ig-ref-bio{
          padding:7px 18px 5px;
          font-size:12px;
          line-height:1.35;
        }

        .ig-ref-bio p{
          margin:0;
        }

        .ig-ref-bio span{
          color:#4059b2;
        }

        .ig-ref-followed{
          display:flex;
          align-items:center;
          gap:8px;
          padding:7px 18px 8px;
        }

        .ig-ref-faces{
          display:flex;
          flex:0 0 68px;
        }

        .ig-ref-faces span{
          position:relative;
          width:28px;
          height:28px;
          border-radius:50%;
          overflow:hidden;
          border:2px solid #fff;
          margin-right:-7px;
        }

        .ig-ref-faces img{
          object-fit:cover;
        }

        .ig-ref-followed p{
          margin:0;
          font-size:10px;
          line-height:1.25;
        }

        .ig-ref-buttons{
          display:grid;
          grid-template-columns:1fr 1fr 46px;
          gap:7px;
          padding:6px 16px 10px;
        }

        .ig-ref-buttons button{
          height:38px;
          border:0;
          border-radius:10px;
          background:#f0f2f5;
          color:#111;
          font-size:13px;
          font-weight:700;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:3px;
        }

        .ig-ref-buttons button svg{
          width:16px;
          height:16px;
          fill:none;
          stroke:#111;
          stroke-width:1.8;
          stroke-linecap:round;
          stroke-linejoin:round;
        }

        .ig-ref-highlight-wrap{
          padding:7px 16px 5px;
          min-height:88px;
        }

        .ig-ref-highlight{
          width:64px;
          text-align:center;
        }

        .ig-ref-highlight>span{
          width:58px;
          height:58px;
          position:relative;
          display:block;
          overflow:hidden;
          border-radius:50%;
          border:3px solid #e6e9ee;
          margin:0 auto 3px;
        }

        .ig-ref-highlight img{
          object-fit:cover;
        }

        .ig-ref-highlight small{
          font-size:9px;
        }

        .ig-ref-tabs{
          height:50px;
          display:grid;
          grid-template-columns:repeat(4,1fr);
          align-items:center;
          border-bottom:1px solid #e5e7eb;
        }

        .ig-ref-tabs button{
          height:50px;
          border:0;
          background:transparent;
          display:grid;
          place-items:center;
          position:relative;
        }

        .ig-ref-tabs button svg{
          width:21px;
          height:21px;
          fill:none;
          stroke:#6d7480;
          stroke-width:1.8;
          stroke-linecap:round;
          stroke-linejoin:round;
        }

        .ig-ref-tabs button.active svg{
          stroke:#111;
        }

        .ig-ref-tabs button.active:after{
          content:"";
          position:absolute;
          left:18px;
          right:18px;
          bottom:0;
          height:2px;
          background:#111;
        }

        .ig-ref-grid{
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:2px;
        }

        .ig-ref-post{
          position:relative;
          aspect-ratio:1/1.05;
          overflow:hidden;
          background:#eee;
        }

        .ig-ref-post img{
          object-fit:cover;
        }

        .ig-ref-carousel{
          position:absolute;
          top:6px;
          right:6px;
          width:18px;
          height:18px;
          display:grid;
          place-items:center;
        }

        .ig-ref-carousel svg{
          width:17px;
          height:17px;
          fill:none;
          stroke:#fff;
          stroke-width:2;
          filter:drop-shadow(0 1px 2px rgba(0,0,0,.4));
        }

        @media(min-width:769px){
          .pl-modal{
            width:420px!important;
            max-width:420px!important;
          }

          .native-instagram{
            max-width:384px!important;
            margin:0 auto!important;
          }
        }



        /* V182 — TikTok Step 3 matched to supplied white-profile reference */
        .tk-ref{background:#fff!important;color:#111!important;border:1px solid #e5e7eb!important;border-radius:14px!important;overflow:hidden!important;position:relative!important}
        .tk-ref button{font-family:Arial,Helvetica,sans-serif}
        .tk-ref-header{height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 16px}
        .tk-ref-header-left,.tk-ref-header-right{display:flex;align-items:center}.tk-ref-header-left{gap:16px}.tk-ref-header-right{gap:12px}
        .tk-ref-icon-btn{width:32px;height:32px;border:0;padding:0;background:transparent;display:grid;place-items:center;color:#111}
        .tk-ref-icon-btn svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
        .tk-ref-coin{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:15px;font-weight:900;background:#efbb3a;border:3px solid #ffe08b}
        .tk-ref-profile{display:flex;justify-content:space-between;gap:14px;padding:4px 18px 6px}
        .tk-ref-left{flex:1;min-width:0}.tk-ref-name{display:flex;align-items:center;gap:4px;margin-top:5px}
        .tk-ref-name h3{margin:0;font-size:24px;line-height:1.05;letter-spacing:-.8px;font-weight:900}
        .tk-ref-name svg{width:18px;height:18px;stroke-width:3}.tk-ref-handle{display:block;color:#8b8b8b;font-size:13px;margin-top:5px}
        .tk-ref-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;width:255px;margin-top:26px}
        .tk-ref-stats div{position:relative}.tk-ref-stats b{display:block;font-size:17px;line-height:1;font-weight:800}
        .tk-ref-stats span:not(.tk-ref-plus-one){display:block;margin-top:4px;color:#898989;font-size:12px;white-space:nowrap}
        .tk-ref-plus-one{position:absolute;top:-16px;left:3px;padding:1px 5px;border-radius:6px;background:#ffd9e1;color:#ee3e64;font-size:11px;font-weight:800}
        .tk-ref-avatar-wrap{width:108px;height:108px;position:relative;flex:0 0 108px}.tk-ref-avatar{width:108px!important;height:108px!important;border:0!important}
        .tk-ref-avatar-plus{position:absolute;right:-2px;bottom:4px;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#4dc5e8;color:#fff;font-size:28px;line-height:1;font-weight:400;border:3px solid #fff}
        .tk-ref-bio-pill{margin:8px 18px 10px;width:calc(100% - 36px);min-height:40px;border:0;border-radius:999px;background:#f0f0f1;display:flex;align-items:center;justify-content:flex-start;gap:7px;padding:0 14px;color:#8b8b8b;font-size:12px;overflow:hidden;white-space:nowrap}
        .tk-ref-bio-pill strong{color:#111;font-size:13px}
        .tk-ref-tools{display:flex;gap:10px;padding:0 18px 10px}.tk-ref-tools button{height:38px;border:1px solid #e3e3e4;border-radius:999px;background:#fff;color:#111;padding:0 14px;display:flex;align-items:center;gap:7px;font-size:13px;font-weight:800}
        .tk-ref-tools button svg{width:18px;height:18px;fill:none;stroke:#ef476f;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
        .tk-ref-tabs{height:52px;display:grid;grid-template-columns:repeat(5,1fr);align-items:center;border-bottom:1px solid #e9e9ea}
        .tk-ref-tabs button{height:52px;border:0;background:transparent;color:#8e8e8e;display:flex;align-items:center;justify-content:center;position:relative;gap:1px}
        .tk-ref-tabs button svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.tk-ref-tabs button.active{color:#111}
        .tk-ref-tabs button.active:after{content:"";position:absolute;left:22%;right:22%;bottom:0;height:2px;background:#111}.tk-ref-tab-chevron{width:12px!important;height:12px!important;stroke-width:2.5!important}
        .tk-ref-empty{min-height:330px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:70px;text-align:center}
        .tk-ref-empty-icon{width:70px;height:70px;display:grid;place-items:center;color:#aaa}.tk-ref-empty-icon svg{width:64px;height:64px;fill:none;stroke:#aaa;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
        .tk-ref-empty h4{margin:13px 0 18px;font-size:18px;line-height:1.15;font-weight:800}.tk-ref-empty button{min-width:92px;height:42px;border:0;border-radius:999px;background:#ef4057;color:#fff;font-size:16px;font-weight:700}
        .tk-ref-bottom-nav{height:64px;display:grid;grid-template-columns:repeat(4,1fr);align-items:center;border-top:1px solid #ececee;background:#fff;color:#858585}
        .tk-ref-bottom-nav>div{position:relative;height:64px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:10px}.tk-ref-bottom-nav svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
        .tk-ref-bottom-nav b{position:absolute;top:5px;right:16px;min-width:23px;height:18px;padding:0 5px;border-radius:999px;display:grid;place-items:center;background:#ef3f64;color:#fff;font-size:10px}
        .tk-ref-create span{width:48px;height:31px;border-radius:8px;display:grid;place-items:center;background:#111;color:#fff;font-size:28px;line-height:1;box-shadow:-5px 0 0 #25f4ee,5px 0 0 #fe2c55}
        @media(min-width:769px){.pl-modal:has(.tk-ref){width:420px!important;max-width:420px!important;padding:14px!important}.tk-ref{max-width:390px!important;margin:0 auto!important}.tk-ref-empty{min-height:230px!important;padding-top:40px!important}}
        @media(max-width:768px){.pl-modal:has(.tk-ref){padding:8px!important}.tk-ref{border-radius:12px!important}.tk-ref-bottom-nav{display:none!important}.tk-ref-empty{min-height:230px!important;padding-top:42px!important}}



        /* V183 — TikTok Step 3, minutely aligned to the supplied white reference */
        .tk-v183{
          background:#fff!important;
          color:#111!important;
          border:1px solid #e6e7e9!important;
          border-radius:14px!important;
          overflow:hidden!important;
          box-shadow:none!important;
        }

        .tk-v183 button{
          font-family:Arial,Helvetica,sans-serif;
        }

        .tk-v183-toolbar{
          height:72px;
          display:flex;
          justify-content:space-between;
          align-items:center;
          padding:0 24px;
        }

        .tk-v183-left-tools,
        .tk-v183-right-tools{
          display:flex;
          align-items:center;
        }

        .tk-v183-left-tools{gap:22px}
        .tk-v183-right-tools{gap:16px}

        .tk-v183-icon{
          width:34px;
          height:34px;
          padding:0;
          border:0;
          background:transparent;
          color:#0d0d0d;
          display:grid;
          place-items:center;
        }

        .tk-v183-icon svg{
          width:27px;
          height:27px;
          fill:none;
          stroke:currentColor;
          stroke-width:2.05;
          stroke-linecap:round;
          stroke-linejoin:round;
        }

        .tk-v183-pcoin{
          width:35px;
          height:35px;
          border-radius:50%;
          display:grid;
          place-items:center;
          background:#f3bd37;
          border:3px solid #ffd777;
          box-shadow:inset 0 0 0 1px rgba(255,255,255,.6);
        }

        .tk-v183-pcoin b{
          color:#fff;
          font-size:17px;
          font-weight:900;
        }

        .tk-v183-steps svg{
          width:29px!important;
          height:29px!important;
        }

        .tk-v183-identity{
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          padding:5px 28px 0;
          gap:20px;
        }

        .tk-v183-copy{
          flex:1;
          min-width:0;
        }

        .tk-v183-name-row{
          display:flex;
          align-items:center;
          gap:4px;
          margin-top:6px;
        }

        .tk-v183-name-row h3{
          margin:0;
          font-size:29px;
          line-height:1;
          letter-spacing:-1px;
          font-weight:900;
          white-space:nowrap;
        }

        .tk-v183-name-row svg{
          width:18px;
          height:18px;
          stroke-width:3.2;
          flex:0 0 auto;
        }

        .tk-v183-handle{
          display:block;
          margin-top:7px;
          color:#8d8d8d;
          font-size:14px;
          line-height:1;
        }

        .tk-v183-stats{
          width:273px;
          margin-top:33px;
          display:grid;
          grid-template-columns:repeat(3,1fr);
          column-gap:22px;
        }

        .tk-v183-stats div{
          position:relative;
        }

        .tk-v183-stats b{
          display:block;
          color:#111;
          font-size:20px;
          line-height:1;
          font-weight:800;
        }

        .tk-v183-stats span:not(.tk-v183-plus1){
          display:block;
          margin-top:5px;
          color:#8a8a8a;
          font-size:14px;
          line-height:1;
          white-space:nowrap;
        }

        .tk-v183-plus1{
          position:absolute;
          left:4px;
          top:-22px;
          padding:2px 7px;
          border-radius:7px;
          background:#ffdce4;
          color:#ec4667;
          font-size:12px;
          font-weight:800;
        }

        .tk-v183-avatar-wrap{
          width:116px;
          height:116px;
          flex:0 0 116px;
          position:relative;
        }

        .tk-v183-avatar{
          width:116px!important;
          height:116px!important;
          border:0!important;
          box-shadow:none!important;
        }

        .tk-v183-avatar-plus{
          position:absolute;
        }

        .tk-v183-plus{
          position:absolute;
          right:-1px;
          bottom:4px;
          width:39px;
          height:39px;
          border-radius:50%;
          border:4px solid #fff;
          background:#44c4e6;
          color:#fff;
          font-size:32px;
          line-height:31px;
          font-weight:400;
          text-align:center;
        }

        .tk-v183-bio{
          height:48px;
          width:calc(100% - 56px);
          margin:20px 28px 16px;
          padding:0 16px;
          border:0;
          border-radius:999px;
          background:#f1f1f2;
          color:#858585;
          display:flex;
          align-items:center;
          gap:8px;
          overflow:hidden;
          white-space:nowrap;
        }

        .tk-v183-bio strong{
          color:#111;
          font-size:16px;
          font-weight:800;
        }

        .tk-v183-dot{
          color:#8d8d8d;
          font-size:16px;
        }

        .tk-v183-smile{
          width:23px;
          height:23px;
          display:grid;
          place-items:center;
          color:#8d61df;
          flex:0 0 23px;
        }

        .tk-v183-smile svg{
          width:23px;
          height:23px;
          fill:none;
          stroke:currentColor;
          stroke-width:1.8;
          stroke-linecap:round;
        }

        .tk-v183-bio-placeholder{
          min-width:0;
          overflow:hidden;
          text-overflow:ellipsis;
          color:#929292;
          font-size:15px;
        }

        .tk-v183-pills{
          display:flex;
          align-items:center;
          gap:12px;
          padding:0 28px 20px;
        }

        .tk-v183-pills button{
          height:43px;
          padding:0 16px;
          border:1px solid #dedfe1;
          border-radius:999px;
          background:#fff;
          color:#111;
          display:flex;
          align-items:center;
          gap:8px;
          font-size:15px;
          font-weight:800;
        }

        .tk-v183-pills button svg{
          width:20px;
          height:20px;
          fill:none;
          stroke:#ef4b72;
          stroke-width:1.9;
          stroke-linecap:round;
          stroke-linejoin:round;
        }

        .tk-v183-studio-mark{
          width:22px;
          height:22px;
          display:grid;
          place-items:center;
        }

        .tk-v183-studio-mark svg{
          width:22px!important;
          height:22px!important;
          fill:none;
          stroke:#ef4b72;
        }

        .tk-v183-tabs{
          height:64px;
          display:grid;
          grid-template-columns:repeat(5,1fr);
          align-items:center;
          border-bottom:1px solid #e8e9ea;
        }

        .tk-v183-tabs button{
          height:64px;
          border:0;
          padding:0;
          background:transparent;
          color:#929292;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:2px;
          position:relative;
        }

        .tk-v183-tabs button svg{
          width:26px;
          height:26px;
          fill:none;
          stroke:currentColor;
          stroke-width:1.75;
          stroke-linecap:round;
          stroke-linejoin:round;
        }

        .tk-v183-tabs button.active{
          color:#111;
        }

        .tk-v183-tabs button.active:after{
          content:"";
          position:absolute;
          bottom:0;
          left:22%;
          right:22%;
          height:3px;
          background:#111;
          border-radius:3px 3px 0 0;
        }

        .tk-v183-tab-arrow{
          width:13px!important;
          height:13px!important;
          stroke-width:2.7!important;
        }

        .tk-v183-memory{
          min-height:405px;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:flex-start;
          padding-top:104px;
          text-align:center;
        }

        .tk-v183-memory-icon{
          width:76px;
          height:76px;
          color:#a9a9a9;
        }

        .tk-v183-memory-icon svg{
          width:76px;
          height:76px;
          fill:none;
          stroke:#a9a9a9;
          stroke-width:2.2;
          stroke-linecap:round;
          stroke-linejoin:round;
        }

        .tk-v183-memory h4{
          margin:17px 0 24px;
          color:#111;
          font-size:22px;
          line-height:1.18;
          font-weight:850;
        }

        .tk-v183-memory button{
          width:126px;
          height:54px;
          border:0;
          border-radius:999px;
          background:#ef3f58;
          color:#fff;
          font-size:19px;
          font-weight:700;
        }

        /* Compact popup dimensions while preserving the exact vertical composition. */
        @media(min-width:769px){
          .pl-modal:has(.tk-v183){
            width:440px!important;
            max-width:440px!important;
            padding:12px!important;
            overflow:hidden!important;
          }

          .tk-v183{
            max-width:414px!important;
            margin:0 auto!important;
          }

          .tk-v183-memory{
            min-height:260px!important;
            padding-top:58px!important;
          }
        }

        @media(max-width:768px){
          .pl-modal:has(.tk-v183){
            padding:8px!important;
            overflow:hidden!important;
          }

          .tk-v183{
            border-radius:12px!important;
          }

          .tk-v183-toolbar{padding-left:18px;padding-right:18px}
          .tk-v183-identity{padding-left:20px;padding-right:20px}
          .tk-v183-bio{width:calc(100% - 40px);margin-left:20px;margin-right:20px}
          .tk-v183-pills{padding-left:20px;padding-right:20px}
          .tk-v183-memory{min-height:245px!important;padding-top:52px!important}
        }


        /* V184 — Step 3 only: proportionally smaller on desktop.
           No internal layout, typography, icons or spacing changed. */
        @media(min-width:769px){
          .pl-modal:has(.pl-found){
            zoom:.90;
            overflow:hidden!important;
            max-height:none!important;
          }
        }



        /* V185 — TikTok Step 3 matched more closely to supplied reference */
        .native-tiktok{
          width:100%!important;
          max-width:100%!important;
          background:#fff!important;
          color:#0a0a0a!important;
          overflow:hidden!important;
        }

        .native-tiktok .tk-nav{
          height:50px!important;
          padding:0 16px!important;
          grid-template-columns:28px 1fr 28px 28px!important;
          column-gap:14px!important;
        }

        .native-tiktok .tk-nav svg{
          width:21px!important;
          height:21px!important;
          stroke-width:2.2!important;
        }

        .native-tiktok .tk-nav span{
          font-size:20px!important;
          line-height:1!important;
        }

        .native-tiktok .tk-identity{
          padding:4px 16px 2px!important;
          align-items:center!important;
          gap:10px!important;
        }

        .native-tiktok .tk-identity > div:first-child{
          min-width:0!important;
          flex:1!important;
        }

        .native-tiktok .tk-identity h3{
          margin:0!important;
          font-size:25px!important;
          line-height:1.02!important;
          letter-spacing:-1px!important;
          font-weight:900!important;
          white-space:nowrap!important;
          overflow:visible!important;
          text-overflow:clip!important;
        }

        .native-tiktok .tk-identity > div:first-child > span{
          display:block!important;
          margin-top:5px!important;
          font-size:12px!important;
          line-height:1.15!important;
          color:#8a8a8a!important;
          white-space:nowrap!important;
        }

        .native-tiktok .native-avatar.tk{
          width:88px!important;
          height:88px!important;
          min-width:88px!important;
          min-height:88px!important;
          flex:0 0 88px!important;
          border-radius:50%!important;
        }

        .native-tiktok .tk-stats{
          width:72%!important;
          grid-template-columns:repeat(3,minmax(0,1fr))!important;
          gap:10px!important;
          padding:8px 0 10px 16px!important;
        }

        .native-tiktok .tk-stats b{
          font-size:16px!important;
          line-height:1!important;
          font-weight:800!important;
          white-space:nowrap!important;
        }

        .native-tiktok .tk-stats span{
          margin-top:4px!important;
          font-size:11px!important;
          line-height:1.05!important;
          color:#8b8b8b!important;
          white-space:nowrap!important;
        }

        .native-tiktok .tk-buttons{
          grid-template-columns:1.15fr 1.15fr 44px!important;
          gap:8px!important;
          padding:8px 16px 10px!important;
        }

        .native-tiktok .tk-buttons button{
          height:38px!important;
          border-radius:999px!important;
          font-size:13px!important;
          font-weight:800!important;
          white-space:nowrap!important;
          padding:0 10px!important;
        }

        .native-tiktok .tk-buttons button:first-child{
          background:#ef4057!important;
          color:#fff!important;
        }

        .native-tiktok .tk-buttons button:nth-child(2),
        .native-tiktok .tk-buttons button:nth-child(3){
          background:#f1f1f2!important;
          color:#101010!important;
        }

        .native-tiktok .tk-bio{
          padding:8px 16px 12px!important;
        }

        .native-tiktok .tk-bio p{
          margin:0!important;
          font-size:12px!important;
          line-height:1.3!important;
          white-space:normal!important;
        }

        .native-tiktok .tk-tabs{
          height:46px!important;
          gap:0!important;
          display:grid!important;
          grid-template-columns:repeat(5,1fr)!important;
          border-bottom:1px solid #ececec!important;
          padding:0 10px!important;
        }

        .native-tiktok .tk-tabs span{
          min-width:0!important;
          width:100%!important;
          height:46px!important;
          font-size:19px!important;
          color:#929292!important;
        }

        .native-tiktok .tk-tabs span.active{
          color:#111!important;
        }

        .native-tiktok .tk-tabs span.active:after{
          left:16%!important;
          right:16%!important;
          height:2px!important;
          background:#111!important;
        }

        .native-tiktok .pl-media-grid{
          grid-template-columns:repeat(3,1fr)!important;
          gap:1px!important;
          padding:0!important;
        }

        .native-tiktok .pl-media-tile{
          aspect-ratio:.78!important;
          border-radius:0!important;
        }

        .native-tiktok .pl-views{
          left:5px!important;
          bottom:5px!important;
          font-size:9px!important;
          font-weight:800!important;
        }

        /* Keep all text fully visible; no clipping/cropping on the TikTok profile. */
        .native-tiktok,
        .native-tiktok *{
          text-overflow:clip!important;
        }

        .native-tiktok h3,
        .native-tiktok p,
        .native-tiktok span,
        .native-tiktok b{
          max-width:none!important;
        }

        /* Desktop: smaller popup while keeping the internal profile proportional. */
        @media(min-width:769px){
          .pl-modal{
            width:390px!important;
            max-width:390px!important;
            padding:14px!important;
          }

          .native-tiktok{
            max-width:362px!important;
            margin:0 auto!important;
          }

          .native-tiktok .tk-identity h3{
            font-size:23px!important;
          }

          .native-tiktok .native-avatar.tk{
            width:82px!important;
            height:82px!important;
            min-width:82px!important;
            min-height:82px!important;
            flex-basis:82px!important;
          }
        }

        /* Mobile: use available width without enlarging typography disproportionately. */
        @media(max-width:768px){
          .pl-modal{
            width:100%!important;
            max-width:none!important;
            padding:8px!important;
          }

          .native-tiktok{
            width:100%!important;
          }

          .native-tiktok .tk-identity h3{
            font-size:23px!important;
          }

          .native-tiktok .native-avatar.tk{
            width:84px!important;
            height:84px!important;
            min-width:84px!important;
            min-height:84px!important;
            flex-basis:84px!important;
          }
        }



        /* V186 — exact user supplied TikTok Step 3 PX values */
        @media (min-width:769px){
          .native-tiktok{
            max-width:461px!important;
            margin:0 auto!important;
          }
        }

        .tk-v183-name-row h3{
          letter-spacing:-1px!important;
          white-space:nowrap!important;
          margin:0!important;
          font-size:21px!important;
          font-weight:900!important;
          line-height:1!important;
        }

        .tk-v183-bio{
          color:#858585!important;
          white-space:nowrap!important;
          background:#f1f1f2!important;
          border:0!important;
          border-radius:999px!important;
          align-items:center!important;
          gap:4px!important;
          width:calc(100% - 56px)!important;
          height:40px!important;
          margin:20px 18px 16px!important;
          padding:0 16px!important;
          display:flex!important;
          overflow:hidden!important;
        }

        .tk-v183-bio strong{
          color:#111!important;
          font-size:15px!important;
          font-weight:600!important;
        }

        .tk-v183-stats b{
          color:#111!important;
          font-size:18px!important;
          font-weight:600!important;
          line-height:1!important;
          display:block!important;
        }

        .tk-v183-plus1{
          color:#ec4667!important;
          background:#ffdce4!important;
          border-radius:8px!important;
          padding:3px 7px!important;
          font-size:12px!important;
          font-weight:600!important;
          position:absolute!important;
          top:-25px!important;
          left:12px!important;
        }

        .tk-v183-handle{
          color:#8d8d8d!important;
          margin-top:7px!important;
          font-size:16px!important;
          line-height:1!important;
          display:block!important;
        }

        .tk-v183-stats{
          grid-template-columns:repeat(3,1fr)!important;
          column-gap:2px!important;
          width:273px!important;
          margin-top:36px!important;
        }

        .tk-v183-pills button{
          color:#111!important;
          background:#fff!important;
          border:1px solid #dedfe1!important;
          border-radius:999px!important;
          align-items:center!important;
          gap:8px!important;
          height:43px!important;
          padding:0 16px!important;
          font-size:15px!important;
          font-weight:600!important;
        }

        .tk-v183-studio-mark svg{
          fill:none!important;
          stroke:#ef4b72!important;
          width:25px!important;
          height:25px!important;
        }

        .tk-v183-tabs button svg{
          fill:none!important;
          stroke:currentColor!important;
          stroke-width:1.75px!important;
          stroke-linecap:round!important;
          stroke-linejoin:round!important;
          width:28px!important;
          height:28px!important;
        }

        .tk-v183-memory h4{
          color:#111!important;
          margin:17px 0 24px!important;
          font-size:22px!important;
          font-weight:600!important;
          line-height:1.18!important;
        }

        .tk-v183-memory button{
          color:#fff!important;
          background:#ef3f58!important;
          border:0!important;
          border-radius:999px!important;
          width:126px!important;
          height:54px!important;
          font-size:17px!important;
          font-weight:600!important;
        }

        .tk-v183-pcoin{
          background:#f3bd37!important;
          border:3px solid #ffd777!important;
          border-radius:50%!important;
          place-items:center!important;
          width:28px!important;
          height:28px!important;
        }



        /* V188 — exact footer/button values supplied by user */
        .pl-try{
          color:#1376ff!important;
          cursor:pointer!important;
          background:0 0!important;
          border:0!important;
          margin:7px auto 0!important;
          font-size:14px!important;
          font-weight:700!important;
          display:block!important;
        }

        .pl-found .pl-secure{
          margin-top:7px!important;
          font-size:12px!important;
        }

        .pl-secure svg{
          width:14px!important;
          height:14px!important;
        }

        .pl-found .pl-continue{
          min-height:42px!important;
          margin:10px 0 0!important;
          font-size:15px!important;
        }

        .pl-primary{
          font-weight:800!important;
        }

`}</style>
    </div>
  );
}
