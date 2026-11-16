import { Result } from '@/shared/core/result';
import { EntradaCotacaoInvalidaError } from '../../domain/errors';
import {
  CotacaoInput,
  FalhaCotacao,
  FreteGateway,
  OpcaoFrete,
} from '../ports/frete-gateway';

export class CotarFretes {
  constructor(private readonly gateway: FreteGateway) {}

  executar(
    input: CotacaoInput
  ): Promise<Result<OpcaoFrete[], EntradaCotacaoInvalidaError | FalhaCotacao>> {
    const cepOrigem = this.normalizarCep(input.cepOrigem);
    const cepDestino = this.normalizarCep(input.cepDestino);
    if (
      !cepOrigem ||
      !cepDestino ||
      input.produtos.length === 0 ||
      input.produtos.some(
        (produto) =>
          !produto.id.trim() ||
          !Number.isSafeInteger(produto.larguraCm) ||
          produto.larguraCm <= 0 ||
          !Number.isSafeInteger(produto.alturaCm) ||
          produto.alturaCm <= 0 ||
          !Number.isSafeInteger(produto.comprimentoCm) ||
          produto.comprimentoCm <= 0 ||
          !Number.isSafeInteger(produto.pesoGramas) ||
          produto.pesoGramas <= 0 ||
          !Number.isSafeInteger(produto.quantidade) ||
          produto.quantidade <= 0 ||
          produto.valorSeguro.moeda !== 'BRL'
      )
    ) {
      return Promise.resolve(Result.fail(new EntradaCotacaoInvalidaError()));
    }

    return this.gateway.calcularCotacoes({
      cepOrigem,
      cepDestino,
      produtos: input.produtos.map((produto) => ({
        ...produto,
        id: produto.id.trim(),
      })),
    });
  }

  private normalizarCep(cep: string): string | null {
    const normalizado = cep.replace(/\D/g, '');
    return /^\d{8}$/.test(normalizado) ? normalizado : null;
  }
}
