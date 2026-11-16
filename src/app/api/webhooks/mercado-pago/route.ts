import { z } from 'zod';
import { ProcessarWebhookPagamento } from '@/modules/pagamentos/application/use-cases/processar-webhook-pagamento';
import { validarAssinaturaWebhookMercadoPago } from '@/modules/pagamentos/infra/assinatura-webhook';
import { MercadoPagoGateway } from '@/modules/pagamentos/infra/mercado-pago-gateway';
import { PrismaWebhookPagamentoRepository } from '@/modules/pagamentos/infra/prisma-webhook-pagamento-repository';
import { PrismaPedidoRepository } from '@/modules/pedidos/infra/prisma-pedido-repository';
import { prisma } from '@/shared/infra/prisma';

const idSchema = z.union([z.string().min(1), z.number().int().positive()]).transform(String);

const notificacaoSchema = z.object({
  id: idSchema,
  type: z.string(),
  action: z.string(),
  data: z.object({ id: idSchema }),
});

export async function POST(request: Request): Promise<Response> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN ?? '';
  const segredo = process.env.MERCADO_PAGO_WEBHOOK_SECRET ?? '';
  if (!token.startsWith('TEST-') || !segredo) {
    return Response.json(
      { erro: 'CONFIGURACAO_INVALIDA', mensagem: 'Configure as credenciais TEST do Mercado Pago.' },
      { status: 503 }
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

  const entrada = notificacaoSchema.safeParse(corpo);
  if (!entrada.success) {
    return Response.json(
      { erro: 'NOTIFICACAO_INVALIDA', detalhes: entrada.error.flatten() },
      { status: 400 }
    );
  }

  const requestId = request.headers.get('x-request-id');
  if (
    !validarAssinaturaWebhookMercadoPago(
      segredo,
      request.headers.get('x-signature'),
      requestId,
      entrada.data.data.id
    )
  ) {
    return Response.json(
      { erro: 'ASSINATURA_INVALIDA', mensagem: 'A assinatura do webhook não é válida.' },
      { status: 401 }
    );
  }

  const useCase = new ProcessarWebhookPagamento(
    new MercadoPagoGateway(token),
    new PrismaPedidoRepository(prisma),
    new PrismaWebhookPagamentoRepository(prisma)
  );
  const resultado = await useCase.executar(
    {
      idEvento: entrada.data.id,
      tipo: entrada.data.type,
      acao: entrada.data.action,
      idPagamento: entrada.data.data.id,
    },
    new Date()
  );

  if (resultado.kind === 'failure') {
    const status =
      resultado.error.name === 'FalhaGatewayPagamento'
        ? 502
        : 422;
    return Response.json(
      { erro: 'WEBHOOK_NAO_PROCESSADO', mensagem: resultado.error.message },
      { status }
    );
  }

  if (resultado.value === 'PEDIDO_NAO_PAGAVEL') {
    console.error(
      `Pagamento aprovado não aplicado: evento ${entrada.data.id}, pagamento ${entrada.data.data.id}.`
    );
  }

  return Response.json({ resultado: resultado.value }, { status: 200 });
}
