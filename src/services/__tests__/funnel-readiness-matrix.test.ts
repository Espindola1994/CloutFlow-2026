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

  describe('ETAPA 11D-0: Strict Funnel Regression Scenarios A through L', () => {
    it('A) fresh load -> canShowPlans=false', () => {
      useFunnelStore.getState().reset();
      const readiness = useFunnelStore.getState().getReadiness();
      expect(readiness.canShowPlans).toBe(false);
      expect(readiness.targetVerified).toBe(false);
      expect(readiness.canCheckout).toBe(false);
    });

    it('B) stale persisted unlocked state -> fresh validation relocks / resets to idle', () => {
      // If store is freshly reset or initialized without explicit confirmation
      useFunnelStore.getState().reset();
      expect(useFunnelStore.getState().getReadiness().canShowPlans).toBe(false);
      expect(useFunnelStore.getState().verificationStatus).toBe('idle');
      expect(useFunnelStore.getState().verifiedTargetData).toBeNull();
    });

    it('C) valid profile found -> targetValid=true, targetVerified=false, canShowPlans=false', () => {
      useFunnelStore.getState().reset();
      useFunnelStore.getState().setPlatform('instagram');
      useFunnelStore.getState().setService('followers');
      useFunnelStore.getState().setEmail('user@cloutflow.co');
      
      // Search found profile, but user has NOT clicked "Yes, this is my profile"
      useFunnelStore.getState().setTarget({
        targetType: 'profile',
        targetValue: 'found_user',
        socialUsername: 'found_user',
        profileUrl: 'https://www.instagram.com/found_user',
        email: 'user@cloutflow.co',
        verifiedTargetData: null, // Not confirmed yet
        verificationStatus: 'idle', // Not confirmed yet
      });

      const readiness = useFunnelStore.getState().getReadiness();
      expect(readiness.targetValid).toBe(true);
      expect(readiness.targetVerified).toBe(false);
      expect(readiness.canShowPlans).toBe(false);
      expect(readiness.canCheckout).toBe(false);
    });

    it('D) confirmation click -> targetVerified=true', () => {
      useFunnelStore.getState().reset();
      useFunnelStore.getState().setPlatform('instagram');
      useFunnelStore.getState().setService('followers');
      useFunnelStore.getState().setEmail('user@cloutflow.co');
      
      // User clicks "Yes, this is my profile"
      useFunnelStore.getState().setTarget({
        targetType: 'profile',
        targetValue: 'found_user',
        socialUsername: 'found_user',
        profileUrl: 'https://www.instagram.com/found_user',
        email: 'user@cloutflow.co',
        verifiedTargetData: { username: 'found_user', verified: true },
        verificationStatus: 'success',
      });

      const readiness = useFunnelStore.getState().getReadiness();
      expect(readiness.targetValid).toBe(true);
      expect(readiness.targetVerified).toBe(true);
    });

    it('E) only after all required gates -> canShowPlans=true', () => {
      useFunnelStore.getState().reset();
      useFunnelStore.getState().setPlatform('instagram');
      useFunnelStore.getState().setService('followers');
      useFunnelStore.getState().setEmail('user@cloutflow.co');
      
      useFunnelStore.getState().setTarget({
        targetType: 'profile',
        targetValue: 'found_user',
        socialUsername: 'found_user',
        profileUrl: 'https://www.instagram.com/found_user',
        email: 'user@cloutflow.co',
        verifiedTargetData: { username: 'found_user' },
        verificationStatus: 'success',
      });

      const readiness = useFunnelStore.getState().getReadiness();
      expect(readiness.targetValid).toBe(true);
      expect(readiness.targetVerified).toBe(true);
      expect(readiness.emailValid).toBe(true);
      expect(readiness.canShowPlans).toBe(true);
      expect(readiness.canCheckout).toBe(true);
    });

    it('F) target change -> relock', () => {
      // Start in confirmed state
      useFunnelStore.getState().setPlatform('instagram');
      useFunnelStore.getState().setService('followers');
      useFunnelStore.getState().setEmail('user@cloutflow.co');
      useFunnelStore.getState().setTarget({
        targetType: 'profile',
        targetValue: 'initial_user',
        socialUsername: 'initial_user',
        verificationStatus: 'success',
        verifiedTargetData: { username: 'initial_user' },
      });
      expect(useFunnelStore.getState().getReadiness().canShowPlans).toBe(true);

      // User resets or modifies target
      useFunnelStore.getState().resetTarget();
      const readinessAfter = useFunnelStore.getState().getReadiness();
      expect(readinessAfter.targetVerified).toBe(false);
      expect(readinessAfter.canShowPlans).toBe(false);
      expect(readinessAfter.canCheckout).toBe(false);
    });

    it('G) service change -> relock', () => {
      useFunnelStore.getState().setPlatform('instagram');
      useFunnelStore.getState().setService('followers');
      useFunnelStore.getState().setEmail('user@cloutflow.co');
      useFunnelStore.getState().setTarget({
        targetType: 'profile',
        targetValue: 'user_a',
        socialUsername: 'user_a',
        verificationStatus: 'success',
        verifiedTargetData: { username: 'user_a' },
      });
      expect(useFunnelStore.getState().getReadiness().canShowPlans).toBe(true);

      // Switch service
      useFunnelStore.getState().setService('likes');
      const readinessAfter = useFunnelStore.getState().getReadiness();
      expect(readinessAfter.targetVerified).toBe(false);
      expect(readinessAfter.canShowPlans).toBe(false);
      expect(readinessAfter.canCheckout).toBe(false);
    });

    it('H) platform change -> relock', () => {
      useFunnelStore.getState().setPlatform('instagram');
      useFunnelStore.getState().setService('followers');
      useFunnelStore.getState().setEmail('user@cloutflow.co');
      useFunnelStore.getState().setTarget({
        targetType: 'profile',
        targetValue: 'user_a',
        socialUsername: 'user_a',
        verificationStatus: 'success',
        verifiedTargetData: { username: 'user_a' },
      });
      expect(useFunnelStore.getState().getReadiness().canShowPlans).toBe(true);

      // Switch platform
      useFunnelStore.getState().setPlatform('twitter');
      const readinessAfter = useFunnelStore.getState().getReadiness();
      expect(readinessAfter.targetVerified).toBe(false);
      expect(readinessAfter.canShowPlans).toBe(false);
      expect(readinessAfter.canCheckout).toBe(false);
    });

    it('I) failed search -> canShowPlans=false', () => {
      useFunnelStore.getState().reset();
      useFunnelStore.getState().setPlatform('instagram');
      useFunnelStore.getState().setService('followers');
      useFunnelStore.getState().setEmail('user@cloutflow.co');
      useFunnelStore.getState().setVerificationStatus('error');

      const readiness = useFunnelStore.getState().getReadiness();
      expect(readiness.targetVerified).toBe(false);
      expect(readiness.canShowPlans).toBe(false);
      expect(readiness.canCheckout).toBe(false);
    });

    it('J) invalid content URL -> canShowPlans=false', () => {
      const res = resolveFunnelReadiness({
        platform: 'instagram',
        service: 'likes',
        targetType: 'post',
        targetUrl: 'not_a_valid_url',
        email: 'user@cloutflow.co',
        verificationStatus: 'success',
        verifiedTargetData: { id: 'test' },
      });
      expect(res.targetValid).toBe(false);
      expect(res.canShowPlans).toBe(false);
    });

    it('K) YouTube channel URL for Views -> blocked', () => {
      const channelUrls = [
        'https://www.youtube.com/@channelName',
        'https://www.youtube.com/channel/UC1234567890',
        'https://www.youtube.com/@somecreator/about',
        'https://www.youtube.com/c/CreatorName',
      ];

      for (const channelUrl of channelUrls) {
        const res = resolveFunnelReadiness({
          platform: 'youtube',
          service: 'views',
          targetType: 'video',
          targetUrl: channelUrl,
          email: 'user@cloutflow.co',
          verificationStatus: 'success',
          verifiedTargetData: { id: 'fake_channel' },
        });

        expect(res.targetValid).toBe(false);
        expect(res.targetVerified).toBe(false);
        expect(res.canShowPlans).toBe(false);
        expect(res.canCheckout).toBe(false);
      }
    });

    it('L) YouTube video URL -> valid content path', () => {
      const videoUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      ];

      for (const videoUrl of videoUrls) {
        const res = resolveFunnelReadiness({
          platform: 'youtube',
          service: 'views',
          targetType: 'video',
          targetUrl: videoUrl,
          email: 'user@cloutflow.co',
          verificationStatus: 'success',
          verifiedTargetData: { id: 'dQw4w9WgXcQ' },
        });

        expect(res.targetValid).toBe(true);
        expect(res.targetVerified).toBe(true);
        expect(res.canShowPlans).toBe(true);
        expect(res.canCheckout).toBe(true);
      }
    });
  });
});
