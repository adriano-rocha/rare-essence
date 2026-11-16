import { Money } from '@/shared/core/money';
import { Result } from '@/shared/core/result';
import { FretePedidoInvalidoError } from './errors';

export interface FretePedidoProps {
  modalidade: string;
  prazoDias: number;
  valor: Money;
}

export class FretePedido {
  private constructor(
    readonly modalidade: string,
    readonly prazoDias: number,
    readonly valor: Money
  ) {
    Object.freeze(this);
  }

  static criar(props: FretePedidoProps): Result<FretePedido, FretePedidoInvalidoError> {
    if (
      !props.modalidade.trim() ||
      !Number.isSafeInteger(props.prazoDias) ||
      props.prazoDias < 0 ||
      props.prazoDias > 2_147_483_647 ||
      props.valor.centavos > 2_147_483_647
    ) {
      return Result.fail(new FretePedidoInvalidoError());
    }

    return Result.ok(
      new FretePedido(props.modalidade.trim().toUpperCase(), props.prazoDias, props.valor)
    );
  }
}
