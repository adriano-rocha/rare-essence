'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  PackageCheck,
  Sparkles,
  Timer,
} from 'lucide-react';
import { useCart } from '@/app/store/cart-provider';
import type {
  CodigoFamiliaOlfativa,
} from '@/modules/catalogo/domain/familia-olfativa';
import {
  FAMILIAS_OLFATIVAS,
  FAMILIA_OLFATIVA_LABELS,
} from '@/modules/catalogo/domain/familia-olfativa';

export interface StoreProduct {
  id: string;
  slug: string;
  nome: string;
  descricao: string;
  imagemUrl: string | null;
  marca: string;
  categoria: string;
  familiaOlfativa: CodigoFamiliaOlfativa;
  indiceVisual: number;
  variacoes: {
    id: string;
    sku: string;
    volumeMl: number;
    precoCentavos: number;
    estoqueDisponivel: number;
    totalPixCentavos: number;
    descontoPixPercentual: number;
    planosParcelamento: {
      quantidade: number;
      primeiraParcelaCentavos: number;
    }[];
  }[];
}

function dinheiro(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100);
}

export function Storefront({ products }: { products: StoreProduct[] }) {
  const [familiaSelecionada, setFamiliaSelecionada] = useState<CodigoFamiliaOlfativa | null>(null);
  const produtosFiltrados = useMemo(
    () => products.filter(
      (product) => !familiaSelecionada || product.familiaOlfativa === familiaSelecionada,
    ),
    [familiaSelecionada, products],
  );

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10" id="colecao">
        <div className="mb-8 flex items-end justify-between gap-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-brand-accent">A coleção</p>
          </div>
          <p className="hidden max-w-xs text-right text-xs leading-5 text-brand-muted sm:block">
            Composições para momentos que merecem ser lembrados.
          </p>
        </div>
        <div aria-label="Filtrar por família olfativa" className="mb-8 flex flex-wrap gap-2" role="group">
          <button
            aria-pressed={familiaSelecionada === null}
            className={`border px-4 py-2 text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-gold ${familiaSelecionada === null ? 'border-brand-accent bg-brand-accent font-semibold text-brand-bg' : 'border-brand-border text-brand-muted hover:border-brand-accent hover:text-brand-text'}`}
            onClick={() => setFamiliaSelecionada(null)}
            type="button"
          >
            Todas
          </button>
          {FAMILIAS_OLFATIVAS.map((familia) => (
            <button
              aria-pressed={familiaSelecionada === familia}
              className={`border px-4 py-2 text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-gold ${familiaSelecionada === familia ? 'border-brand-accent bg-brand-accent font-semibold text-brand-bg' : 'border-brand-border text-brand-muted hover:border-brand-accent hover:text-brand-text'}`}
              key={familia}
              onClick={() => setFamiliaSelecionada(familia)}
              type="button"
            >
              {FAMILIA_OLFATIVA_LABELS[familia]}
            </button>
          ))}
        </div>
        {products.length === 0 ? (
          <p className="border border-brand-border p-8 text-sm text-brand-muted">
            Nossa coleção está sendo preparada. Volte em breve.
          </p>
        ) : produtosFiltrados.length === 0 ? (
          <p className="border border-brand-border p-8 text-sm text-brand-muted">
            Nenhuma fragrância encontrada nesta família.
          </p>
        ) : (
          <ProductCarousel products={produtosFiltrados} />
        )}
      </section>
      <TrustPillars />
      <section className="border-y border-brand-border bg-brand-surface/50" id="manifesto">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
          <p className="text-[10px] uppercase tracking-[0.28em] text-brand-accent">O manifesto</p>
          <p className="mt-5 font-serif text-2xl leading-relaxed text-brand-text sm:text-3xl">
            “A fragrância certa não anuncia sua chegada. Ela torna sua presença inesquecível.”
          </p>
        </div>
      </section>
    </>
  );
}

function ProductCarousel({ products }: { products: StoreProduct[] }) {
  const carouselRef = useRef<HTMLDivElement>(null);

  function scroll(direction: -1 | 1) {
    carouselRef.current?.scrollBy({
      left: direction * carouselRef.current.clientWidth * 0.8,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end gap-2 lg:hidden">
        <button
          aria-label="Ver fragrâncias anteriores"
          className="border border-brand-border p-2 text-brand-text transition hover:border-brand-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-gold"
          onClick={() => scroll(-1)}
          type="button"
        >
          <ChevronLeft aria-hidden size={18} />
        </button>
        <button
          aria-label="Ver próximas fragrâncias"
          className="border border-brand-border p-2 text-brand-text transition hover:border-brand-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-gold"
          onClick={() => scroll(1)}
          type="button"
        >
          <ChevronRight aria-hidden size={18} />
        </button>
      </div>
      <div
        aria-label="Fragrâncias da coleção"
        className="product-carousel flex snap-x snap-mandatory gap-5 overflow-x-auto pb-5 lg:grid lg:grid-cols-3 lg:overflow-visible"
        ref={carouselRef}
        role="region"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: StoreProduct }) {
  const [selectedId, setSelectedId] = useState(product.variacoes[0]?.id ?? '');
  const [adicionado, setAdicionado] = useState(false);
  const { adicionar } = useCart();
  const variacao = product.variacoes.find((item) => item.id === selectedId) ?? product.variacoes[0];
  const parcelamento = variacao?.planosParcelamento.at(-1);

  if (!variacao) return null;

  return (
    <article className="group flex w-[min(84vw,340px)] shrink-0 snap-start flex-col border border-brand-border bg-brand-surface/70 transition hover:border-brand-accent/50 lg:w-full">
      <Link
        aria-label={`Conheça ${product.nome}`}
        className={`${product.imagemUrl ? 'studio-frame p-6' : 'product-art'} relative flex aspect-[4/3.5] items-center justify-center overflow-hidden border-b border-brand-border`}
        href={`/produto/${product.slug}`}
      >
        {product.imagemUrl && (
          <div className="relative h-full w-full">
            <Image
              alt={`${product.nome} — ${product.marca}`}
              className="object-contain mix-blend-multiply transition duration-500 group-hover:scale-105"
              fill
              sizes="(max-width: 640px) 84vw, (max-width: 1024px) 340px, 420px"
              src={product.imagemUrl}
            />
          </div>
        )}
        <span className="absolute left-3.5 top-3.5 z-10 bg-brand-bg/85 px-2.5 py-1 text-[9px] uppercase tracking-[0.15em] text-brand-text backdrop-blur-sm">
          {product.categoria}
        </span>
        {!product.imagemUrl && (
          <div aria-hidden className="bottle-card relative h-44 w-28 rounded-[1.4rem_1.4rem_0.9rem_0.9rem] border border-brand-accent/30 shadow-2xl transition duration-500 group-hover:-translate-y-2 sm:h-48 sm:w-32">
            <div className="absolute -top-6 left-1/2 h-7 w-11 -translate-x-1/2 rounded-t-sm border border-brand-accent/30 bg-[#231e18]" />
            <div className="absolute inset-x-3 top-12 border-y border-brand-accent/25 py-4 text-center">
              <span className="block font-serif text-[10px] tracking-[0.2em] text-brand-accent">RARE</span>
              <span className="mt-1 block text-[7px] tracking-[0.12em] text-brand-text/80">{product.nome.toUpperCase()}</span>
            </div>
          </div>
        )}
        <span
          aria-hidden
          className="absolute bottom-3.5 right-3.5 z-10 bg-brand-bg/80 px-2.5 py-1 text-[9px] uppercase tracking-widest text-brand-text backdrop-blur-sm transition group-hover:text-brand-gold"
        >
          Descobrir ↗
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[9px] uppercase tracking-[0.2em] text-brand-muted">{product.marca}</p>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-accent">
          {FAMILIA_OLFATIVA_LABELS[product.familiaOlfativa]}
        </p>
        <Link className="mt-1 block font-serif text-2xl tracking-wide text-brand-text transition hover:text-brand-gold" href={`/produto/${product.slug}`}>
          {product.nome}
        </Link>
        <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-brand-muted">{product.descricao}</p>
        <fieldset className="mt-4">
          <legend className="text-[10px] uppercase tracking-[0.12em] text-brand-muted">Volume</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.variacoes.map((opcao) => (
              <button
                aria-pressed={selectedId === opcao.id}
                className={`border px-3 py-2 text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-gold ${selectedId === opcao.id ? 'border-brand-accent bg-brand-bg text-brand-text' : 'border-brand-border text-brand-muted hover:border-brand-accent/70 hover:text-brand-text'}`}
                key={opcao.id}
                onClick={() => setSelectedId(opcao.id)}
                type="button"
              >
                {opcao.volumeMl} ml
              </button>
            ))}
          </div>
        </fieldset>
        <div className="mt-5 border-t border-brand-border pt-4">
          <div className="flex items-center justify-between gap-2">
            <span className="bg-brand-pix/15 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-brand-pix">
              {variacao.descontoPixPercentual}% OFF no Pix
            </span>
            <span className="text-xs text-brand-muted">{variacao.volumeMl} ml</span>
          </div>
          <p className="mt-2 text-xs text-brand-muted line-through">{dinheiro(variacao.precoCentavos)}</p>
          <p className="text-xl font-semibold text-brand-pix">{dinheiro(variacao.totalPixCentavos)}</p>
          {parcelamento && (
            <p className="mt-1 text-xs text-brand-muted">
              ou {parcelamento.quantidade}x de {dinheiro(parcelamento.primeiraParcelaCentavos)} sem juros
            </p>
          )}
          <p className="mt-1 text-[10px] text-brand-muted">Frete calculado na sacolinha.</p>
        </div>
        <button
          className="mt-auto w-full pt-4"
          tabIndex={-1}
          type="button"
        />
        <button
          className="mt-4 w-full bg-brand-accent px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-bg transition hover:bg-brand-gold disabled:cursor-not-allowed disabled:opacity-50"
          disabled={variacao.estoqueDisponivel <= 0}
          onClick={() => {
            adicionar({
              variacaoId: variacao.id,
              sku: variacao.sku,
              nomeProduto: product.nome,
              slug: product.slug,
              volumeMl: variacao.volumeMl,
              precoCentavos: variacao.precoCentavos,
              estoqueDisponivel: variacao.estoqueDisponivel,
            });
            setAdicionado(true);
          }}
          type="button"
        >
          {variacao.estoqueDisponivel > 0
            ? adicionado ? 'Adicionar outra unidade' : 'Adicionar à sacolinha'
            : 'Indisponível'}
        </button>
        <p aria-live="polite" className="sr-only">
          {adicionado ? `${product.nome} adicionado à sacolinha. A sacolinha foi aberta.` : ''}
        </p>
      </div>
    </article>
  );
}

function TrustPillars() {
  const pilares = [
    { titulo: 'Qualidade premium', descricao: 'Curadoria de fragrâncias para a sua coleção.', Icon: Sparkles },
    { titulo: 'Alta fixação', descricao: 'Composições pensadas para acompanhar o seu dia.', Icon: Timer },
    { titulo: 'Produtos originais', descricao: 'Autenticidade em cada fragrância.', Icon: BadgeCheck },
    { titulo: 'Pagamento facilitado', descricao: 'Pix e cartão com opções de parcelamento.', Icon: CreditCard },
    { titulo: 'Entrega segura', descricao: 'Acompanhe as opções de envio na sacolinha.', Icon: PackageCheck },
  ];

  return (
    <section aria-labelledby="trust-heading" className="border-y border-brand-border bg-brand-surface/50" id="pilares">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <p className="text-center text-[10px] uppercase tracking-[0.28em] text-brand-accent">Comprar com confiança</p>
        <h2 className="mt-3 text-center font-serif text-3xl text-brand-text" id="trust-heading">Os pilares Rare Essence</h2>
        <ul className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {pilares.map((pilar) => (
            <li className="border-t border-brand-border pt-4 text-center" key={pilar.titulo}>
              <div className="mb-3 flex justify-center text-brand-accent">
                <pilar.Icon aria-hidden size={22} strokeWidth={1.5} />
              </div>
              <p className="font-serif text-lg text-brand-text">{pilar.titulo}</p>
              <p className="mt-2 text-xs leading-5 text-brand-muted">{pilar.descricao}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}