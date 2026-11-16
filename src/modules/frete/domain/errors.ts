import { DomainError } from '@/shared/core/errors/domain-error';

export class EntradaCotacaoInvalidaError extends DomainError {
  constructor() {
    super('Os CEPs e produtos da cotação de frete são inválidos.', 'ENTRADA_COTACAO_INVALIDA');
  }
}
