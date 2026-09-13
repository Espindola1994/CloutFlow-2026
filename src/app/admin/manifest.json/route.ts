import { NextResponse } from 'next/server';

export const dynamic = 'force-static';
export const revalidate = false;

export function GET() {
  const manifest = {
    id: '/admin',
    name: 'CloutFlow Admin',
    short_name: 'CF Admin',
    description: 'Private administration app.',
    start_url: '/admin',
    scope: '/admin/',
    display: 'standalone',
    background_color: '#080B14',
    theme_color: '#080B14',
    orientation: 'any',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
