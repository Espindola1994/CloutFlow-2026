/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @next/next/no-img-element, jsx-a11y/alt-text */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { RepeatProfilePresentation } from '../RepeatProfilePresentation';
import { OFFER_PLATFORM_THEMES } from '../theme';

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

describe('RepeatProfilePresentation Component', () => {
  const theme = OFFER_PLATFORM_THEMES.instagram;

  it('renders with real avatar image when avatarUrl is provided', () => {
    render(
      <RepeatProfilePresentation
        identity={{
          platform: 'instagram',
          username: 'guilhermeterraaa',
          avatarUrl: 'https://example.com/real-avatar.jpg',
          maskedEmail: 'gui*****@gmail.com',
          isConfirmed: false,
        }}
        theme={theme}
        size="lg"
      />
    );

    const img = screen.getByAltText('guilhermeterraaa');
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe('https://example.com/real-avatar.jpg');
    expect(screen.getByText('@guilhermeterraaa')).toBeDefined();
    expect(screen.getByText('gui*****@gmail.com')).toBeDefined();
    expect(screen.getByText('Last Used')).toBeDefined();
  });

  it('renders confirmed badge when isConfirmed is true', () => {
    render(
      <RepeatProfilePresentation
        identity={{
          platform: 'instagram',
          username: 'guilhermeterraaa',
          avatarUrl: 'https://example.com/fresh-avatar.jpg',
          maskedEmail: 'gui*****@gmail.com',
          isConfirmed: true,
        }}
        theme={theme}
        size="md"
      />
    );

    expect(screen.getByText('Confirmed')).toBeDefined();
  });

  it('falls back cleanly to neutral placeholder if avatarUrl is null', () => {
    render(
      <RepeatProfilePresentation
        identity={{
          platform: 'tiktok',
          username: 'tiktokcreator',
          avatarUrl: null,
          maskedEmail: 'tik*****@gmail.com',
          isConfirmed: false,
        }}
        theme={OFFER_PLATFORM_THEMES.tiktok}
        size="sm"
      />
    );

    expect(screen.getByText('@tiktokcreator')).toBeDefined();
    expect(screen.getByText('tik*****@gmail.com')).toBeDefined();
    expect(screen.queryByAltText('tiktokcreator')).toBeNull();
  });
});
