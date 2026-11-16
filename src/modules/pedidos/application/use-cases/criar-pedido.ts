import { Clock } from '@/shared/application/ports/clock.port';
import { IdGenerator } from '@/shared/application/ports/id-generator.port';
import { Result } from '@/shared/core/result';
import { ClientePedido, ClientePedidoProps } from '../../domain/cliente-pedido';
import { EnderecoEntrega, EnderecoEntregaProps } from '../../domain/endereco-entrega';
import { FretePedido, FretePedidoProps } from '../../domain/frete-pedido';
import { ItemPedido, ItemPedidoProps } from '../../domain/item-pedido';
import {
  FormaPagamento,
  Pedido,
} from '../../domain/pedido';
import { PedidoError } from '../../domain/errors';
import { PedidoRepository } from '../ports/pedido-repository';
import { Money } from '@/shared/core/money';

export interface CriarPedidoInput {
  cliente: ClientePedidoProps;
  enderecoEntrega: EnderecoEntregaProps;
  itens: readonly ItemPedidoProps[];
  formaPagamento: FormaPagamento;
  subtotalProdutos: Money;
  descontoCupom: Money;
  descontoPix: Money;
  frete: FretePedidoProps;
  totalCartao: Money;
  totalPix: Money;
  codigoCupom?: string;
}

export class CriarPedido {
  constructor(
    private readonly repository: PedidoRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock
  ) {}

  async executar(input: CriarPedidoInput): Promise<Result<Pedido, PedidoError>> {
    const cliente = ClientePedido.criar(input.cliente);
    if (cliente.kind === 'failure') return Result.fail(cliente.error);

    const endereco = EnderecoEntrega.criar(input.enderecoEntrega);
    if (endereco.kind === 'failure') return Result.fail(endereco.error);

    const itens: ItemPedido[] = [];
    for (const props of input.itens) {
      const item = ItemPedido.criar(props);
      if (item.kind === 'failure') return Result.fail(item.error);
      itens.push(item.value);
    }

    const frete = FretePedido.criar(input.frete);
    if (frete.kind === 'failure') return Result.fail(frete.error);

    const id = this.idGenerator.gerar();
    const pedido = Pedido.criar({
      id,
      codigoRastreavel: `RE-${this.idGenerator.gerar().toUpperCase()}`,
      cliente: cliente.value,
      enderecoEntrega: endereco.value,
      itens,
      formaPagamento: input.formaPagamento,
      subtotalProdutos: input.subtotalProdutos,
      descontoCupom: input.descontoCupom,
      descontoPix: input.descontoPix,
      frete: frete.value,
      totalCartao: input.totalCartao,
      totalPix: input.totalPix,
      codigoCupom: input.codigoCupom?.trim().toUpperCase(),
      criadoEm: this.clock.agora(),
    });

    if (pedido.kind === 'failure') return Result.fail(pedido.error);

    await this.repository.salvar(pedido.value);
    return Result.ok(pedido.value);
  }
}
