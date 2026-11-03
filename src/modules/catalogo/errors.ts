import { DomainError } from '@/shared/domain/domain-error';

export class SlugInvalidoError extends DomainError {
  constructor(mensagem = 'Slug inválido: deve estar em formato kebab-case e não pode ser vazio.') {
    super(mensagem, 'SLUG_INVALIDO');
  }
}

export class SkuInvalidoError extends DomainError {
  constructor(mensagem = 'SKU inválido: deve conter apenas letras, números e hifens.') {
    super(mensagem, 'SKU_INVALIDO');
  }
}

export class VolumeInvalidoError extends DomainError {
  constructor(mensagem = 'Volume inválido: deve ser um número inteiro estritamente positivo.') {
    super(mensagem, 'VOLUME_INVALIDO');
  }
}

export class PiramideInvalidaError extends DomainError {
  constructor(mensagem = 'Pirâmide olfativa inválida: notas de topo, coração e base são obrigatórias.') {
    super(mensagem, 'PIRAMIDE_INVALIDA');
  }
}

export class ProdutoSemVariacoesError extends DomainError {
  constructor(mensagem = 'RN-013: O produto não pode ser ativado sem ao menos uma variação cadastrada.') {
    super(mensagem, 'PRODUTO_SEM_VARIACOES');
  }
}

export class SkuDuplicadoError extends DomainError {
  constructor(sku: string) {
    super(`RN-011: Já existe uma variação com o SKU ${sku} neste produto.`, 'SKU_DUPLICADO');
  }
}

export class PrecoInvalidoError extends DomainError {
  constructor(mensagem = 'RN-012: O preço da variação deve ser estritamente maior que zero.') {
    super(mensagem, 'PRECO_INVALIDO');
  }
}