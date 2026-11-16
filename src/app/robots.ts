import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/shared/infra/site-url';

export default function robots(): MetadataRoute.Robots {
  const isIndexable = process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview';
  const siteUrl = getSiteUrl();

  if (!isIndexable) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/'],
    },
    sitemap: siteUrl ? new URL('/sitemap.xml', siteUrl).toString() : undefined,
  };
}
