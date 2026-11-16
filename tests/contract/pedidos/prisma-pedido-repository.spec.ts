import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { prisma } from '@/shared/infra/prisma';
import { PedidoBuilder } from '../../helpers/builders/pedido.builder';
import { PrismaPedidoRepository } from '@/modules/pedidos/infra/prisma-pedido-repository';

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('Contract Test: PrismaPedidoRepository', () => {
  const repository = new PrismaPedidoRepository(prisma);
  let pedidoId: string;

  afterEach(async () => {
    if (pedidoId) {
      await prisma.pedido.deleteMany({ where: { id: pedidoId } });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('persiste snapshots, estado, forma de pagamento e busca pelo código', async () => {
    pedidoId = randomUUID();
    const pedido = PedidoBuilder.umPedido()
      .comIdentidade(pedidoId, `RE-${pedidoId}`)
      .build();

    await repository.salvar(pedido);
    const carregadoPorId = await repository.buscarPorId(pedidoId);
    const carregadoPorCodigo = await repository.buscarPorCodigo(pedido.codigoRastreavel);

    expect(carregadoPorId).not.toBeNull();
    expect(carregadoPorCodigo?.id).toBe(pedidoId);
    expect(carregadoPorId?.status).toBe('CRIADO');
    expect(carregadoPorId?.totalEmCentavos).toBe(36100);
    expect(carregadoPorId?.itens[0].sku).toMatch(/^RARE-NOIR-\d+-100ML$/);
    expect(carregadoPorId?.itens[0]).toMatchObject({
      nomeProduto: 'Noir Absolu',
      quantidade: 1,
      precoUnitario: { centavos: 38000 },
    });

    const transicao = carregadoPorId?.marcarPago(
      new Date('2026-11-15T12:01:00Z')
    );
    expect(transicao?.kind).toBe('success');
    if (carregadoPorId) {
      await repository.salvar(carregadoPorId);
    }

    const atualizado = await repository.buscarPorCodigo(pedido.codigoRastreavel);
    expect(atualizado?.status).toBe('PAGO');
    expect(atualizado?.totalEmCentavos).toBe(36100);
  });
});
