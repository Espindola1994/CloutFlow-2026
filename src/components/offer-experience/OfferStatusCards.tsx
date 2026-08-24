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

export function OfferValidatingCard() {
  return (
    <div className="w-full max-w-[460px] mx-auto p-6 animate-in fade-in zoom-in-95 duration-200">
      <div
        className="bg-white/95 backdrop-blur-xs border border-[#E2E8F0] rounded-2xl p-8 text-center"
        style={{
          boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.08)',
        }}
      >
        <div className="w-10 h-10 border-3 border-[#1376FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-[19px] font-black text-[#0F172A] tracking-tight">Validating Offer</h2>
        <p className="text-[13px] text-[#64748B] mt-1.5 font-medium">
          Retrieving your verified 25% repeat purchase discount...
        </p>
      </div>
    </div>
  );
}
