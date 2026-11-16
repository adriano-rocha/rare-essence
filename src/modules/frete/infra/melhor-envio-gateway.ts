import { z } from 'zod';
import { Result } from '@/shared/core/result';
import { Money } from '@/shared/core/money';
import {
  CotacaoInput,
  FalhaCotacao,
  FreteGateway,
  OpcaoFrete,
} from '../application/ports/frete-gateway';

const respostaCotacoesSchema = z.array(
  z
    .object({
      id: z.number().int(),
      custom_price: z.union([z.string(), z.number().finite()]).optional(),
      custom_delivery_time: z.number().int().nonnegative().optional(),
    })
    .passthrough()
);

const respostaErroSchema = z.object({
  message: z.string().optional(),
  error: z.string().optional(),
});

type Fetch = typeof fetch;

const SERVICOS = new Map<number, OpcaoFrete['modalidade']>([
  [1, 'PAC'],
  [2, 'SEDEX'],
]);

export class MelhorEnvioGateway implements FreteGateway {
  constructor(
    private readonly token: string,
    private readonly userAgent: string,
    private readonly sandboxAtivo: boolean,
    private readonly fetcher: Fetch = fetch
  ) {}

  async calcularCotacoes(
    params: CotacaoInput
  ): Promise<Result<OpcaoFrete[], FalhaCotacao>> {
    if (!this.configuracaoValida()) {
      return this.falha(
        'CONFIGURACAO_INVALIDA',
        'Configure token, User-Agent com e-mail de contato e ambiente sandbox do Melhor Envio.'
      );
    }

    let response: Response;
    try {
      response = await this.fetcher(
        'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': this.userAgent,
          },
          body: JSON.stringify(this.paraPayload(params)),
        }
      );
    } catch {
      return this.falha(
        'FALHA_DE_REDE',
        'Não foi possível consultar o sandbox do Melhor Envio.'
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return this.falha(
        'RESPOSTA_INVALIDA',
        'O Melhor Envio retornou uma resposta que não é JSON válido.'
      );
    }

    if (!response.ok) return this.erroHttp(response.status, body);

    const cotacoes = respostaCotacoesSchema.safeParse(body);
    if (!cotacoes.success) {
      return this.falha(
        'RESPOSTA_INVALIDA',
        'O Melhor Envio retornou uma lista de cotações inválida.'
      );
    }

    const opcoes: OpcaoFrete[] = [];
    for (const cotacao of cotacoes.data) {
      const modalidade = SERVICOS.get(cotacao.id);
      if (!modalidade) continue;

      if (cotacao.custom_price === undefined || cotacao.custom_delivery_time === undefined) {
        return this.falha(
          'RESPOSTA_INVALIDA',
          `A cotação ${modalidade} não contém preço ou prazo customizado.`
        );
      }

      const valorTexto = String(cotacao.custom_price).replace('.', ',');
      const valor = Money.fromReais(valorTexto);
      if (valor.kind === 'failure') {
        return this.falha(
          'RESPOSTA_INVALIDA',
          `A cotação ${modalidade} contém um preço inválido.`
        );
      }

      opcoes.push({
        codigoServico: cotacao.id,
        modalidade,
        valor: valor.value,
        prazoDias: cotacao.custom_delivery_time,
      });
    }

    return Result.ok(opcoes);
  }

  private configuracaoValida(): boolean {
    const emailDeContato = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
    return (
      this.sandboxAtivo &&
      Boolean(this.token.trim()) &&
      this.userAgent.trim().startsWith('Rare Essence') &&
      emailDeContato.test(this.userAgent)
    );
  }

  private paraPayload(params: CotacaoInput) {
    return {
      from: { postal_code: params.cepOrigem },
      to: { postal_code: params.cepDestino },
      products: params.produtos.map((produto) => ({
        id: produto.id,
        width: produto.larguraCm,
        height: produto.alturaCm,
        length: produto.comprimentoCm,
        weight: produto.pesoGramas / 1000,
        insurance_value: produto.valorSeguro.centavos / 100,
        quantity: produto.quantidade,
      })),
      options: { receipt: false, own_hand: false },
      services: '1,2',
    };
  }

  private erroHttp(
    status: number,
    body: unknown
  ): Result<never, FalhaCotacao> {
    const erro = respostaErroSchema.safeParse(body);
    const mensagem = erro.success
      ? erro.data.message ?? erro.data.error ?? `A cotação de frete falhou (${status}).`
      : `A cotação de frete falhou (${status}).`;
    return this.falha(`HTTP_${status}`, mensagem);
  }

  private falha(
    codigo: string,
    mensagem: string
  ): Result<never, FalhaCotacao> {
    return Result.fail(new FalhaCotacao(mensagem, codigo));
  }
}
