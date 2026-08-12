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
        src: '/cloutflow-logo.png', // Fallback to logo as no square app icon was provided yet. A dedicated 512x512 maskable app icon should be provided in the future for better OS rendering.
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}