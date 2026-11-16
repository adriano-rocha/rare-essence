import { Money } from '@/shared/core/money';
import { Result } from '@/shared/core/result';
import { ClientePedido } from './cliente-pedido';
import { EnderecoEntrega } from './endereco-entrega';
import {
  DataPedidoInvalidaError,
  PedidoError,
  PedidoInvalidoError,
  PedidoNaoExpiravelError,
  PedidoPixExpiradoError,
  PedidoPixNaoExpiradoError,
  SnapshotPrecoPedidoInvalidoError,
  TransicaoPedidoInvalidaError,
} from './errors';
import { FretePedido } from './frete-pedido';
import { ItemPedido } from './item-pedido';

export const StatusPedido = {
  CRIADO: 'CRIADO',
  PAGO: 'PAGO',
  EM_SEPARACAO: 'EM_SEPARACAO',
  ENVIADO: 'ENVIADO',
  ENTREGUE: 'ENTREGUE',
  CANCELADO: 'CANCELADO',
} as const;

export type StatusPedido = (typeof StatusPedido)[keyof typeof StatusPedido];

export const FormaPagamento = {
  PIX: 'PIX',
  CARTAO: 'CARTAO',
} as const;

export type FormaPagamento = (typeof FormaPagamento)[keyof typeof FormaPagamento];

export interface PedidoProps {
  id: string;
  codigoRastreavel: string;
  cliente: ClientePedido;
  enderecoEntrega: EnderecoEntrega;
  itens: readonly ItemPedido[];
  formaPagamento: FormaPagamento;
  subtotalProdutos: Money;
  descontoCupom: Money;
  descontoPix: Money;
  frete: FretePedido;
  totalCartao: Money;
  totalPix: Money;
  codigoCupom?: string;
  criadoEm: Date;
}

const PRAZO_PIX_MINUTOS = 30;
const VALOR_MAXIMO_CENTAVOS = 2_147_483_647;

export class Pedido {
  private statusAtual: StatusPedido = StatusPedido.CRIADO;
  private dataAtualizacao: Date;
  private readonly dataCriacao: Date;
  private readonly dataExpiracao?: Date;
  private readonly itensSnapshot: readonly ItemPedido[];

  private constructor(
    private readonly props: PedidoProps,
    status: StatusPedido = StatusPedido.CRIADO,
    atualizadoEm: Date = props.criadoEm
  ) {
    this.dataCriacao = new Date(props.criadoEm);
    this.dataAtualizacao = new Date(atualizadoEm);
    this.statusAtual = status;
    this.dataExpiracao =
      props.formaPagamento === FormaPagamento.PIX
        ? new Date(props.criadoEm.getTime() + PRAZO_PIX_MINUTOS * 60 * 1000)
        : undefined;
    this.itensSnapshot = Object.freeze([...props.itens]);
    Object.freeze(this.props);
  }

  static criar(props: PedidoProps): Result<Pedido, PedidoError> {
    if (
      !props.id.trim() ||
      !props.codigoRastreavel.trim() ||
      props.itens.length === 0 ||
      !Number.isFinite(props.criadoEm.getTime()) ||
      !Object.values(FormaPagamento).includes(props.formaPagamento)
    ) {
      return Result.fail(new PedidoInvalidoError());
    }

    const snapshotValido = this.validarSnapshotDePreco(props);
    if (snapshotValido.kind === 'failure') {
      return Result.fail(snapshotValido.error);
    }

    return Result.ok(new Pedido(props));
  }

  static reconstituir(
    props: PedidoProps,
    status: StatusPedido,
    atualizadoEm: Date
  ): Result<Pedido, PedidoError> {
    if (
      !Object.values(StatusPedido).includes(status) ||
      !Number.isFinite(atualizadoEm.getTime()) ||
      !props.id.trim() ||
      !props.codigoRastreavel.trim() ||
      props.itens.length === 0 ||
      !Number.isFinite(props.criadoEm.getTime()) ||
      !Object.values(FormaPagamento).includes(props.formaPagamento)
    ) {
      return Result.fail(new PedidoInvalidoError());
    }

    const snapshotValido = this.validarSnapshotDePreco(props);
    if (snapshotValido.kind === 'failure') {
      return Result.fail(snapshotValido.error);
    }

    return Result.ok(new Pedido(props, status, atualizadoEm));
  }

  get id(): string {
    return this.props.id;
  }

  get codigoRastreavel(): string {
    return this.props.codigoRastreavel;
  }

  get cliente(): ClientePedido {
    return this.props.cliente;
  }

  get enderecoEntrega(): EnderecoEntrega {
    return this.props.enderecoEntrega;
  }

  get itens(): readonly ItemPedido[] {
    return this.itensSnapshot;
  }

  get formaPagamento(): FormaPagamento {
    return this.props.formaPagamento;
  }

  get subtotalProdutos(): Money {
    return this.props.subtotalProdutos;
  }

  get descontoCupom(): Money {
    return this.props.descontoCupom;
  }

  get descontoPix(): Money {
    return this.props.descontoPix;
  }

  get frete(): FretePedido {
    return this.props.frete;
  }

  get totalCartao(): Money {
    return this.props.totalCartao;
  }

  get totalPix(): Money {
    return this.props.totalPix;
  }

  get total(): Money {
    return this.props.formaPagamento === FormaPagamento.PIX
      ? this.props.totalPix
      : this.props.totalCartao;
  }

  get totalEmCentavos(): number {
    return this.total.centavos;
  }

  get codigoCupom(): string | undefined {
    return this.props.codigoCupom;
  }

  get status(): StatusPedido {
    return this.statusAtual;
  }

  get criadoEm(): Date {
    return new Date(this.dataCriacao);
  }

  get atualizadoEm(): Date {
    return new Date(this.dataAtualizacao);
  }

  get expiraEm(): Date | undefined {
    return this.dataExpiracao ? new Date(this.dataExpiracao) : undefined;
  }

  marcarPago(agora: Date): Result<void, PedidoError> {
    if (!this.dataValida(agora)) {
      return Result.fail(new DataPedidoInvalidaError());
    }
    if (
      this.formaPagamento === FormaPagamento.PIX &&
      this.dataExpiracao &&
      agora.getTime() >= this.dataExpiracao.getTime()
    ) {
      return Result.fail(new PedidoPixExpiradoError());
    }
    return this.transicionar(StatusPedido.CRIADO, StatusPedido.PAGO, agora);
  }

  iniciarSeparacao(agora: Date): Result<void, PedidoError> {
    return this.transicionar(StatusPedido.PAGO, StatusPedido.EM_SEPARACAO, agora);
  }

  marcarEnviado(agora: Date): Result<void, PedidoError> {
    return this.transicionar(StatusPedido.EM_SEPARACAO, StatusPedido.ENVIADO, agora);
  }

  marcarEntregue(agora: Date): Result<void, PedidoError> {
    return this.transicionar(StatusPedido.ENVIADO, StatusPedido.ENTREGUE, agora);
  }

  cancelar(agora: Date): Result<void, PedidoError> {
    if (!this.dataValida(agora)) {
      return Result.fail(new DataPedidoInvalidaError());
    }

    if (
      this.statusAtual !== StatusPedido.CRIADO &&
      this.statusAtual !== StatusPedido.PAGO &&
      this.statusAtual !== StatusPedido.EM_SEPARACAO
    ) {
      return Result.fail(
        new TransicaoPedidoInvalidaError(this.statusAtual, StatusPedido.CANCELADO)
      );
    }

    this.statusAtual = StatusPedido.CANCELADO;
    this.dataAtualizacao = new Date(agora);
    return Result.ok(undefined);
  }

  expirarPix(agora: Date): Result<void, PedidoError> {
    if (!this.dataValida(agora)) {
      return Result.fail(new DataPedidoInvalidaError());
    }

    if (
      this.formaPagamento !== FormaPagamento.PIX ||
      this.statusAtual !== StatusPedido.CRIADO ||
      !this.dataExpiracao
    ) {
      return Result.fail(new PedidoNaoExpiravelError());
    }

    if (agora.getTime() < this.dataExpiracao.getTime()) {
      return Result.fail(new PedidoPixNaoExpiradoError());
    }

    this.statusAtual = StatusPedido.CANCELADO;
    this.dataAtualizacao = new Date(agora);
    return Result.ok(undefined);
  }

  private transicionar(
    statusEsperado: StatusPedido,
    proximoStatus: StatusPedido,
    agora: Date
  ): Result<void, PedidoError> {
    if (!this.dataValida(agora)) {
      return Result.fail(new DataPedidoInvalidaError());
    }
    if (this.statusAtual !== statusEsperado) {
      return Result.fail(
        new TransicaoPedidoInvalidaError(this.statusAtual, proximoStatus)
      );
    }

    this.statusAtual = proximoStatus;
    this.dataAtualizacao = new Date(agora);
    return Result.ok(undefined);
  }

  private dataValida(data: Date): boolean {
    return Number.isFinite(data.getTime());
  }

  private static validarSnapshotDePreco(
    props: PedidoProps
  ): Result<void, PedidoError> {
    const valores = [
      props.subtotalProdutos,
      props.descontoCupom,
      props.descontoPix,
      props.frete.valor,
      props.totalCartao,
      props.totalPix,
      ...props.itens.map((item) => item.precoUnitario),
    ];
    const moeda = props.subtotalProdutos.moeda;

    if (
      valores.some(
        (valor) =>
          valor.moeda !== moeda ||
          valor.centavos > VALOR_MAXIMO_CENTAVOS
      )
    ) {
      return Result.fail(new SnapshotPrecoPedidoInvalidoError());
    }

    let subtotal = Money.fromCentavos(0, moeda);
    if (subtotal.kind === 'failure') {
      return Result.fail(subtotal.error);
    }
    let subtotalCalculado = subtotal.value;

    for (const item of props.itens) {
      const linha = item.calcularSubtotal();
      if (linha.kind === 'failure') {
        return Result.fail(linha.error);
      }
      const soma = subtotalCalculado.somar(linha.value);
      if (soma.kind === 'failure') {
        return Result.fail(soma.error);
      }
      subtotalCalculado = soma.value;
    }

    if (subtotalCalculado.centavos !== props.subtotalProdutos.centavos) {
      return Result.fail(new SnapshotPrecoPedidoInvalidoError());
    }

    const subtotalAposCupom = props.subtotalProdutos.subtrair(props.descontoCupom);
    if (subtotalAposCupom.kind === 'failure') {
      return Result.fail(new SnapshotPrecoPedidoInvalidoError());
    }
    const subtotalPix = subtotalAposCupom.value.subtrair(props.descontoPix);
    if (subtotalPix.kind === 'failure') {
      return Result.fail(new SnapshotPrecoPedidoInvalidoError());
    }

    const cartaoCalculado = subtotalAposCupom.value.somar(props.frete.valor);
    const pixCalculado = subtotalPix.value.somar(props.frete.valor);
    if (
      cartaoCalculado.kind === 'failure' ||
      pixCalculado.kind === 'failure' ||
      cartaoCalculado.value.centavos !== props.totalCartao.centavos ||
      pixCalculado.value.centavos !== props.totalPix.centavos
    ) {
      return Result.fail(new SnapshotPrecoPedidoInvalidoError());
    }

    return Result.ok(undefined);
  }
}
