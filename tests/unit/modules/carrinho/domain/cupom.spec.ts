import { describe, expect, it } from 'vitest';
import { Money } from '@/shared/core/money';
import { Cupom, CupomProps } from '@/modules/carrinho/domain/cupom';

const agora = new Date('2026-11-15T12:00:00Z');

function dinheiro(centavos: number, moeda = 'BRL'): Money {
  const resultado = Money.fromCentavos(centavos, moeda);
  if (resultado.kind === 'failure') throw new Error(resultado.error.mensagem);
  return resultado.value;
}

type CupomPercentualProps = Extract<CupomProps, { tipo: 'PERCENTUAL' }>;

function criarCupom(
  props: Partial<CupomPercentualProps> = {}
): Cupom {
  const resultado = Cupom.criar({
    codigo: '  promo-10 ',
    valor: 10,
    valorMinimo: dinheiro(0),
    ativo: true,
    ...props,
    tipo: 'PERCENTUAL',
  });
  if (resultado.kind === 'failure') throw new Error(resultado.error.mensagem);
  return resultado.value;
}

function criarCupomFixo(codigo: string, valor: Money): Cupom {
  const resultado = Cupom.criar({
    codigo,
    tipo: 'FIXO',
    valor,
    valorMinimo: dinheiro(0),
    ativo: true,
  });
  if (resultado.kind === 'failure') throw new Error(resultado.error.mensagem);
  return resultado.value;
}

describe('Cupom', () => {
  it('aplica desconto percentual sobre o subtotal e normaliza o código', () => {
    const cupom = criarCupom();
    const desconto = cupom.calcularDesconto(dinheiro(10000), agora);

    expect(cupom.codigo).toBe('PROMO-10');
    expect(desconto).toMatchObject({
      kind: 'success',
      value: { centavos: 1000 },
    });
  });

  it('limita desconto fixo ao subtotal para não produzir total negativo', () => {
    const cupom = criarCupomFixo('FIXO', dinheiro(5000));

    expect(cupom.calcularDesconto(dinheiro(3000), agora)).toMatchObject({
      kind: 'success',
      value: { centavos: 3000 },
    });
  });

  it('rejeita cupom inativo, expirado, esgotado ou abaixo do mínimo', () => {
    const casos: Array<[Cupom, Money, Date, string]> = [
      [criarCupom({ ativo: false }), dinheiro(10000), agora, 'CUPOM_INATIVO'],
      [
        criarCupom({ expiraEm: new Date(agora.getTime()) }),
        dinheiro(10000),
        agora,
        'CUPOM_EXPIRADO',
      ],
      [
        criarCupom({ limiteUsos: 2, usosRealizados: 2 }),
        dinheiro(10000),
        agora,
        'CUPOM_USOS_ESGOTADOS',
      ],
      [
        criarCupom({ valorMinimo: dinheiro(5000) }),
        dinheiro(4999),
        agora,
        'CUPOM_PEDIDO_MINIMO',
      ],
    ];

    for (const [cupom, subtotal, data, codigo] of casos) {
      const resultado = cupom.calcularDesconto(subtotal, data);
      expect(resultado.kind).toBe('failure');
      if (resultado.kind === 'failure') {
        expect(resultado.error.codigo).toBe(codigo);
      }
    }
  });

  it('rejeita configuração inválida e moeda incompatível', () => {
    expect(
      Cupom.criar({
        codigo: 'INVALIDO',
        tipo: 'PERCENTUAL',
        valor: 101,
        valorMinimo: dinheiro(0),
        ativo: true,
      }).kind
    ).toBe('failure');

    const cupom = criarCupomFixo('FIXO', dinheiro(100, 'USD'));
    const resultado = cupom.calcularDesconto(dinheiro(1000), agora);
    expect(resultado.kind).toBe('failure');
    if (resultado.kind === 'failure') {
      expect(resultado.error.codigo).toBe('MOEDA_PRECIFICACAO_INCOMPATIVEL');
    }
  });
});
