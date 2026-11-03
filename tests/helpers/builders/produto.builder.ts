import { Produto } from '@/modules/catalogo/domain/produto';
import { Variacao } from '@/modules/catalogo/domain/variacao';
import { Slug } from '@/modules/catalogo/domain/slug';
import { Sku } from '@/modules/catalogo/domain/sku';
import { Volume } from '@/modules/catalogo/domain/volume';
import { PiramideOlfativa } from '@/modules/catalogo/domain/piramide-olfativa';
import { Money } from '@/shared/core/money';

export class ProdutoBuilder {
  private id = 'prod-1';
  private nome = 'Noir Absolu';
  private slug = Slug.criar('noir-absolu').value!;
  private descricao = 'Uma fragrância oriental amadeirada marcante e misteriosa.';
  private marcaId = 'marca-rare';
  private categoriaId = 'cat-amadeirado';
  private piramide = PiramideOlfativa.criar({
    topo: ['Bergamota', 'Pimenta Preta'],
    coracao: ['Íris', 'Rosa Damascena'],
    base: ['Âmbar', 'Oud', 'Cedro'],
  }).value!;
  private ativo = false;
  private variacoes: Variacao[] = [];

  static umProduto(): ProdutoBuilder {
    return new ProdutoBuilder();
  }

  comId(id: string): this {
    this.id = id;
    return this;
  }

  comNome(nome: string): this {
    this.nome = nome;
    this.slug = Slug.criarAPartirDoNome(nome).value!;
    return this;
  }

  comSlug(slugStr: string): this {
    this.slug = Slug.criar(slugStr).value!;
    return this;
  }

  comVariacao(
    skuStr = 'RARE-NOIR-50ML',
    volumeMl = 50,
    precoCentavos = 42000,
    id = 'var-1'
  ): this {
    const variacao = Variacao.criar({
      id,
      produtoId: this.id,
      sku: Sku.criar(skuStr).value!,
      volume: Volume.criar(volumeMl).value!,
      preco: Money.fromCentavos(precoCentavos),
      pesoGramas: 250,
      ativo: true,
    }).value!;

    this.variacoes.push(variacao);
    return this;
  }

  ativoNoCatalogo(): this {
    if (this.variacoes.length === 0) {
      this.comVariacao();
    }
    this.ativo = true;
    return this;
  }

  build(): Produto {
    const produto = Produto.criar({
      id: this.id,
      nome: this.nome,
      slug: this.slug,
      descricao: this.descricao,
      marcaId: this.marcaId,
      categoriaId: this.categoriaId,
      piramideOlfativa: this.piramide,
      ativo: this.ativo,
      variacoes: this.variacoes,
    });

    if (produto.isFailure()) {
      throw new Error(`Falha ao construir produto de teste: ${produto.error?.mensagem}`);
    }

    return produto.value!;
  }
}