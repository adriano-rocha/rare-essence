import { describe, expect, it } from 'vitest';
import { Money } from '@/shared/core/money';
import { CalcularPrecificacao } from '@/modules/carrinho/application/calcular-precificacao';
import { Cupom } from '@/modules/carrinho/domain/cupom';
import { ItemCarrinho } from '@/modules/carrinho/domain/item-carrinho';

const agora = new Date('2026-11-15T12:00:00Z');

function dinheiro(centavos: number, moeda = 'BRL'): Money {
  const resultado = Money.fromCentavos(centavos, moeda);
  if (resultado.kind === 'failure') throw new Error(resultado.error.mensagem);
  return resultado.value;
}

function item(precoCentavos: number, quantidade = 1, moeda = 'BRL'): ItemCarrinho {
  const resultado = ItemCarrinho.criar({
    variacaoId: `variacao-${precoCentavos}`,
    sku: `SKU-${precoCentavos}`,
    precoUnitario: dinheiro(precoCentavos, moeda),
    quantidade,
  });
  if (resultado.kind === 'failure') throw new Error(resultado.error.mensagem);
  return resultado.value;
}

function cupomPercentual(percentual: number, valorMinimoCentavos = 0): Cupom {
  const resultado = Cupom.criar({
    codigo: 'PROMO',
    tipo: 'PERCENTUAL',
    valor: percentual,
    valorMinimo: dinheiro(valorMinimoCentavos),
    ativo: true,
  });
  if (resultado.kind === 'failure') throw new Error(resultado.error.mensagem);
  return resultado.value;
}

describe('CalcularPrecificacao', () => {
  it('atende UC-001: frete PAC grátis, desconto Pix e parcelamento em seis vezes', () => {
    const resultado = CalcularPrecificacao.executar(
      [item(38000)],
      { modalidade: 'PAC', valor: dinheiro(2500) },
      agora
    );

    expect(resultado.kind).toBe('success');
    if (resultado.kind === 'success') {
      expect(resultado.value.subtotalProdutos.centavos).toBe(38000);
      expect(resultado.value.freteGratis).toBe(true);
      expect(resultado.value.frete.centavos).toBe(0);
      expect(resultado.value.descontoPix.centavos).toBe(1900);
      expect(resultado.value.totalPix.centavos).toBe(36100);
      expect(resultado.value.totalCartao.centavos).toBe(38000);

      const seisVezes = resultado.value.planosParcelamento.find(
        (plano) => plano.quantidade === 6
      );
      expect(seisVezes).toBeDefined();
      expect(seisVezes?.valoresCentavos.slice(0, 5)).toEqual([6333, 6333, 6333, 6333, 6333]);
      expect(seisVezes?.valoresCentavos[5]).toBe(6335);
      expect(seisVezes?.valoresCentavos.reduce((total, parcela) => total + parcela, 0))
        .toBe(38000);
      expect(seisVezes?.valoresCentavos.every((parcela) => parcela >= 3000)).toBe(true);
    }
  });

  it('aplica cupom primeiro e calcula os 5% Pix sobre o subtotal reduzido', () => {
    const resultado = CalcularPrecificacao.executar(
      [item(38000)],
      { modalidade: 'PAC', valor: dinheiro(2500) },
      agora,
      cupomPercentual(10)
    );

    expect(resultado.kind).toBe('success');
    if (resultado.kind === 'success') {
      expect(resultado.value.descontoCupom.centavos).toBe(3800);
      expect(resultado.value.subtotalAposCupom.centavos).toBe(34200);
      expect(resultado.value.descontoPix.centavos).toBe(1710);
      expect(resultado.value.totalPix.centavos).toBe(32490);
      expect(resultado.value.totalCartao.centavos).toBe(34200);
      expect(resultado.value.freteGratis).toBe(true);
    }
  });

  it('aplica frete grátis somente ao PAC quando o subtotal atinge o limite', () => {
    const pac = CalcularPrecificacao.executar(
      [item(35000)],
      { modalidade: 'PAC', valor: dinheiro(2000) },
      agora
    );
    const sedex = CalcularPrecificacao.executar(
      [item(35000)],
      { modalidade: 'SEDEX', valor: dinheiro(3000) },
      agora
    );
    const abaixoDoLimite = CalcularPrecificacao.executar(
      [item(34999)],
      { modalidade: 'PAC', valor: dinheiro(2000) },
      agora
    );

    expect(pac.kind === 'success' && pac.value.frete.centavos).toBe(0);
    expect(sedex.kind === 'success' && sedex.value.frete.centavos).toBe(3000);
    expect(abaixoDoLimite.kind === 'success' && abaixoDoLimite.value.frete.centavos)
      .toBe(2000);
  });

  it('respeita o mínimo de parcela e retorna vazio quando nenhuma parcela é elegível', () => {
    const elegivel = CalcularPrecificacao.executar(
      [item(17999)],
      { modalidade: 'PAC', valor: dinheiro(0) },
      agora
    );
    const abaixoMinimo = CalcularPrecificacao.executar(
      [item(2999)],
      { modalidade: 'PAC', valor: dinheiro(0) },
      agora
    );

    expect(elegivel.kind === 'success' && elegivel.value.planosParcelamento.length)
      .toBe(5);
    expect(abaixoMinimo.kind === 'success' && abaixoMinimo.value.planosParcelamento)
      .toHaveLength(0);
  });

  it('propaga falha do cupom e rejeita modalidade ou configuração inválida', () => {
    const cupomAbaixoDoMinimo = cupomPercentual(10, 5000);
    const cupomInvalido = CalcularPrecificacao.executar(
      [item(4000)],
      { modalidade: 'PAC', valor: dinheiro(0) },
      agora,
      cupomAbaixoDoMinimo
    );
    const modalidadeInvalida = CalcularPrecificacao.executar(
      [item(4000)],
      { modalidade: '  ', valor: dinheiro(0) },
      agora
    );
    const configuracaoInvalida = CalcularPrecificacao.executar(
      [item(4000)],
      { modalidade: 'PAC', valor: dinheiro(0) },
      agora,
      undefined,
      {
        descontoPixPercentual: -1,
        valorMinimoParcelaCentavos: 3000,
        limiteParcelas: 6,
        subtotalFreteGratisCentavos: 35000,
      }
    );

    expect(cupomInvalido.kind).toBe('failure');
    if (cupomInvalido.kind === 'failure') {
      expect(cupomInvalido.error.codigo).toBe('CUPOM_PEDIDO_MINIMO');
    }
    expect(modalidadeInvalida.kind).toBe('failure');
    if (modalidadeInvalida.kind === 'failure') {
      expect(modalidadeInvalida.error.codigo).toBe('COTACAO_FRETE_INVALIDA');
    }
    expect(configuracaoInvalida.kind).toBe('failure');
    if (configuracaoInvalida.kind === 'failure') {
      expect(configuracaoInvalida.error.codigo).toBe(
        'CONFIGURACAO_PRECIFICACAO_INVALIDA'
      );
    }
  });

  it('retorna falha para carrinho vazio e moedas incompatíveis', () => {
    expect(
      CalcularPrecificacao.executar(
        [],
        { modalidade: 'PAC', valor: dinheiro(0) },
        agora
      ).kind
    ).toBe('failure');

    expect(
      CalcularPrecificacao.executar(
        [item(1000), item(2000, 1, 'USD')],
        { modalidade: 'PAC', valor: dinheiro(0) },
        agora
      ).kind
    ).toBe('failure');

    expect(
      CalcularPrecificacao.executar(
        [item(1000)],
        { modalidade: 'PAC', valor: dinheiro(0, 'USD') },
        agora
      ).kind
    ).toBe('failure');
  });
});
