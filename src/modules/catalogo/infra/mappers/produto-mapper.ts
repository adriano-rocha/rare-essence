import { Produto } from '../../domain/produto';
import { Variacao } from '../../domain/variacao';
import { Slug } from '../../domain/slug';
import { Sku } from '../../domain/sku';
import { Volume } from '../../domain/volume';
import { PiramideOlfativa } from '../../domain/piramide-olfativa';
import { Money } from '@/shared/core/money';
import {
  Produto as PrismaProduto,
  Variacao as PrismaVariacao,
} from '@prisma/client';

export type PrismaProdutoComVariacoes = PrismaProduto & {
  variacoes: PrismaVariacao[];
};

export class ProdutoMapper {
  static toDomain(raw: PrismaProdutoComVariacoes): Produto {
    const slug = Slug.criar(raw.slug).value!;
    const piramide = PiramideOlfativa.criar({
      topo: raw.notasTopo,
      coracao: raw.notasCoracao,
      base: raw.notasBase,
    }).value!;

    const variacoes = raw.variacoes.map((v) => {
      return Variacao.criar({
        id: v.id,
        produtoId: v.produtoId,
        sku: Sku.criar(v.sku).value!,
        volume: Volume.criar(v.volumeMl).value!,
        preco: Money.fromCentavos(v.precoCentavos),
        pesoGramas: v.pesoGramas,
        ativo: v.ativo,
      }).value!;
    });

    const produto = Produto.criar({
      id: raw.id,
      nome: raw.nome,
      slug,
      descricao: raw.descricao,
      marcaId: raw.marcaId,
      categoriaId: raw.categoriaId,
      piramideOlfativa: piramide,
      ativo: raw.ativo,
      variacoes,
      criadoEm: raw.criadoEm,
      atualizadoEm: raw.atualizadoEm,
    }).value!;

    return produto;
  }
}