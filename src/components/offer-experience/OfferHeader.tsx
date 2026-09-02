'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { OfferPlatformTheme } from './theme';
import instagramIcon from '@/assets/home-icons-vector/instagram.svg';
import tiktokIcon from '@/assets/home-icons-vector/tiktok.svg';
import twitterIcon from '@/assets/home-icons-vector/twitter.svg';
import youtubeIcon from '@/assets/home-icons-vector/youtube.svg';

interface OfferHeaderProps {
  timeLeft: string | null;
  isExpiredLocally: boolean;
  currentStepNum: number;
  platform: 'instagram' | 'tiktok' | 'twitter' | 'youtube';
  theme: OfferPlatformTheme;
}


export function OfferHeader({ timeLeft, isExpiredLocally }: OfferHeaderProps) {
  return (
    <header className="cf-offer-header-new cf-offer-header-clean">
      <div className="cf-offer-nav">
        <Link href="/" className="cf-offer-brand" aria-label="CloutFlow">
          <img className="cf-offer-brand-logo" src="/offer/cloutflow-header-logo.png" alt="CloutFlow" />
        </Link>

        <div className="cf-offer-header-timer-slot">
          {timeLeft && !isExpiredLocally && (
            <div className="cf-timer578" aria-label={`Offer expires in ${timeLeft}`}>
              <span className="cf-timer578-particles cf-timer578-particles-left" aria-hidden="true" />

              <div className="cf-timer578-card">
                <div className="cf-timer579-hourglass cf-hourglass-live" aria-hidden="true">
                  <svg viewBox="0 0 96 96" role="img" focusable="false">
                    <defs>
                      <linearGradient id="cf579Cap" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9A38F4" />
                        <stop offset="55%" stopColor="#6817B8" />
                        <stop offset="100%" stopColor="#421077" />
                      </linearGradient>
                      <linearGradient id="cf579Glass" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
                        <stop offset="45%" stopColor="#EEE6FF" stopOpacity="0.68" />
                        <stop offset="72%" stopColor="#FFFFFF" stopOpacity="0.92" />
                        <stop offset="100%" stopColor="#D8C9F3" stopOpacity="0.42" />
                      </linearGradient>
                      <linearGradient id="cf579Sand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF62C7" />
                        <stop offset="55%" stopColor="#F02C9A" />
                        <stop offset="100%" stopColor="#C319C7" />
                      </linearGradient>
                      <radialGradient id="cf579Glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FF4EB3" stopOpacity="0.55" />
                        <stop offset="100%" stopColor="#8F29DE" stopOpacity="0" />
                      </radialGradient>
                      <filter id="cf579Shadow" x="-40%" y="-40%" width="180%" height="180%">
                        <feDropShadow dx="0" dy="8" stdDeviation="5" floodColor="#63229E" floodOpacity="0.26" />
                      </filter>
                    </defs>

                    <ellipse cx="48" cy="51" rx="31" ry="36" fill="url(#cf579Glow)" opacity="0.55" />
                    <g filter="url(#cf579Shadow)">
                      <rect x="16" y="8" width="64" height="11" rx="6" fill="url(#cf579Cap)" />
                      <rect x="21" y="10" width="54" height="3" rx="1.5" fill="#FFFFFF" opacity="0.30" />

                      <path d="M27 19 H69 C68 31 61 38 53 44 C50 46 48 48 48 50 C48 52 50 54 53 56 C61 62 68 69 69 81 H27 C28 69 35 62 43 56 C46 54 48 52 48 50 C48 48 46 46 43 44 C35 38 28 31 27 19 Z"
                            fill="url(#cf579Glass)" stroke="#FFFFFF" strokeOpacity="0.9" strokeWidth="1.6" />

                      <path d="M34 26 H62 C60 33 56 37 50 41 C49 42 48 43 48 44 C48 43 47 42 46 41 C40 37 36 33 34 26 Z"
                            fill="url(#cf579Sand)" />
                      <rect x="46.6" y="41" width="2.8" height="15" rx="1.4" fill="url(#cf579Sand)" />
                      <path d="M33 75 C38 65 43 59 48 59 C53 59 58 65 63 75 Z" fill="url(#cf579Sand)" />

                      <path d="M31 22 C32 34 38 39 44 44" fill="none" stroke="#FFFFFF" strokeOpacity="0.86" strokeWidth="2.2" strokeLinecap="round" />
                      <path d="M65 22 C64 34 58 39 52 44" fill="none" stroke="#D9CBF3" strokeOpacity="0.62" strokeWidth="1.4" strokeLinecap="round" />

                      <rect x="16" y="77" width="64" height="11" rx="6" fill="url(#cf579Cap)" />
                      <rect x="21" y="79" width="54" height="3" rx="1.5" fill="#FFFFFF" opacity="0.26" />
                    </g>
                  </svg>
                </div>

                <div className="cf-timer578-copy">
                  <small>TIME REMAINING</small>
                  <strong key={timeLeft} className="cf-offer-countdown-value">{timeLeft}</strong>
                </div>

                <span className="cf-timer578-divider" aria-hidden="true" />

                <div className="cf-timer578-bars" aria-hidden="true">
                  <i /><i /><i /><i />
                </div>
              </div>

              <span className="cf-timer578-particles cf-timer578-particles-right" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="cf-offer-nav-meta">
          <div className="cf-header-tagline589" aria-label="Grow. Engage. Get Noticed.">
            <span className="cf-header-tagline589-spark" aria-hidden="true">✦</span>
            <strong>Grow. Engage. Get Noticed.</strong>
          </div>
        </div>
      </div>
    </header>
  );
}

export function OfferTrustBar() {
  return null;
}
