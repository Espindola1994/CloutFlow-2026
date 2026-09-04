import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { resolveFunnelReadiness, FunnelReadinessResult, VerificationStatus } from '@/services/funnel-readiness.resolver';

export type TargetType = 'profile' | 'post' | 'video' | 'channel';

export interface FunnelState {
  // Versioning for storage migration
  version: number;

  platformSlug: string | null;
  serviceSlug: string | null;
  followerType: 'real' | 'niche' | null;
  username: string | null;
  email: string | null;
  profileData: Record<string, unknown> | null;
  
  // Generalized Target State
  targetType: TargetType | null;
  targetValue: string | null;
  targetUrl: string | null;
  socialUsername: string | null;
  profileUrl: string | null;
  verifiedTargetData: Record<string, unknown> | null;
  verificationStatus: VerificationStatus;

  nicheId: string | null;
  customNiche: string | null;
  selectedMedia: string[] | null;
  planId: string | null;
  
  // Actions
  setPlatform: (slug: string) => void;
  setService: (slug: string) => void;
  setFollowerType: (type: 'real' | 'niche' | null) => void;
  setUsername: (username: string) => void;
  setEmail: (email: string) => void;
  setProfileData: (data: Record<string, unknown> | null) => void;
  setVerificationStatus: (status: VerificationStatus) => void;
  setTarget: (target: {
    targetType: TargetType;
    targetValue?: string | null;
    targetUrl?: string | null;
    socialUsername?: string | null;
    profileUrl?: string | null;
    email?: string | null;
    verifiedTargetData?: Record<string, unknown> | null;
    verificationStatus?: VerificationStatus;
  }) => void;
  resetTarget: () => void;
  setNiche: (nicheId: string, custom?: string) => void;
  setSelectedMedia: (media: string[]) => void;
  setPlan: (planId: string) => void;
  reset: () => void;
  getReadiness: () => FunnelReadinessResult;
}

const CURRENT_FUNNEL_VERSION = 3;

export const useFunnelStore = create<FunnelState>()(
  persist(
    (set, get) => ({
      version: CURRENT_FUNNEL_VERSION,
      platformSlug: null,
      serviceSlug: null,
      followerType: null,
      username: null,
      email: null,
      profileData: null,
      targetType: null,
      targetValue: null,
      targetUrl: null,
      socialUsername: null,
      profileUrl: null,
      verifiedTargetData: null,
      verificationStatus: 'idle',
      nicheId: null,
      customNiche: null,
      selectedMedia: null,
      planId: null,

      // Switching platform clears all target and verification data (preserves email)
      setPlatform: (slug) => set((state) => {
        if (state.platformSlug === slug) return state;
        return {
          platformSlug: slug,
          serviceSlug: null,
          followerType: null,
          username: null,
          profileData: null,
          targetType: null,
          targetValue: null,
          targetUrl: null,
          socialUsername: null,
          profileUrl: null,
          verifiedTargetData: null,
          verificationStatus: 'idle',
          planId: null,
        };
      }),

      // Switching service clears target and verification data to prevent cross-service target leakage (preserves email & platform)
      setService: (slug) => set((state) => {
        if (state.serviceSlug === slug) return state;
        return {
          serviceSlug: slug,
          username: null,
          profileData: null,
          targetType: null,
          targetValue: null,
          targetUrl: null,
          socialUsername: null,
          profileUrl: null,
          verifiedTargetData: null,
          verificationStatus: 'idle',
          planId: null,
        };
      }),

      setFollowerType: (type) => set({ followerType: type }),
      setUsername: (username) => set({ username, socialUsername: username.replace(/^@+/, ''), profileData: null }),
      setEmail: (email) => set({ email: email ? email.trim() : null }),
      setProfileData: (data) => set({ profileData: data }),
      setVerificationStatus: (verificationStatus) => set({ verificationStatus }),

      setTarget: (target) => set((state) => ({
        targetType: target.targetType,
        targetValue: target.targetValue || null,
        targetUrl: target.targetUrl || null,
        socialUsername: target.socialUsername || null,
        profileUrl: target.profileUrl || null,
        email: target.email !== undefined ? (target.email ? target.email.trim() : null) : state.email,
        verifiedTargetData: target.verifiedTargetData || null,
        verificationStatus: target.verificationStatus || (target.verifiedTargetData ? 'success' : 'idle'),
      })),

      resetTarget: () => set({
        targetType: null,
        targetValue: null,
        targetUrl: null,
        socialUsername: null,
        profileUrl: null,
        verifiedTargetData: null,
        verificationStatus: 'idle',
        profileData: null,
        planId: null,
      }),

      setNiche: (nicheId, custom) => set({ nicheId, customNiche: custom || null }),
      setSelectedMedia: (media) => set({ selectedMedia: media }),
      setPlan: (planId) => set({ planId }),
      
      reset: () => set({
        platformSlug: null,
        serviceSlug: null,
        followerType: null,
        username: null,
        email: null,
        profileData: null,
        targetType: null,
        targetValue: null,
        targetUrl: null,
        socialUsername: null,
        profileUrl: null,
        verifiedTargetData: null,
        verificationStatus: 'idle',
        nicheId: null,
        customNiche: null,
        selectedMedia: null,
        planId: null,
      }),

      getReadiness: () => {
        const s = get();
        return resolveFunnelReadiness({
          platform: s.platformSlug,
          service: s.serviceSlug,
          targetType: s.targetType,
          targetValue: s.targetValue,
          targetUrl: s.targetUrl,
          socialUsername: s.socialUsername,
          profileUrl: s.profileUrl,
          verificationStatus: s.verificationStatus,
          verifiedTargetData: s.verifiedTargetData,
          email: s.email,
        });
      },
    }),
    {
      name: 'funnel-storage-v3', // Migration v3: stale persisted verification states never unlock plans automatically
      version: 3,
      migrate: (persistedState: any, version: number) => {
        return {
          version: 3,
          platformSlug: null,
          serviceSlug: null,
          followerType: null,
          username: null,
          email: null,
          profileData: null,
          targetType: null,
          targetValue: null,
          targetUrl: null,
          socialUsername: null,
          profileUrl: null,
          verifiedTargetData: null,
          verificationStatus: 'idle',
          nicheId: null,
          customNiche: null,
          selectedMedia: null,
          planId: null,
        };
      },
    }
  )
);
