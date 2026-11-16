import { PedidoRepository } from '../application/ports/pedido-repository';
import { Pedido } from '../domain/pedido';

export class FakePedidoRepository implements PedidoRepository {
  private readonly pedidosPorId = new Map<string, Pedido>();
  private readonly idsPorCodigo = new Map<string, string>();

  async salvar(pedido: Pedido): Promise<void> {
    this.pedidosPorId.set(pedido.id, pedido);
    this.idsPorCodigo.set(pedido.codigoRastreavel, pedido.id);
  }

  async buscarPorId(id: string): Promise<Pedido | null> {
    return this.pedidosPorId.get(id) ?? null;
  }

  async buscarPorCodigo(codigo: string): Promise<Pedido | null> {
    const id = this.idsPorCodigo.get(codigo);
    return id ? this.buscarPorId(id) : null;
  }
}
