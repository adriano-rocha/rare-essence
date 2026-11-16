import { z } from 'zod';
import { CriarPedido } from '@/modules/pedidos/application/use-cases/criar-pedido';
import {
  LiberarReservaEstoque,
  ReservarEstoque,
} from '@/modules/estoque/application/use-cases/estoque-use-cases';
import { PrismaEstoqueRepository } from '@/modules/estoque/infra/prisma-estoque-repository';
import { PrismaPedidoRepository } from '@/modules/pedidos/infra/prisma-pedido-repository';
import { LIMITE_CRIACAO_CHECKOUT } from '@/shared/infra/rate-limit-policies';
import { obterIdentificadorCliente } from '@/shared/infra/client-identifier';
import { PrismaRateLimiter } from '@/shared/infra/prisma-rate-limiter';
import { CryptoIdGenerator } from '@/shared/infra/id-generator';
import { SystemClock } from '@/shared/infra/clock';
import { prisma } from '@/shared/infra/prisma';
import { Money } from '@/shared/core/money';
import type { ItemPedidoProps } from '@/modules/pedidos/domain/item-pedido';
import {
  calcularCotacaoCheckout,
  cepCheckoutSchema,
  itensCheckoutSchema,
} from './_shared';

const entradaSchema = z.object({
  cliente: z.object({
    nome: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    cpf: z.string().trim().transform((valor) => valor.replace(/\D/g, '')).refine((valor) => valor.length === 11),
    telefone: z.string().trim().transform((valor) => valor.replace(/\D/g, '')).refine((valor) => valor.length >= 10 && valor.length <= 13),
  }),
  enderecoEntrega: z.object({
    cep: cepCheckoutSchema,
    logradouro: z.string().trim().min(1).max(120),
    numero: z.string().trim().min(1).max(20),
    complemento: z.string().trim().max(100).optional(),
    bairro: z.string().trim().min(1).max(100),
    cidade: z.string().trim().min(1).max(100),
    estado: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/),
  }),
  itens: itensCheckoutSchema,
  freteModalidade: z.enum(['PAC', 'SEDEX']),
  formaPagamento: z.literal('PIX'),
});

interface Reserva {
  variacaoId: string;
  quantidade: number;
}

async function compensarReservas(reservas: readonly Reserva[]): Promise<boolean> {
  const liberar = new LiberarReservaEstoque(new PrismaEstoqueRepository(prisma));
  let sucesso = true;

  for (const reserva of [...reservas].reverse()) {
    try {
      const resultado = await liberar.executar(
        reserva.variacaoId,
        reserva.quantidade
      );
      if (resultado.kind === 'failure') {
        sucesso = false;
        console.error(
          `Falha ao compensar reserva da variação ${reserva.variacaoId}: ${resultado.error.mensagem}`
        );
      }
    } catch (erro) {
      sucesso = false;
      console.error(
        `Falha de persistência ao compensar reserva da variação ${reserva.variacaoId}.`,
        erro
      );
    }
  }

  return sucesso;
}

export async function POST(request: Request): Promise<Response> {
  let limite;
  try {
    limite = await new PrismaRateLimiter(
      prisma,
      process.env.ADMIN_SESSION_SECRET ?? ''
    ).consumir(obterIdentificadorCliente(request), LIMITE_CRIACAO_CHECKOUT);
  } catch (erro) {
    console.error('Rate limit de checkout indisponível.', erro);
    return Response.json(
      { erro: 'SERVICO_INDISPONIVEL', mensagem: 'Não foi possível iniciar o checkout agora.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (!limite.permitido) {
    return Response.json(
      { erro: 'MUITAS_REQUISICOES', mensagem: 'Tente novamente mais tarde.' },
      {
        status: 429,
        headers: {
          'Cache-Control': 'no-store',
          'Retry-After': String(limite.tentarNovamenteEmSegundos),
        },
      }
    );
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return Response.json(
      { erro: 'ENTRADA_INVALIDA', mensagem: 'Informe os dados do checkout em JSON válido.' },
      { status: 400 }
    );
  }

  const entrada = entradaSchema.safeParse(corpo);
  if (!entrada.success) {
    return Response.json(
      { erro: 'ENTRADA_INVALIDA', detalhes: entrada.error.flatten() },
      { status: 400 }
    );
  }

  let cotacao;
  try {
    cotacao = await calcularCotacaoCheckout({
      itens: entrada.data.itens,
      cepDestino: entrada.data.enderecoEntrega.cep,
    });
  } catch (erro) {
    console.error('Falha ao preparar cotação para checkout.', erro);
    return Response.json(
      { erro: 'CHECKOUT_INDISPONIVEL', mensagem: 'Não foi possível concluir o checkout.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  if (cotacao.kind === 'failure') {
    return Response.json(
      { erro: cotacao.error.codigo, mensagem: cotacao.error.mensagem },
      { status: cotacao.error.status }
    );
  }

  const frete = cotacao.value.opcoesFrete.find(
    (opcao) => opcao.modalidade === entrada.data.freteModalidade
  );
  if (!frete) {
    return Response.json(
      { erro: 'FRETE_INVALIDO', mensagem: 'Selecione uma opção de frete válida.' },
      { status: 400 }
    );
  }

  const reservas: Reserva[] = [];
  const estoque = new PrismaEstoqueRepository(prisma);
  const reservar = new ReservarEstoque(estoque);

  for (const item of [...cotacao.value.itens].sort((a, b) =>
    a.variacaoId.localeCompare(b.variacaoId)
  )) {
    try {
      const resultado = await reservar.executar(item.variacaoId, item.quantidade);
      if (resultado.kind === 'failure') {
        const compensado = await compensarReservas(reservas);
        if (!compensado) {
          return Response.json(
            { erro: 'RESERVA_INCONSISTENTE', mensagem: 'Não foi possível concluir o checkout. Contate o atendimento.' },
            { status: 503 }
          );
        }
        return Response.json(
          { erro: 'ESTOQUE_INSUFICIENTE', mensagem: 'Um ou mais itens acabaram de ficar indisponíveis.' },
          { status: 409 }
        );
      }
      reservas.push({ variacaoId: item.variacaoId, quantidade: item.quantidade });
    } catch (erro) {
      const compensado = await compensarReservas(reservas);
      console.error('Falha ao reservar estoque para checkout.', erro);
      return Response.json(
        {
          erro: compensado ? 'CHECKOUT_INDISPONIVEL' : 'RESERVA_INCONSISTENTE',
          mensagem: 'Não foi possível concluir o checkout. Tente novamente.',
        },
        { status: 503 }
      );
    }
  }

  const itensPedido: ItemPedidoProps[] = [];
  for (const item of cotacao.value.itens) {
    const preco = Money.fromCentavos(item.precoUnitarioCentavos);
    if (preco.kind === 'failure') {
      const compensado = await compensarReservas(reservas);
      return Response.json(
        {
          erro: compensado ? 'PRECO_INVALIDO' : 'RESERVA_INCONSISTENTE',
          mensagem: 'Não foi possível concluir o checkout.',
        },
        { status: compensado ? 500 : 503 }
      );
    }

    itensPedido.push({
      variacaoId: item.variacaoId,
      sku: item.sku,
      nomeProduto: item.nomeProduto,
      volumeMl: item.volumeMl,
      quantidade: item.quantidade,
      precoUnitario: preco.value,
    });
  }

  const descontoCupom = Money.fromCentavos(0);
  const descontoPix = Money.fromCentavos(frete.descontoPixCentavos);
  const valorFrete = Money.fromCentavos(frete.valorCentavos);
  const totalCartao = Money.fromCentavos(frete.totalCartaoCentavos);
  const totalPix = Money.fromCentavos(frete.totalPixCentavos);
  const subtotalProdutos = Money.fromCentavos(
    cotacao.value.subtotalProdutosCentavos
  );
  const valores = [
    descontoCupom,
    descontoPix,
    valorFrete,
    totalCartao,
    totalPix,
    subtotalProdutos,
  ];
  if (valores.some((valor) => valor.kind === 'failure')) {
    const compensado = await compensarReservas(reservas);
    return Response.json(
      {
        erro: compensado ? 'PRECOS_INVALIDOS' : 'RESERVA_INCONSISTENTE',
        mensagem: 'Não foi possível concluir o checkout.',
      },
      { status: compensado ? 500 : 503 }
    );
  }

  const [cupom, desconto, valorDoFrete, cartao, pix, subtotal] = valores;
  if (
    cupom.kind === 'failure' ||
    desconto.kind === 'failure' ||
    valorDoFrete.kind === 'failure' ||
    cartao.kind === 'failure' ||
    pix.kind === 'failure' ||
    subtotal.kind === 'failure'
  ) {
    const compensado = await compensarReservas(reservas);
    return Response.json(
      {
        erro: compensado ? 'PRECOS_INVALIDOS' : 'RESERVA_INCONSISTENTE',
        mensagem: 'Não foi possível concluir o checkout.',
      },
      { status: compensado ? 500 : 503 }
    );
  }

  let pedido: Awaited<ReturnType<CriarPedido['executar']>>;
  try {
    pedido = await new CriarPedido(
      new PrismaPedidoRepository(prisma),
      new CryptoIdGenerator(),
      new SystemClock()
    ).executar({
      cliente: entrada.data.cliente,
      enderecoEntrega: entrada.data.enderecoEntrega,
      itens: itensPedido,
      formaPagamento: 'PIX',
      subtotalProdutos: subtotal.value,
      descontoCupom: cupom.value,
      descontoPix: desconto.value,
      frete: {
        modalidade: frete.modalidade,
        prazoDias: frete.prazoDias,
        valor: valorDoFrete.value,
      },
      totalCartao: cartao.value,
      totalPix: pix.value,
    });
  } catch (erro) {
    const compensado = await compensarReservas(reservas);
    console.error('Falha ao persistir pedido do checkout.', erro);
    return Response.json(
      {
        erro: compensado ? 'CHECKOUT_INDISPONIVEL' : 'RESERVA_INCONSISTENTE',
        mensagem: 'Não foi possível concluir o checkout. Tente novamente.',
      },
      { status: 503 }
    );
  }

  if (pedido.kind === 'failure') {
    const compensado = await compensarReservas(reservas);
    return Response.json(
      {
        erro: compensado ? pedido.error.codigo : 'RESERVA_INCONSISTENTE',
        mensagem: compensado
          ? pedido.error.mensagem
          : 'Não foi possível concluir o checkout. Contate o atendimento.',
      },
      { status: compensado ? 422 : 503 }
    );
  }

  return Response.json(
    {
      pedidoId: pedido.value.id,
      codigoRastreavel: pedido.value.codigoRastreavel,
      totalCentavos: pedido.value.totalEmCentavos,
      expiraEm: pedido.value.expiraEm?.toISOString() ?? null,
    },
    { status: 201, headers: { 'Cache-Control': 'no-store' } }
  );
}
