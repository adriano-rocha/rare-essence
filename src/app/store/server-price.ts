import {
  CalcularPrecificacao,
  PRECIFICACAO_PADRAO,
} from '@/modules/carrinho/application/calcular-precificacao';
import { ItemCarrinho } from '@/modules/carrinho/domain/item-carrinho';
import { Money } from '@/shared/core/money';

export interface StoreVariationPrice {
  totalPixCentavos: number;
  descontoPixPercentual: number;
  planosParcelamento: {
    quantidade: number;
    primeiraParcelaCentavos: number;
  }[];
}

export function precificarVariacao(
  variacao: { id: string; sku: string; precoCentavos: number }
): StoreVariationPrice {
  const preco = Money.fromCentavos(variacao.precoCentavos);
  if (preco.kind === 'failure') {
    throw new Error(`Preço inválido para a variação ${variacao.id}.`);
  }

  const item = ItemCarrinho.criar({
    variacaoId: variacao.id,
    sku: variacao.sku,
    precoUnitario: preco.value,
    quantidade: 1,
  });
  if (item.kind === 'failure') {
    throw new Error(`Não foi possível preparar a variação ${variacao.id}.`);
  }

  const fretePlaceholder = Money.fromCentavos(0);
  if (fretePlaceholder.kind === 'failure') {
    throw new Error(
      `Não foi possível preparar o frete da variação ${variacao.id}.`
    );
  }

  const resumo = CalcularPrecificacao.executar(
    [item.value],
    { modalidade: 'SEDEX', valor: fretePlaceholder.value },
    new Date()
  );
  if (resumo.kind === 'failure') {
    throw new Error(`Não foi possível precificar a variação ${variacao.id}.`);
  }

  return {
    totalPixCentavos: resumo.value.totalPix.centavos,
    descontoPixPercentual: PRECIFICACAO_PADRAO.descontoPixPercentual,
    planosParcelamento: resumo.value.planosParcelamento.map((plano) => ({
      quantidade: plano.quantidade,
      primeiraParcelaCentavos: plano.valoresCentavos[0],
    })),
  };
}
