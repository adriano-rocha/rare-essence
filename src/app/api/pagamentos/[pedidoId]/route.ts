import { z } from 'zod';
import { IniciarPagamento } from '@/modules/pagamentos/application/use-cases/iniciar-pagamento';
import { MercadoPagoGateway } from '@/modules/pagamentos/infra/mercado-pago-gateway';
import { PrismaPedidoRepository } from '@/modules/pedidos/infra/prisma-pedido-repository';
import { prisma } from '@/shared/infra/prisma';
import { SystemClock } from '@/shared/infra/clock';
import { LIMITE_CRIACAO_PAGAMENTO } from '@/shared/infra/rate-limit-policies';
import { obterIdentificadorCliente } from '@/shared/infra/client-identifier';
import { PrismaRateLimiter } from '@/shared/infra/prisma-rate-limiter';

const pagamentoInputSchema = z.discriminatedUnion('formaPagamento', [
  z.object({ formaPagamento: z.literal('PIX') }),
  z.object({
    formaPagamento: z.literal('CARTAO'),
    tokenCartao: z.string().trim().min(1).max(2048),
    metodoCartao: z.string().trim().min(1).max(40),
    parcelas: z.number().int().min(1).max(6),
  }),
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ pedidoId: string }> }
): Promise<Response> {
  let limite;
  try {
    limite = await new PrismaRateLimiter(
      prisma,
      process.env.ADMIN_SESSION_SECRET ?? ''
    ).consumir(
      obterIdentificadorCliente(request),
      LIMITE_CRIACAO_PAGAMENTO
    );
  } catch (erro) {
    console.error('Rate limit de criação de pagamento indisponível.', erro);
    return Response.json(
      { erro: 'SERVICO_INDISPONIVEL', mensagem: 'Não foi possível iniciar o pagamento agora.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (!limite.permitido) {
    return Response.json(
      { erro: 'MUITAS_REQUISICOES', mensagem: 'Tente novamente mais tarde.' },
      {
        status: 429,
        headers: {
          'Cache-Control': 'no-store',
          'Retry-After': String(limite.tentarNovamenteEmSegundos),
        },
      }
    );
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return Response.json(
      { erro: 'CORPO_INVALIDO', mensagem: 'O corpo deve ser um JSON válido.' },
      { status: 400 }
    );
  }

  const entrada = pagamentoInputSchema.safeParse(corpo);
  if (!entrada.success) {
    return Response.json(
      { erro: 'ENTRADA_INVALIDA', detalhes: entrada.error.flatten() },
      { status: 400 }
    );
  }

  const { pedidoId } = await context.params;
  const tokenMp = (process.env.MERCADO_PAGO_ACCESS_TOKEN ?? '')
    .trim()
    .replace(/^["']|["']$/g, '');
  console.info('[MP_CHECK]', {
    definido: Boolean(tokenMp),
    tamanho: tokenMp.length,
    prefixo: tokenMp.slice(0, 5),
  });

  const useCase = new IniciarPagamento(
    new PrismaPedidoRepository(prisma),
    new MercadoPagoGateway(tokenMp),
    new SystemClock()
  );
  const cartao =
    entrada.data.formaPagamento === 'CARTAO'
      ? {
          tokenCartao: entrada.data.tokenCartao,
          metodoCartao: entrada.data.metodoCartao,
          parcelas: entrada.data.parcelas,
        }
      : undefined;

  const resultado = await useCase.executar(pedidoId, cartao);
  if (resultado.kind === 'failure') {
    const status =
      resultado.error.codigo === 'PEDIDO_NAO_ENCONTRADO'
        ? 404
        : resultado.error.codigo === 'CONFIGURACAO_INVALIDA'
          ? 503
          : resultado.error.codigo.startsWith('HTTP_') ||
              resultado.error.codigo === 'FALHA_DE_REDE'
            ? 502
            : 409;

    return Response.json(
      {
        erro: resultado.error.codigo,
        mensagem:
          'mensagem' in resultado.error
            ? resultado.error.mensagem
            : resultado.error.message,
      },
      { status }
    );
  }

  return Response.json(resultado.value, { status: 201 });
}