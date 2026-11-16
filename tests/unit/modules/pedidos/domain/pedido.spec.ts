import { describe, expect, it } from 'vitest';
import { PedidoBuilder } from '../../../../helpers/builders/pedido.builder';
import { FormaPagamento, StatusPedido } from '@/modules/pedidos/domain/pedido';
import { Pedido } from '@/modules/pedidos/domain/pedido';
import { Money } from '@/shared/core/money';

const instanteInicial = new Date('2026-11-15T12:00:00Z');

describe('Pedido (Agregado Raiz)', () => {
  it('mantém snapshots imutáveis e seleciona o total pela forma de pagamento', () => {
    const pix = PedidoBuilder.umPedido().build();
    const cartao = PedidoBuilder.umPedido()
      .comFormaPagamento(FormaPagamento.CARTAO)
      .build();

    expect(pix.totalEmCentavos).toBe(36100);
    expect(cartao.totalEmCentavos).toBe(38000);
    expect(pix.itens[0].sku).toBe('RARE-NOIR-1-100ML');
    expect(Object.isFrozen(pix.itens)).toBe(true);

    const expiraEm = pix.expiraEm;
    expiraEm?.setFullYear(2030);
    expect(pix.expiraEm?.toISOString()).toBe('2026-11-15T12:30:00.000Z');
  });

  it('exige a sequência estrita de estados até a entrega', () => {
    const pedido = PedidoBuilder.umPedido().build();

    expect(pedido.iniciarSeparacao(instanteInicial).kind).toBe('failure');
    expect(pedido.marcarPago(instanteInicial).kind).toBe('success');
    expect(pedido.iniciarSeparacao(new Date(instanteInicial.getTime() + 1)).kind)
      .toBe('success');
    expect(pedido.marcarEnviado(new Date(instanteInicial.getTime() + 2)).kind)
      .toBe('success');
    expect(pedido.marcarEntregue(new Date(instanteInicial.getTime() + 3)).kind)
      .toBe('success');
    expect(pedido.status).toBe(StatusPedido.ENTREGUE);
    expect(pedido.cancelar(new Date(instanteInicial.getTime() + 4)).kind)
      .toBe('failure');
  });

  it('permite cancelar em qualquer estado anterior ao envio e impede repetir etapas', () => {
    const criado = PedidoBuilder.umPedido().build();
    const pago = PedidoBuilder.umPedido().build();
    const emSeparacao = PedidoBuilder.umPedido().build();

    expect(criado.cancelar(instanteInicial).kind).toBe('success');
    expect(pago.marcarPago(instanteInicial).kind).toBe('success');
    expect(pago.cancelar(instanteInicial).kind).toBe('success');
    expect(emSeparacao.marcarPago(instanteInicial).kind).toBe('success');
    expect(emSeparacao.iniciarSeparacao(instanteInicial).kind).toBe('success');
    expect(emSeparacao.cancelar(instanteInicial).kind).toBe('success');
    expect(criado.status).toBe(StatusPedido.CANCELADO);
    expect(criado.marcarPago(instanteInicial).kind).toBe('failure');
    expect(criado.cancelar(instanteInicial).kind).toBe('failure');
  });

  it('expira pagamento Pix após 30 minutos e não expira pedido de cartão', () => {
    const pix = PedidoBuilder.umPedido().build();
    const cartao = PedidoBuilder.umPedido()
      .comFormaPagamento(FormaPagamento.CARTAO)
      .build();

    expect(pix.expirarPix(new Date(instanteInicial.getTime() + 29 * 60 * 1000)).kind)
      .toBe('failure');
    expect(
      pix.marcarPago(new Date(instanteInicial.getTime() + 29 * 60 * 1000)).kind
    ).toBe('success');
    const expiravel = PedidoBuilder.umPedido().build();
    expect(
      expiravel.marcarPago(new Date(instanteInicial.getTime() + 30 * 60 * 1000)).kind
    ).toBe('failure');
    expect(
      expiravel.expirarPix(new Date(instanteInicial.getTime() + 30 * 60 * 1000)).kind
    ).toBe('success');
    expect(expiravel.status).toBe(StatusPedido.CANCELADO);
    expect(cartao.expiraEm).toBeUndefined();
    expect(cartao.expirarPix(instanteInicial).kind).toBe('failure');
  });

  it('rejeita snapshot com total inconsistente', () => {
    const pedido = PedidoBuilder.umPedido().build();
    const subtotal = Money.fromCentavos(38000);
    if (subtotal.kind === 'failure') throw new Error(subtotal.error.mensagem);

    const invalidado = Pedido.criar({
      id: 'pedido-invalido',
      codigoRastreavel: 'RE-INVALIDO',
      cliente: pedido.cliente,
      enderecoEntrega: pedido.enderecoEntrega,
      itens: pedido.itens,
      formaPagamento: FormaPagamento.PIX,
      subtotalProdutos: subtotal.value,
      descontoCupom: pedido.descontoCupom,
      descontoPix: pedido.descontoPix,
      frete: pedido.frete,
      totalCartao: subtotal.value,
      totalPix: subtotal.value,
      criadoEm: instanteInicial,
    });

    expect(invalidado.kind).toBe('failure');
    if (invalidado.kind === 'failure') {
      expect(invalidado.error.codigo).toBe('SNAPSHOT_PRECO_PEDIDO_INVALIDO');
    }
  });
});
