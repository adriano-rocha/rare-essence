export interface ProcessarEventoPagamentoInput {
  idEventoExterno: string;
  idPagamentoExterno: string;
  pedidoId: string;
  acao: string;
  statusPagamento: string;
  aprovado: boolean;
  recebidoEm: Date;
}

export type ResultadoEventoPagamento =
  | 'APLICADO'
  | 'DUPLICADO'
  | 'NAO_APROVADO'
  | 'PEDIDO_NAO_PAGAVEL';

export interface WebhookPagamentoRepository {
  processarEvento(
    input: ProcessarEventoPagamentoInput
  ): Promise<ResultadoEventoPagamento>;
}
