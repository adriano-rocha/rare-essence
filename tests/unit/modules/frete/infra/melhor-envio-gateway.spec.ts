import { describe, expect, it, vi } from 'vitest';
import { MelhorEnvioGateway } from '@/modules/frete/infra/melhor-envio-gateway';
import { Money } from '@/shared/core/money';

function dinheiro(centavos: number): Money {
  const resultado = Money.fromCentavos(centavos);
  if (resultado.kind === 'failure') throw new Error(resultado.error.mensagem);
  return resultado.value;
}

const entrada = {
  cepOrigem: '01001000',
  cepDestino: '01310100',
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

describe('MelhorEnvioGateway', () => {
  it('cota PAC e SEDEX no sandbox com medidas convertidas e valores customizados', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify([
          { id: 1, custom_price: '37.79', custom_delivery_time: 9 },
          { id: 2, custom_price: '46.23', custom_delivery_time: 4 },
          { id: 3 },
        ]),
        { status: 200 }
      )
    );
    const gateway = new MelhorEnvioGateway(
      'sandbox-token',
      'Rare Essence (dev@example.com)',
      true,
      fetcher
    );

    const resultado = await gateway.calcularCotacoes(entrada);

    expect(resultado.kind).toBe('success');
    if (resultado.kind === 'success') {
      expect(resultado.value).toHaveLength(2);
      expect(resultado.value.map((cotacao) => ({
        modalidade: cotacao.modalidade,
        centavos: cotacao.valor.centavos,
        prazoDias: cotacao.prazoDias,
      }))).toEqual([
        { modalidade: 'PAC', centavos: 3779, prazoDias: 9 },
        { modalidade: 'SEDEX', centavos: 4623, prazoDias: 4 },
      ]);
    }

    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe(
      'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate'
    );
    expect(options?.headers).toMatchObject({
      Authorization: 'Bearer sandbox-token',
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Rare Essence (dev@example.com)',
    });
    expect(JSON.parse(String(options?.body))).toEqual({
      from: { postal_code: '01001000' },
      to: { postal_code: '01310100' },
      products: [
        {
          id: 'variacao-100ml',
          width: 11,
          height: 17,
          length: 11,
          weight: 0.3,
          insurance_value: 380,
          quantity: 1,
        },
      ],
      options: { receipt: false, own_hand: false },
      services: '1,2',
    });
  });

  it('não chama endpoint de produção nem aceita configuração fora do sandbox', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const gateway = new MelhorEnvioGateway(
      'token',
      'Rare Essence (dev@example.com)',
      false,
      fetcher
    );

    const resultado = await gateway.calcularCotacoes(entrada);

    expect(resultado.kind).toBe('failure');
    if (resultado.kind === 'failure') {
      expect(resultado.error.codigo).toBe('CONFIGURACAO_INVALIDA');
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('retorna falha tipada para erro HTTP e resposta JSON inválida', async () => {
    const fetchErro = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ message: 'invalid token' }), { status: 401 })
    );
    const gatewayErro = new MelhorEnvioGateway(
      'sandbox-token',
      'Rare Essence (dev@example.com)',
      true,
      fetchErro
    );
    const resultadoErro = await gatewayErro.calcularCotacoes(entrada);

    const fetchInvalido = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('not-json', { status: 200 })
    );
    const gatewayInvalido = new MelhorEnvioGateway(
      'sandbox-token',
      'Rare Essence (dev@example.com)',
      true,
      fetchInvalido
    );
    const resultadoInvalido = await gatewayInvalido.calcularCotacoes(entrada);

    expect(resultadoErro.kind).toBe('failure');
    expect(resultadoInvalido.kind).toBe('failure');
  });

  it('falha explicitamente se uma cotação Correios não tiver preço ou prazo customizado', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify([{ id: 1, price: '37.79', delivery_time: 9 }]), {
        status: 200,
      })
    );
    const gateway = new MelhorEnvioGateway(
      'sandbox-token',
      'Rare Essence (dev@example.com)',
      true,
      fetcher
    );

    const resultado = await gateway.calcularCotacoes(entrada);

    expect(resultado.kind).toBe('failure');
    if (resultado.kind === 'failure') {
      expect(resultado.error.codigo).toBe('RESPOSTA_INVALIDA');
    }
  });
});
