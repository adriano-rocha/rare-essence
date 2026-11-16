import type { MetadataRoute } from 'next';
import { prisma } from '@/shared/infra/prisma';
import { getSiteUrl } from '@/shared/infra/site-url';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  if (!siteUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL é obrigatório para gerar o sitemap.');
  }

  const products = await prisma.produto.findMany({
    where: { ativo: true },
    select: { slug: true, atualizadoEm: true },
    orderBy: { slug: 'asc' },
  });

  return [
    { url: new URL('/', siteUrl).toString(), changeFrequency: 'daily', priority: 1 },
    ...products.map((product) => ({
      url: new URL(`/produto/${product.slug}`, siteUrl).toString(),
      lastModified: product.atualizadoEm,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
