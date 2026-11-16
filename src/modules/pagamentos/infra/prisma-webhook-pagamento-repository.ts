import { Prisma, PrismaClient } from '@prisma/client';
import { WebhookPagamentoRepository, ProcessarEventoPagamentoInput, ResultadoEventoPagamento } from '../application/ports/webhook-pagamento-repository';
import { PedidoMapper } from '@/modules/pedidos/infra/mappers/pedido-mapper';
import { StatusPedido } from '@/modules/pedidos/domain/pedido';

export class PrismaWebhookPagamentoRepository implements WebhookPagamentoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async processarEvento(
    input: ProcessarEventoPagamentoInput
  ): Promise<ResultadoEventoPagamento> {
    return this.prisma.$transaction(async (transacao) => {
      const insercao = await transacao.eventoWebhookPagamento.createMany({
        data: {
          idEventoExterno: input.idEventoExterno,
          idPagamentoExterno: input.idPagamentoExterno,
          pedidoId: input.pedidoId,
          acao: input.acao,
          statusPagamento: input.statusPagamento,
          resultado: input.aprovado ? 'APLICADO' : 'NAO_APROVADO',
          recebidoEm: input.recebidoEm,
        },
        skipDuplicates: true,
      });

      if (insercao.count === 0) return 'DUPLICADO';
      if (!input.aprovado) return 'NAO_APROVADO';

      await transacao.$queryRaw`
        SELECT "id" FROM "pedidos" WHERE "id" = ${input.pedidoId} FOR UPDATE
      `;
      const registro = await transacao.pedido.findUnique({
        where: { id: input.pedidoId },
        include: { itens: true },
      });
      if (!registro) {
        throw new Error(`Pedido inexistente para webhook de pagamento: ${input.pedidoId}.`);
      }

      const pedido = PedidoMapper.toDomain(registro);
      if (
        pedido.status === StatusPedido.PAGO ||
        pedido.status === StatusPedido.EM_SEPARACAO ||
        pedido.status === StatusPedido.ENVIADO ||
        pedido.status === StatusPedido.ENTREGUE
      ) {
        return 'APLICADO';
      }

      if (pedido.status !== StatusPedido.CRIADO) {
        await this.marcarNaoPagavel(transacao, input.idEventoExterno);
        return 'PEDIDO_NAO_PAGAVEL';
      }

      const transicao = pedido.marcarPago(input.recebidoEm);
      if (transicao.kind === 'failure') {
        await this.marcarNaoPagavel(transacao, input.idEventoExterno);
        return 'PEDIDO_NAO_PAGAVEL';
      }

      await transacao.pedido.update({
        where: { id: pedido.id },
        data: {
          status: pedido.status,
          atualizadoEm: pedido.atualizadoEm,
        },
      });

      return 'APLICADO';
    });
  }

  private marcarNaoPagavel(
    transacao: Prisma.TransactionClient,
    idEventoExterno: string
  ): Promise<unknown> {
    return transacao.eventoWebhookPagamento.update({
      where: { idEventoExterno },
      data: { resultado: 'PEDIDO_NAO_PAGAVEL' },
    });
  }
}
