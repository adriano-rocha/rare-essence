import { Clock } from '@/shared/application/ports/clock.port';
import { Result } from '@/shared/core/result';
import { PedidoRepository } from '@/modules/pedidos/application/ports/pedido-repository';
import { PedidoPixExpiradoError } from '@/modules/pedidos/domain/errors';
import { FormaPagamento, StatusPedido } from '@/modules/pedidos/domain/pedido';
import {
  CriarPagamentoCartaoInput,
  CriarPagamentoInput,
  FalhaGatewayPagamento,
  PagamentoCriado,
  PagamentoGateway,
  PagadorPagamento,
} from '../ports/pagamento-gateway';

export class PedidoPagamentoNaoEncontradoError extends Error {
  readonly codigo = 'PEDIDO_NAO_ENCONTRADO';

  constructor() {
    super('O pedido informado não existe.');
    this.name = 'PedidoPagamentoNaoEncontradoError';
  }
}

export class PedidoNaoAguardandoPagamentoError extends Error {
  readonly codigo = 'PEDIDO_NAO_AGUARDANDO_PAGAMENTO';

  constructor() {
    super('Somente pedidos aguardando pagamento podem iniciar uma cobrança.');
    this.name = 'PedidoNaoAguardandoPagamentoError';
  }
}

export class FormaPagamentoIncompativelError extends Error {
  readonly codigo = 'FORMA_PAGAMENTO_INCOMPATIVEL';

  constructor() {
    super('A forma de pagamento deve ser definida no pedido antes da cobrança.');
    this.name = 'FormaPagamentoIncompativelError';
  }
}

export interface IniciarPagamentoCartaoInput {
  tokenCartao: string;
  metodoCartao: string;
  parcelas: number;
}

export type IniciarPagamentoError =
  | PedidoPagamentoNaoEncontradoError
  | PedidoNaoAguardandoPagamentoError
  | FormaPagamentoIncompativelError
  | PedidoPixExpiradoError
  | FalhaGatewayPagamento;

export class IniciarPagamento {
  constructor(
    private readonly pedidos: PedidoRepository,
    private readonly gateway: PagamentoGateway,
    private readonly clock: Clock
  ) {}

  async executar(
    pedidoId: string,
    cartao?: IniciarPagamentoCartaoInput
  ): Promise<Result<PagamentoCriado, IniciarPagamentoError>> {
    const pedido = await this.pedidos.buscarPorId(pedidoId);
    if (!pedido) {
      return Result.fail(new PedidoPagamentoNaoEncontradoError());
    }

    if (pedido.status !== StatusPedido.CRIADO) {
      return Result.fail(new PedidoNaoAguardandoPagamentoError());
    }

    if (pedido.formaPagamento === FormaPagamento.PIX) {
      if (pedido.expiraEm && this.clock.agora().getTime() >= pedido.expiraEm.getTime()) {
        return Result.fail(new PedidoPixExpiradoError());
      }

      if (cartao) {
        return Result.fail(new FormaPagamentoIncompativelError());
      }

      const input: CriarPagamentoInput = {
        pedidoId: pedido.id,
        codigoPedido: pedido.codigoRastreavel,
        chaveIdempotencia: pedido.id,
        valor: pedido.total,
        pagador: this.pagador(pedido.cliente.nome, pedido.cliente.email, pedido.cliente.cpf),
        expiraEm: pedido.expiraEm,
      };
      return this.gateway.criarPix(input);
    }

    if (!cartao || !this.cartaoValido(cartao, pedido.total.centavos)) {
      return Result.fail(new FormaPagamentoIncompativelError());
    }

    const input: CriarPagamentoCartaoInput = {
      pedidoId: pedido.id,
      codigoPedido: pedido.codigoRastreavel,
      chaveIdempotencia: pedido.id,
      valor: pedido.total,
      pagador: this.pagador(pedido.cliente.nome, pedido.cliente.email, pedido.cliente.cpf),
      tokenCartao: cartao.tokenCartao,
      metodoCartao: cartao.metodoCartao,
      parcelas: cartao.parcelas,
    };
    return this.gateway.criarCartao(input);
  }

  private cartaoValido(
    input: IniciarPagamentoCartaoInput,
    totalCentavos: number
  ): boolean {
    return (
      Boolean(input.tokenCartao.trim()) &&
      Boolean(input.metodoCartao.trim()) &&
      Number.isInteger(input.parcelas) &&
      input.parcelas >= 1 &&
      input.parcelas <= 6 &&
      Math.floor(totalCentavos / input.parcelas) >= 3000
    );
  }

  private pagador(nome: string, email: string, cpf: string): PagadorPagamento {
    const partes = nome.trim().split(/\s+/);
    return {
      email,
      nome: partes[0],
      sobrenome: partes.slice(1).join(' ') || partes[0],
      cpf,
    };
  }
}
