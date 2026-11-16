import { describe, expect, it, vi } from 'vitest';
import { FreteGateway } from '@/modules/frete/application/ports/frete-gateway';
import { CotarFretes } from '@/modules/frete/application/use-cases/cotar-fretes';
import { Money } from '@/shared/core/money';
import { Result } from '@/shared/core/result';

function dinheiro(centavos: number): Money {
  const resultado = Money.fromCentavos(centavos);
  if (resultado.kind === 'failure') throw new Error(resultado.error.mensagem);
  return resultado.value;
}

function entradaValida() {
  return {
    cepOrigem: '01001-000',
    cepDestino: '01310-100',
    produtos: [
      {
        id: 'variacao-100ml',
        larguraCm: 11,
        alturaCm: 17,
        comprimentoCm: 11,
        pesoGramas: 300,
        valorSeguro: dinheiro(38000),
        quantidade: 1,
      },
    ],
  };
}

describe('CotarFretes', () => {
  it('normaliza os CEPs e encaminha os produtos para o port', async () => {
    const gateway: FreteGateway = {
      calcularCotacoes: vi.fn().mockResolvedValue(Result.ok([])),
    };
    const useCase = new CotarFretes(gateway);

    await useCase.executar(entradaValida());

    expect(gateway.calcularCotacoes).toHaveBeenCalledWith(
      expect.objectContaining({
        cepOrigem: '01001000',
        cepDestino: '01310100',
      })
    );
  });

  it('rejeita CEP inválido e carrinho sem produtos sem chamar o gateway', async () => {
    const gateway: FreteGateway = {
      calcularCotacoes: vi.fn().mockResolvedValue(Result.ok([])),
    };
    const useCase = new CotarFretes(gateway);

    const cepInvalido = await useCase.executar({
      ...entradaValida(),
      cepDestino: '123',
    });
    const semProdutos = await useCase.executar({
      ...entradaValida(),
      produtos: [],
    });

    expect(cepInvalido.kind).toBe('failure');
    expect(semProdutos.kind).toBe('failure');
    expect(gateway.calcularCotacoes).not.toHaveBeenCalled();
  });

  it('rejeita dimensões, peso, preço ou quantidade inválidos', async () => {
    const gateway: FreteGateway = {
      calcularCotacoes: vi.fn().mockResolvedValue(Result.ok([])),
    };
    const useCase = new CotarFretes(gateway);
    const produtos = entradaValida().produtos;

    const resultado = await useCase.executar({
      ...entradaValida(),
      produtos: [{ ...produtos[0], larguraCm: 0 }],
    });

    expect(resultado.kind).toBe('failure');
    expect(gateway.calcularCotacoes).not.toHaveBeenCalled();
  });
});
