import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@/shared/infra/prisma';
import { EstoqueItem } from '@/modules/estoque/domain/estoque-item';
import {
  ConfirmarBaixaEstoque,
  LiberarReservaEstoque,
  ReservarEstoque,
} from '@/modules/estoque/application/use-cases/estoque-use-cases';
import { PrismaEstoqueRepository } from '@/modules/estoque/infra/prisma-estoque-repository';

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('Contract Test: PrismaEstoqueRepository', () => {
  const repository = new PrismaEstoqueRepository(prisma);
  let produtoId: string;
  let variacaoId: string;

  beforeEach(async () => {
    produtoId = randomUUID();
    variacaoId = randomUUID();
    const marcaId = 'marca-estoque-contract';
    const categoriaId = 'categoria-estoque-contract';

    await prisma.marca.upsert({
      where: { id: marcaId },
      update: {},
      create: {
        id: marcaId,
        nome: 'Marca de teste de estoque',
        slug: 'marca-teste-estoque',
      },
    });
    await prisma.categoria.upsert({
      where: { id: categoriaId },
      update: {},
      create: {
        id: categoriaId,
        nome: 'Categoria de teste de estoque',
        slug: 'categoria-teste-estoque',
      },
    });
    await prisma.produto.create({
      data: {
        id: produtoId,
        nome: 'Produto de teste de estoque',
        slug: `produto-teste-${produtoId}`,
        descricao: 'Produto isolado para contrato de estoque.',
        marcaId,
        categoriaId,
        familiaOlfativa: 'AMADEIRADO',
        notasTopo: [],
        notasCoracao: [],
        notasBase: [],
      },
    });
    await prisma.variacao.create({
      data: {
        id: variacaoId,
        produtoId,
        sku: `ESTOQUE-${variacaoId}`,
        volumeMl: 50,
        precoCentavos: 10000,
      },
    });
  });

  afterEach(async () => {
    await prisma.produto.deleteMany({ where: { id: produtoId } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('reserva, confirma baixa e libera reserva com persistência', async () => {
    const criado = EstoqueItem.criar({
      id: randomUUID(),
      variacaoId,
      quantidadeFisica: 5,
      quantidadeReservada: 0,
    });
    if (criado.kind === 'failure') {
      throw new Error(criado.error.mensagem);
    }

    await repository.salvar(criado.value);

    const reservado = await new ReservarEstoque(repository).executar(variacaoId, 2);
    expect(reservado.kind).toBe('success');
    const carregado = await repository.buscarPorVariacaoId(variacaoId);
    expect(carregado?.quantidadeFisica).toBe(5);
    expect(carregado?.quantidadeReservada).toBe(2);
    expect(carregado?.quantidadeDisponivel).toBe(3);

    const baixado = await new ConfirmarBaixaEstoque(repository).executar(variacaoId, 2);
    expect(baixado.kind).toBe('success');
    const aposBaixa = await repository.buscarPorVariacaoId(variacaoId);
    expect(aposBaixa?.quantidadeFisica).toBe(3);
    expect(aposBaixa?.quantidadeReservada).toBe(0);

    const reservaFinal = await new ReservarEstoque(repository).executar(variacaoId, 1);
    expect(reservaFinal.kind).toBe('success');
    const liberado = await new LiberarReservaEstoque(repository).executar(variacaoId, 1);
    expect(liberado.kind).toBe('success');
    const aposLiberacao = await repository.buscarPorVariacaoId(variacaoId);
    expect(aposLiberacao?.quantidadeFisica).toBe(3);
    expect(aposLiberacao?.quantidadeReservada).toBe(0);
  });

  it('serializa reservas concorrentes e não permite over-selling', async () => {
    const criado = EstoqueItem.criar({
      id: randomUUID(),
      variacaoId,
      quantidadeFisica: 5,
      quantidadeReservada: 0,
    });
    if (criado.kind === 'failure') {
      throw new Error(criado.error.mensagem);
    }
    await repository.salvar(criado.value);

    const resultados = await Promise.all(
      Array.from({ length: 10 }, () =>
        new ReservarEstoque(repository).executar(variacaoId, 1)
      )
    );

    expect(resultados.filter((resultado) => resultado.kind === 'success')).toHaveLength(5);
    expect(resultados.filter((resultado) => resultado.kind === 'failure')).toHaveLength(5);
    const estoque = await repository.buscarPorVariacaoId(variacaoId);
    expect(estoque?.quantidadeFisica).toBe(5);
    expect(estoque?.quantidadeReservada).toBe(5);
    expect(estoque?.quantidadeDisponivel).toBe(0);
  });
});
