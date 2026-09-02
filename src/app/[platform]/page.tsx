import { notFound, permanentRedirect } from "next/navigation";

const LEGACY_PLATFORMS = new Set(["instagram", "tiktok", "youtube", "twitter", "x"]);

export default async function PlatformPage({
  params,
}: {
  params: Promise<{ platform: string }>;
}) {
  const { platform } = await params;
  if (LEGACY_PLATFORMS.has(platform.toLowerCase())) {
    permanentRedirect("/");
  }

  notFound();
}

