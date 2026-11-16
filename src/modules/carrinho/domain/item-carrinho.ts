import { Money, MoneyError } from '@/shared/core/money';
import { Result } from '@/shared/core/result';
import { ItemCarrinhoInvalidoError } from './errors';

const QUANTIDADE_MAXIMA = 2_147_483_647;

export interface ItemCarrinhoProps {
  variacaoId: string;
  sku: string;
  precoUnitario: Money;
  quantidade: number;
}

export class ItemCarrinho {
  private constructor(
    readonly variacaoId: string,
    readonly sku: string,
    readonly precoUnitario: Money,
    readonly quantidade: number
  ) {
    Object.freeze(this);
  }

  static criar(props: ItemCarrinhoProps): Result<ItemCarrinho, ItemCarrinhoInvalidoError> {
    if (
      !props.variacaoId.trim() ||
      !props.sku.trim() ||
      !Number.isSafeInteger(props.quantidade) ||
      props.quantidade <= 0 ||
      props.quantidade > QUANTIDADE_MAXIMA
    ) {
      return Result.fail(new ItemCarrinhoInvalidoError());
    }

    return Result.ok(
      new ItemCarrinho(
        props.variacaoId,
        props.sku,
        props.precoUnitario,
        props.quantidade
      )
    );
  }

  calcularSubtotal(): Result<Money, MoneyError> {
    const centavos = this.precoUnitario.centavos * this.quantidade;
    return Money.fromCentavos(centavos, this.precoUnitario.moeda);
  }
}
