import { db } from '../index';
import { platforms, services, plans, niches } from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function getPlatforms() {
  return await db.query.platforms.findMany({
    where: eq(platforms.enabled, true),
    orderBy: [asc(platforms.sortOrder)],
  });
}

export async function getPlatformBySlug(slug: string) {
  const [platform] = await db.query.platforms.findMany({
    where: eq(platforms.slug, slug),
    limit: 1,
  });
  return platform;
}

export async function getServicesByPlatformId(platformId: string) {
  return await db.query.services.findMany({
    where: eq(services.platformId, platformId),
    orderBy: [asc(services.sortOrder)],
  });
}

export async function getServiceBySlug(slug: string) {
  const [service] = await db.query.services.findMany({
    where: eq(services.slug, slug),
    limit: 1,
  });
  return service;
}

export async function getPlansByServiceId(serviceId: string) {
  return await db.query.plans.findMany({
    where: eq(plans.serviceId, serviceId),
    orderBy: [asc(plans.sortOrder)],
  });
}

export async function getPlanById(planId: string) {
  const [plan] = await db.query.plans.findMany({
    where: eq(plans.id, planId),
    limit: 1,
  });
  return plan;
}

export async function getNiches() {
  return await db.query.niches.findMany({
    where: eq(niches.enabled, true),
    orderBy: [asc(niches.sortOrder)],
  });
}
