import { Money } from '@/shared/core/money';
import { Result } from '@/shared/core/result';

export interface PagadorPagamento {
  email: string;
  nome: string;
  sobrenome: string;
  cpf: string;
}

export interface CriarPagamentoInput {
  pedidoId: string;
  codigoPedido: string;
  chaveIdempotencia: string;
  valor: Money;
  pagador: PagadorPagamento;
  expiraEm?: Date;
}

export interface CriarPagamentoCartaoInput extends CriarPagamentoInput {
  tokenCartao: string;
  metodoCartao: string;
  parcelas: number;
}

export interface PagamentoCriado {
  id: string;
  status: string;
  detalheStatus?: string;
  codigoPix?: string;
  qrCodeBase64?: string;
  urlPagamento?: string;
  expiraEm?: Date;
}

export interface PagamentoConsultado {
  id: string;
  referenciaExterna: string;
  status: string;
  valorCentavos: number;
  moeda: string;
  metodo: string;
}

export class FalhaGatewayPagamento extends Error {
  constructor(
    mensagem: string,
    readonly codigo: string
  ) {
    super(mensagem);
    this.name = 'FalhaGatewayPagamento';
  }
}

export interface PagamentoGateway {
  criarPix(input: CriarPagamentoInput): Promise<Result<PagamentoCriado, FalhaGatewayPagamento>>;
  criarCartao(
    input: CriarPagamentoCartaoInput
  ): Promise<Result<PagamentoCriado, FalhaGatewayPagamento>>;
  consultar(id: string): Promise<Result<PagamentoConsultado, FalhaGatewayPagamento>>;
}
