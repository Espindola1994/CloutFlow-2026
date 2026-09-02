import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/offer/'],
    },
    sitemap: 'https://cloutflow.co/sitemap.xml',
  };
}

