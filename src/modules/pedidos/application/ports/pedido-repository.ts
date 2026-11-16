import { Pedido } from '../../domain/pedido';

export interface PedidoRepository {
  salvar(pedido: Pedido): Promise<void>;
  buscarPorId(id: string): Promise<Pedido | null>;
  buscarPorCodigo(codigo: string): Promise<Pedido | null>;
}
