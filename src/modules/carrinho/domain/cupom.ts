import { Money, MoneyError } from '@/shared/core/money';
import { Result } from '@/shared/core/result';
import {
  CupomError,
  CupomExpiradoError,
  CupomInativoError,
  CupomInvalidoError,
  CupomUsosEsgotadosError,
  MoedaPrecificacaoIncompativelError,
  PedidoMinimoCupomNaoAtingidoError,
} from './errors';

interface CupomBaseProps {
  codigo: string;
  valorMinimo: Money;
  ativo: boolean;
  expiraEm?: Date;
  limiteUsos?: number;
  usosRealizados?: number;
}

export type CupomProps = CupomBaseProps &
  (
    | { tipo: 'FIXO'; valor: Money }
    | { tipo: 'PERCENTUAL'; valor: number }
  );

export class Cupom {
  private readonly dataExpiracao?: Date;
  readonly valorFixo?: Money;
  readonly percentual?: number;

  private constructor(
    readonly codigo: string,
    readonly tipo: CupomProps['tipo'],
    readonly valorMinimo: Money,
    readonly ativo: boolean,
    expiraEm: Date | undefined,
    readonly limiteUsos: number | undefined,
    readonly usosRealizados: number,
    props: CupomProps
  ) {
    this.dataExpiracao = expiraEm ? new Date(expiraEm) : undefined;
    this.valorFixo = props.tipo === 'FIXO' ? props.valor : undefined;
    this.percentual = props.tipo === 'PERCENTUAL' ? props.valor : undefined;
    Object.freeze(this);
  }

  static criar(props: CupomProps): Result<Cupom, CupomError> {
    if (
      !props.codigo.trim() ||
      !Number.isSafeInteger(props.valorMinimo.centavos) ||
      (props.expiraEm !== undefined && !Number.isFinite(props.expiraEm.getTime())) ||
      (props.limiteUsos !== undefined &&
        (!Number.isSafeInteger(props.limiteUsos) || props.limiteUsos < 0)) ||
      (props.usosRealizados !== undefined &&
        (!Number.isSafeInteger(props.usosRealizados) || props.usosRealizados < 0))
    ) {
      return Result.fail(new CupomInvalidoError());
    }

    if (props.tipo === 'FIXO') {
      if (props.valor.centavos <= 0) {
        return Result.fail(new CupomInvalidoError());
      }
    } else if (
      !Number.isFinite(props.valor) ||
      props.valor <= 0 ||
      props.valor > 100
    ) {
      return Result.fail(new CupomInvalidoError());
    }

    return Result.ok(
      new Cupom(
        props.codigo.trim().toUpperCase(),
        props.tipo,
        props.valorMinimo,
        props.ativo,
        props.expiraEm,
        props.limiteUsos,
        props.usosRealizados ?? 0,
        props
      )
    );
  }

  get expiraEm(): Date | undefined {
    return this.dataExpiracao ? new Date(this.dataExpiracao) : undefined;
  }

  calcularDesconto(
    subtotal: Money,
    agora: Date
  ): Result<Money, CupomError | MoneyError> {
    if (subtotal.moeda !== this.valorMinimo.moeda) {
      return Result.fail(new MoedaPrecificacaoIncompativelError());
    }

    if (this.valorFixo && this.valorFixo.moeda !== subtotal.moeda) {
      return Result.fail(new MoedaPrecificacaoIncompativelError());
    }

    if (!this.ativo) {
      return Result.fail(new CupomInativoError());
    }

    if (this.dataExpiracao && agora.getTime() >= this.dataExpiracao.getTime()) {
      return Result.fail(new CupomExpiradoError());
    }

    if (this.limiteUsos !== undefined && this.usosRealizados >= this.limiteUsos) {
      return Result.fail(new CupomUsosEsgotadosError());
    }

    if (subtotal.centavos < this.valorMinimo.centavos) {
      return Result.fail(new PedidoMinimoCupomNaoAtingidoError());
    }

    if (this.tipo === 'FIXO') {
      const desconto = this.valorFixo;
      if (!desconto) return Result.fail(new CupomInvalidoError());
      return Money.fromCentavos(
        Math.min(desconto.centavos, subtotal.centavos),
        subtotal.moeda
      );
    }

    if (this.percentual === undefined) {
      return Result.fail(new CupomInvalidoError());
    }

    return subtotal.calcularDescontoPercentual(this.percentual);
  }
}
