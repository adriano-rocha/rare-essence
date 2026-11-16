import { Money } from '@/shared/core/money';
import { Result } from '@/shared/core/result';

export interface ProdutoParaCotacao {
  id: string;
  larguraCm: number;
  alturaCm: number;
  comprimentoCm: number;
  pesoGramas: number;
  valorSeguro: Money;
  quantidade: number;
}

export interface CotacaoInput {
  cepOrigem: string;
  cepDestino: string;
  produtos: readonly ProdutoParaCotacao[];
}

export interface OpcaoFrete {
  codigoServico: number;
  modalidade: 'PAC' | 'SEDEX';
  valor: Money;
  prazoDias: number;
}

export class FalhaCotacao extends Error {
  constructor(
    mensagem: string,
    readonly codigo: string
  ) {
    super(mensagem);
    this.name = 'FalhaCotacao';
  }
}

export interface FreteGateway {
  calcularCotacoes(
    params: CotacaoInput
  ): Promise<Result<OpcaoFrete[], FalhaCotacao>>;
}
