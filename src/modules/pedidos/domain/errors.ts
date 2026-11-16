import { DomainError } from '@/shared/core/errors/domain-error';
import { MoneyError } from '@/shared/core/money';

export class PedidoInvalidoError extends DomainError {
  constructor() {
    super('Os dados do pedido são inválidos.', 'PEDIDO_INVALIDO');
  }
}

export class ClientePedidoInvalidoError extends DomainError {
  constructor() {
    super('Os dados do cliente do pedido são inválidos.', 'CLIENTE_PEDIDO_INVALIDO');
  }
}

export class EnderecoEntregaInvalidoError extends DomainError {
  constructor() {
    super('O endereço de entrega do pedido é inválido.', 'ENDERECO_ENTREGA_INVALIDO');
  }
}

export class ItemPedidoInvalidoError extends DomainError {
  constructor() {
    super('O snapshot do item do pedido é inválido.', 'ITEM_PEDIDO_INVALIDO');
  }
}

export class FretePedidoInvalidoError extends DomainError {
  constructor() {
    super('O snapshot do frete do pedido é inválido.', 'FRETE_PEDIDO_INVALIDO');
  }
}

export class SnapshotPrecoPedidoInvalidoError extends DomainError {
  constructor() {
    super('Os valores do snapshot de preço do pedido são inconsistentes.', 'SNAPSHOT_PRECO_PEDIDO_INVALIDO');
  }
}

export class TransicaoPedidoInvalidaError extends DomainError {
  constructor(statusAtual: string, proximoStatus: string) {
    super(
      `Não é permitida a transição do pedido de ${statusAtual} para ${proximoStatus}.`,
      'TRANSICAO_PEDIDO_INVALIDA'
    );
  }
}

export class PedidoPixExpiradoError extends DomainError {
  constructor() {
    super('O prazo para pagamento Pix deste pedido expirou.', 'PEDIDO_PIX_EXPIRADO');
  }
}

export class PedidoPixNaoExpiradoError extends DomainError {
  constructor() {
    super('O prazo para pagamento Pix deste pedido ainda não expirou.', 'PEDIDO_PIX_NAO_EXPIRADO');
  }
}

export class PedidoNaoExpiravelError extends DomainError {
  constructor() {
    super('Somente pedidos Pix aguardando pagamento podem expirar.', 'PEDIDO_NAO_EXPIRAVEL');
  }
}

export class DataPedidoInvalidaError extends DomainError {
  constructor() {
    super('A data informada para o pedido é inválida.', 'DATA_PEDIDO_INVALIDA');
  }
}

export type PedidoError =
  | PedidoInvalidoError
  | ClientePedidoInvalidoError
  | EnderecoEntregaInvalidoError
  | ItemPedidoInvalidoError
  | FretePedidoInvalidoError
  | SnapshotPrecoPedidoInvalidoError
  | TransicaoPedidoInvalidaError
  | PedidoPixExpiradoError
  | PedidoPixNaoExpiradoError
  | PedidoNaoExpiravelError
  | DataPedidoInvalidaError
  | MoneyError;
