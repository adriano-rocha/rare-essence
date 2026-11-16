import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { PedidoBuilder } from '../../helpers/builders/pedido.builder';
import { prisma } from '@/shared/infra/prisma';
import { PrismaPedidoRepository } from '@/modules/pedidos/infra/prisma-pedido-repository';
import { PrismaWebhookPagamentoRepository } from '@/modules/pagamentos/infra/prisma-webhook-pagamento-repository';

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('Contract Test: PrismaWebhookPagamentoRepository', () => {
  const pedidos = new PrismaPedidoRepository(prisma);
  const eventos = new PrismaWebhookPagamentoRepository(prisma);
  let pedidoId: string;

  afterEach(async () => {
    if (pedidoId) {
      await prisma.eventoWebhookPagamento.deleteMany({ where: { pedidoId } });
      await prisma.pedido.deleteMany({ where: { id: pedidoId } });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('aplica uma confirmação e ignora a repetição do mesmo evento externo', async () => {
    pedidoId = randomUUID();
    const pedido = PedidoBuilder.umPedido()
      .comIdentidade(pedidoId, `RE-${pedidoId}`)
      .build();
    await pedidos.salvar(pedido);
    const input = {
      idEventoExterno: randomUUID(),
      idPagamentoExterno: 'mp-payment-1',
      pedidoId,
      acao: 'payment.updated',
      statusPagamento: 'approved',
      aprovado: true,
      recebidoEm: new Date('2026-11-15T12:05:00Z'),
    };

    const resultados = await Promise.all([
      eventos.processarEvento(input),
      eventos.processarEvento(input),
    ]);
    expect(resultados.sort()).toEqual(['APLICADO', 'DUPLICADO']);
    expect((await pedidos.buscarPorId(pedidoId))?.status).toBe('PAGO');

    const registro = await prisma.eventoWebhookPagamento.findUnique({
      where: { idEventoExterno: input.idEventoExterno },
    });
    expect(registro?.resultado).toBe('APLICADO');
  });

  it('registra uma aprovação tardia sem avançar um pedido Pix expirado', async () => {
    pedidoId = randomUUID();
    const pedido = PedidoBuilder.umPedido()
      .comIdentidade(pedidoId, `RE-${pedidoId}`)
      .build();
    await pedidos.salvar(pedido);

    const resultado = await eventos.processarEvento({
      idEventoExterno: randomUUID(),
      idPagamentoExterno: 'mp-payment-late',
      pedidoId,
      acao: 'payment.updated',
      statusPagamento: 'approved',
      aprovado: true,
      recebidoEm: new Date('2026-11-15T12:31:00Z'),
    });

    expect(resultado).toBe('PEDIDO_NAO_PAGAVEL');
    expect((await pedidos.buscarPorId(pedidoId))?.status).toBe('CRIADO');
    const evento = await prisma.eventoWebhookPagamento.findFirst({ where: { pedidoId } });
    expect(evento?.resultado).toBe('PEDIDO_NAO_PAGAVEL');
  });
});
