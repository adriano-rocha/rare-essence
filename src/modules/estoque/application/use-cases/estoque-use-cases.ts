import { Result } from '@/shared/core/result';
import { EstoqueRepository } from '../ports/estoque-repository';
import {
  EstoqueError,
  EstoqueNaoEncontradoError,
} from '../../domain/errors';
import { EstoqueItem } from '../../domain/estoque-item';

abstract class AlterarEstoque {
  protected constructor(protected readonly repository: EstoqueRepository) {}

  protected executarOperacao(
    variacaoId: string,
    quantidade: number,
    operacao: (item: EstoqueItem, quantidade: number) => Result<void, EstoqueError>
  ): Promise<Result<EstoqueItem, EstoqueError>> {
    return this.repository.executarComLock(variacaoId, async (item, salvar) => {
      if (!item) {
        return Result.fail(new EstoqueNaoEncontradoError(variacaoId));
      }

      const resultado = operacao(item, quantidade);
      if (resultado.kind === 'failure') {
        return resultado;
      }

      await salvar(item);
      return Result.ok(item);
    });
  }
}

export class ReservarEstoque extends AlterarEstoque {
  constructor(repository: EstoqueRepository) {
    super(repository);
  }

  executar(variacaoId: string, quantidade: number): Promise<Result<EstoqueItem, EstoqueError>> {
    return this.executarOperacao(variacaoId, quantidade, (item, q) => item.reservar(q));
  }
}

export class ConfirmarBaixaEstoque extends AlterarEstoque {
  constructor(repository: EstoqueRepository) {
    super(repository);
  }

  executar(variacaoId: string, quantidade: number): Promise<Result<EstoqueItem, EstoqueError>> {
    return this.executarOperacao(variacaoId, quantidade, (item, q) => item.confirmarBaixa(q));
  }
}

export class LiberarReservaEstoque extends AlterarEstoque {
  constructor(repository: EstoqueRepository) {
    super(repository);
  }

  executar(variacaoId: string, quantidade: number): Promise<Result<EstoqueItem, EstoqueError>> {
    return this.executarOperacao(variacaoId, quantidade, (item, q) => item.liberarReserva(q));
  }
}
