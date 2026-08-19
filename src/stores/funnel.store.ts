import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TargetType = 'profile' | 'post' | 'video' | 'channel';

interface FunnelState {
  platformSlug: string | null;
  serviceSlug: string | null;
  followerType: 'real' | 'niche' | null;
  username: string | null;
  profileData: Record<string, unknown> | null;
  
  // Generalized Target State
  targetType: TargetType | null;
  targetValue: string | null;
  targetUrl: string | null;
  socialUsername: string | null;
  profileUrl: string | null;
  verifiedTargetData: Record<string, unknown> | null;

  nicheId: string | null;
  customNiche: string | null;
  selectedMedia: string[] | null;
  planId: string | null;
  
  setPlatform: (slug: string) => void;
  setService: (slug: string) => void;
  setFollowerType: (type: 'real' | 'niche' | null) => void;
  setUsername: (username: string) => void;
  setProfileData: (data: Record<string, unknown>) => void;
  setTarget: (target: {
    targetType: TargetType;
    targetValue?: string | null;
    targetUrl?: string | null;
    socialUsername?: string | null;
    profileUrl?: string | null;
    verifiedTargetData?: Record<string, unknown> | null;
  }) => void;
  setNiche: (nicheId: string, custom?: string) => void;
  setSelectedMedia: (media: string[]) => void;
  setPlan: (planId: string) => void;
  reset: () => void;
}

export const useFunnelStore = create<FunnelState>()(
  persist(
    (set) => ({
      platformSlug: null,
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
      nicheId: null,
      customNiche: null,
      selectedMedia: null,
      planId: null,

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
          planId: null,
        };
      }),
      setService: (slug) => set((state) => {
        if (state.serviceSlug === slug) return state;
        return { serviceSlug: slug, planId: null };
      }),
      setFollowerType: (type) => set({ followerType: type }),
      setUsername: (username) => set({ username, socialUsername: username.replace(/^@+/, ''), profileData: null }),
      setProfileData: (data) => set({ profileData: data }),
      setTarget: (target) => set({
        targetType: target.targetType,
        targetValue: target.targetValue || null,
        targetUrl: target.targetUrl || null,
        socialUsername: target.socialUsername || null,
        profileUrl: target.profileUrl || null,
        verifiedTargetData: target.verifiedTargetData || null,
      }),
      setNiche: (nicheId, custom) => set({ nicheId, customNiche: custom || null }),
      setSelectedMedia: (media) => set({ selectedMedia: media }),
      setPlan: (planId) => set({ planId }),
      reset: () => set({
        platformSlug: null,
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
        nicheId: null,
        customNiche: null,
        selectedMedia: null,
        planId: null,
      }),
    }),
    {
      name: 'funnel-storage',
    }
  )
);

