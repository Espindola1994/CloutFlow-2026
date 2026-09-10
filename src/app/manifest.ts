import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CloutFlow',
    short_name: 'CloutFlow',
    description: 'Accelerate your social media presence with premium growth services.',
    start_url: '/',
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
}