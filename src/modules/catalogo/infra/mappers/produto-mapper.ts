import { Produto } from '../../domain/produto';
import { Variacao } from '../../domain/variacao';
import { Slug } from '../../domain/slug';
import { Sku } from '../../domain/sku';
import { Volume } from '../../domain/volume';
import { PiramideOlfativa } from '../../domain/piramide-olfativa';
import { FamiliaOlfativa } from '../../domain/familia-olfativa';
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
    const familiaOlfativa = FamiliaOlfativa.criar(raw.familiaOlfativa);
    if (familiaOlfativa.kind === 'failure') {
      throw new Error(
        `Família olfativa inválida persistida para o produto ${raw.id}.`
      );
    }

    const variacoes = raw.variacoes.map((v) => {
      const preco = Money.fromCentavos(v.precoCentavos);
      if (preco.kind === 'failure') {
        throw new Error(
          `Preço inválido persistido para a variação ${v.id}: ${preco.error.mensagem}`
        );
      }

      return Variacao.criar({
        id: v.id,
        produtoId: v.produtoId,
        sku: Sku.criar(v.sku).value!,
        volume: Volume.criar(v.volumeMl).value!,
        preco: preco.value,
        pesoGramas: v.pesoGramas,
        ativo: v.ativo,
      }).value!;
    });

    const produto = Produto.criar({
      id: raw.id,
      nome: raw.nome,
      slug,
      descricao: raw.descricao,
      imagemUrl: raw.imagemUrl,
      marcaId: raw.marcaId,
      categoriaId: raw.categoriaId,
      familiaOlfativa: familiaOlfativa.value,
      piramideOlfativa: piramide,
      ativo: raw.ativo,
      variacoes,
      criadoEm: raw.criadoEm,
      atualizadoEm: raw.atualizadoEm,
    }).value!;

    return produto;
  }
}