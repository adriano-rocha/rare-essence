import Link from 'next/link';
import Image from 'next/image';
import { Storefront } from './storefront';
import type { StoreProduct } from './storefront';
import { prisma } from '@/shared/infra/prisma';
import { precificarVariacao } from '@/app/store/server-price';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const records = await prisma.produto.findMany({
    where: {
      ativo: true,
      variacoes: { some: { ativo: true } },
    },
    include: {
      marca: true,
      categoria: true,
      variacoes: {
        where: { ativo: true },
        include: { estoque: true },
        orderBy: { volumeMl: 'asc' },
      },
    },
    orderBy: { criadoEm: 'asc' },
    take: 12,
  });

  const products: StoreProduct[] = records.map((produto, index) => ({
    id: produto.id,
    slug: produto.slug,
    nome: produto.nome,
    descricao: produto.descricao,
    imagemUrl: produto.imagemUrl,
    marca: produto.marca.nome,
    categoria: produto.categoria.nome,
    familiaOlfativa: produto.familiaOlfativa,
    indiceVisual: index,
    variacoes: produto.variacoes.map((variacao) => ({
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
    })),
  }));

  return (
    <main>
      <section className="relative overflow-hidden border-b border-brand-border">
        <Image
          alt=""
          className="object-cover object-[68%_center] lg:object-center"
          fill
          priority
          sizes="100vw"
          src="/banner.png"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-brand-bg via-brand-bg to-transparent" />
        <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-center px-6 py-20 lg:min-h-[640px] lg:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-accent">
              Haute parfumerie · desde 2024
            </p>
            <h1 className="mt-7 font-serif text-5xl leading-tight text-brand-text sm:text-6xl">
              A arte de deixar
              <span className="block italic text-brand-accent">uma impressão.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-brand-muted">
              Fragrâncias de personalidade singular, selecionadas para quem
              transforma presença em assinatura.
            </p>
            <Link
              className="mt-9 inline-flex items-center gap-3 bg-brand-accent px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-bg transition hover:bg-brand-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              href="#colecao"
            >
              Ver coleção <span aria-hidden>↘</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-brand-border bg-brand-surface/50">
        <div className="mx-auto grid max-w-7xl gap-5 px-6 py-7 text-center text-[10px] uppercase tracking-[0.2em] text-brand-muted sm:grid-cols-3 sm:text-xs">
          <p>Curadoria de alta perfumaria</p>
          <p className="border-y border-brand-border py-4 sm:border-x sm:border-y-0 sm:py-0">Pagamento seguro via Pix</p>
          <p>Envio para todo o Brasil</p>
        </div>
      </section>

      <Storefront products={products} />
    </main>
  );
}