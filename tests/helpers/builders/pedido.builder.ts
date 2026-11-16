import { Money } from '@/shared/core/money';
import { ClientePedido } from '@/modules/pedidos/domain/cliente-pedido';
import { EnderecoEntrega } from '@/modules/pedidos/domain/endereco-entrega';
import { FretePedido } from '@/modules/pedidos/domain/frete-pedido';
import { ItemPedido } from '@/modules/pedidos/domain/item-pedido';
import {
  FormaPagamento,
  Pedido,
} from '@/modules/pedidos/domain/pedido';

let sequenciaPedido = 1;

function dinheiro(centavos: number): Money {
  const resultado = Money.fromCentavos(centavos);
  if (resultado.kind === 'failure') {
    throw new Error(resultado.error.mensagem);
  }
  return resultado.value;
}

function criarCliente(): ClientePedido {
  const resultado = ClientePedido.criar({
    nome: 'Ana Cliente',
    email: 'ana@example.com',
    cpf: '123.456.789-09',
    telefone: '(11) 99999-9999',
  });
  if (resultado.kind === 'failure') throw new Error(resultado.error.mensagem);
  return resultado.value;
}

function criarEndereco(): EnderecoEntrega {
  const resultado = EnderecoEntrega.criar({
    cep: '01001-000',
    logradouro: 'Praça da Sé',
    numero: '100',
    complemento: 'Apto 2',
    bairro: 'Sé',
    cidade: 'São Paulo',
    estado: 'sp',
  });
  if (resultado.kind === 'failure') throw new Error(resultado.error.mensagem);
  return resultado.value;
}

function criarFrete(): FretePedido {
  const resultado = FretePedido.criar({
    modalidade: 'PAC',
    prazoDias: 5,
    valor: dinheiro(0),
  });
  if (resultado.kind === 'failure') throw new Error(resultado.error.mensagem);
  return resultado.value;
}

function criarItem(sequencia: number): ItemPedido {
  const resultado = ItemPedido.criar({
    variacaoId: `variacao-${sequencia}`,
    sku: `RARE-NOIR-${sequencia}-100ML`,
    nomeProduto: 'Noir Absolu',
    volumeMl: 100,
    quantidade: 1,
    precoUnitario: dinheiro(38000),
  });
  if (resultado.kind === 'failure') throw new Error(resultado.error.mensagem);
  return resultado.value;
}

export class PedidoBuilder {
  private readonly sequencia = sequenciaPedido++;
  private formaPagamento: FormaPagamento = FormaPagamento.PIX;
  private id = `pedido-${this.sequencia}`;
  private codigo = `RE-TEST-${this.sequencia}`;

  static umPedido(): PedidoBuilder {
    return new PedidoBuilder();
  }

  comIdentidade(id: string, codigoRastreavel: string): this {
    this.id = id;
    this.codigo = codigoRastreavel;
    return this;
  }

  comFormaPagamento(formaPagamento: FormaPagamento): this {
    this.formaPagamento = formaPagamento;
    return this;
  }

  build(): Pedido {
    const pedido = Pedido.criar({
      id: this.id,
      codigoRastreavel: this.codigo,
      cliente: criarCliente(),
      enderecoEntrega: criarEndereco(),
      itens: [criarItem(this.sequencia)],
      formaPagamento: this.formaPagamento,
      subtotalProdutos: dinheiro(38000),
      descontoCupom: dinheiro(0),
      descontoPix: dinheiro(1900),
      frete: criarFrete(),
      totalCartao: dinheiro(38000),
      totalPix: dinheiro(36100),
      criadoEm: new Date('2026-11-15T12:00:00Z'),
    });

    if (pedido.kind === 'failure') {
      throw new Error(`Pedido de teste inválido: ${pedido.error.mensagem}`);
    }
    return pedido.value;
  }
}
