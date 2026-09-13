import { describe, it, expect } from "vitest";
import publicManifest from "../../../app/manifest";
import { GET as getAdminManifest } from "../../../app/admin/manifest.json/route";

describe("Dual PWA Manifest Architecture Validation", () => {
  it("1. Public manifest has correct id, start_url, scope, name, and icons", () => {
    const pub = publicManifest();

    expect(pub.id).toBe("/");
    expect(pub.name).toBe("CloutFlow");
    expect(pub.short_name).toBe("CloutFlow");
    expect(pub.start_url).toBe("/");
    expect(pub.scope).toBe("/");
    expect(pub.display).toBe("standalone");
    expect(pub.icons && pub.icons.length).toBeGreaterThanOrEqual(2);
  });

  it("2. Admin manifest has correct id, start_url, scope, name, and icons", async () => {
    const response = getAdminManifest();
    const admin = await response.json();

    expect(admin.id).toBe("/admin");
    expect(admin.name).toBe("CloutFlow Admin");
    expect(admin.short_name).toBe("CF Admin");
    expect(admin.start_url).toBe("/admin");
    expect(admin.scope).toBe("/admin/");
    expect(admin.display).toBe("standalone");
    expect(admin.icons && admin.icons.length).toBeGreaterThanOrEqual(2);
  });

  it("3. Public and Admin manifests have distinct, non-overlapping IDs, scopes, and start_urls", async () => {
    const pub = publicManifest();
    const response = getAdminManifest();
    const admin = await response.json();

    // Critical independence requirements
    expect(pub.id).not.toBe(admin.id);
    expect(pub.start_url).not.toBe(admin.start_url);
    expect(pub.scope).not.toBe(admin.scope);
    expect(pub.name).not.toBe(admin.name);
    expect(pub.short_name).not.toBe(admin.short_name);

    // Scopes check
    expect(pub.scope).toBe("/");
    expect(admin.scope).toBe("/admin/");
  });
});
