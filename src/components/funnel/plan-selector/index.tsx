"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft, ArrowRight, BadgeCheck, Check, Star, TimerReset, TrendingUp, Zap, ChevronRight, UserRound, Plus, Minus, CircleHelp, ShieldCheck, RefreshCw, LockKeyhole, CircleDollarSign, UsersRound, Tag, Flame, Gem, Sparkles,
} from "lucide-react";
import { useFunnelStore } from "@/stores/funnel.store";
import instagramIcon from "@/assets/home-icons-vector/instagram.svg";
import tiktokIcon from "@/assets/home-icons-vector/tiktok.svg";
import twitterIcon from "@/assets/home-icons-vector/twitter.svg";
import youtubeIcon from "@/assets/home-icons-vector/youtube.svg";
import avatar1 from "@/assets/plans-v124/avatar-1.png";
import avatar2 from "@/assets/plans-v124/avatar-2.png";
import avatar3 from "@/assets/plans-v124/avatar-3.png";
import avatar4 from "@/assets/plans-v124/avatar-4.png";
import avatar5 from "@/assets/plans-v124/avatar-5.png";
import rocket25dPremium from "@/assets/plans-v124/rocket-25d-premium.png";

const reviews = [
  { name:"Sarah J.", handle:"@sarah.journey", avatar:avatar1, text:"CloutFlow took my Instagram to the next level. Gained 25K+ real followers in just 2 weeks!", tag:"Instagram" },
  { name:"Alex M.", handle:"@alexmoneymaker", avatar:avatar2, text:"The best SMM panel I've used. Fast delivery, great support, and amazing results!", tag:"YouTube" },
  { name:"Diana R.", handle:"@diana.reels", avatar:avatar3, text:"My TikTok exploded! 1M+ views on my videos and real engagement. Highly recommended!", tag:"TikTok" },
  { name:"Mark T.", handle:"@marketalks", avatar:avatar4, text:"Finally, a service that delivers what it promises. My X account grew 10x faster!", tag:"X (Twitter)" },
  { name:"Emma L.", handle:"@emma.lifestyle", avatar:avatar5, text:"Excellent quality followers and super reliable. CloutFlow is now my go-to!", tag:"Instagram" },
];



const faqs = [
  {
    question: "Will my followers really be delivered?",
    answer: "Yes. Once your order is confirmed, delivery starts automatically to the public profile you selected. You can follow the progress without sharing your password."
  },
  {
    question: "Are the followers real or just bots?",
    answer: "CloutFlow is designed around quality social growth and reliable delivery. Package quality can vary by service, so the exact offer details shown before checkout are the source of truth for your order."
  },
  {
    question: "Is my Instagram account safe?",
    answer: "We never ask for your Instagram password. Your order is connected only to the public username or content link you confirm in the Growth Package Builder."
  },
  {
    question: "What if my follower count drops after delivery?",
    answer: "Eligible packages include refill protection. When refill is included, the package card shows it clearly before you purchase."
  },
  {
    question: "Do I need to share my password?",
    answer: "No. Your password is never required. We only use the public profile, post, video, or channel information that you choose for the order."
  },
  {
    question: "Is this a subscription or a one-time payment?",
    answer: "The packages shown on this page are one-time purchases unless a product is explicitly labeled otherwise. You will always see the price and package details before checkout."
  },
];

const faqIcons = [
  UsersRound,
  BadgeCheck,
  ShieldCheck,
  RefreshCw,
  LockKeyhole,
  CircleDollarSign,
];


const offerStep2PlanNames = ["Starter", "Boost", "Growth", "Pro", "Elite", "Max"] as const;
const offerStep2IconKeys = ["starter", "growth", "pro", "authority", "influencer", "scale"] as const;

function serviceLabel(service:string){
  if(service==="subscribers") return "Subscribers";
  if(service==="followers") return "Followers";
  if(service==="likes") return "Likes";
  if(service==="views") return "Views";
  if(service==="comments") return "Comments";
  return "Growth";
}

export function PlanSelector({ plans, username, platform, service, hasTarget, onSelectPlan }:{plans:any[];username:string;platform:string;service:string;hasTarget:boolean;onSelectPlan?:(planId:string)=>void|Promise<void>}){
  const trackRef=useRef<HTMLDivElement>(null);
  const { setPlan }=useFunnelStore();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const metric=useMemo(()=>serviceLabel(service),[service]);
  const slots=useMemo(()=>offerStep2PlanNames.map((title,index)=>{
    const live=plans[index];
    const quantity = Number(live?.quantity || 0);
    const bonusQuantity = Number(live?.bonusQuantity || 0);
    const currentPrice = live?.priceCents ? Number(live.priceCents) / 100 : 0;
    const comparePrice = live?.oldPriceCents ? Number(live.oldPriceCents) / 100 : (currentPrice > 0 ? Number((currentPrice * 1.35).toFixed(2)) : 0);
    const discountPercent = comparePrice > currentPrice ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100) : 25;

    return {
      id: live?.id || null,
      title: live?.name || title,
      iconKey: offerStep2IconKeys[index],
      quantity,
      bonusQuantity,
      currentPrice,
      comparePrice,
      discountPercent,
      isBestValue: index === 3 || index === 5,
    };
  }),[plans]);
  const select=(id:string|null)=>{ if(!id) return; setPlan(id); void onSelectPlan?.(id); };

  return <>
    <section className="cf-plans-pricing cf-home-offer-pricing">
        <div className="cf-plans-section-title cf-pricing-title">
          <h2>Choose Your <span className="cf-growth-plan-accent">Growth Plan</span> <span aria-hidden="true">♥</span></h2>
          <p>Pick a plan for your goals and start growing today.</p>
        </div>

        <div
          className={`cf-o10-master cf-home-offer-card-host cf-o10-platform-${platform}`}
          data-stage="package"
          data-platform={platform}
        >
          <div className="cf-o10-package-ref-grid">
            {slots.map((p:any,index:number)=>{
              const serviceUnit = metric;
              const planIconKey = p.iconKey;
              return (
                <article
                  key={p.title}
                  className={`cf-o10-package-ref-card ${p.isBestValue ? "is-best-value" : ""}`}
                  onClick={()=>select(p.id)}
                >
                  {index === 3 && (
                    <span className="cf-o10-package-ref-best cf-o10-package-ref-best--popular">
                      <Star /> MOST POPULAR
                    </span>
                  )}
                  {index === 5 && (
                    <span className="cf-o10-package-ref-best cf-o10-package-ref-best--deal">
BEST DEAL
                    </span>
                  )}

                  <div className="cf-o10-package-ref-topline">
                    <div className="cf-o10-package-ref-plan">
                      <div className="cf-o10-package-ref-plan-name">
                        <span className={`cf-plan-premium-icon cf-plan-premium-icon--${planIconKey}`} aria-hidden="true">
                          <img
                            src={
                              planIconKey === "growth"
                                ? "/offer/package-plan-icons/growth-exact.png"
                                : planIconKey === "influencer"
                                  ? "/offer/package-plan-icons/influencer-exact.png"
                                  : `/offer/package-plan-icons/${planIconKey}.png`
                            }
                            alt=""
                            draggable={false}
                          />
                        </span>
                        <strong>{p.title}</strong>
                      </div>
                    </div>
                    <b className={`cf-o10-discount-badge cf-o10-discount-badge--${planIconKey}`}>
                      {index === 0 && <Tag />}
                      {index === 1 && <Flame />}
                      {index === 2 && <ShieldCheck />}
                      {index === 3 && <Zap />}
                      {index === 4 && <Gem />}
                      {index === 5 && <Star />}
                      <span>{p.discountPercent}% OFF</span>
                    </b>
                  </div>

                  <h3 className="cf-o10-package-ref-qty">
                    {p.quantity.toLocaleString("en-US")} {serviceUnit}
                  </h3>

                  <div className="cf-o10-package-ref-bonus-slot">
                    <div className="cf-o10-package-ref-bonus">
                      <Sparkles /> 5% Promo
                    </div>
                  </div>

                  <div className="cf-o10-package-ref-price">
                    <strong>${p.currentPrice.toFixed(2)}</strong>
                    <del>${p.comparePrice.toFixed(2)}</del>
                  </div>

                  <p className={`cf-o10-package-ref-coupon ${index === 0 ? "cf-o10-package-ref-coupon--starter" : ""}`}>
                    With coupon FLOW25
                  </p>

                  <div className="cf-o10-package-ref-divider" />

                  <ul className="cf-o10-package-ref-benefits">
                    <li><span><Check /></span>No password required</li>
                    <li><span><Check /></span>Fast delivery start</li>
                    <li><span><Check /></span>24/7 priority support</li>
                  </ul>

                  <div className="cf-o10-package-assurance">
                    <div><ShieldCheck /><span>100% real followers</span></div>
                    <div><RefreshCw /><span>Refill guaranteed</span></div>
                  </div>

                  <button
                    className="cf-o10-package-ref-cta"
                    type="button"
                    onClick={(e)=>{
                      e.stopPropagation();
                      select(p.id);
                    }}
                  >
                    <span className="cf-o10-cta-default">
                      Get {p.quantity.toLocaleString("en-US")} {serviceUnit} <ArrowRight />
                    </span>
                    <span className="cf-o10-cta-hover">
                      Selected <Check />
                    </span>
                  </button>
                </article>
              );
            })}
          </div>
        </div>
    </section>


    <section id="reviews" className="cf-plans-reviews">
      <div className="cf-plans-section-title"><h2>Real People. <span className="cf-review-growth-gradient">Real Growth.</span> <span>♥</span></h2><p>See why creators trust CloutFlow to grow.</p></div>
      <button className="cf-plans-carousel-arrow left" type="button" aria-label="Previous reviews" aria-disabled="true"><ArrowLeft/></button>
      <div ref={trackRef} className="cf-plans-review-track">
        {reviews.map((r,i)=><article className="cf-plans-review-card" key={r.name}>
          <div className="cf-plans-review-head"><span className="cf-plans-review-avatar"><Image src={r.avatar} alt=""/></span><div><b>{r.name}</b><small>{r.handle}</small></div><BadgeCheck/></div>
          <div className="cf-plans-stars"><Star/><Star/><Star/><Star/><Star/></div>
          <p>{r.text}</p><span className={`cf-plans-review-tag tag-${i}`}>{r.tag}</span>
        </article>)}
      </div>
      <button className="cf-plans-carousel-arrow right" type="button" aria-label="Next reviews" aria-disabled="true"><ArrowRight/></button>
      <div className="cf-plans-review-summary">
        <div className="cf-trust-pill">
          <span className="cf-trust-excellent">Excellent</span>
          <span className="cf-trust-stars" aria-label="5 out of 5 stars">
            <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
          </span>
          <span className="cf-trust-score">4.9/5</span>
          <span className="cf-trust-divider" aria-hidden="true"/>
          <span className="cf-trust-reviews">2,500+ reviews</span>
          <span className="cf-trust-divider" aria-hidden="true"/>
          <span className="cf-trustpilot"><span aria-hidden="true">★</span> Trustpilot</span>
        </div>
      </div>
    </section>


    <section className="cf-home-faq cf-home-faq-compact" id="faq" aria-labelledby="cf-home-faq-title">
      <div className="cf-home-faq-head">
        <span className="cf-home-faq-eyebrow"><CircleHelp/> COMMON QUESTIONS</span>
        <h2 id="cf-home-faq-title">Questions? <em>We’ve got answers.</em></h2>
        <p>Everything you need to know before growing your profile.</p>
      </div>

      <div className="cf-home-faq-list">
        {faqs.map((item, index) => {
          const isOpen = openFaq === index;
          return (
            <article className={`cf-home-faq-item ${isOpen ? "is-open" : ""}`} key={item.question}>
              <button
                className="cf-home-faq-question"
                type="button"
                aria-expanded={isOpen}
                aria-controls={`cf-home-faq-answer-${index}`}
                onClick={() => setOpenFaq(isOpen ? null : index)}
              >
                <span className="cf-home-faq-icon" aria-hidden="true">
              {(() => {
                const Icon = faqIcons[index] ?? CircleHelp;
                return <Icon />;
              })()}
            </span>
                <span className="cf-home-faq-question-copy">{item.question}</span>
                <span className="cf-home-faq-toggle" aria-hidden="true">{isOpen ? <Minus/> : <Plus/>}</span>
              </button>
              <div
                id={`cf-home-faq-answer-${index}`}
                className="cf-home-faq-answer"
                aria-hidden={!isOpen}
              >
                <div><p>{item.answer}</p></div>
              </div>
            </article>
          );
        })}
      </div>
    </section>

    <section className="cf-plans-final-cta" id="contact">
      <div className="cf-plans-rocket-art" aria-hidden="true"><Image className="cf-plans-rocket-premium" src={rocket25dPremium} alt="" priority/></div>
      <div className="cf-plans-final-copy"><h2>Ready to Take Your <span>Growth Further?</span></h2><p><span className="cf-final-copy-desktop">Grow your reach and stand out with CloutFlow.</span><span className="cf-final-copy-mobile">Grow your reach with CloutFlow.</span></p></div>
      <div className="cf-plans-final-action"><button type="button" onClick={()=>document.getElementById("growth-package-builder")?.scrollIntoView({behavior:"smooth",block:"start"})}>Get Started Now <ArrowRight/></button><small><span className="cf-customer-faces"><Image src={avatar1} alt=""/><Image src={avatar2} alt=""/><Image src={avatar3} alt=""/></span><span className="cf-happy-customer-text"><span className="cf-social-proof-count">2.700k+</span><span className="cf-social-proof-label"> Happy Customers</span><span className="cf-social-proof-verified" aria-label="Verified customers"><BadgeCheck aria-hidden="true"/></span></span></small></div>
    </section>
    <section className="cf-plans-value-row"><div><TrendingUp/><span><b>Real Growth</b><small>Build an audience that engages.</small></span></div><div><Zap/><span><b>Boost Visibility</b><small>Get more reach, views and opportunities.</small></span></div><div><TimerReset/><span><b>Save Time</b><small>Focus on content, we handle growth.</small></span></div><div><ChevronRight/><span><b>Scale Faster</b><small>Grow your brand with less effort.</small></span></div></section>
  </>;
}
