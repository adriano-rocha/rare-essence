import { DomainError } from '@/shared/core/errors/domain-error';

export class ItemCarrinhoInvalidoError extends DomainError {
  constructor() {
    super('O item do carrinho deve ter SKU, preço e quantidade válidos.', 'ITEM_CARRINHO_INVALIDO');
  }
}

export class CarrinhoVazioError extends DomainError {
  constructor() {
    super('Não é possível calcular um carrinho sem itens.', 'CARRINHO_VAZIO');
  }
}

export class CupomInvalidoError extends DomainError {
  constructor() {
    super('Os dados do cupom são inválidos.', 'CUPOM_INVALIDO');
  }
}

export class CupomInativoError extends DomainError {
  constructor() {
    super('O cupom está inativo.', 'CUPOM_INATIVO');
  }
}

export class CupomExpiradoError extends DomainError {
  constructor() {
    super('O cupom expirou.', 'CUPOM_EXPIRADO');
  }
}

export class CupomUsosEsgotadosError extends DomainError {
  constructor() {
    super('O limite de usos do cupom foi atingido.', 'CUPOM_USOS_ESGOTADOS');
  }
}

export class PedidoMinimoCupomNaoAtingidoError extends DomainError {
  constructor() {
    super('O subtotal não atingiu o valor mínimo para este cupom.', 'CUPOM_PEDIDO_MINIMO');
  }
}

export class MoedaPrecificacaoIncompativelError extends DomainError {
  constructor() {
    super('Todos os valores da precificação devem usar a mesma moeda.', 'MOEDA_PRECIFICACAO_INCOMPATIVEL');
  }
}

export class CotacaoFreteInvalidaError extends DomainError {
  constructor() {
    super('A cotação de frete deve informar uma modalidade válida.', 'COTACAO_FRETE_INVALIDA');
  }
}

export class ConfiguracaoPrecificacaoInvalidaError extends DomainError {
  constructor() {
    super('A configuração de precificação é inválida.', 'CONFIGURACAO_PRECIFICACAO_INVALIDA');
  }
}

export type CupomError =
  | CupomInvalidoError
  | CupomInativoError
  | CupomExpiradoError
  | CupomUsosEsgotadosError
  | PedidoMinimoCupomNaoAtingidoError
  | MoedaPrecificacaoIncompativelError;

export type CarrinhoError =
  | ItemCarrinhoInvalidoError
  | CarrinhoVazioError
  | CupomError
  | MoedaPrecificacaoIncompativelError
  | CotacaoFreteInvalidaError
  | ConfiguracaoPrecificacaoInvalidaError;
