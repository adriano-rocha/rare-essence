import { Produto } from '../domain/produto';
import { ProdutoRepository, FiltrosCatalogo } from '../application/ports/produto-repository';

export class FakeProdutoRepository implements ProdutoRepository {
  private produtos: Map<string, Produto> = new Map();

  async salvar(produto: Produto): Promise<void> {
    this.produtos.set(produto.id, produto);
  }

  async buscarPorId(id: string): Promise<Produto | null> {
    return this.produtos.get(id) || null;
  }

  async buscarPorSlug(slug: string): Promise<Produto | null> {
    for (const p of this.produtos.values()) {
      if (p.slug.valor === slug) return p;
    }
    return null;
  }

  async buscarPorSku(sku: string): Promise<Produto | null> {
    const skuFormatado = sku.trim().toUpperCase();
    for (const p of this.produtos.values()) {
      if (p.variacoes.some((v) => v.sku.valor === skuFormatado)) {
        return p;
      }
    }
    return null;
  }

  async listar(filtros: FiltrosCatalogo = {}): Promise<{ produtos: Produto[]; total: number }> {
    let lista = Array.from(this.produtos.values());

    if (filtros.apenasAtivos) {
      lista = lista.filter((p) => p.ativo);
    }

    const total = lista.length;
    const pagina = filtros.pagina || 1;
    const itensPorPagina = filtros.itensPorPagina || 10;
    const inicio = (pagina - 1) * itensPorPagina;
    const paginados = lista.slice(inicio, inicio + itensPorPagina);

    return { produtos: paginados, total };
  }

  async existeComSlug(slug: string): Promise<boolean> {
    return (await this.buscarPorSlug(slug)) !== null;
  }
}