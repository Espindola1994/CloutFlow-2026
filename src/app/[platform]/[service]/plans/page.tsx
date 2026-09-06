import { notFound } from "next/navigation";
import HomePage from "@/app/page";
import { PLATFORM_SERVICES, normalizePlatform, normalizeService } from "@/services/commercial-offer.resolver";

export default async function PlansPage({
  params,
}: {
  params: Promise<{ platform: string; service: string }>;
}) {
  const { platform, service } = await params;
  const normalizedPlatform = normalizePlatform(platform);
  const normalizedService = normalizeService(service);
  if (normalizedPlatform && normalizedService && PLATFORM_SERVICES[normalizedPlatform].includes(normalizedService)) {
    return <HomePage initialPlatform={normalizedPlatform} initialService={normalizedService} />;
  }

  notFound();
}
