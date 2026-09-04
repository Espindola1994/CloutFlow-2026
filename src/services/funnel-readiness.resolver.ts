import { CommercialPlatform, CommercialService } from './commercial-offer.resolver';
import { validateEmailFormat, buildCanonicalProfileUrl } from '@/lib/social/normalize';
import { validateSafeUrl } from '@/lib/social/security';

export type FunnelStateStep =
  | 'SELECTING'
  | 'TARGET_REQUIRED'
  | 'VERIFYING'
  | 'TARGET_VERIFIED'
  | 'EMAIL_REQUIRED'
  | 'READY_FOR_PLANS'
  | 'CHECKOUT_PENDING';

export type VerificationStatus = 'idle' | 'pending' | 'success' | 'error';

export interface FunnelReadinessInput {
  platform: CommercialPlatform | string | null;
  service: CommercialService | string | null;
  targetType?: string | null;
  targetValue?: string | null;
  targetUrl?: string | null;
  socialUsername?: string | null;
  profileUrl?: string | null;
  verificationStatus?: VerificationStatus | null;
  verifiedTargetData?: Record<string, unknown> | null;
  email?: string | null;
}

export interface FunnelReadinessResult {
  step: FunnelStateStep;
  targetValid: boolean;
  targetVerified: boolean;
  emailValid: boolean;
  canShowPlans: boolean;
  canCheckout: boolean;
  normalizedUsername: string | null;
  canonicalProfileUrl: string | null;
  resolvedTargetUrl: string | null;
  resolvedTargetValue: string | null;
  resolvedTargetType: 'profile' | 'post' | 'video' | 'channel' | null;
  normalizedEmail: string | null;
  reason: string | null;
}

/**
 * Single source of truth for Funnel gating, readiness, and checkout eligibility.
 */
export function resolveFunnelReadiness(input: FunnelReadinessInput): FunnelReadinessResult {
  const platform = (input.platform?.toLowerCase().trim() || 'instagram') as CommercialPlatform;
  const service = (input.service?.toLowerCase().trim() || 'followers') as CommercialService;
  const verificationStatus: VerificationStatus = input.verificationStatus || 'idle';

  // 1. YouTube Followers is unsupported
  if (platform === 'youtube' && service === 'followers') {
    return {
      step: 'SELECTING',
      targetValid: false,
      targetVerified: false,
      emailValid: false,
      canShowPlans: false,
      canCheckout: false,
      normalizedUsername: null,
      canonicalProfileUrl: null,
      resolvedTargetUrl: null,
      resolvedTargetValue: null,
      resolvedTargetType: null,
      normalizedEmail: null,
      reason: 'YouTube followers service is not supported.',
    };
  }

  const isFollowers = service === 'followers';
  const isContent = service === 'likes' || service === 'views';

  // Resolve target type
  const resolvedTargetType: 'profile' | 'post' | 'video' | 'channel' = isFollowers
    ? 'profile'
    : platform === 'youtube' || platform === 'tiktok'
      ? 'video'
      : 'post';

  // Evaluate Target Validity
  let targetValid = false;
  let normalizedUsername: string | null = null;
  let canonicalProfileUrl: string | null = null;
  let resolvedTargetUrl: string | null = null;
  let resolvedTargetValue: string | null = null;

  if (isFollowers) {
    const rawUsername = input.socialUsername || input.targetValue || null;
    if (rawUsername && typeof rawUsername === 'string') {
      const cleanUser = rawUsername.trim().replace(/^@+/, '').replace(/\/+$/, '').trim();
      if (cleanUser.length > 0 && !cleanUser.includes('/') && !cleanUser.includes(' ')) {
        normalizedUsername = cleanUser;
        canonicalProfileUrl = buildCanonicalProfileUrl(platform, cleanUser);
        resolvedTargetValue = cleanUser;
        resolvedTargetUrl = canonicalProfileUrl;
        targetValid = true;
      }
    }
  } else if (isContent) {
    const rawUrl = input.targetUrl || input.targetValue || null;
    if (rawUrl && typeof rawUrl === 'string') {
      const trimmedUrl = rawUrl.trim();
      const safeValidation = validateSafeUrl(trimmedUrl, platform);
      if (safeValidation.isSafe && safeValidation.url) {
        resolvedTargetUrl = trimmedUrl;
        resolvedTargetValue = trimmedUrl;
        targetValid = true;
      }
    }
  }

  // Target Verification Evaluation
  const targetVerified = Boolean(targetValid && verificationStatus === 'success' && input.verifiedTargetData);

  // Email Evaluation
  const emailRes = validateEmailFormat(input.email || '');
  const emailValid = Boolean(emailRes.isValid && emailRes.normalized);
  const normalizedEmail = emailRes.isValid && emailRes.normalized ? emailRes.normalized : null;

  // Determine Stage and Readiness
  let step: FunnelStateStep = 'SELECTING';
  let reason: string | null = null;

  if (!targetValid) {
    step = 'TARGET_REQUIRED';
    reason = isFollowers
      ? 'Enter your profile username before continuing.'
      : 'Enter the post or video URL before continuing.';
  } else if (verificationStatus === 'pending') {
    step = 'VERIFYING';
    reason = 'Verifying target...';
  } else if (!targetVerified) {
    step = 'TARGET_REQUIRED';
    reason = isFollowers
      ? 'Profile must be verified before continuing.'
      : 'Content link must be verified before continuing.';
  } else if (!emailValid) {
    step = 'EMAIL_REQUIRED';
    reason = 'Enter a valid email address before continuing.';
  } else {
    step = 'READY_FOR_PLANS';
  }

  const canShowPlans = step === 'READY_FOR_PLANS';
  const canCheckout = canShowPlans && targetVerified && emailValid;

  return {
    step,
    targetValid,
    targetVerified,
    emailValid,
    canShowPlans,
    canCheckout,
    normalizedUsername,
    canonicalProfileUrl,
    resolvedTargetUrl,
    resolvedTargetValue,
    resolvedTargetType,
    normalizedEmail,
    reason,
  };
}
