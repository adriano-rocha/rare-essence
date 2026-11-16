import { Money, MoneyError } from '@/shared/core/money';
import { Result } from '@/shared/core/result';
import {
  CarrinhoError,
  CarrinhoVazioError,
  ConfiguracaoPrecificacaoInvalidaError,
  CotacaoFreteInvalidaError,
  MoedaPrecificacaoIncompativelError,
} from '../domain/errors';
import { Cupom } from '../domain/cupom';
import { ItemCarrinho } from '../domain/item-carrinho';

export interface FreteInformado {
  modalidade: string;
  valor: Money;
}

export interface PrecificacaoConfig {
  descontoPixPercentual: number;
  valorMinimoParcelaCentavos: number;
  limiteParcelas: number;
  subtotalFreteGratisCentavos: number;
}

export interface PlanoParcelamento {
  quantidade: number;
  valoresCentavos: readonly number[];
}

export interface ResumoPrecificacao {
  subtotalProdutos: Money;
  descontoCupom: Money;
  subtotalAposCupom: Money;
  descontoPix: Money;
  frete: Money;
  freteGratis: boolean;
  totalPix: Money;
  totalCartao: Money;
  planosParcelamento: readonly PlanoParcelamento[];
  codigoCupom?: string;
}

export const PRECIFICACAO_PADRAO: PrecificacaoConfig = Object.freeze({
  descontoPixPercentual: 5,
  valorMinimoParcelaCentavos: 3000,
  limiteParcelas: 6,
  subtotalFreteGratisCentavos: 35000,
});

export class CalcularPrecificacao {
  static executar(
    itens: readonly ItemCarrinho[],
    freteInformado: FreteInformado,
    agora: Date,
    cupom?: Cupom,
    config: PrecificacaoConfig = PRECIFICACAO_PADRAO
  ): Result<ResumoPrecificacao, CarrinhoError | MoneyError> {
    if (
      !Number.isFinite(config.descontoPixPercentual) ||
      config.descontoPixPercentual < 0 ||
      config.descontoPixPercentual > 100 ||
      !Number.isSafeInteger(config.valorMinimoParcelaCentavos) ||
      config.valorMinimoParcelaCentavos <= 0 ||
      !Number.isSafeInteger(config.limiteParcelas) ||
      config.limiteParcelas <= 0 ||
      !Number.isSafeInteger(config.subtotalFreteGratisCentavos) ||
      config.subtotalFreteGratisCentavos < 0 ||
      !Number.isFinite(agora.getTime())
    ) {
      return Result.fail(new ConfiguracaoPrecificacaoInvalidaError());
    }

    if (itens.length === 0) {
      return Result.fail(new CarrinhoVazioError());
    }

    if (!freteInformado.modalidade.trim()) {
      return Result.fail(new CotacaoFreteInvalidaError());
    }

    const subtotalInicial = Money.fromCentavos(0, itens[0].precoUnitario.moeda);
    if (subtotalInicial.kind === 'failure') {
      return Result.fail(subtotalInicial.error);
    }

    let subtotal = subtotalInicial.value;

    for (const item of itens) {
      const itemSubtotal = item.calcularSubtotal();
      if (itemSubtotal.kind === 'failure') {
        return Result.fail(itemSubtotal.error);
      }
      const soma = subtotal.somar(itemSubtotal.value);
      if (soma.kind === 'failure') return Result.fail(soma.error);
      subtotal = soma.value;
    }

    if (
      freteInformado.valor.moeda !== subtotal.moeda ||
      itens.some((item) => item.precoUnitario.moeda !== subtotal.moeda)
    ) {
      return Result.fail(new MoedaPrecificacaoIncompativelError());
    }

    const descontoInicial = Money.fromCentavos(0, subtotal.moeda);
    if (descontoInicial.kind === 'failure') {
      return Result.fail(descontoInicial.error);
    }
    let descontoCupom = descontoInicial.value;

    if (cupom) {
      const resultadoCupom = cupom.calcularDesconto(subtotal, agora);
      if (resultadoCupom.kind === 'failure') {
        return Result.fail(resultadoCupom.error);
      }
      descontoCupom = resultadoCupom.value;
    }

    const aposCupom = subtotal.subtrair(descontoCupom);
    if (aposCupom.kind === 'failure') return Result.fail(aposCupom.error);

    const subtotalAposCupom = aposCupom.value;
    const descontoPix = subtotalAposCupom.calcularDescontoPercentual(
      config.descontoPixPercentual
    );
    if (descontoPix.kind === 'failure') return Result.fail(descontoPix.error);

    const freteGratis =
      subtotal.centavos >= config.subtotalFreteGratisCentavos &&
      freteInformado.modalidade.trim().toUpperCase() === 'PAC';
    let frete = freteInformado.valor;
    if (freteGratis) {
      const freteGratuito = Money.fromCentavos(0, subtotal.moeda);
      if (freteGratuito.kind === 'failure') {
        return Result.fail(freteGratuito.error);
      }
      frete = freteGratuito.value;
    }

    const totalCartao = subtotalAposCupom.somar(frete);
    if (totalCartao.kind === 'failure') return Result.fail(totalCartao.error);

    const pixComDesconto = subtotalAposCupom.subtrair(descontoPix.value);
    if (pixComDesconto.kind === 'failure') {
      return Result.fail(pixComDesconto.error);
    }
    const totalPix = pixComDesconto.value.somar(frete);
    if (totalPix.kind === 'failure') return Result.fail(totalPix.error);

    return Result.ok({
      subtotalProdutos: subtotal,
      descontoCupom,
      subtotalAposCupom,
      descontoPix: descontoPix.value,
      frete,
      freteGratis,
      totalPix: totalPix.value,
      totalCartao: totalCartao.value,
      planosParcelamento: this.calcularParcelamentos(
        totalCartao.value.centavos,
        config
      ),
      codigoCupom: cupom?.codigo,
    });
  }

  private static calcularParcelamentos(
    totalCentavos: number,
    config: PrecificacaoConfig
  ): readonly PlanoParcelamento[] {
    const limite = Math.min(
      config.limiteParcelas,
      Math.floor(totalCentavos / config.valorMinimoParcelaCentavos)
    );
    const planos: PlanoParcelamento[] = [];

    for (let quantidade = 1; quantidade <= limite; quantidade += 1) {
      const base = Math.floor(totalCentavos / quantidade);
      const resto = totalCentavos % quantidade;
      const valoresCentavos = Object.freeze([
        ...Array.from({ length: quantidade - 1 }, () => base),
        base + resto,
      ]);
      planos.push(Object.freeze({ quantidade, valoresCentavos }));
    }

    return Object.freeze(planos);
  }
}
