import { describe, it, expect, beforeEach } from 'vitest';
import { ProdutoRepository } from '@/modules/catalogo/application/ports/produto-repository';
import { ProdutoBuilder } from '../../helpers/builders/produto.builder';

export function runProdutoRepositoryContractTests(
  repositoryName: string,
  repositoryFactory: () => Promise<ProdutoRepository> | ProdutoRepository
) {
  describe(`Contract Test: ${repositoryName} (LSP)`, () => {
    let sut: ProdutoRepository;

    beforeEach(async () => {
      sut = await repositoryFactory();
    });

    it('deve salvar e buscar um produto por id', async () => {
      const produto = ProdutoBuilder.umProduto()
        .comId('p-1')
        .comVariacao('RARE-TESTE-50ML', 50, 35000)
        .build();

      await sut.salvar(produto);
      const encontrado = await sut.buscarPorId('p-1');

      expect(encontrado).not.toBeNull();
      expect(encontrado?.id).toBe('p-1');
      expect(encontrado?.nome).toBe(produto.nome);
      expect(encontrado?.variacoes.length).toBe(1);
      expect(encontrado?.variacoes[0].sku.valor).toBe('RARE-TESTE-50ML');
    });

    it('deve buscar um produto por slug', async () => {
      const produto = ProdutoBuilder.umProduto()
        .comId('p-2')
        .comNome('Oud Imperial')
        .comSlug('oud-imperial')
        .comVariacao('RARE-OUD-50ML')
        .build();

      await sut.salvar(produto);
      const encontrado = await sut.buscarPorSlug('oud-imperial');

      expect(encontrado).not.toBeNull();
      expect(encontrado?.slug.valor).toBe('oud-imperial');
    });

    it('deve buscar um produto pelo SKU de uma de suas variações', async () => {
      const produto = ProdutoBuilder.umProduto()
        .comId('p-3')
        .comVariacao('RARE-ESPECIAL-100ML', 100, 58000)
        .build();

      await sut.salvar(produto);
      const encontrado = await sut.buscarPorSku('RARE-ESPECIAL-100ML');

      expect(encontrado).not.toBeNull();
      expect(encontrado?.id).toBe('p-3');
    });

    it('deve retornar true se slug já existe e false se não existe', async () => {
      const produto = ProdutoBuilder.umProduto()
        .comId('p-4')
        .comSlug('ambre-solaire')
        .comVariacao()
        .build();

      await sut.salvar(produto);

      expect(await sut.existeComSlug('ambre-solaire')).toBe(true);
      expect(await sut.existeComSlug('slug-inexistente')).toBe(false);
    });

    it('deve listar produtos respeitando filtro de apenasAtivos', async () => {
      const produtoInativo = ProdutoBuilder.umProduto()
        .comId('p-inativo')
        .comVariacao('RARE-INATIVO-50ML')
        .build();

      const produtoAtivo = ProdutoBuilder.umProduto()
        .comId('p-ativo')
        .ativoNoCatalogo()
        .build();

      await sut.salvar(produtoInativo);
      await sut.salvar(produtoAtivo);

      const resultadoApenasAtivos = await sut.listar({ apenasAtivos: true });
      expect(resultadoApenasAtivos.produtos.some((p) => p.id === 'p-inativo')).toBe(false);
      expect(resultadoApenasAtivos.produtos.some((p) => p.id === 'p-ativo')).toBe(true);
    });
  });
}