import { describe, it, expect, beforeEach } from 'vitest';
import { resolveFunnelReadiness, FunnelReadinessInput } from '../funnel-readiness.resolver';
import { useFunnelStore } from '@/stores/funnel.store';

describe('Funnel Central Readiness & Transition Matrix', () => {
  beforeEach(() => {
    useFunnelStore.getState().reset();
  });

  const matrixCombinations = [
    // Instagram
    { platform: 'instagram', service: 'followers', sampleTarget: 'cloutflow', sampleUrl: null },
    { platform: 'instagram', service: 'likes', sampleTarget: null, sampleUrl: 'https://www.instagram.com/p/DFxyz123/' },
    { platform: 'instagram', service: 'views', sampleTarget: null, sampleUrl: 'https://www.instagram.com/reel/DFxyz123/' },
    // TikTok
    { platform: 'tiktok', service: 'followers', sampleTarget: 'cloutflow_tt', sampleUrl: null },
    { platform: 'tiktok', service: 'likes', sampleTarget: null, sampleUrl: 'https://www.tiktok.com/@cloutflow_tt/video/123456789' },
    { platform: 'tiktok', service: 'views', sampleTarget: null, sampleUrl: 'https://www.tiktok.com/@cloutflow_tt/video/123456789' },
    // Twitter
    { platform: 'twitter', service: 'followers', sampleTarget: 'cloutflow_x', sampleUrl: null },
    { platform: 'twitter', service: 'likes', sampleTarget: null, sampleUrl: 'https://x.com/cloutflow_x/status/123456789' },
    { platform: 'twitter', service: 'views', sampleTarget: null, sampleUrl: 'https://x.com/cloutflow_x/status/123456789' },
    // YouTube
    { platform: 'youtube', service: 'likes', sampleTarget: null, sampleUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { platform: 'youtube', service: 'views', sampleTarget: null, sampleUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  ];

  for (const combo of matrixCombinations) {
    describe(`${combo.platform.toUpperCase()} - ${combo.service.toUpperCase()}`, () => {
      it('A) nothing filled -> cards closed, cannot checkout', () => {
        const input: FunnelReadinessInput = {
          platform: combo.platform,
          service: combo.service,
        };
        const res = resolveFunnelReadiness(input);
        expect(res.canShowPlans).toBe(false);
        expect(res.canCheckout).toBe(false);
        expect(res.targetValid).toBe(false);
        expect(res.targetVerified).toBe(false);
        expect(res.emailValid).toBe(false);
      });

      it('B) target filled, not verified -> cards closed, cannot checkout', () => {
        const input: FunnelReadinessInput = {
          platform: combo.platform,
          service: combo.service,
          socialUsername: combo.sampleTarget,
          targetValue: combo.sampleTarget || combo.sampleUrl,
          targetUrl: combo.sampleUrl,
          verificationStatus: 'idle',
        };
        const res = resolveFunnelReadiness(input);
        expect(res.targetValid).toBe(true);
        expect(res.targetVerified).toBe(false);
        expect(res.canShowPlans).toBe(false);
        expect(res.canCheckout).toBe(false);
      });

      it('C) target verified, email empty -> cards closed, cannot checkout', () => {
        const input: FunnelReadinessInput = {
          platform: combo.platform,
          service: combo.service,
          socialUsername: combo.sampleTarget,
          targetValue: combo.sampleTarget || combo.sampleUrl,
          targetUrl: combo.sampleUrl,
          verificationStatus: 'success',
          verifiedTargetData: { id: 'test_123', username: combo.sampleTarget || 'test' },
          email: '',
        };
        const res = resolveFunnelReadiness(input);
        expect(res.targetValid).toBe(true);
        expect(res.targetVerified).toBe(true);
        expect(res.emailValid).toBe(false);
        expect(res.canShowPlans).toBe(false);
        expect(res.canCheckout).toBe(false);
      });

      it('D) email valid, target not verified -> cards closed, cannot checkout', () => {
        const input: FunnelReadinessInput = {
          platform: combo.platform,
          service: combo.service,
          email: 'valid@example.com',
          verificationStatus: 'idle',
        };
        const res = resolveFunnelReadiness(input);
        expect(res.emailValid).toBe(true);
        expect(res.targetVerified).toBe(false);
        expect(res.canShowPlans).toBe(false);
        expect(res.canCheckout).toBe(false);
      });

      it('E) target verified + email valid -> cards opened, can checkout', () => {
        const input: FunnelReadinessInput = {
          platform: combo.platform,
          service: combo.service,
          socialUsername: combo.sampleTarget,
          targetValue: combo.sampleTarget || combo.sampleUrl,
          targetUrl: combo.sampleUrl,
          verificationStatus: 'success',
          verifiedTargetData: { id: 'test_123', username: combo.sampleTarget || 'test' },
          email: 'valid@example.com',
        };
        const res = resolveFunnelReadiness(input);
        expect(res.targetValid).toBe(true);
        expect(res.targetVerified).toBe(true);
        expect(res.emailValid).toBe(true);
        expect(res.canShowPlans).toBe(true);
        expect(res.canCheckout).toBe(true);
        expect(res.step).toBe('READY_FOR_PLANS');
      });
    });
  }

  describe('Platform Switching Isolation', () => {
    it('Instagram verified -> switch to TikTok immediately closes cards and resets target', () => {
      const store = useFunnelStore.getState();
      store.setPlatform('instagram');
      store.setService('followers');
      store.setEmail('test@example.com');
      store.setTarget({
        targetType: 'profile',
        targetValue: 'ig_user',
        socialUsername: 'ig_user',
        profileUrl: 'https://www.instagram.com/ig_user',
        verificationStatus: 'success',
        verifiedTargetData: { username: 'ig_user' },
      });

      expect(useFunnelStore.getState().getReadiness().canShowPlans).toBe(true);

      // Switch to TikTok
      useFunnelStore.getState().setPlatform('tiktok');

      const readinessAfter = useFunnelStore.getState().getReadiness();
      expect(readinessAfter.canShowPlans).toBe(false);
      expect(readinessAfter.targetVerified).toBe(false);
      expect(useFunnelStore.getState().targetValue).toBeNull();
      expect(useFunnelStore.getState().socialUsername).toBeNull();
      expect(useFunnelStore.getState().verifiedTargetData).toBeNull();
      // Email is preserved
      expect(useFunnelStore.getState().email).toBe('test@example.com');
    });

    it('TikTok -> Twitter -> YouTube -> Instagram loop resets target each step', () => {
      const platforms = ['tiktok', 'twitter', 'youtube', 'instagram'] as const;
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        useFunnelStore.getState().setPlatform(p);
        useFunnelStore.getState().setService(p === 'youtube' ? 'likes' : 'followers');
        useFunnelStore.getState().setTarget({
          targetType: p === 'youtube' ? 'video' : 'profile',
          targetValue: 'user_' + p,
          socialUsername: p === 'youtube' ? null : 'user_' + p,
          targetUrl: p === 'youtube' ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : null,
          verificationStatus: 'success',
          verifiedTargetData: { user: p },
          email: 'loop@example.com',
        });
        expect(useFunnelStore.getState().getReadiness().canShowPlans).toBe(true);

        const nextP = platforms[(i + 1) % platforms.length];
        useFunnelStore.getState().setPlatform(nextP);
        expect(useFunnelStore.getState().getReadiness().canShowPlans).toBe(false);
        expect(useFunnelStore.getState().targetValue).toBeNull();
      }
    });
  });

  describe('Service Switching Isolation', () => {
    it('TikTok Followers (profile) -> TikTok Views (video) resets target and closes plans', () => {
      useFunnelStore.getState().setPlatform('tiktok');
      useFunnelStore.getState().setService('followers');
      useFunnelStore.getState().setEmail('tt@example.com');
      useFunnelStore.getState().setTarget({
        targetType: 'profile',
        targetValue: 'tt_user',
        socialUsername: 'tt_user',
        profileUrl: 'https://www.tiktok.com/@tt_user',
        verificationStatus: 'success',
        verifiedTargetData: { username: 'tt_user' },
      });

      expect(useFunnelStore.getState().getReadiness().canShowPlans).toBe(true);

      // Switch to Views
      useFunnelStore.getState().setService('views');

      const readinessAfter = useFunnelStore.getState().getReadiness();
      expect(readinessAfter.canShowPlans).toBe(false);
      expect(readinessAfter.targetVerified).toBe(false);
      expect(useFunnelStore.getState().targetValue).toBeNull();
    });

    it('TikTok Views (video) -> TikTok Followers (profile) resets target and closes plans', () => {
      useFunnelStore.getState().setPlatform('tiktok');
      useFunnelStore.getState().setService('views');
      useFunnelStore.getState().setEmail('tt@example.com');
      useFunnelStore.getState().setTarget({
        targetType: 'video',
        targetValue: 'https://www.tiktok.com/@tt_user/video/123456789',
        targetUrl: 'https://www.tiktok.com/@tt_user/video/123456789',
        verificationStatus: 'success',
        verifiedTargetData: { id: '123456789' },
      });

      expect(useFunnelStore.getState().getReadiness().canShowPlans).toBe(true);

      // Switch to Followers
      useFunnelStore.getState().setService('followers');

      const readinessAfter = useFunnelStore.getState().getReadiness();
      expect(readinessAfter.canShowPlans).toBe(false);
      expect(readinessAfter.targetVerified).toBe(false);
      expect(useFunnelStore.getState().targetUrl).toBeNull();
    });
  });
});
