import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private surfaces: nothing here should ever be indexed.
        disallow: ['/admin', '/portal', '/api', '/login', '/register'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
