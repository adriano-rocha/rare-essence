import { PrismaClient } from '@prisma/client';
import { Produto } from '../domain/produto';
import {
  ProdutoRepository,
  FiltrosCatalogo,
} from '../application/ports/produto-repository';
import { ProdutoMapper } from './mappers/produto-mapper';

export class PrismaProdutoRepository implements ProdutoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async salvar(produto: Produto): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Upsert do agregado raiz Produto
      await tx.produto.upsert({
        where: { id: produto.id },
        update: {
          nome: produto.nome,
          slug: produto.slug.valor,
          descricao: produto.descricao,
          marcaId: produto.marcaId,
          categoriaId: produto.categoriaId,
          notasTopo: [...produto.piramideOlfativa.topo],
          notasCoracao: [...produto.piramideOlfativa.coracao],
          notasBase: [...produto.piramideOlfativa.base],
          ativo: produto.ativo,
          atualizadoEm: produto.atualizadoEm,
        },
        create: {
          id: produto.id,
          nome: produto.nome,
          slug: produto.slug.valor,
          descricao: produto.descricao,
          marcaId: produto.marcaId,
          categoriaId: produto.categoriaId,
          notasTopo: [...produto.piramideOlfativa.topo],
          notasCoracao: [...produto.piramideOlfativa.coracao],
          notasBase: [...produto.piramideOlfativa.base],
          ativo: produto.ativo,
          criadoEm: produto.criadoEm,
          atualizadoEm: produto.atualizadoEm,
        },
      });

      // Sincronização das variações do produto
      for (const variacao of produto.variacoes) {
        await tx.variacao.upsert({
          where: { sku: variacao.sku.valor },
          update: {
            volumeMl: variacao.volume.valor,
            precoCentavos: variacao.preco.centavos,
            pesoGramas: variacao.pesoGramas,
            ativo: variacao.ativo,
          },
          create: {
            id: variacao.id,
            produtoId: produto.id,
            sku: variacao.sku.valor,
            volumeMl: variacao.volume.valor,
            precoCentavos: variacao.preco.centavos,
            pesoGramas: variacao.pesoGramas,
            ativo: variacao.ativo,
          },
        });
      }
    });
  }

  async buscarPorId(id: string): Promise<Produto | null> {
    const raw = await this.prisma.produto.findUnique({
      where: { id },
      include: { variacoes: true },
    });
    if (!raw) return null;
    return ProdutoMapper.toDomain(raw);
  }

  async buscarPorSlug(slug: string): Promise<Produto | null> {
    const raw = await this.prisma.produto.findUnique({
      where: { slug },
      include: { variacoes: true },
    });
    if (!raw) return null;
    return ProdutoMapper.toDomain(raw);
  }

  async buscarPorSku(sku: string): Promise<Produto | null> {
    const formatado = sku.trim().toUpperCase();
    const variacao = await this.prisma.variacao.findUnique({
      where: { sku: formatado },
      include: {
        produto: {
          include: { variacoes: true },
        },
      },
    });

    if (!variacao || !variacao.produto) return null;
    return ProdutoMapper.toDomain(variacao.produto);
  }

  async listar(filtros: FiltrosCatalogo = {}): Promise<{ produtos: Produto[]; total: number }> {
    const where: Record<string, unknown> = {};

    if (filtros.apenasAtivos) {
      where.ativo = true;
    }
    if (filtros.categoriaSlug) {
      where.categoria = { slug: filtros.categoriaSlug };
    }
    if (filtros.marcaSlug) {
      where.marca = { slug: filtros.marcaSlug };
    }

    const pagina = filtros.pagina || 1;
    const itensPorPagina = filtros.itensPorPagina || 10;
    const skip = (pagina - 1) * itensPorPagina;

    const [rawProdutos, total] = await Promise.all([
      this.prisma.produto.findMany({
        where,
        include: { variacoes: true },
        skip,
        take: itensPorPagina,
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.produto.count({ where }),
    ]);

    return {
      produtos: rawProdutos.map(ProdutoMapper.toDomain),
      total,
    };
  }

  async existeComSlug(slug: string): Promise<boolean> {
    const count = await this.prisma.produto.count({
      where: { slug },
    });
    return count > 0;
  }
}