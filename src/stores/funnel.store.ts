import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FunnelState {
  platformSlug: string | null;
  serviceSlug: string | null;
  username: string | null;
  profileData: Record<string, unknown> | null;
  nicheId: string | null;
  customNiche: string | null;
  selectedMedia: string[] | null;
  planId: string | null;
  
  setPlatform: (slug: string) => void;
  setService: (slug: string) => void;
  setUsername: (username: string) => void;
  setProfileData: (data: Record<string, unknown>) => void;
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
      username: null,
      profileData: null,
      nicheId: null,
      customNiche: null,
      selectedMedia: null,
      planId: null,

      setPlatform: (slug) => set({ platformSlug: slug, serviceSlug: null, username: null, profileData: null, planId: null }),
      setService: (slug) => set({ serviceSlug: slug, planId: null }),
      setUsername: (username) => set({ username, profileData: null }),
      setProfileData: (data) => set({ profileData: data }),
      setNiche: (nicheId, custom) => set({ nicheId, customNiche: custom || null }),
      setSelectedMedia: (media) => set({ selectedMedia: media }),
      setPlan: (planId) => set({ planId }),
      reset: () => set({
        platformSlug: null,
        serviceSlug: null,
        username: null,
        profileData: null,
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
