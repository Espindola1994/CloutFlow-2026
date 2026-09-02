'use client';

import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OfferStatusCardProps {
  title?: string;
  description?: string;
}

export function OfferStatusCard({
  title = 'Offer Unavailable',
  description = 'This repeat-purchase offer is no longer active or has already reached its expiration date.',
}: OfferStatusCardProps) {
  const router = useRouter();

  return (
    <div className="w-full max-w-[500px] mx-auto p-6 animate-in fade-in zoom-in-95 duration-200">
      <div
        className="bg-white/95 backdrop-blur-xs border border-[#E2E8F0] rounded-2xl p-8 text-center"
        style={{
          boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.08)',
        }}
      >
        <div className="w-13 h-13 rounded-2xl bg-[#FEF2F2] border border-[#FEE2E2] flex items-center justify-center text-[#DC2626] mx-auto mb-4 shadow-inner">
          <AlertCircle className="w-6 h-6 stroke-[2.5]" />
        </div>
        <h1 className="text-[22px] sm:text-[24px] font-black text-[#0F172A] tracking-tight">
          {title}
        </h1>
        <p className="text-[14px] text-[#64748B] mt-2 mb-6 font-medium">
          {description}
        </p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-extrabold text-[13px] transition-all duration-150 cursor-pointer shadow-md hover:-translate-y-0.5"
        >
          <span>Explore CloutFlow Services</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function OfferValidatingCard({ progress = 45 }: { progress?: number }) {
  return (
    <div className="cf-offer-validating-v606" role="status" aria-live="polite">
      <div className="cf-offer-validating-v606-orbit" aria-hidden="true">
        <span className="cf-v606-spark cf-v606-spark-a">✦</span>
        <span className="cf-v606-spark cf-v606-spark-b">✦</span>
        <span className="cf-v606-spark cf-v606-spark-c">✦</span>
        <span className="cf-v606-spark cf-v606-spark-d">✦</span>

        <div className="cf-v606-ring">
          <div className="cf-v606-ring-inner">
            <svg viewBox="0 0 64 64" focusable="false">
              <path className="cf-v606-ticket" d="M14 18c0-3.3 2.7-6 6-6h24c3.3 0 6 2.7 6 6v6.5a7.5 7.5 0 0 0 0 15V46c0 3.3-2.7 6-6 6H20c-3.3 0-6-2.7-6-6v-6.5a7.5 7.5 0 0 0 0-15V18Z" />
              <circle cx="25" cy="27" r="4" />
              <circle cx="39" cy="37" r="4" />
              <path d="M39 24 25 40" />
            </svg>
          </div>
        </div>
      </div>

      <h2>Validating <span>Offer</span></h2>
      <p>
        Retrieving your verified 25% repeat
        <br className="cf-v606-desktop-break" /> purchase discount...
      </p>

      <div className="cf-v606-progress-row">
        <div className="cf-v606-progress-track">
          <span className="cf-v606-progress-fill" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
        <strong className="cf-v606-progress-percent">{Math.round(Math.max(0, Math.min(100, progress)))}%</strong>
      </div>

      <div className="cf-v606-secure">
        <span className="cf-v606-shield" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M12 3 19 6v5c0 4.7-2.8 8-7 10-4.2-2-7-5.3-7-10V6l7-3Z" />
            <path d="M12 6v11.2" />
          </svg>
        </span>
        <span className="cf-v606-secure-copy">
          <strong>Secure &amp; Verified</strong>
          <small>We are securely validating your offer. Please wait...</small>
        </span>
      </div>
    </div>
  );
}

