import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PedidoRepository } from '@/modules/pedidos/application/ports/pedido-repository';
import { PedidoBuilder } from '../../../../helpers/builders/pedido.builder';
import { PagamentoGateway } from '@/modules/pagamentos/application/ports/pagamento-gateway';
import { WebhookPagamentoRepository } from '@/modules/pagamentos/application/ports/webhook-pagamento-repository';
import { ProcessarWebhookPagamento } from '@/modules/pagamentos/application/use-cases/processar-webhook-pagamento';
import { Result } from '@/shared/core/result';

describe('ProcessarWebhookPagamento', () => {
  let gateway: PagamentoGateway;
  let pedidos: PedidoRepository;
  let eventos: WebhookPagamentoRepository;
  let useCase: ProcessarWebhookPagamento;

  beforeEach(() => {
    gateway = {
      criarPix: vi.fn(),
      criarCartao: vi.fn(),
      consultar: vi.fn().mockResolvedValue({
        kind: 'success',
        value: {
          id: 'mp-123',
          referenciaExterna: 'pedido-1',
          status: 'approved',
          valorCentavos: 36100,
          moeda: 'BRL',
          metodo: 'pix',
        },
      }),
    };
    pedidos = {
      salvar: vi.fn(),
      buscarPorId: vi.fn().mockResolvedValue(PedidoBuilder.umPedido().comIdentidade('pedido-1', 'RE-1').build()),
      buscarPorCodigo: vi.fn(),
    };
    eventos = {
      processarEvento: vi.fn().mockResolvedValue('APLICADO'),
    };
    useCase = new ProcessarWebhookPagamento(gateway, pedidos, eventos);
  });

  it('consulta o pagamento com o provedor e encaminha evento aprovado uma única vez', async () => {
    const resultado = await useCase.executar(
      {
        idEvento: 'evt-1',
        tipo: 'payment',
        acao: 'payment.updated',
        idPagamento: 'mp-123',
      },
      new Date('2026-11-15T12:05:00Z')
    );

    expect(resultado).toMatchObject({ kind: 'success', value: 'APLICADO' });
    expect(gateway.consultar).toHaveBeenCalledWith('mp-123');
    expect(eventos.processarEvento).toHaveBeenCalledWith(
      expect.objectContaining({
        idEventoExterno: 'evt-1',
        idPagamentoExterno: 'mp-123',
        pedidoId: 'pedido-1',
        aprovado: true,
        statusPagamento: 'approved',
      })
    );
  });

  it('não processa pagamento com valor ou forma divergente do pedido', async () => {
    vi.mocked(gateway.consultar).mockResolvedValue(
      Result.ok({
        id: 'mp-123',
        referenciaExterna: 'pedido-1',
        status: 'approved',
        valorCentavos: 999,
        moeda: 'BRL',
        metodo: 'pix',
      })
    );

    const resultado = await useCase.executar(
      { idEvento: 'evt-2', tipo: 'payment', acao: 'payment.updated', idPagamento: 'mp-123' },
      new Date()
    );

    expect(resultado.kind).toBe('failure');
    expect(eventos.processarEvento).not.toHaveBeenCalled();
  });

  it('ignora notificações que não são de pagamento sem consultar o gateway', async () => {
    const resultado = await useCase.executar(
      { idEvento: 'evt-3', tipo: 'merchant_order', acao: 'merchant_order.updated', idPagamento: 'mp-123' },
      new Date()
    );

    expect(resultado).toMatchObject({ kind: 'success', value: 'IGNORADO' });
    expect(gateway.consultar).not.toHaveBeenCalled();
    expect(eventos.processarEvento).not.toHaveBeenCalled();
  });
});
