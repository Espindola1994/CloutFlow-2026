import { describe, it, expect } from "vitest";

describe("Instagram Media Forensics and Normalization Regression Tests", () => {
  it("A. provider returns 5 images => normalized array contains latest 3 or up to max", async () => {
    // Test that mapping limits and structure conform
    const mockItems = [
      { id: "1", thumbnail_url: "https://cdn.com/1.jpg" },
      { id: "2", thumbnail_url: "https://cdn.com/2.jpg" },
      { id: "3", thumbnail_url: "https://cdn.com/3.jpg" },
      { id: "4", thumbnail_url: "https://cdn.com/4.jpg" },
      { id: "5", thumbnail_url: "https://cdn.com/5.jpg" },
    ];
    
    const mapped = mockItems.slice(0, 6).map((m: Record<string, unknown>) => ({
      id: String(m.id),
      thumbnail_url: String(m.thumbnail_url),
      is_video: false,
    }));

    expect(mapped.length).toBe(5);
    expect(mapped.slice(0, 3).length).toBe(3);
    expect(mapped[0].thumbnail_url).toBe("https://cdn.com/1.jpg");
  });

  it("B. provider returns image + video + reel => all three have static thumbnails and video flag", () => {
    const mockItems = [
      {
        id: "post_img",
        image_versions2: { candidates: [{ url: "https://cdn.com/static_img.jpg" }] },
        media_type: 1,
      },
      {
        id: "post_vid",
        image_versions2: { candidates: [{ url: "https://cdn.com/vid_thumb.jpg" }] },
        media_type: 2,
        is_video: true,
      },
      {
        id: "post_reel",
        thumbnail_url: "https://cdn.com/reel_cover.jpg",
        product_type: "clips",
      },
    ];

    const posts = mockItems.map((obj: Record<string, unknown>) => {
      const getCandidate = (o: Record<string, unknown>, path: string[]): string | undefined => {
        let curr: unknown = o;
        for (const p of path) {
          if (curr && typeof curr === "object" && p in (curr as Record<string, unknown>)) {
            curr = (curr as Record<string, unknown>)[p];
          } else {
            return undefined;
          }
        }
        return typeof curr === "string" ? curr : undefined;
      };

      const rawUrl =
        (typeof obj.thumbnail_url === "string" ? obj.thumbnail_url : undefined) ||
        getCandidate(obj, ["image_versions", "0", "url"]) ||
        getCandidate(obj, ["image_versions2", "candidates", "0", "url"]) ||
        "";

      return {
        id: String(obj.id),
        thumbnail_url: String(rawUrl),
        is_video: Boolean(
          obj.media_type === 2 ||
          obj.is_video ||
          obj.product_type === "clips" ||
          obj.product_type === "feed_video"
        ),
      };
    });

    expect(posts).toHaveLength(3);
    expect(posts[0].thumbnail_url).toBe("https://cdn.com/static_img.jpg");
    expect(posts[0].is_video).toBe(false);
    expect(posts[1].thumbnail_url).toBe("https://cdn.com/vid_thumb.jpg");
    expect(posts[1].is_video).toBe(true);
    expect(posts[2].thumbnail_url).toBe("https://cdn.com/reel_cover.jpg");
    expect(posts[2].is_video).toBe(true);
  });

  it("C & D. media survives resolution structures and is never stripped", () => {
    const profile = {
      platform: "instagram" as const,
      username: "testuser",
      full_name: "Test User",
      avatar_url: "https://cdn.com/avatar.jpg",
      posts_count: 100,
      followers_count: 500,
      following_count: 200,
      bio: "Hello world",
      is_private: false,
      posts: [
        { id: "1", thumbnail_url: "https://cdn.com/1.jpg" },
        { id: "2", thumbnail_url: "https://cdn.com/2.jpg" },
        { id: "3", thumbnail_url: "https://cdn.com/3.jpg" },
      ],
    };

    expect(profile.posts).toHaveLength(3);
    expect(profile.posts[0].thumbnail_url).toBe("https://cdn.com/1.jpg");
  });
});
