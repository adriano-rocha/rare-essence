import { Prisma, PrismaClient } from '@prisma/client';
import { PedidoRepository } from '../application/ports/pedido-repository';
import { Pedido } from '../domain/pedido';
import { PedidoMapper } from './mappers/pedido-mapper';

export class PrismaPedidoRepository implements PedidoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async salvar(pedido: Pedido): Promise<void> {
    await this.prisma.pedido.upsert({
      where: { id: pedido.id },
      create: {
        ...this.paraPersistencia(pedido),
        itens: { create: pedido.itens.map((item) => this.itemParaPersistencia(item)) },
      },
      update: {
        ...this.paraPersistencia(pedido),
        itens: {
          deleteMany: { pedidoId: pedido.id },
          create: pedido.itens.map((item) => this.itemParaPersistencia(item)),
        },
      },
    });
  }

  async buscarPorId(id: string): Promise<Pedido | null> {
    const registro = await this.prisma.pedido.findUnique({
      where: { id },
      include: { itens: true },
    });
    return registro ? PedidoMapper.toDomain(registro) : null;
  }

  async buscarPorCodigo(codigo: string): Promise<Pedido | null> {
    const registro = await this.prisma.pedido.findUnique({
      where: { codigoRastreavel: codigo },
      include: { itens: true },
    });
    return registro ? PedidoMapper.toDomain(registro) : null;
  }

  private paraPersistencia(pedido: Pedido): Prisma.PedidoUncheckedCreateInput {
    return {
      id: pedido.id,
      codigoRastreavel: pedido.codigoRastreavel,
      status: pedido.status,
      formaPagamento: pedido.formaPagamento,
      clienteNome: pedido.cliente.nome,
      clienteEmail: pedido.cliente.email,
      clienteCpf: pedido.cliente.cpf,
      clienteTelefone: pedido.cliente.telefone,
      enderecoCep: pedido.enderecoEntrega.cep,
      enderecoLogradouro: pedido.enderecoEntrega.logradouro,
      enderecoNumero: pedido.enderecoEntrega.numero,
      enderecoComplemento: pedido.enderecoEntrega.complemento,
      enderecoBairro: pedido.enderecoEntrega.bairro,
      enderecoCidade: pedido.enderecoEntrega.cidade,
      enderecoEstado: pedido.enderecoEntrega.estado,
      subtotalProdutosCentavos: pedido.subtotalProdutos.centavos,
      descontoCupomCentavos: pedido.descontoCupom.centavos,
      descontoPixCentavos: pedido.descontoPix.centavos,
      codigoCupom: pedido.codigoCupom,
      freteModalidade: pedido.frete.modalidade,
      fretePrazoDias: pedido.frete.prazoDias,
      freteValorCentavos: pedido.frete.valor.centavos,
      totalCartaoCentavos: pedido.totalCartao.centavos,
      totalPixCentavos: pedido.totalPix.centavos,
      totalEmCentavos: pedido.totalEmCentavos,
      expiraEm: pedido.expiraEm,
      criadoEm: pedido.criadoEm,
      atualizadoEm: pedido.atualizadoEm,
    };
  }

  private itemParaPersistencia(item: Pedido['itens'][number]) {
    const subtotal = item.calcularSubtotal();
    if (subtotal.kind === 'failure') {
      throw new Error(
        `Não foi possível calcular o snapshot do item ${item.variacaoId}: ${subtotal.error.mensagem}`
      );
    }

    return {
      variacaoId: item.variacaoId,
      sku: item.sku,
      nomeProduto: item.nomeProduto,
      volumeMl: item.volumeMl,
      quantidade: item.quantidade,
      precoUnitarioCentavos: item.precoUnitario.centavos,
      subtotalCentavos: subtotal.value.centavos,
    };
  }
}
