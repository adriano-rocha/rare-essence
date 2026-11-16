import { z } from 'zod';
import { Money } from '@/shared/core/money';
import { Result } from '@/shared/core/result';
import {
  CriarPagamentoCartaoInput,
  CriarPagamentoInput,
  FalhaGatewayPagamento,
  PagamentoConsultado,
  PagamentoCriado,
  PagamentoGateway,
} from '../application/ports/pagamento-gateway';

const pagamentoResponseSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  status: z.string(),
  status_detail: z.string().optional(),
  date_of_expiration: z.string().optional(),
  point_of_interaction: z
    .object({
      transaction_data: z
        .object({
          qr_code: z.string().optional(),
          qr_code_base64: z.string().optional(),
          ticket_url: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

const consultaResponseSchema = pagamentoResponseSchema.extend({
  external_reference: z.string(),
  transaction_amount: z.number().finite().nonnegative(),
  currency_id: z.string(),
  payment_method_id: z.string(),
});

const respostaErroSchema = z.object({
  message: z.string().optional(),
  error: z.string().optional(),
});

type Fetch = typeof fetch;

export class MercadoPagoGateway implements PagamentoGateway {
  constructor(
    private readonly accessToken: string,
    private readonly fetcher: Fetch = fetch
  ) {}

  async criarPix(input: CriarPagamentoInput): Promise<Result<PagamentoCriado, FalhaGatewayPagamento>> {
    const resultado = await this.criarPagamento(
      {
        transaction_amount: input.valor.centavos / 100,
        description: `Pedido ${input.codigoPedido}`,
        payment_method_id: 'pix',
        payer: this.pagador(input.pagador),
        external_reference: input.pedidoId,
        date_of_expiration: input.expiraEm?.toISOString(),
      },
      input.chaveIdempotencia
    );
    if (resultado.kind === 'failure') return resultado;
    if (!resultado.value.codigoPix || !resultado.value.qrCodeBase64) {
      return this.falha(
        'RESPOSTA_INVALIDA',
        'O Mercado Pago não retornou o código Pix e a imagem do QR Code.'
      );
    }
    return resultado;
  }

  async criarCartao(
    input: CriarPagamentoCartaoInput
  ): Promise<Result<PagamentoCriado, FalhaGatewayPagamento>> {
    return this.criarPagamento(
      {
        transaction_amount: input.valor.centavos / 100,
        description: `Pedido ${input.codigoPedido}`,
        payment_method_id: input.metodoCartao,
        token: input.tokenCartao,
        installments: input.parcelas,
        payer: this.pagador(input.pagador),
        external_reference: input.pedidoId,
      },
      input.chaveIdempotencia
    );
  }

  async consultar(id: string): Promise<Result<PagamentoConsultado, FalhaGatewayPagamento>> {
    if (!this.configuracaoValida()) {
      return this.falha('CONFIGURACAO_INVALIDA', 'Configure um access token TEST do Mercado Pago.');
    }

    let response: Response;
    try {
      response = await this.fetcher(
        `https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`,
        { headers: this.headers() }
      );
    } catch {
      return this.falha('FALHA_DE_REDE', 'Não foi possível consultar o pagamento no Mercado Pago.');
    }

    const body = await this.lerJson(response);
    if (body.kind === 'failure') return body;
    if (!response.ok) return this.erroHttp(response.status, body.value);

    const pagamento = consultaResponseSchema.safeParse(body.value);
    if (!pagamento.success) {
      return this.falha('RESPOSTA_INVALIDA', 'O Mercado Pago retornou uma consulta de pagamento inválida.');
    }

    const valor = Money.fromReais(String(pagamento.data.transaction_amount).replace('.', ','));
    if (valor.kind === 'failure') {
      return this.falha('RESPOSTA_INVALIDA', 'O Mercado Pago retornou um valor de pagamento inválido.');
    }

    return Result.ok({
      id: pagamento.data.id,
      referenciaExterna: pagamento.data.external_reference,
      status: pagamento.data.status,
      valorCentavos: valor.value.centavos,
      moeda: pagamento.data.currency_id,
      metodo: pagamento.data.payment_method_id,
    });
  }

  private async criarPagamento(
    payload: Record<string, unknown>,
    chaveIdempotencia: string
  ): Promise<Result<PagamentoCriado, FalhaGatewayPagamento>> {
    if (!this.configuracaoValida()) {
      return this.falha('CONFIGURACAO_INVALIDA', 'Configure um access token TEST do Mercado Pago.');
    }
    if (!chaveIdempotencia.trim()) {
      return this.falha('CHAVE_IDEMPOTENCIA_INVALIDA', 'A chave de idempotência é obrigatória.');
    }

    let response: Response;
    try {
      response = await this.fetcher('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          ...this.headers(),
          'Content-Type': 'application/json',
          'X-Idempotency-Key': chaveIdempotencia,
        },
        body: JSON.stringify(payload),
      });
    } catch {
      return this.falha('FALHA_DE_REDE', 'Não foi possível criar o pagamento no Mercado Pago.');
    }

    const body = await this.lerJson(response);
    if (body.kind === 'failure') return body;
    if (!response.ok) return this.erroHttp(response.status, body.value);

    const pagamento = pagamentoResponseSchema.safeParse(body.value);
    if (!pagamento.success) {
      return this.falha('RESPOSTA_INVALIDA', 'O Mercado Pago retornou uma criação de pagamento inválida.');
    }

    const dadosPix = pagamento.data.point_of_interaction?.transaction_data;
    const expiraEm = pagamento.data.date_of_expiration
      ? new Date(pagamento.data.date_of_expiration)
      : undefined;
    if (expiraEm && !Number.isFinite(expiraEm.getTime())) {
      return this.falha('RESPOSTA_INVALIDA', 'O Mercado Pago retornou uma expiração de pagamento inválida.');
    }

    return Result.ok({
      id: pagamento.data.id,
      status: pagamento.data.status,
      detalheStatus: pagamento.data.status_detail,
      codigoPix: dadosPix?.qr_code,
      qrCodeBase64: dadosPix?.qr_code_base64,
      urlPagamento: dadosPix?.ticket_url,
      expiraEm,
    });
  }

  private configuracaoValida(): boolean {
    return this.accessToken.startsWith('TEST-') && this.accessToken.length > 5;
  }

  private headers(): HeadersInit {
    return { Authorization: `Bearer ${this.accessToken}` };
  }

  private pagador(pagador: CriarPagamentoInput['pagador']) {
    const partesNome = pagador.nome.trim().split(/\s+/);
    return {
      email: pagador.email,
      first_name: partesNome[0],
      last_name: pagador.sobrenome,
      identification: {
        type: 'CPF',
        number: pagador.cpf.replace(/\D/g, ''),
      },
    };
  }

  private async lerJson(
    response: Response
  ): Promise<Result<unknown, FalhaGatewayPagamento>> {
    try {
      return Result.ok(await response.json());
    } catch {
      return this.falha('RESPOSTA_INVALIDA', 'O Mercado Pago retornou uma resposta que não é JSON válido.');
    }
  }

  private erroHttp(
    status: number,
    body: unknown
  ): Result<never, FalhaGatewayPagamento> {
    const erro = respostaErroSchema.safeParse(body);
    const mensagem = erro.success
      ? erro.data.message ?? erro.data.error ?? `A requisição ao Mercado Pago falhou (${status}).`
      : `A requisição ao Mercado Pago falhou (${status}).`;
    return this.falha(`HTTP_${status}`, mensagem);
  }

  private falha(
    codigo: string,
    mensagem: string
  ): Result<never, FalhaGatewayPagamento> {
    return Result.fail(new FalhaGatewayPagamento(mensagem, codigo));
  }
}
