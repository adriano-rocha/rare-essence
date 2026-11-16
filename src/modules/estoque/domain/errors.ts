import { DomainError } from '@/shared/core/errors/domain-error';

export class QuantidadeEstoqueInvalidaError extends DomainError {
  constructor() {
    super('A quantidade de estoque deve ser um inteiro válido.', 'QUANTIDADE_ESTOQUE_INVALIDA');
  }
}

export class EstoqueInsuficienteError extends DomainError {
  constructor() {
    super('Estoque disponível insuficiente para realizar a reserva.', 'ESTOQUE_INSUFICIENTE');
  }
}

export class EstoqueNaoEncontradoError extends DomainError {
  constructor(variacaoId: string) {
    super(`Estoque não encontrado para a variação ${variacaoId}.`, 'ESTOQUE_NAO_ENCONTRADO');
  }
}

export class ReservaIncompativelError extends DomainError {
  constructor() {
    super('Não existe reserva compatível com a quantidade solicitada.', 'RESERVA_INCOMPATIVEL');
  }
}

export class EstadoEstoqueInvalidoError extends DomainError {
  constructor() {
    super('O estoque reservado não pode exceder o estoque físico.', 'ESTADO_ESTOQUE_INVALIDO');
  }
}

export type EstoqueError =
  | QuantidadeEstoqueInvalidaError
  | EstoqueInsuficienteError
  | EstoqueNaoEncontradoError
  | ReservaIncompativelError
  | EstadoEstoqueInvalidoError;
