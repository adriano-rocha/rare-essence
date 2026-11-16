import { describe, expect, it, vi } from 'vitest';
import { Money } from '@/shared/core/money';
import { MercadoPagoGateway } from '@/modules/pagamentos/infra/mercado-pago-gateway';

function dinheiro(centavos: number): Money {
  const resultado = Money.fromCentavos(centavos);
  if (resultado.kind === 'failure') throw new Error(resultado.error.mensagem);
  return resultado.value;
}

const pagamentoBase = {
  pedidoId: 'pedido-123',
  codigoPedido: 'RE-123',
  chaveIdempotencia: 'idempotencia-123',
  valor: dinheiro(36100),
  pagador: {
    email: 'cliente@example.com',
    nome: 'Ana Maria',
    sobrenome: 'Silva',
    cpf: '123.456.789-09',
  },
};

describe('MercadoPagoGateway', () => {
  it('cria Pix com valor em reais, referência do pedido e chave de idempotência', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 123,
          status: 'pending',
          status_detail: 'pending_waiting_transfer',
          date_of_expiration: '2026-11-15T12:30:00Z',
          point_of_interaction: {
            transaction_data: {
              qr_code: 'pix-copia-cola',
              qr_code_base64: 'base64-image',
              ticket_url: 'https://example.test/pix',
            },
          },
        }),
        { status: 201 }
      )
    );
    const gateway = new MercadoPagoGateway('TEST-token', fetcher);

    const resultado = await gateway.criarPix({
      ...pagamentoBase,
      expiraEm: new Date('2026-11-15T12:30:00Z'),
    });

    expect(resultado.kind).toBe('success');
    if (resultado.kind === 'success') {
      expect(resultado.value).toMatchObject({
        id: '123',
        status: 'pending',
        codigoPix: 'pix-copia-cola',
        qrCodeBase64: 'base64-image',
        urlPagamento: 'https://example.test/pix',
      });
    }

    expect(fetcher).toHaveBeenCalledOnce();
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe('https://api.mercadopago.com/v1/payments');
    expect(options?.headers).toMatchObject({
      Authorization: 'Bearer TEST-token',
      'X-Idempotency-Key': 'idempotencia-123',
    });
    expect(JSON.parse(String(options?.body))).toMatchObject({
      transaction_amount: 361,
      payment_method_id: 'pix',
      external_reference: 'pedido-123',
      date_of_expiration: '2026-11-15T12:30:00.000Z',
      payer: {
        email: 'cliente@example.com',
        first_name: 'Ana',
        last_name: 'Silva',
        identification: { type: 'CPF', number: '12345678909' },
      },
    });
  });

  it('cria cartão somente com tokenização e parcelas recebidas pelo port', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 456, status: 'approved' }), { status: 201 })
    );
    const gateway = new MercadoPagoGateway('TEST-token', fetcher);

    const resultado = await gateway.criarCartao({
      ...pagamentoBase,
      tokenCartao: 'token-seguro',
      metodoCartao: 'master',
      parcelas: 3,
    });

    expect(resultado.kind).toBe('success');
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({
      transaction_amount: 361,
      payment_method_id: 'master',
      token: 'token-seguro',
      installments: 3,
      external_reference: 'pedido-123',
    });
  });

  it('impede chamadas com token de produção', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const gateway = new MercadoPagoGateway('APP_USR-live-token', fetcher);

    const resultado = await gateway.criarPix(pagamentoBase);

    expect(resultado.kind).toBe('failure');
    if (resultado.kind === 'failure') {
      expect(resultado.error.codigo).toBe('CONFIGURACAO_INVALIDA');
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('não aceita criação Pix sem os dados necessários para exibir o QR Code', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 123, status: 'pending' }), { status: 201 })
    );
    const gateway = new MercadoPagoGateway('TEST-token', fetcher);

    const resultado = await gateway.criarPix(pagamentoBase);

    expect(resultado.kind).toBe('failure');
    if (resultado.kind === 'failure') {
      expect(resultado.error.codigo).toBe('RESPOSTA_INVALIDA');
    }
  });

  it('retorna falha tipada quando o provedor rejeita a requisição', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ message: 'invalid payer' }), { status: 400 })
    );
    const gateway = new MercadoPagoGateway('TEST-token', fetcher);

    const resultado = await gateway.criarPix(pagamentoBase);

    expect(resultado.kind).toBe('failure');
    if (resultado.kind === 'failure') {
      expect(resultado.error.codigo).toBe('HTTP_400');
      expect(resultado.error.message).toBe('invalid payer');
    }
  });

  it('consulta o pagamento e preserva o valor em centavos', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 789,
          status: 'approved',
          external_reference: 'pedido-123',
          transaction_amount: 361,
          currency_id: 'BRL',
          payment_method_id: 'pix',
        }),
        { status: 200 }
      )
    );
    const gateway = new MercadoPagoGateway('TEST-token', fetcher);

    const resultado = await gateway.consultar('789');

    expect(resultado).toMatchObject({
      kind: 'success',
      value: {
        id: '789',
        referenciaExterna: 'pedido-123',
        status: 'approved',
        valorCentavos: 36100,
        moeda: 'BRL',
      },
    });
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.mercadopago.com/v1/payments/789',
      expect.any(Object)
    );
  });
});
