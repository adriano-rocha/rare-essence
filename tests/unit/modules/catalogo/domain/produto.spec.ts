import { describe, it, expect } from 'vitest';
import { ProdutoBuilder } from '../../../../helpers/builders/produto.builder';
import { Variacao } from '@/modules/catalogo/domain/variacao';
import { Sku } from '@/modules/catalogo/domain/sku';
import { Volume } from '@/modules/catalogo/domain/volume';
import { Money } from '@/shared/core/money';

describe('Produto (Agregado Raiz)', () => {
  it('deve instanciar um produto inativo inicialmente', () => {
    const produto = ProdutoBuilder.umProduto().build();
    expect(produto.ativo).toBe(false);
  });

  it('RN-013: não deve permitir ativar produto sem ao menos uma variação', () => {
    const produto = ProdutoBuilder.umProduto().build();
    const resultado = produto.ativar();

    expect(resultado.isFailure()).toBe(true);
    expect(resultado.error?.codigo).toBe('PRODUTO_SEM_VARIACOES');
    expect(produto.ativo).toBe(false);
  });

  it('RN-013: deve permitir ativar produto quando possuir variação', () => {
    const produto = ProdutoBuilder.umProduto()
      .comVariacao('RARE-NOIR-50ML', 50, 42000)
      .build();

    const resultado = produto.ativar();
    expect(resultado.isSuccess()).toBe(true);
    expect(produto.ativo).toBe(true);
  });

  it('RN-011: não deve permitir adicionar variação com SKU duplicado no mesmo produto', () => {
    const produto = ProdutoBuilder.umProduto()
      .comVariacao('RARE-NOIR-50ML', 50, 42000, 'var-1')
      .build();

    const variacaoDuplicada = Variacao.criar({
      id: 'var-2',
      produtoId: produto.id,
      sku: Sku.criar('RARE-NOIR-50ML').value!,
      volume: Volume.criar(100).value!,
      preco: Money.fromCentavos(65000),
      pesoGramas: 300,
      ativo: true,
    }).value!;

    const resultado = produto.adicionarVariacao(variacaoDuplicada);
    expect(resultado.isFailure()).toBe(true);
    expect(resultado.error?.codigo).toBe('SKU_DUPLICADO');
  });

  it('RN-012: deve rejeitar criação de variação com preço menor ou igual a zero', () => {
    const precoZero = Money.fromCentavos(0);
    const variacao = Variacao.criar({
      id: 'var-invalida',
      produtoId: 'prod-1',
      sku: Sku.criar('RARE-INVALID-50ML').value!,
      volume: Volume.criar(50).value!,
      preco: precoZero,
      pesoGramas: 200,
      ativo: true,
    });

    expect(variacao.isFailure()).toBe(true);
    expect(variacao.error?.codigo).toBe('PRECO_INVALIDO');
  });
});