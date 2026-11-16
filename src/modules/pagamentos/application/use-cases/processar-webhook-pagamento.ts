import { Result } from '@/shared/core/result';
import { PedidoRepository } from '@/modules/pedidos/application/ports/pedido-repository';
import { FormaPagamento } from '@/modules/pedidos/domain/pedido';
import {
  FalhaGatewayPagamento,
  PagamentoGateway,
} from '../ports/pagamento-gateway';
import {
  ResultadoEventoPagamento,
  WebhookPagamentoRepository,
} from '../ports/webhook-pagamento-repository';

export interface NotificacaoPagamento {
  idEvento: string;
  tipo: string;
  acao: string;
  idPagamento: string;
}

export class NotificacaoPagamentoInvalidaError extends Error {
  readonly codigo = 'NOTIFICACAO_PAGAMENTO_INVALIDA';

  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'NotificacaoPagamentoInvalidaError';
  }
}

export class ProcessarWebhookPagamento {
  constructor(
    private readonly gateway: PagamentoGateway,
    private readonly pedidos: PedidoRepository,
    private readonly eventos: WebhookPagamentoRepository
  ) {}

  async executar(
    notificacao: NotificacaoPagamento,
    recebidoEm: Date
  ): Promise<Result<ResultadoEventoPagamento | 'IGNORADO', Error>> {
    if (notificacao.tipo !== 'payment' || !notificacao.acao.startsWith('payment.')) {
      return Result.ok('IGNORADO');
    }

    const consulta = await this.gateway.consultar(notificacao.idPagamento);
    if (consulta.kind === 'failure') return Result.fail(consulta.error);

    if (consulta.value.id !== notificacao.idPagamento) {
      return Result.fail(
        new NotificacaoPagamentoInvalidaError('O ID do pagamento consultado não corresponde ao evento.')
      );
    }

    const pedido = await this.pedidos.buscarPorId(consulta.value.referenciaExterna);
    if (!pedido) {
      return Result.fail(
        new NotificacaoPagamentoInvalidaError('O pagamento não referencia um pedido existente.')
      );
    }

    if (
      consulta.value.valorCentavos !== pedido.totalEmCentavos ||
      consulta.value.moeda !== 'BRL' ||
      !this.formaPagamentoCompativel(pedido.formaPagamento, consulta.value.metodo)
    ) {
      return Result.fail(
        new NotificacaoPagamentoInvalidaError(
          'O valor, a moeda ou a forma de pagamento não correspondem ao pedido.'
        )
      );
    }

    return Result.ok(await this.eventos.processarEvento({
      idEventoExterno: notificacao.idEvento,
      idPagamentoExterno: consulta.value.id,
      pedidoId: pedido.id,
      acao: notificacao.acao,
      statusPagamento: consulta.value.status,
      aprovado: consulta.value.status === 'approved',
      recebidoEm,
    }));
  }

  private formaPagamentoCompativel(forma: FormaPagamento, metodo: string): boolean {
    return forma === FormaPagamento.PIX ? metodo === 'pix' : metodo !== 'pix';
  }
}
