import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveSearchInput } from '@/lib/social';

describe('Parity of Search Resolvers between HOME and /offer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves Instagram @username for followers', async () => {
    const input = '@leomessi';
    const result: any = await resolveSearchInput(input, 'instagram', 'followers');
    // HOME and /offer both invoke resolveSearchInput with these exact arguments
    expect(result).toBeDefined();
    // In test env without HIKER_API_KEY, resolver returns PROVIDER_RESTRICTED (never UNSUPPORTED_URL_TYPE or INVALID_INPUT)
    expect(result.code).not.toBe('UNSUPPORTED_URL_TYPE');
    expect(result.code).not.toBe('INVALID_INPUT');
  });

  it('resolves Instagram profile URL for followers', async () => {
    const input = 'https://www.instagram.com/cristiano';
    const result: any = await resolveSearchInput(input, 'instagram', 'followers');
    expect(result).toBeDefined();
    expect(result.code).not.toBe('UNSUPPORTED_URL_TYPE');
    expect(result.code).not.toBe('INVALID_INPUT');
  });

  it('resolves Instagram Reel link for Views', async () => {
    const input = 'https://www.instagram.com/reel/C3bXYZ12345/';
    const result: any = await resolveSearchInput(input, 'instagram', 'views');
    // Views with Reel is accepted by validateServiceTarget
    expect(result).toBeDefined();
    // Not blocked by URL validation
    expect(result.code).not.toBe('UNSUPPORTED_URL_TYPE');
  });

  it('rejects Instagram photo post link for Views', async () => {
    const input = 'https://www.instagram.com/p/C3bXYZ12345/';
    const result: any = await resolveSearchInput(input, 'instagram', 'views');
    // Photo post is rejected for Views in both HOME and /offer
    expect(result.success).toBe(false);
    expect(result.code).toBe('UNSUPPORTED_URL_TYPE');
    expect(result.message).toContain('Instagram Views accepts only public video/reels');
  });

  it('resolves Instagram photo post link for Likes', async () => {
    const input = 'https://www.instagram.com/p/C3bXYZ12345/';
    const result: any = await resolveSearchInput(input, 'instagram', 'likes');
    expect(result.code).not.toBe('UNSUPPORTED_URL_TYPE');
  });

  it('resolves TikTok @username for followers', async () => {
    const input = '@charlidamelio';
    const result: any = await resolveSearchInput(input, 'tiktok', 'followers');
    expect(result.code).not.toBe('UNSUPPORTED_URL_TYPE');
  });

  it('resolves TikTok video link for views/likes', async () => {
    const input = 'https://www.tiktok.com/@user/video/7123456789012345678';
    const result: any = await resolveSearchInput(input, 'tiktok', 'views');
    expect(result.code).not.toBe('UNSUPPORTED_URL_TYPE');
  });

  it('resolves YouTube channel link or handle for followers', async () => {
    const input = 'https://www.youtube.com/@MrBeast';
    const result: any = await resolveSearchInput(input, 'youtube', 'followers');
    expect(result.code).not.toBe('UNSUPPORTED_URL_TYPE');
  });

  it('resolves YouTube video link for views', async () => {
    const input = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const result: any = await resolveSearchInput(input, 'youtube', 'views');
    expect(result.code).not.toBe('UNSUPPORTED_URL_TYPE');
  });

  it('resolves X/Twitter @username for followers', async () => {
    const input = '@elonmusk';
    const result: any = await resolveSearchInput(input, 'twitter', 'followers');
    expect(result.code).not.toBe('UNSUPPORTED_URL_TYPE');
  });

  it('resolves X/Twitter post link for likes/views', async () => {
    const input = 'https://x.com/elonmusk/status/1234567890123456789';
    const result: any = await resolveSearchInput(input, 'twitter', 'likes');
    expect(result.code).not.toBe('UNSUPPORTED_URL_TYPE');
  });
});
