import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { resolveFunnelReadiness, FunnelReadinessResult, VerificationStatus } from '@/services/funnel-readiness.resolver';

export type TargetType = 'profile' | 'post' | 'video' | 'channel';

const LEGACY_STORAGE_KEY = 'funnel-storage-v3';

// One-shot surgical cleanup of legacy localStorage key
export function purgeLegacyFunnelStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Fail-open: Never disrupt execution if storage access is restricted
  }
}

// Client-safe execution upon module load in the browser
if (typeof window !== 'undefined') {
  purgeLegacyFunnelStorage();
}

export interface FunnelState {
  // Versioning for storage migration
  version: number;

  platformSlug: string | null;
  serviceSlug: string | null;
  followerType: 'real' | 'niche' | null;
  username: string | null;
  email: string | null;
  draftIdentifier: string | null;
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
  setDraftIdentifier: (identifier: string) => void;
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
  resetAfterCheckoutReturn: () => void;
  resetAnalysis: () => void;
  reset: () => void;
  getReadiness: () => FunnelReadinessResult;
}

const CURRENT_FUNNEL_VERSION = 4;

export const useFunnelStore = create<FunnelState>()(
  persist(
    (set, get) => ({
      version: CURRENT_FUNNEL_VERSION,
      platformSlug: null,
      serviceSlug: null,
      followerType: null,
      username: null,
      email: null,
      draftIdentifier: null,
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
      setDraftIdentifier: (draftIdentifier) => set({ draftIdentifier: draftIdentifier || null }),
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

      // Checkout return: full funnel reset back to initial state
      resetAfterCheckoutReturn: () => set({
        platformSlug: null,
        serviceSlug: null,
        followerType: null,
        username: null,
        email: null,
        draftIdentifier: null,
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

      // Checkout return invalidates analysis results but keeps the customer's inputs and route context.
      resetAnalysis: () => set((state) => ({
        serviceSlug: null,
        username: null,
        profileData: null,
        targetType: null,
        targetValue: null,
        targetUrl: null,
        socialUsername: null,
        profileUrl: null,
        verifiedTargetData: null,
        verificationStatus: 'idle',
        followerType: null,
        nicheId: null,
        customNiche: null,
        selectedMedia: null,
        planId: null,
        email: state.email,
        draftIdentifier: state.draftIdentifier,
      })),
      
      reset: () => set({
        platformSlug: null,
        serviceSlug: null,
        followerType: null,
        username: null,
        email: null,
        draftIdentifier: null,
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
      name: 'funnel-session-v1',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
