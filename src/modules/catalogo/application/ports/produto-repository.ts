import { Produto } from '../../domain/produto';

export interface FiltrosCatalogo {
  categoriaSlug?: string;
  marcaSlug?: string;
  apenasAtivos?: boolean;
  pagina?: number;
  itensPorPagina?: number;
}

export interface ProdutoRepository {
  salvar(produto: Produto): Promise<void>;
  buscarPorId(id: string): Promise<Produto | null>;
  buscarPorSlug(slug: string): Promise<Produto | null>;
  buscarPorSku(sku: string): Promise<Produto | null>;
  listar(filtros?: FiltrosCatalogo): Promise<{ produtos: Produto[]; total: number }>;
  existeComSlug(slug: string): Promise<boolean>;
}