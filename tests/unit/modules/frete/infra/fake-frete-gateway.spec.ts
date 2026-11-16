import { describe, expect, it } from 'vitest';
import { FakeFreteGateway } from '@/modules/frete/infra/fake-frete-gateway';
import { Money } from '@/shared/core/money';

describe('FakeFreteGateway', () => {
  it('retorna sempre as mesmas cotações PAC e SEDEX sem rede', async () => {
    const gateway = new FakeFreteGateway();
    const entrada = {
      cepOrigem: '01001000',
      cepDestino: '01310100',
      produtos: [{
        id: 'sku-1',
        larguraCm: 11,
        alturaCm: 17,
        comprimentoCm: 11,
        pesoGramas: 300,
        valorSeguro: dinheiro(38000),
        quantidade: 1,
      }],
    };

    const primeira = await gateway.calcularCotacoes(entrada);
    const segunda = await gateway.calcularCotacoes(entrada);

    expect(primeira.kind).toBe('success');
    expect(segunda.kind).toBe('success');
    if (primeira.kind === 'success' && segunda.kind === 'success') {
      expect(segunda.value).toEqual(primeira.value);
      expect(primeira.value.map((cotacao) => cotacao.modalidade)).toEqual([
        'PAC',
        'SEDEX',
      ]);
    }
  });
});

function dinheiro(centavos: number): Money {
  const resultado = Money.fromCentavos(centavos);
  if (resultado.kind === 'failure') throw new Error(resultado.error.mensagem);
  return resultado.value;
}
