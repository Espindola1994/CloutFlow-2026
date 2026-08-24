import { Platform } from '@/config/service-sales.config';

export interface OfferPlatformTheme {
  name: string;
  label: string;
  badge: string;
  primary: string;
  primaryHover: string;
  secondary: string;
  accentSubtle: string;
  tagColor: string;
  gradient: string;
  ctaGradient: string;
  borderGlow: string;
  ambientGlowLeft: string;
  ambientGlowRight: string;
  cardBorder: string;
  cardSelectedBorder: string;
  cardSelectedGlow: string;
  buttonShadow: string;
  stepActiveBg: string;
  stepCompletedBg: string;
  stepCompletedBorder: string;
  stepCompletedText: string;
  focusRing: string;
}

export const OFFER_PLATFORM_THEMES: Record<Platform, OfferPlatformTheme> = {
  instagram: {
    name: 'Instagram',
    label: 'Instagram',
    badge: 'Instagram Boost',
    primary: '#E1306C',
    primaryHover: '#D82D66',
    secondary: '#833AB4',
    accentSubtle: 'rgba(225, 48, 108, 0.06)',
    tagColor: '#C13584',
    gradient: 'linear-gradient(90deg, #833AB4 0%, #C13584 26%, #E1306C 50%, #F56040 74%, #FCAF45 100%)',
    ctaGradient: 'linear-gradient(90deg, #833AB4 0%, #C13584 26%, #E1306C 50%, #F56040 74%, #FCAF45 100%)',
    borderGlow: 'rgba(225, 48, 108, 0.28)',
    ambientGlowLeft: 'radial-gradient(ellipse 600px 400px at 0% 15%, rgba(225, 48, 108, 0.08) 0%, rgba(131, 58, 180, 0.04) 50%, transparent 80%)',
    ambientGlowRight: 'radial-gradient(ellipse 600px 400px at 100% 85%, rgba(245, 96, 64, 0.07) 0%, rgba(225, 48, 108, 0.03) 50%, transparent 80%)',
    cardBorder: 'rgba(225, 48, 108, 0.18)',
    cardSelectedBorder: '#E1306C',
    cardSelectedGlow: '0 12px 28px -4px rgba(225, 48, 108, 0.24)',
    buttonShadow: '0 8px 20px -4px rgba(225, 48, 108, 0.38)',
    stepActiveBg: 'linear-gradient(90deg, #833AB4 0%, #C13584 40%, #E1306C 100%)',
    stepCompletedBg: 'rgba(225, 48, 108, 0.12)',
    stepCompletedBorder: 'rgba(225, 48, 108, 0.40)',
    stepCompletedText: '#E1306C',
    focusRing: 'rgba(225, 48, 108, 0.25)',
  },
  tiktok: {
    name: 'TikTok',
    label: 'TikTok',
    badge: 'TikTok Boost',
    primary: '#000000',
    primaryHover: '#111827',
    secondary: '#25F4EE',
    accentSubtle: 'rgba(37, 244, 238, 0.06)',
    tagColor: '#25F4EE',
    gradient: 'linear-gradient(110deg, #080808 0%, #0a0d0e 25%, #155054 60%, #9b2948 100%)',
    ctaGradient: 'linear-gradient(110deg, #080808 0%, #0a0d0e 25%, #155054 60%, #9b2948 100%)',
    borderGlow: 'rgba(37, 244, 238, 0.35)',
    ambientGlowLeft: 'radial-gradient(ellipse 600px 400px at 0% 15%, rgba(37, 244, 238, 0.08) 0%, rgba(15, 23, 42, 0.04) 50%, transparent 80%)',
    ambientGlowRight: 'radial-gradient(ellipse 600px 400px at 100% 85%, rgba(254, 44, 85, 0.07) 0%, rgba(37, 244, 238, 0.03) 50%, transparent 80%)',
    cardBorder: 'rgba(37, 244, 238, 0.22)',
    cardSelectedBorder: '#25F4EE',
    cardSelectedGlow: '0 12px 28px -4px rgba(37, 244, 238, 0.25)',
    buttonShadow: '0 8px 20px -4px rgba(155, 41, 72, 0.35)',
    stepActiveBg: 'linear-gradient(110deg, #080808 0%, #155054 60%, #9b2948 100%)',
    stepCompletedBg: 'rgba(37, 244, 238, 0.12)',
    stepCompletedBorder: 'rgba(37, 244, 238, 0.45)',
    stepCompletedText: '#0e7490',
    focusRing: 'rgba(37, 244, 238, 0.35)',
  },
  twitter: {
    name: 'X (Twitter)',
    label: 'X / Twitter',
    badge: 'X Boost',
    primary: '#0F1419',
    primaryHover: '#272C30',
    secondary: '#536471',
    accentSubtle: 'rgba(15, 20, 25, 0.04)',
    tagColor: '#536471',
    gradient: 'linear-gradient(135deg, #0F1419 0%, #272C30 100%)',
    ctaGradient: 'linear-gradient(135deg, #0F1419 0%, #272C30 100%)',
    borderGlow: 'rgba(15, 20, 25, 0.25)',
    ambientGlowLeft: 'radial-gradient(ellipse 600px 400px at 0% 15%, rgba(148, 163, 184, 0.08) 0%, transparent 70%)',
    ambientGlowRight: 'radial-gradient(ellipse 600px 400px at 100% 85%, rgba(71, 85, 105, 0.06) 0%, transparent 70%)',
    cardBorder: 'rgba(15, 20, 25, 0.18)',
    cardSelectedBorder: '#0F1419',
    cardSelectedGlow: '0 12px 28px -4px rgba(15, 20, 25, 0.20)',
    buttonShadow: '0 8px 20px -4px rgba(15, 20, 25, 0.35)',
    stepActiveBg: '#0F1419',
    stepCompletedBg: 'rgba(15, 20, 25, 0.08)',
    stepCompletedBorder: 'rgba(15, 20, 25, 0.35)',
    stepCompletedText: '#0F1419',
    focusRing: 'rgba(15, 20, 25, 0.25)',
  },
  youtube: {
    name: 'YouTube',
    label: 'YouTube',
    badge: 'YouTube Boost',
    primary: '#FF0000',
    primaryHover: '#D5000C',
    secondary: '#CC0000',
    accentSubtle: 'rgba(255, 0, 0, 0.05)',
    tagColor: '#FF0000',
    gradient: 'linear-gradient(110deg, #C9000B 0%, #E6000C 28%, #FF0000 55%, #F21822 76%, #D5000C 100%)',
    ctaGradient: 'linear-gradient(110deg, #C9000B 0%, #E6000C 28%, #FF0000 55%, #F21822 76%, #D5000C 100%)',
    borderGlow: 'rgba(255, 0, 0, 0.28)',
    ambientGlowLeft: 'radial-gradient(ellipse 600px 400px at 0% 15%, rgba(255, 0, 0, 0.08) 0%, transparent 70%)',
    ambientGlowRight: 'radial-gradient(ellipse 600px 400px at 100% 85%, rgba(220, 38, 38, 0.06) 0%, transparent 70%)',
    cardBorder: 'rgba(255, 0, 0, 0.18)',
    cardSelectedBorder: '#FF0000',
    cardSelectedGlow: '0 12px 28px -4px rgba(255, 0, 0, 0.24)',
    buttonShadow: '0 8px 20px -4px rgba(255, 0, 0, 0.35)',
    stepActiveBg: '#FF0000',
    stepCompletedBg: 'rgba(255, 0, 0, 0.10)',
    stepCompletedBorder: 'rgba(255, 0, 0, 0.40)',
    stepCompletedText: '#DC2626',
    focusRing: 'rgba(255, 0, 0, 0.25)',
  },
};

