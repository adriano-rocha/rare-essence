'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/app/store/cart-provider';
import type { CodigoFamiliaOlfativa } from '@/modules/catalogo/domain/familia-olfativa';
import { FAMILIA_OLFATIVA_LABELS } from '@/modules/catalogo/domain/familia-olfativa';

interface ProductVariation {
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
}

export function ProductDetail({
  brand,
  category,
  description,
  imageUrl,
  family,
  name,
  notes,
  slug,
  variations,
}: {
  brand: string;
  category: string;
  description: string;
  imageUrl: string | null;
  family: CodigoFamiliaOlfativa;
  name: string;
  notes: { top: string[]; heart: string[]; base: string[] };
  slug: string;
  variations: ProductVariation[];
}) {
  const [selectedId, setSelectedId] = useState(variations[0].id);
  const { adicionar } = useCart();
  const selected = variations.find((variation) => variation.id === selectedId) ?? variations[0];
  const installment = selected.planosParcelamento.at(-1);
  const dinheiro = (centavos: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100);

  return (
    <>
      <Link className="mb-9 inline-block text-[10px] uppercase tracking-[0.2em] text-brand-muted hover:text-brand-gold" href="/#colecao">← Voltar à coleção</Link>
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div className={`${imageUrl ? 'studio-frame p-8 sm:p-12' : 'product-art'} relative flex min-h-[420px] items-center justify-center border border-brand-border sm:min-h-[560px]`}>
          <span className="absolute left-5 top-5 z-10 bg-brand-bg/85 px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] text-brand-text backdrop-blur-sm">{category}</span>
          {imageUrl ? (
            <div className="relative h-full min-h-[340px] w-full sm:min-h-[440px]">
              <Image
                alt={`${name} — ${brand}`}
                className="object-contain mix-blend-multiply"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                src={imageUrl}
              />
            </div>
          ) : (
            <div aria-hidden className="bottle-card relative h-72 w-44 rounded-[2rem_2rem_1.4rem_1.4rem] border border-brand-accent/30 shadow-[0_35px_80px_rgba(0,0,0,0.55)] sm:h-80 sm:w-52">
              <div className="absolute -top-9 left-1/2 h-11 w-16 -translate-x-1/2 rounded-t-md border border-brand-accent/40 bg-[#231e18]" />
              <div className="absolute inset-x-7 top-20 border-y border-brand-accent/30 py-6 text-center">
                <span className="block font-serif text-sm tracking-[0.3em] text-brand-accent">RARE</span>
                <span className="mt-2 block text-[8px] tracking-[0.25em] text-brand-text/80">{name.toUpperCase()}</span>
                <span className="mt-1 block text-[7px] tracking-[0.2em] text-brand-muted">EAU DE PARFUM</span>
              </div>
            </div>
          )}
        </div>
        <section className="py-2">
          <p className="text-[10px] uppercase tracking-[0.28em] text-brand-accent">{brand}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">
            {FAMILIA_OLFATIVA_LABELS[family]}
          </p>
          <h1 className="mt-3 font-serif text-4xl text-brand-text sm:text-5xl">{name}</h1>
          <p className="mt-6 text-sm leading-7 text-brand-muted">{description}</p>
          <div className="mt-8 border-y border-brand-border py-6">
            <p className="text-[9px] uppercase tracking-[0.2em] text-brand-muted">Pirâmide olfativa</p>
            <div className="mt-4 space-y-4 text-xs">
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-brand-accent">Notas de Topo</p>
                <div className="flex flex-wrap gap-2">
                  {notes.top.map((nota) => (
                    <span className="border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-amber-100" key={nota}>{nota}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-brand-accent">Notas de Coração</p>
                <div className="flex flex-wrap gap-2">
                  {notes.heart.map((nota) => (
                    <span className="border border-stone-400/25 bg-stone-400/10 px-2.5 py-1 text-stone-100" key={nota}>{nota}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-brand-accent">Notas de Base</p>
                <div className="flex flex-wrap gap-2">
                  {notes.base.map((nota) => (
                    <span className="border border-brand-accent/35 bg-brand-accent/15 px-2.5 py-1 text-[#F3DFB1]" key={nota}>{nota}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-7">
            <p className="text-xs text-brand-muted">Escolha o volume</p>
            <div className="mt-3 flex gap-3">
              {variations.map((variation) => (
                <button
                  aria-pressed={selected.id === variation.id}
                  className={`min-w-24 border px-5 py-3 text-sm transition ${selected.id === variation.id ? 'border-brand-accent bg-brand-surface text-brand-text' : 'border-brand-border text-brand-muted hover:border-brand-accent/60'}`}
                  key={variation.id}
                  onClick={() => setSelectedId(variation.id)}
                  type="button"
                >
                  {variation.volumeMl} ml
                </button>
              ))}
            </div>
          </div>
          <div className="mt-8">
            <p className="text-sm text-brand-muted line-through">{dinheiro(selected.precoCentavos)}</p>
            <span className="mt-2 inline-flex bg-brand-pix/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-pix">
              {selected.descontoPixPercentual}% OFF no Pix
            </span>
            <p className="mt-2 text-2xl font-semibold text-brand-pix">{dinheiro(selected.totalPixCentavos)}</p>
            <p className="mt-1 text-xs text-brand-muted">no Pix à vista</p>
            {installment && <p className="mt-1 text-xs text-brand-muted">ou até {installment.quantidade}x de {dinheiro(installment.primeiraParcelaCentavos)} sem juros</p>}
            <p className="mt-3 text-[10px] text-brand-muted">Valores do produto. Frete calculado na sacola.</p>
          </div>
          <button
            className="mt-7 w-full bg-brand-accent px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-bg transition hover:bg-brand-gold disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-72"
            disabled={selected.estoqueDisponivel <= 0}
            onClick={() => adicionar({
              variacaoId: selected.id,
              sku: selected.sku,
              nomeProduto: name,
              slug,
              volumeMl: selected.volumeMl,
              precoCentavos: selected.precoCentavos,
              estoqueDisponivel: selected.estoqueDisponivel,
            })}
            type="button"
          >
            {selected.estoqueDisponivel > 0 ? 'Adicionar à sacola' : 'Indisponível'}
          </button>
        </section>
      </div>
    </>
  );
}