import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OfferOption10Experience } from '../OfferOption10Experience';
import { OFFER_PLATFORM_THEMES } from '../theme';

describe('OfferOption10Experience - YouTube Service Matrix Rules', () => {
  const baseProps = {
    flowStep: 'PREFILL' as const,
    previousTarget: null,
    liveAvatarUrl: null,
    isLoadingLiveAvatar: false,
    targetPlatform: 'youtube' as const,
    setTargetPlatform: vi.fn(),
    targetService: 'likes' as const,
    setTargetService: vi.fn(),
    emailValue: 'user@example.com',
    setEmailValue: vi.fn(),
    lookupInput: '',
    setLookupInput: vi.fn(),
    lookupError: null,
    verifiedProfile: null,
    isProfileRestricted: false,
    theme: OFFER_PLATFORM_THEMES.youtube,
    eligiblePackages: [],
    selectedPackageId: null,
    couponCode: 'FLOW25',
    timeLeft: '23:59:59',
    copied: false,
    checkoutSubmitting: false,
    checkoutError: null,
    onUseSavedProfile: vi.fn(),
    onChooseAnother: vi.fn(),
    onSearch: vi.fn(),
    onCancelSearch: vi.fn(),
    onConfirmFound: vi.fn(),
    onBackToSaved: vi.fn(),
    onSelectPackage: vi.fn(),
    onChangeProfile: vi.fn(),
    onCopyCoupon: vi.fn(),
    onExecuteCheckout: vi.fn(),
  };

  it('1. YouTube renders only Likes and Views buttons, never Followers', () => {
    render(<OfferOption10Experience {...baseProps} targetPlatform="youtube" />);

    expect(screen.getByText('Likes')).toBeDefined();
    expect(screen.getByText('Views')).toBeDefined();
    expect(screen.queryByText('Followers')).toBeNull();
  });

  it('2. Instagram renders Followers, Likes, Views buttons', () => {
    render(<OfferOption10Experience {...baseProps} targetPlatform="instagram" targetService="followers" />);

    expect(screen.getByText('Followers')).toBeDefined();
    expect(screen.getByText('Likes')).toBeDefined();
    expect(screen.getByText('Views')).toBeDefined();
  });

  it('3. TikTok renders Followers, Likes, Views buttons', () => {
    render(<OfferOption10Experience {...baseProps} targetPlatform="tiktok" targetService="followers" />);

    expect(screen.getByText('Followers')).toBeDefined();
    expect(screen.getByText('Likes')).toBeDefined();
    expect(screen.getByText('Views')).toBeDefined();
  });

  it('4. X (Twitter) renders Followers, Likes, Views buttons', () => {
    render(<OfferOption10Experience {...baseProps} targetPlatform="twitter" targetService="followers" />);

    expect(screen.getByText('Followers')).toBeDefined();
    expect(screen.getByText('Likes')).toBeDefined();
    expect(screen.getByText('Views')).toBeDefined();
  });

  it('5. Immediate visual feedback on Network change', () => {
    const setTargetPlatform = vi.fn();
    render(<OfferOption10Experience {...baseProps} targetPlatform="instagram" setTargetPlatform={setTargetPlatform} />);

    const tiktokBtn = screen.getByRole('button', { name: /tiktok/i });
    expect(tiktokBtn.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(tiktokBtn);

    // Visual selection updates immediately via local state
    expect(tiktokBtn.getAttribute('aria-pressed')).toBe('true');
    expect(tiktokBtn.className).toContain('is-active');
    expect(setTargetPlatform).toHaveBeenCalledWith('tiktok');
  });

  it('6. Immediate visual feedback on Service/Goal change', () => {
    const setTargetService = vi.fn();
    render(<OfferOption10Experience {...baseProps} targetPlatform="instagram" targetService="followers" setTargetService={setTargetService} />);

    const likesBtn = screen.getByRole('button', { name: /likes/i });
    expect(likesBtn.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(likesBtn);

    // Visual selection updates immediately
    expect(likesBtn.getAttribute('aria-pressed')).toBe('true');
    expect(likesBtn.className).toContain('is-active');
    expect(setTargetService).toHaveBeenCalledWith('likes');
  });
});
