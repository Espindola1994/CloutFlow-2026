import { notFound, permanentRedirect } from "next/navigation";

const LEGACY_PLATFORMS = new Set(["instagram", "tiktok", "youtube", "twitter", "x"]);
const LEGACY_SERVICES = new Set(["follower", "followers", "like", "likes", "view", "views", "comments"]);

export default async function PlansPage({
  params,
}: {
  params: Promise<{ platform: string; service: string }>;
}) {
  const { platform, service } = await params;
  if (
    LEGACY_PLATFORMS.has(platform.toLowerCase()) &&
    LEGACY_SERVICES.has(service.toLowerCase())
  ) {
    permanentRedirect("/");
  }

  notFound();
}


