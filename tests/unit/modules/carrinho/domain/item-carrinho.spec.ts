import { describe, expect, it } from 'vitest';
import { Money } from '@/shared/core/money';
import { ItemCarrinho } from '@/modules/carrinho/domain/item-carrinho';

function dinheiro(centavos: number): Money {
  const resultado = Money.fromCentavos(centavos);
  if (resultado.kind === 'failure') throw new Error(resultado.error.mensagem);
  return resultado.value;
}

describe('ItemCarrinho', () => {
  it('valida quantidade e calcula subtotal em centavos', () => {
    const item = ItemCarrinho.criar({
      variacaoId: 'variacao-1',
      sku: 'RARE-NOIR-50ML',
      precoUnitario: dinheiro(1250),
      quantidade: 3,
    });

    expect(item.kind).toBe('success');
    if (item.kind === 'success') {
      expect(item.value.calcularSubtotal()).toMatchObject({
        kind: 'success',
        value: { centavos: 3750 },
      });
    }

    for (const quantidade of [0, -1, 1.5, 2_147_483_648]) {
      expect(
        ItemCarrinho.criar({
          variacaoId: 'variacao-1',
          sku: 'RARE-NOIR-50ML',
          precoUnitario: dinheiro(1250),
          quantidade,
        }).kind
      ).toBe('failure');
    }
  });
});
