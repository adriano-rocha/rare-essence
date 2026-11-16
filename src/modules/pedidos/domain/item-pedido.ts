import { Money, MoneyError } from '@/shared/core/money';
import { Result } from '@/shared/core/result';
import { ItemPedidoInvalidoError } from './errors';

const INTEIRO_MAXIMO = 2_147_483_647;

export interface ItemPedidoProps {
  variacaoId: string;
  sku: string;
  nomeProduto: string;
  volumeMl: number;
  quantidade: number;
  precoUnitario: Money;
}

export class ItemPedido {
  private constructor(
    readonly variacaoId: string,
    readonly sku: string,
    readonly nomeProduto: string,
    readonly volumeMl: number,
    readonly quantidade: number,
    readonly precoUnitario: Money
  ) {
    Object.freeze(this);
  }

  static criar(props: ItemPedidoProps): Result<ItemPedido, ItemPedidoInvalidoError> {
    if (
      !props.variacaoId.trim() ||
      !props.sku.trim() ||
      !props.nomeProduto.trim() ||
      !Number.isSafeInteger(props.volumeMl) ||
      props.volumeMl <= 0 ||
      props.volumeMl > INTEIRO_MAXIMO ||
      !Number.isSafeInteger(props.quantidade) ||
      props.quantidade <= 0 ||
      props.quantidade > INTEIRO_MAXIMO ||
      props.precoUnitario.centavos <= 0 ||
      props.precoUnitario.centavos > INTEIRO_MAXIMO
    ) {
      return Result.fail(new ItemPedidoInvalidoError());
    }

    return Result.ok(
      new ItemPedido(
        props.variacaoId.trim(),
        props.sku.trim().toUpperCase(),
        props.nomeProduto.trim(),
        props.volumeMl,
        props.quantidade,
        props.precoUnitario
      )
    );
  }

  calcularSubtotal(): Result<Money, MoneyError> {
    return Money.fromCentavos(
      this.precoUnitario.centavos * this.quantidade,
      this.precoUnitario.moeda
    );
  }
}
