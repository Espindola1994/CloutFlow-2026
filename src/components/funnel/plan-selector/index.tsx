"use client";

import { useMemo, useRef } from "react";
import Image from "next/image";
import {
  ArrowLeft, ArrowRight, BadgeCheck, Check,
  Star, TimerReset, TrendingUp, Zap, ChevronRight, UserRound,
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
import starterPlanIcon from "@/assets/plan-icons-reference-v207/starter.png";
import growthPlanIcon from "@/assets/plan-icons-reference-v207/growth.png";
import proPlanIcon from "@/assets/plan-icons-reference-v207/pro.png";
import authorityPlanIcon from "@/assets/plan-icons-reference-v207/authority.png";
import influencerPlanIcon from "@/assets/plan-icons-reference-v207/influencer.png";
import scalePlanIcon from "@/assets/plan-icons-reference-v207/scale.png";
import dominancePlanIcon from "@/assets/plan-icons-reference-v207/dominance.png";
import ultimatePlanIcon from "@/assets/plan-icons-reference-v207/ultimate.png";

const reviews = [
  { name:"Sarah J.", handle:"@sarah.journey", avatar:avatar1, text:"CloutFlow took my Instagram to the next level. Gained 25K+ real followers in just 2 weeks!", tag:"Instagram" },
  { name:"Alex M.", handle:"@alexmoneymaker", avatar:avatar2, text:"The best SMM panel I've used. Fast delivery, great support, and amazing results!", tag:"YouTube" },
  { name:"Diana R.", handle:"@diana.reels", avatar:avatar3, text:"My TikTok exploded! 1M+ views on my videos and real engagement. Highly recommended!", tag:"TikTok" },
  { name:"Mark T.", handle:"@marketalks", avatar:avatar4, text:"Finally, a service that delivers what it promises. My X account grew 10x faster!", tag:"X (Twitter)" },
  { name:"Emma L.", handle:"@emma.lifestyle", avatar:avatar5, text:"Excellent quality followers and super reliable. CloutFlow is now my go-to!", tag:"Instagram" },
];


const packageQuantities: Record<string, number[]> = {
  followers: [2000, 6000, 10000, 20000, 40000, 100000, 200000, 400000],
  likes: [1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000],
  views: [5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000],
  comments: [100, 250, 500, 1000, 2500, 5000, 10000, 25000],
};

const fallbackPlans = [
  {title:"Starter", kicker:"Kickstart your growth", regularPrice:"US$ 24,90", discount:"-40%", price:"US$ 14,90", audience:"Perfect for beginners", qty:"2,000 Followers", feat2:"Verified profile delivery", feat3:"Public target only", delivery:"Standard Delivery", support:"24/7 Support", tint:"violet"},
  {title:"Growth", kicker:"Accelerate your results", regularPrice:"US$ 49,90", discount:"-40%", price:"US$ 29,90", audience:"Best for growing creators", qty:"6,000 Followers", feat2:"Verified profile delivery", feat3:"Public target only", delivery:"Priority Delivery", support:"24/7 Support", tint:"coral"},
  {title:"Pro", kicker:"Fastest & Most Popular", regularPrice:"US$ 69,90", discount:"-43%", price:"US$ 39,90", audience:"For serious growth", qty:"20,000 Followers", feat2:"Verified profile delivery", feat3:"Public target only", delivery:"Ultra Fast Delivery", support:"24/7 VIP Support", tint:"purple"},
  {title:"Authority", kicker:"Build your authority", regularPrice:"US$ 119,90", discount:"-42%", price:"US$ 69,90", audience:"For established creators", qty:"20,000 Followers", feat2:"Verified profile delivery", feat3:"Public target only", delivery:"Priority Delivery", support:"24/7 VIP Support", tint:"blue"},
  {title:"Influencer", kicker:"Boost your influence", regularPrice:"US$ 199,90", discount:"-40%", price:"US$ 119,90", audience:"For influencers & brands", qty:"40,000 Followers", feat2:"Verified profile delivery", feat3:"Public target only", delivery:"Instant Delivery", support:"24/7 VIP Support", tint:"orange", badge:"MOST POPULAR", featured:true},
  {title:"Scale", kicker:"Scale your audience", regularPrice:"US$ 329,90", discount:"-39%", price:"US$ 199,90", audience:"For growing businesses", qty:"200,000 Followers", feat2:"Verified profile delivery", feat3:"Public target only", delivery:"Priority Instant Delivery", support:"Dedicated VIP Support", tint:"mint"},
  {title:"Dominance", kicker:"Dominate your niche", regularPrice:"US$ 499,90", discount:"-40%", price:"US$ 299,90", audience:"For top creators & agencies", qty:"200,000 Followers", feat2:"Verified profile delivery", feat3:"Public target only", delivery:"Highest Priority Delivery", support:"Priority Concierge Support", tint:"purple2", badge:"BEST DEAL", featured:true},
  {title:"Ultimate", kicker:"The ultimate growth", regularPrice:"US$ 799,90", discount:"-38%", price:"US$ 499,90", audience:"For maximum results", qty:"400,000 Followers", feat2:"Verified profile delivery", feat3:"Public target only", delivery:"Highest Priority Delivery", support:"Priority Concierge Support", tint:"gold"},
];

const planIconMap: Record<string, any> = {
  Starter: starterPlanIcon,
  Growth: growthPlanIcon,
  Pro: proPlanIcon,
  Authority: authorityPlanIcon,
  Influencer: influencerPlanIcon,
  Scale: scalePlanIcon,
  Dominance: dominancePlanIcon,
  Ultimate: ultimatePlanIcon,
};

function PlanIcon({title}:{title:string}){
  return <Image className={`cf-plan-icon-art cf-plan-icon-art-${title.toLowerCase()}`} src={planIconMap[title] || starterPlanIcon} alt="" priority={title === "Pro"}/>;
}

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
  const metric=useMemo(()=>serviceLabel(service),[service]);
  const ctaMetric=useMemo(()=>service === "followers" ? "Followers" : service === "likes" ? "Likes" : service === "views" ? "Views" : service === "comments" ? "Comments" : "Growth",[service]);
  const slots=useMemo(()=>fallbackPlans.map((fallback,index)=>{
    const live=plans[index];
    const fallbackQty = packageQuantities[service]?.[index] ?? packageQuantities.followers[index];
    const serviceSpecific = {
      ...fallback,
      qty: index === 7 && service === "followers" ? `400,000 ${metric}` : `${fallbackQty.toLocaleString()} ${metric}`,
      feat2: "100% real followers",
      feat3: "Instant delivery",
      delivery: "Refill guaranteed",
      support: "No password required",
    };
    if(!live) return {...serviceSpecific, id:null};
    return {
      ...serviceSpecific,
      id:live.id,
      price: fallback.price,
      qty:index === 7 && service === "followers" ? `400,000 ${metric}` : `${Number(live.quantity||fallbackQty).toLocaleString()} ${metric}`,
      delivery: "Refill guaranteed",
      support: "No password required",
      featured:Boolean(fallback.featured),
      badge:fallback.badge,
    };
  }),[plans,metric,service]);
  const select=(id:string|null)=>{ if(!id) return; setPlan(id); void onSelectPlan?.(id); };

  return <>
    <section id="reviews" className="cf-plans-reviews">
      <div className="cf-plans-section-title"><h2>Loved by Creators, Chosen by Brand Builders <span>♥</span></h2></div>
      <button className="cf-plans-carousel-arrow left" type="button" aria-label="Previous reviews" aria-disabled="true"><ArrowLeft/></button>
      <div ref={trackRef} className="cf-plans-review-track">
        {reviews.map((r,i)=><article className="cf-plans-review-card" key={r.name}>
          <div className="cf-plans-review-head"><span className="cf-plans-review-avatar"><Image src={r.avatar} alt=""/></span><div><b>{r.name}</b><small>{r.handle}</small></div><BadgeCheck/></div>
          <div className="cf-plans-stars"><Star/><Star/><Star/><Star/><Star/></div>
          <p>{r.text}</p><span className={`cf-plans-review-tag tag-${i}`}>{r.tag}</span>
        </article>)}
      </div>
      <button className="cf-plans-carousel-arrow right" type="button" aria-label="Next reviews" aria-disabled="true"><ArrowRight/></button>
      <div className="cf-plans-review-summary"><b>Excellent</b><span className="cf-plans-summary-stars"><i>★</i><i>★</i><i>★</i><i>★</i><i>★</i></span><span>4.9 out of 5 based on 2,500+ reviews</span><strong>★ Trustpilot</strong></div>
    </section>

    {hasTarget && <section className="cf-plans-pricing">
        <div className="cf-plans-section-title cf-pricing-title"><h2>Choose Your Growth Plan</h2><p>Pick the package that fits your goals and start growing today.</p></div>
        <div className="cf-plans-card-grid">
          {slots.map((p:any)=><article key={p.title} className={`cf-plans-price-card tint-${p.tint} ${p.featured?"is-featured":""}`}>
            {p.badge && <span className={`cf-plans-popular-badge ${p.badge === "BEST DEAL" ? "is-best-deal" : ""}`}><span className={`cf-plans-badge-icon ${p.badge === "BEST DEAL" ? "is-fire" : "is-star"}`} aria-hidden="true">{p.badge === "BEST DEAL" ? "🔥" : "★"}</span><span>{p.badge}</span></span>}
            <div className="cf-plans-price-head"><span className="cf-plan-icon"><PlanIcon title={p.title}/></span><div><h3>{p.title}</h3><p>{p.kicker}</p></div></div>
            <div className="cf-plans-promo-row"><span className="cf-plans-old-price">{p.regularPrice}</span><span className="cf-plans-discount-badge">{p.discount}</span></div>
            <div className="cf-plans-price-row"><strong>{p.price}</strong></div>
            <div className="cf-plans-followers-pill"><UserRound/><strong>{p.qty}</strong></div>
            <ul><li><Check/>{p.feat2}</li><li><Check/>{p.feat3}</li><li><Check/>{p.delivery}</li><li><Check/>{p.support}</li><li><Check/>100% safe &amp; secure</li></ul>
            <button className="cf-plans-card-cta" type="button" onClick={()=>select(p.id)}>Get My {ctaMetric} <span aria-hidden="true">→</span></button>
            <small className="cf-plans-delivery-note"><span aria-hidden="true">⚡</span> Delivered within 24 hours</small>
          </article>)}
        </div>
    </section>}

    <section className="cf-plans-final-cta" id="contact">
      <div className="cf-plans-rocket-art" aria-hidden="true"><Image className="cf-plans-rocket-premium" src={rocket25dPremium} alt="" priority/></div>
      <div className="cf-plans-final-copy"><h2>Ready to Take Your Social Media<br/>to the <span>Next Level?</span></h2><p>Join thousands of creators and businesses growing their online presence with CloutFlow.</p></div>
      <div className="cf-plans-final-action"><button type="button" onClick={()=>document.querySelector(".cf-plans-card-grid")?.scrollIntoView({behavior:"smooth",block:"center"})}>Get Started Now <ArrowRight/></button><small><span className="cf-customer-faces"><Image src={avatar1} alt=""/><Image src={avatar2} alt=""/><Image src={avatar3} alt=""/></span><span className="cf-happy-customer-text">100K+ Happy Customers</span></small></div>
    </section>
    <section className="cf-plans-value-row" id="faq"><div><TrendingUp/><span><b>Real Growth</b><small>Build a genuine audience that engages with your content.</small></span></div><div><Zap/><span><b>Boost Visibility</b><small>Higher reach, more views, more opportunities.</small></span></div><div><TimerReset/><span><b>Save Time</b><small>Focus on creating content, we handle the growth.</small></span></div><div><ChevronRight/><span><b>Scale Faster</b><small>Grow your brand and business effortlessly.</small></span></div></section>
  </>;
}
