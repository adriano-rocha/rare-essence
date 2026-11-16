import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PedidoRepository } from '@/modules/pedidos/application/ports/pedido-repository';
import { PedidoBuilder } from '../../../../helpers/builders/pedido.builder';
import { PagamentoGateway } from '@/modules/pagamentos/application/ports/pagamento-gateway';
import { IniciarPagamento } from '@/modules/pagamentos/application/use-cases/iniciar-pagamento';
import { FakeClock } from '@/shared/infra/clock';

describe('IniciarPagamento', () => {
  let gateway: PagamentoGateway;
  let pedidos: PedidoRepository;

  beforeEach(() => {
    gateway = {
      criarPix: vi.fn().mockResolvedValue({ kind: 'success', value: { id: 'mp-1', status: 'pending' } }),
      criarCartao: vi.fn().mockResolvedValue({ kind: 'success', value: { id: 'mp-2', status: 'approved' } }),
      consultar: vi.fn(),
    };
    pedidos = {
      salvar: vi.fn(),
      buscarPorId: vi.fn(),
      buscarPorCodigo: vi.fn(),
    };
  });

  it('inicia Pix usando o total e a expiração do snapshot do pedido', async () => {
    const pedido = PedidoBuilder.umPedido().build();
    vi.mocked(pedidos.buscarPorId).mockResolvedValue(pedido);
    const useCase = new IniciarPagamento(
      pedidos,
      gateway,
      new FakeClock(new Date('2026-11-15T12:01:00Z'))
    );

    await useCase.executar(pedido.id);

    expect(gateway.criarPix).toHaveBeenCalledWith(
      expect.objectContaining({
        pedidoId: pedido.id,
        chaveIdempotencia: pedido.id,
        valor: pedido.total,
        expiraEm: pedido.expiraEm,
        pagador: {
          email: 'ana@example.com',
          nome: 'Ana',
          sobrenome: 'Cliente',
          cpf: '12345678909',
        },
      })
    );
    expect(gateway.criarCartao).not.toHaveBeenCalled();
  });

  it('recusa Pix depois do prazo do pedido', async () => {
    const pedido = PedidoBuilder.umPedido().build();
    vi.mocked(pedidos.buscarPorId).mockResolvedValue(pedido);
    const useCase = new IniciarPagamento(
      pedidos,
      gateway,
      new FakeClock(new Date('2026-11-15T12:30:00Z'))
    );

    const resultado = await useCase.executar(pedido.id);

    expect(resultado.kind).toBe('failure');
    if (resultado.kind === 'failure') {
      expect(resultado.error.codigo).toBe('PEDIDO_PIX_EXPIRADO');
    }
    expect(gateway.criarPix).not.toHaveBeenCalled();
  });

  it('inicia cartão com token e parcelas sem enviar dados brutos do cartão', async () => {
    const pedido = PedidoBuilder.umPedido().comFormaPagamento('CARTAO').build();
    vi.mocked(pedidos.buscarPorId).mockResolvedValue(pedido);
    const useCase = new IniciarPagamento(
      pedidos,
      gateway,
      new FakeClock(new Date('2026-11-15T12:01:00Z'))
    );

    await useCase.executar(pedido.id, {
      tokenCartao: 'token-fornecido-pelo-sdk',
      metodoCartao: 'master',
      parcelas: 3,
    });

    expect(gateway.criarCartao).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenCartao: 'token-fornecido-pelo-sdk',
        metodoCartao: 'master',
        parcelas: 3,
        valor: pedido.total,
        chaveIdempotencia: pedido.id,
      })
    );
    expect(gateway.criarPix).not.toHaveBeenCalled();
  });

  it('não chama o gateway quando o pedido não existe ou os dados de cartão são inválidos', async () => {
    vi.mocked(pedidos.buscarPorId).mockResolvedValue(null);
    const useCase = new IniciarPagamento(
      pedidos,
      gateway,
      new FakeClock(new Date('2026-11-15T12:01:00Z'))
    );

    const inexistente = await useCase.executar('missing');
    const pedidoCartao = PedidoBuilder.umPedido().comFormaPagamento('CARTAO').build();
    vi.mocked(pedidos.buscarPorId).mockResolvedValue(pedidoCartao);
    const cartaoInvalido = await useCase.executar(pedidoCartao.id, {
      tokenCartao: 'token',
      metodoCartao: 'master',
      parcelas: 13,
    });

    expect(inexistente.kind).toBe('failure');
    expect(cartaoInvalido.kind).toBe('failure');
    expect(gateway.criarCartao).not.toHaveBeenCalled();
  });
});
