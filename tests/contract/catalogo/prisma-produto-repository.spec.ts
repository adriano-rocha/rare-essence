import { prisma } from '@/shared/infra/prisma';
import { PrismaProdutoRepository } from '@/modules/catalogo/infra/prisma-produto-repository';
import { runProdutoRepositoryContractTests } from './produto-repository.contract';

const shouldRunDbTests = !!process.env.DATABASE_URL;

if (shouldRunDbTests) {
  runProdutoRepositoryContractTests('PrismaProdutoRepository', async () => {
    // 1. Limpa produtos e variações de testes anteriores para garantir isolamento
    await prisma.variacao.deleteMany();
    await prisma.produto.deleteMany();

    // 2. Garante que Marca e Categoria existam buscando pelo ID único
    await prisma.marca.upsert({
      where: { id: 'marca-rare' },
      update: {},
      create: { id: 'marca-rare', nome: 'Rare Essence', slug: 'rare-essence' },
    });

    await prisma.categoria.upsert({
      where: { id: 'cat-amadeirado' },
      update: {},
      create: { id: 'cat-amadeirado', nome: 'Amadeirado Nobre', slug: 'amadeirado-nobre' },
    });

    return new PrismaProdutoRepository(prisma);
  });
}