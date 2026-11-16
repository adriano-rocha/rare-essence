import { describe, it, expect } from 'vitest';
import { Money } from '@/shared/core/money';

function dinheiro(centavos: number, moeda = 'BRL'): Money {
  const resultado = Money.fromCentavos(centavos, moeda);
  if (resultado.kind === 'failure') {
    throw new Error(resultado.error.mensagem);
  }
  return resultado.value;
}

describe('Kernel: Money Value Object (RNF-001)', () => {
  it('deve criar uma quantia monetária em centavos inteiros', () => {
    const preco = dinheiro(38000);

    expect(preco.centavos).toBe(38000);
    expect(preco.moeda).toBe('BRL');
  });

  it('deve retornar falha para valores que não sejam inteiros seguros', () => {
    expect(Money.fromCentavos(38000.5).kind).toBe('failure');
    expect(Money.fromCentavos(Number.MAX_SAFE_INTEGER + 1).kind).toBe('failure');
  });

  it('deve retornar falha para valores negativos ou códigos de moeda inválidos', () => {
    expect(Money.fromCentavos(-100).kind).toBe('failure');
    expect(Money.fromCentavos(100, 'BR').kind).toBe('failure');
  });

  it('deve converter reais em centavos sem usar ponto flutuante', () => {
    const resultado = Money.fromReais('380,05');

    expect(resultado.kind).toBe('success');
    if (resultado.kind === 'success') {
      expect(resultado.value.centavos).toBe(38005);
    }

    expect(Money.fromReais('380,005').kind).toBe('failure');
    expect(Money.fromReais('-1,00').kind).toBe('failure');
  });

  it('deve somar duas quantias sem alterar os valores originais', () => {
    const item1 = dinheiro(15000);
    const item2 = dinheiro(20000);
    const total = item1.somar(item2);

    expect(total.kind).toBe('success');
    if (total.kind === 'success') {
      expect(total.value.centavos).toBe(35000);
    }
    expect(item1.centavos).toBe(15000);
    expect(item2.centavos).toBe(20000);
  });

  it('deve retornar falha para soma acima do limite seguro ou moedas distintas', () => {
    const limite = dinheiro(Number.MAX_SAFE_INTEGER);

    expect(limite.somar(dinheiro(1)).kind).toBe('failure');
    expect(dinheiro(100).somar(dinheiro(100, 'USD')).kind).toBe('failure');
  });

  it('deve subtrair quantias e impedir saldo negativo', () => {
    const total = dinheiro(10000);
    const desconto = dinheiro(4000);
    const resultado = total.subtrair(desconto);

    expect(resultado.kind).toBe('success');
    if (resultado.kind === 'success') {
      expect(resultado.value.centavos).toBe(6000);
    }
    expect(total.subtrair(dinheiro(10001)).kind).toBe('failure');
    expect(total.subtrair(dinheiro(1, 'USD')).kind).toBe('failure');
  });

  it('deve aplicar desconto fixo sem mutar o valor original', () => {
    const total = dinheiro(10000);
    const resultado = total.aplicarDesconto(dinheiro(2500));

    expect(resultado.kind).toBe('success');
    if (resultado.kind === 'success') {
      expect(resultado.value.centavos).toBe(7500);
    }
    expect(total.centavos).toBe(10000);
  });

  it('deve aplicar desconto percentual com arredondamento half-up determinístico', () => {
    const original = dinheiro(37990);
    const resultado = original.aplicarDescontoPercentual(5);

    expect(resultado.kind).toBe('success');
    if (resultado.kind === 'success') {
      expect(resultado.value.centavos).toBe(36090);
    }

    const fracao = dinheiro(100).aplicarDescontoPercentual(2.5);
    expect(fracao.kind).toBe('success');
    if (fracao.kind === 'success') {
      expect(fracao.value.centavos).toBe(97);
    }

    for (const percentual of [-1, 101, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(dinheiro(100).aplicarDescontoPercentual(percentual).kind).toBe(
        'failure'
      );
    }
  });

  it('deve formatar para Real Brasileiro (BRL) corretamente', () => {
    const formatado = dinheiro(38000)
      .formatarBRL()
      .replace(/\u00a0/g, ' ');

    expect(formatado).toBe('R$ 380,00');
  });

  it('deve manter o objeto imutável', () => {
    expect(Object.isFrozen(dinheiro(100))).toBe(true);
  });
});
