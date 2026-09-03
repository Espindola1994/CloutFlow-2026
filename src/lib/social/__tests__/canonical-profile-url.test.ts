import { describe, it, expect } from "vitest";
import { buildCanonicalProfileUrl } from "../normalize";

describe("buildCanonicalProfileUrl", () => {
  it("generates correct canonical TikTok profile URL without bio link", () => {
    expect(buildCanonicalProfileUrl("tiktok", "cloutflow.preview")).toBe("https://www.tiktok.com/@cloutflow.preview");
    expect(buildCanonicalProfileUrl("tiktok", "@cloutflow.preview")).toBe("https://www.tiktok.com/@cloutflow.preview");
    expect(buildCanonicalProfileUrl("tiktok", "  @cloutflow.preview/  ")).toBe("https://www.tiktok.com/@cloutflow.preview");
  });

  it("generates correct canonical Instagram profile URL", () => {
    expect(buildCanonicalProfileUrl("instagram", "cloutflow.preview")).toBe("https://www.instagram.com/cloutflow.preview");
    expect(buildCanonicalProfileUrl("instagram", "@cloutflow.preview")).toBe("https://www.instagram.com/cloutflow.preview");
  });

  it("generates correct canonical Twitter/X profile URL without missing slash", () => {
    expect(buildCanonicalProfileUrl("twitter", "CloutFlowPreview")).toBe("https://x.com/CloutFlowPreview");
    expect(buildCanonicalProfileUrl("twitter", "@CloutFlowPreview")).toBe("https://x.com/CloutFlowPreview");
    expect(buildCanonicalProfileUrl("twitter", "CloutFlowPreview")).not.toBe("https://x.comCloutFlowPreview");
  });

  it("returns null for unsupported platforms or empty inputs", () => {
    expect(buildCanonicalProfileUrl("youtube", "cloutflowpreview")).toBeNull();
    expect(buildCanonicalProfileUrl("tiktok", "")).toBeNull();
    expect(buildCanonicalProfileUrl("instagram", null)).toBeNull();
    expect(buildCanonicalProfileUrl("twitter", undefined)).toBeNull();
  });
});
