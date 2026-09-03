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

  it('4. Ignores external bio link (record.link) and constructs canonical profile URL for Followers in funnel store', async () => {
    const { useFunnelStore } = await import('@/stores/funnel.store');
    useFunnelStore.getState().reset();

    const onContinue = vi.fn();
    const { container } = render(
      <GrowthPackageBuilder
        initialPlatform="tiktok"
        initialGoal="followers"
        onPlatformChange={vi.fn()}
        onGoalChange={vi.fn()}
        onContinue={onContinue}
      />
    );

    // Mock search/resolve with external bio link
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/leads/capture')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      }
      if (url.includes('/api/search/resolve')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            resolvedType: 'profile',
            data: {
              platform: 'tiktok',
              username: 'cloutflow.preview',
              full_name: 'CloutFlow Creator',
              link: 'cloutflow.co', // External bio link!
              followers_count: 55800,
            },
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    const inputs = container.querySelectorAll('.cf-pb-input input');
    const usernameInput = inputs[0];
    const emailInput = inputs[1];

    fireEvent.change(usernameInput, { target: { value: '@cloutflow.preview' } });
    fireEvent.change(emailInput, { target: { value: 'test@cloutflow.co' } });

    const analyzeBtn = container.querySelector('.cf-pb-analyze-btn');
    fireEvent.click(analyzeBtn!);

    // Wait for result stage
    await screen.findByText(/Yes, this is my profile/i);

    const state = useFunnelStore.getState();
    expect(state.targetType).toBe('profile');
    expect(state.targetValue).toBe('cloutflow.preview');
    expect(state.socialUsername).toBe('cloutflow.preview');
    expect(state.profileUrl).toBe('https://www.tiktok.com/@cloutflow.preview');
    expect(state.targetUrl).toBe('https://www.tiktok.com/@cloutflow.preview');
    expect(state.profileUrl).not.toContain('cloutflow.co');
    expect(state.targetUrl).not.toContain('cloutflow.co');
  });

  it('5. Ignores linktr.ee external bio link for Instagram in funnel store', async () => {
    const { useFunnelStore } = await import('@/stores/funnel.store');
    useFunnelStore.getState().reset();

    const onContinue = vi.fn();
    const { container } = render(
      <GrowthPackageBuilder
        initialPlatform="instagram"
        initialGoal="followers"
        onPlatformChange={vi.fn()}
        onGoalChange={vi.fn()}
        onContinue={onContinue}
      />
    );

    // Mock search/resolve with linktr.ee bio link
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/leads/capture')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      }
      if (url.includes('/api/search/resolve')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            resolvedType: 'profile',
            data: {
              platform: 'instagram',
              username: 'cloutflow.preview',
              full_name: 'CloutFlow Creator',
              link: 'https://linktr.ee/test', // External linktree bio link!
              followers_count: 78600,
            },
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    const inputs = container.querySelectorAll('.cf-pb-input input');
    const usernameInput = inputs[0];
    const emailInput = inputs[1];

    fireEvent.change(usernameInput, { target: { value: 'cloutflow.preview' } });
    fireEvent.change(emailInput, { target: { value: 'test@cloutflow.co' } });

    const analyzeBtn = container.querySelector('.cf-pb-analyze-btn');
    fireEvent.click(analyzeBtn!);

    await screen.findByText(/Yes, this is my profile/i);

    const state = useFunnelStore.getState();
    expect(state.targetType).toBe('profile');
    expect(state.targetValue).toBe('cloutflow.preview');
    expect(state.socialUsername).toBe('cloutflow.preview');
    expect(state.profileUrl).toBe('https://www.instagram.com/cloutflow.preview');
    expect(state.targetUrl).toBe('https://www.instagram.com/cloutflow.preview');
    expect(state.profileUrl).not.toContain('linktr.ee');
    expect(state.targetUrl).not.toContain('linktr.ee');
  });
});
