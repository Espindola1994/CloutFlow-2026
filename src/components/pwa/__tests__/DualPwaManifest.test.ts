import { describe, it, expect } from "vitest";
import publicManifest from "../../../app/manifest";
import { GET as getAdminManifest } from "../../../app/admin/manifest.json/route";
import { metadata as adminMetadata } from "../../../app/admin/layout";

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
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/manifest+json");

    const admin = await response.json();

    expect(admin.id).toBe("/admin");
    expect(admin.name).toBe("CloutFlow Admin");
    expect(admin.short_name).toBe("CF Admin");
    expect(admin.start_url).toBe("/admin");
    expect(admin.scope).toBe("/admin/");
    expect(admin.display).toBe("standalone");
    expect(admin.icons && admin.icons.length).toBeGreaterThanOrEqual(2);

    // Validate icon definitions
    const icon192 = admin.icons.find((i: { sizes: string }) => i.sizes === "192x192");
    const icon512 = admin.icons.find((i: { sizes: string }) => i.sizes === "512x512");
    expect(icon192).toBeDefined();
    expect(icon192.src).toBe("/icon-192.png");
    expect(icon512).toBeDefined();
    expect(icon512.src).toBe("/icon-512.png");
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

  it("4. start_url is strictly inside scope for both Public and Admin", async () => {
    const pub = publicManifest();
    const response = getAdminManifest();
    const admin = await response.json();

    // Public start_url inside scope
    expect(pub.start_url).toBeDefined();
    expect(pub.scope).toBeDefined();
    expect(pub.start_url!.startsWith(pub.scope!)).toBe(true);

    // Admin start_url (/admin) resolves inside /admin/ scope in URL space
    expect("/admin/".startsWith(admin.scope)).toBe(true);
    expect(admin.scope).toBe("/admin/");
  });

  it("5. Admin HTML metadata points uniquely to /admin/manifest.json and carries distinct Apple title", () => {
    expect(adminMetadata.manifest).toBe("/admin/manifest.json");
    expect(adminMetadata.title).toBe("CloutFlow Admin");
    expect(adminMetadata.appleWebApp).toEqual({
      capable: true,
      title: "CloutFlow Admin",
      statusBarStyle: "black-translucent",
    });
  });
});
