import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/shared/infra/prisma';
import { precificarVariacao } from '@/app/store/server-price';
import { ProductDetail } from './product-detail';

const buscarProdutoAtivo = cache((slug: string) =>
  prisma.produto.findFirst({
    where: { slug, ativo: true },
    include: {
      marca: true,
      categoria: true,
      variacoes: {
        where: { ativo: true },
        include: { estoque: true },
        orderBy: { volumeMl: 'asc' },
      },
    },
  })
);

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const produto = await buscarProdutoAtivo(slug);

  if (!produto) {
    return {
      title: 'Fragrância não encontrada',
      robots: { index: false, follow: false },
    };
  }

  const imagem = produto.imagemUrl ?? '/banner.png';
  return {
    title: produto.nome,
    description: produto.descricao,
    alternates: { canonical: `/produto/${produto.slug}` },
    openGraph: {
      type: 'website',
      title: `${produto.nome} | Rare Essence`,
      description: produto.descricao,
      images: [imagem],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${produto.nome} | Rare Essence`,
      description: produto.descricao,
      images: [imagem],
    },
  };
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;
  const produto = await buscarProdutoAtivo(slug);

  if (!produto || produto.variacoes.length === 0) notFound();

  const variacoes = produto.variacoes.map((variacao) => ({
      id: variacao.id,
      sku: variacao.sku,
      volumeMl: variacao.volumeMl,
      precoCentavos: variacao.precoCentavos,
      ...precificarVariacao(variacao),
      estoqueDisponivel: Math.max(
        0,
        (variacao.estoque?.quantidadeFisica ?? 0) -
          (variacao.estoque?.quantidadeReservada ?? 0)
      ),
    }));

  if (variacoes.length === 0) notFound();

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-16">
      <ProductDetail
        brand={produto.marca.nome}
        category={produto.categoria.nome}
        description={produto.descricao}
        imageUrl={produto.imagemUrl}
        family={produto.familiaOlfativa}
        name={produto.nome}
        notes={{
          top: produto.notasTopo,
          heart: produto.notasCoracao,
          base: produto.notasBase,
        }}
        slug={produto.slug}
        variations={variacoes}
      />
    </main>
  );
}
