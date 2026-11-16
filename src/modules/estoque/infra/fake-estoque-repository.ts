import { EstoqueRepository } from '../application/ports/estoque-repository';
import { EstoqueItem } from '../domain/estoque-item';

export class FakeEstoqueRepository implements EstoqueRepository {
  private readonly itens = new Map<string, EstoqueItem>();
  private readonly locks = new Map<string, Promise<void>>();

  async salvar(item: EstoqueItem): Promise<void> {
    this.itens.set(item.variacaoId, item);
  }

  async buscarPorVariacaoId(variacaoId: string): Promise<EstoqueItem | null> {
    return this.itens.get(variacaoId) ?? null;
  }

  async executarComLock<T>(
    variacaoId: string,
    operacao: (
      item: EstoqueItem | null,
      salvar: (item: EstoqueItem) => Promise<void>
    ) => Promise<T>
  ): Promise<T> {
    const lockAnterior = this.locks.get(variacaoId) ?? Promise.resolve();
    let liberar!: () => void;
    const lockAtual = new Promise<void>((resolve) => {
      liberar = resolve;
    });
    this.locks.set(variacaoId, lockAtual);

    await lockAnterior;
    try {
      const item = this.itens.get(variacaoId) ?? null;
      const salvar = async (atualizado: EstoqueItem): Promise<void> => {
        this.itens.set(variacaoId, atualizado);
      };
      return await operacao(item, salvar);
    } finally {
      liberar();
      if (this.locks.get(variacaoId) === lockAtual) {
        this.locks.delete(variacaoId);
      }
    }
  }
}
