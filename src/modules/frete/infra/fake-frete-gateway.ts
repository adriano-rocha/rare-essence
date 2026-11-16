import { Result } from '@/shared/core/result';
import { Money } from '@/shared/core/money';
import {
  CotacaoInput,
  FalhaCotacao,
  FreteGateway,
  OpcaoFrete,
} from '../application/ports/frete-gateway';

export class FakeFreteGateway implements FreteGateway {
  async calcularCotacoes(
    _params: CotacaoInput
  ): Promise<Result<OpcaoFrete[], FalhaCotacao>> {
    const pac = Money.fromCentavos(2000);
    if (pac.kind === 'failure') {
      return Result.fail(new FalhaCotacao(pac.error.mensagem, pac.error.codigo));
    }

    const sedex = Money.fromCentavos(3500);
    if (sedex.kind === 'failure') {
      return Result.fail(new FalhaCotacao(sedex.error.mensagem, sedex.error.codigo));
    }

    return Result.ok([
      {
        codigoServico: 1,
        modalidade: 'PAC',
        valor: pac.value,
        prazoDias: 5,
      },
      {
        codigoServico: 2,
        modalidade: 'SEDEX',
        valor: sedex.value,
        prazoDias: 2,
      },
    ]);
  }
}
