import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GrowthPackageBuilder from '../growth-package-builder';

describe('GrowthPackageBuilder - YouTube Matrix & Normalization', () => {
  it('1. YouTube shows only Likes and Views in goal selector', () => {
    const { container } = render(
      <GrowthPackageBuilder
        initialPlatform="youtube"
        initialGoal="likes"
        onPlatformChange={vi.fn()}
        onGoalChange={vi.fn()}
        onContinue={vi.fn()}
      />
    );

    const goalButtons = container.querySelectorAll('.cf-pb-goals button');
    expect(goalButtons.length).toBe(2);
    expect(container.querySelector('.cf-pb-goals')).toHaveTextContent('Likes');
    expect(container.querySelector('.cf-pb-goals')).toHaveTextContent('Views');
    expect(container.querySelector('.cf-pb-goals')).not.toHaveTextContent('Followers');
  });

  it('2. Switching from Instagram Followers to YouTube normalizes goal to Likes', () => {
    const onGoalChange = vi.fn();
    const onPlatformChange = vi.fn();

    const { container } = render(
      <GrowthPackageBuilder
        initialPlatform="instagram"
        initialGoal="followers"
        onPlatformChange={onPlatformChange}
        onGoalChange={onGoalChange}
        onContinue={vi.fn()}
      />
    );

    expect(container.querySelector('.cf-pb-goals')).toHaveTextContent('Followers');

    // Click YouTube platform button
    const ytButton = Array.from(container.querySelectorAll('.cf-pb-platforms button')).find(
      (b) => b.textContent?.includes('YouTube')
    );
    expect(ytButton).toBeDefined();
    fireEvent.click(ytButton!);

    expect(onPlatformChange).toHaveBeenCalledWith('youtube');
    expect(onGoalChange).toHaveBeenCalledWith('likes');
  });

  it('3. Instagram shows Followers, Likes, Views', () => {
    const { container } = render(
      <GrowthPackageBuilder
        initialPlatform="instagram"
        initialGoal="followers"
        onPlatformChange={vi.fn()}
        onGoalChange={vi.fn()}
        onContinue={vi.fn()}
      />
    );

    const goalButtons = container.querySelectorAll('.cf-pb-goals button');
    expect(goalButtons.length).toBe(3);
    expect(container.querySelector('.cf-pb-goals')).toHaveTextContent('Followers');
    expect(container.querySelector('.cf-pb-goals')).toHaveTextContent('Likes');
    expect(container.querySelector('.cf-pb-goals')).toHaveTextContent('Views');
  });
});
