import {
  Pedido as PrismaPedido,
  PedidoItem as PrismaPedidoItem,
} from '@prisma/client';
import { Money } from '@/shared/core/money';
import { ClientePedido } from '../../domain/cliente-pedido';
import { EnderecoEntrega } from '../../domain/endereco-entrega';
import { FretePedido } from '../../domain/frete-pedido';
import { ItemPedido } from '../../domain/item-pedido';
import {
  FormaPagamento,
  Pedido,
  PedidoProps,
  StatusPedido,
} from '../../domain/pedido';

type PrismaPedidoComItens = PrismaPedido & {
  itens: PrismaPedidoItem[];
};

export class PedidoMapper {
  static toDomain(raw: PrismaPedidoComItens): Pedido {
    if (!this.isFormaPagamento(raw.formaPagamento)) {
      throw new Error(`Forma de pagamento inválida no pedido ${raw.id}.`);
    }

    if (!this.isStatusPedido(raw.status)) {
      throw new Error(`Status inválido no pedido ${raw.id}.`);
    }

    const cliente = ClientePedido.criar({
      nome: raw.clienteNome,
      email: raw.clienteEmail,
      cpf: raw.clienteCpf,
      telefone: raw.clienteTelefone,
    });
    if (cliente.kind === 'failure') {
      throw new Error(`Cliente inválido persistido no pedido ${raw.id}.`);
    }

    const endereco = EnderecoEntrega.criar({
      cep: raw.enderecoCep,
      logradouro: raw.enderecoLogradouro,
      numero: raw.enderecoNumero,
      complemento: raw.enderecoComplemento ?? undefined,
      bairro: raw.enderecoBairro,
      cidade: raw.enderecoCidade,
      estado: raw.enderecoEstado,
    });
    if (endereco.kind === 'failure') {
      throw new Error(`Endereço inválido persistido no pedido ${raw.id}.`);
    }

    const itens = raw.itens.map((registro) => {
      const item = ItemPedido.criar({
        variacaoId: registro.variacaoId,
        sku: registro.sku,
        nomeProduto: registro.nomeProduto,
        volumeMl: registro.volumeMl,
        quantidade: registro.quantidade,
        precoUnitario: this.money(
          registro.precoUnitarioCentavos,
          `preço unitário do item ${registro.id}`
        ),
      });
      if (item.kind === 'failure') {
        throw new Error(`Item inválido persistido no pedido ${raw.id}.`);
      }

      const subtotal = item.value.calcularSubtotal();
      if (
        subtotal.kind === 'failure' ||
        subtotal.value.centavos !== registro.subtotalCentavos
      ) {
        throw new Error(`Subtotal inválido persistido no item ${registro.id}.`);
      }

      return item.value;
    });

    const frete = FretePedido.criar({
      modalidade: raw.freteModalidade,
      prazoDias: raw.fretePrazoDias,
      valor: this.money(raw.freteValorCentavos, `frete do pedido ${raw.id}`),
    });
    if (frete.kind === 'failure') {
      throw new Error(`Frete inválido persistido no pedido ${raw.id}.`);
    }

    const props: PedidoProps = {
      id: raw.id,
      codigoRastreavel: raw.codigoRastreavel,
      cliente: cliente.value,
      enderecoEntrega: endereco.value,
      itens,
      formaPagamento: raw.formaPagamento,
      subtotalProdutos: this.money(
        raw.subtotalProdutosCentavos,
        `subtotal do pedido ${raw.id}`
      ),
      descontoCupom: this.money(
        raw.descontoCupomCentavos,
        `desconto do cupom do pedido ${raw.id}`
      ),
      descontoPix: this.money(
        raw.descontoPixCentavos,
        `desconto Pix do pedido ${raw.id}`
      ),
      frete: frete.value,
      totalCartao: this.money(
        raw.totalCartaoCentavos,
        `total do cartão do pedido ${raw.id}`
      ),
      totalPix: this.money(raw.totalPixCentavos, `total Pix do pedido ${raw.id}`),
      codigoCupom: raw.codigoCupom ?? undefined,
      criadoEm: raw.criadoEm,
    };

    const pedido = Pedido.reconstituir(
      props,
      raw.status,
      raw.atualizadoEm
    );
    if (pedido.kind === 'failure') {
      throw new Error(
        `Pedido inválido persistido (${raw.id}): ${pedido.error.mensagem}`
      );
    }

    if (
      pedido.value.totalEmCentavos !== raw.totalEmCentavos ||
      pedido.value.expiraEm?.getTime() !== raw.expiraEm?.getTime()
    ) {
      throw new Error(`Snapshot de total ou expiração inválido no pedido ${raw.id}.`);
    }

    return pedido.value;
  }

  private static money(centavos: number, contexto: string): Money {
    const resultado = Money.fromCentavos(centavos);
    if (resultado.kind === 'failure') {
      throw new Error(`Valor monetário inválido no ${contexto}.`);
    }
    return resultado.value;
  }

  private static isFormaPagamento(value: string): value is FormaPagamento {
    return Object.values(FormaPagamento).some((forma) => forma === value);
  }

  private static isStatusPedido(value: string): value is StatusPedido {
    return Object.values(StatusPedido).some((status) => status === value);
  }
}
