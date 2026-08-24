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
    gradient: 'linear-gradient(135deg, #833AB4 0%, #C13584 30%, #E1306C 60%, #F56040 100%)',
    ctaGradient: 'linear-gradient(135deg, #833AB4 0%, #C13584 30%, #E1306C 65%, #F56040 100%)',
    borderGlow: 'rgba(225, 48, 108, 0.25)',
    ambientGlowLeft: 'radial-gradient(ellipse 600px 400px at 0% 20%, rgba(225, 48, 108, 0.07) 0%, rgba(131, 58, 180, 0.04) 50%, transparent 80%)',
    ambientGlowRight: 'radial-gradient(ellipse 600px 400px at 100% 80%, rgba(245, 96, 64, 0.06) 0%, rgba(225, 48, 108, 0.03) 50%, transparent 80%)',
    cardBorder: 'rgba(225, 48, 108, 0.15)',
    cardSelectedBorder: '#E1306C',
    cardSelectedGlow: '0 10px 28px -4px rgba(225, 48, 108, 0.22)',
    buttonShadow: '0 8px 20px -4px rgba(225, 48, 108, 0.35)',
    stepActiveBg: 'linear-gradient(135deg, #833AB4 0%, #E1306C 100%)',
  },
  tiktok: {
    name: 'TikTok',
    label: 'TikTok',
    badge: 'TikTok Boost',
    primary: '#FE2C55',
    primaryHover: '#E0264A',
    secondary: '#25F4EE',
    accentSubtle: 'rgba(37, 244, 238, 0.06)',
    tagColor: '#00F2FE',
    gradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #155054 75%, #FE2C55 100%)',
    ctaGradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #164E63 100%)',
    borderGlow: 'rgba(37, 244, 238, 0.30)',
    ambientGlowLeft: 'radial-gradient(ellipse 600px 400px at 0% 20%, rgba(37, 244, 238, 0.07) 0%, rgba(15, 23, 42, 0.04) 50%, transparent 80%)',
    ambientGlowRight: 'radial-gradient(ellipse 600px 400px at 100% 80%, rgba(254, 44, 85, 0.06) 0%, rgba(37, 244, 238, 0.03) 50%, transparent 80%)',
    cardBorder: 'rgba(37, 244, 238, 0.20)',
    cardSelectedBorder: '#00F2FE',
    cardSelectedGlow: '0 10px 28px -4px rgba(0, 242, 254, 0.25)',
    buttonShadow: '0 8px 20px -4px rgba(254, 44, 85, 0.25)',
    stepActiveBg: '#0F172A',
  },
  twitter: {
    name: 'X (Twitter)',
    label: 'X / Twitter',
    badge: 'X Boost',
    primary: '#0F1419',
    primaryHover: '#272C30',
    secondary: '#334155',
    accentSubtle: 'rgba(15, 20, 25, 0.04)',
    tagColor: '#334155',
    gradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
    ctaGradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    borderGlow: 'rgba(15, 20, 25, 0.20)',
    ambientGlowLeft: 'radial-gradient(ellipse 600px 400px at 0% 20%, rgba(148, 163, 184, 0.08) 0%, transparent 70%)',
    ambientGlowRight: 'radial-gradient(ellipse 600px 400px at 100% 80%, rgba(51, 65, 85, 0.06) 0%, transparent 70%)',
    cardBorder: 'rgba(15, 20, 25, 0.15)',
    cardSelectedBorder: '#0F172A',
    cardSelectedGlow: '0 10px 28px -4px rgba(15, 20, 25, 0.20)',
    buttonShadow: '0 8px 20px -4px rgba(15, 20, 25, 0.30)',
    stepActiveBg: '#0F1419',
  },
  youtube: {
    name: 'YouTube',
    label: 'YouTube',
    badge: 'YouTube Boost',
    primary: '#FF0000',
    primaryHover: '#D5000C',
    secondary: '#DC2626',
    accentSubtle: 'rgba(255, 0, 0, 0.05)',
    tagColor: '#DC2626',
    gradient: 'linear-gradient(135deg, #CC0000 0%, #FF0000 50%, #E6000C 100%)',
    ctaGradient: 'linear-gradient(135deg, #CC0000 0%, #FF0000 100%)',
    borderGlow: 'rgba(255, 0, 0, 0.25)',
    ambientGlowLeft: 'radial-gradient(ellipse 600px 400px at 0% 20%, rgba(255, 0, 0, 0.06) 0%, transparent 70%)',
    ambientGlowRight: 'radial-gradient(ellipse 600px 400px at 100% 80%, rgba(220, 38, 38, 0.05) 0%, transparent 70%)',
    cardBorder: 'rgba(255, 0, 0, 0.15)',
    cardSelectedBorder: '#FF0000',
    cardSelectedGlow: '0 10px 28px -4px rgba(255, 0, 0, 0.22)',
    buttonShadow: '0 8px 20px -4px rgba(255, 0, 0, 0.30)',
    stepActiveBg: '#FF0000',
  },
};
