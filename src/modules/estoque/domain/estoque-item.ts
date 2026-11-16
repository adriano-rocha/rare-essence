import { Result } from '@/shared/core/result';
import {
  EstadoEstoqueInvalidoError,
  EstoqueError,
  EstoqueInsuficienteError,
  QuantidadeEstoqueInvalidaError,
  ReservaIncompativelError,
} from './errors';

const QUANTIDADE_MAXIMA = 2_147_483_647;

export interface EstoqueItemProps {
  id: string;
  variacaoId: string;
  quantidadeFisica: number;
  quantidadeReservada: number;
  criadoEm?: Date;
  atualizadoEm?: Date;
}

export class EstoqueItem {
  private quantidadeFisicaAtual: number;
  private quantidadeReservadaAtual: number;
  private dataAtualizacao: Date;

  private constructor(private readonly props: EstoqueItemProps) {
    this.quantidadeFisicaAtual = props.quantidadeFisica;
    this.quantidadeReservadaAtual = props.quantidadeReservada;
    this.dataAtualizacao = props.atualizadoEm ?? props.criadoEm ?? new Date();
  }

  static criar(props: EstoqueItemProps): Result<EstoqueItem, EstoqueError> {
    if (
      !Number.isSafeInteger(props.quantidadeFisica) ||
      props.quantidadeFisica < 0 ||
      props.quantidadeFisica > QUANTIDADE_MAXIMA ||
      !Number.isSafeInteger(props.quantidadeReservada) ||
      props.quantidadeReservada < 0 ||
      props.quantidadeReservada > QUANTIDADE_MAXIMA
    ) {
      return Result.fail(new QuantidadeEstoqueInvalidaError());
    }

    if (props.quantidadeReservada > props.quantidadeFisica) {
      return Result.fail(new EstadoEstoqueInvalidoError());
    }

    return Result.ok(new EstoqueItem(props));
  }

  get id(): string {
    return this.props.id;
  }

  get variacaoId(): string {
    return this.props.variacaoId;
  }

  get quantidadeFisica(): number {
    return this.quantidadeFisicaAtual;
  }

  get quantidadeReservada(): number {
    return this.quantidadeReservadaAtual;
  }

  get quantidadeDisponivel(): number {
    return this.quantidadeFisicaAtual - this.quantidadeReservadaAtual;
  }

  get criadoEm(): Date {
    return this.props.criadoEm ?? this.dataAtualizacao;
  }

  get atualizadoEm(): Date {
    return this.dataAtualizacao;
  }

  reservar(quantidade: number): Result<void, EstoqueError> {
    const erro = this.validarQuantidade(quantidade);
    if (erro) return Result.fail(erro);

    if (this.quantidadeDisponivel < quantidade) {
      return Result.fail(new EstoqueInsuficienteError());
    }

    this.quantidadeReservadaAtual += quantidade;
    this.marcarAtualizacao();
    return Result.ok(undefined);
  }

  confirmarBaixa(quantidade: number): Result<void, EstoqueError> {
    const erro = this.validarQuantidade(quantidade);
    if (erro) return Result.fail(erro);

    if (this.quantidadeReservadaAtual < quantidade) {
      return Result.fail(new ReservaIncompativelError());
    }

    this.quantidadeFisicaAtual -= quantidade;
    this.quantidadeReservadaAtual -= quantidade;
    this.marcarAtualizacao();
    return Result.ok(undefined);
  }

  liberarReserva(quantidade: number): Result<void, EstoqueError> {
    const erro = this.validarQuantidade(quantidade);
    if (erro) return Result.fail(erro);

    if (this.quantidadeReservadaAtual < quantidade) {
      return Result.fail(new ReservaIncompativelError());
    }

    this.quantidadeReservadaAtual -= quantidade;
    this.marcarAtualizacao();
    return Result.ok(undefined);
  }

  private validarQuantidade(quantidade: number): QuantidadeEstoqueInvalidaError | null {
    if (
      !Number.isSafeInteger(quantidade) ||
      quantidade <= 0 ||
      quantidade > QUANTIDADE_MAXIMA
    ) {
      return new QuantidadeEstoqueInvalidaError();
    }
    return null;
  }

  private marcarAtualizacao(): void {
    this.dataAtualizacao = new Date();
  }
}
