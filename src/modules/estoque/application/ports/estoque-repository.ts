import { EstoqueItem } from '../../domain/estoque-item';

export interface EstoqueRepository {
  salvar(item: EstoqueItem): Promise<void>;
  buscarPorVariacaoId(variacaoId: string): Promise<EstoqueItem | null>;
  executarComLock<T>(
    variacaoId: string,
    operacao: (
      item: EstoqueItem | null,
      salvar: (item: EstoqueItem) => Promise<void>
    ) => Promise<T>
  ): Promise<T>;
}
