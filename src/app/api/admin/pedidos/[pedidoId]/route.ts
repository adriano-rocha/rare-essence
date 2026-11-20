import { z } from 'zod';
import { LiberarReservaEstoque } from '@/modules/estoque/application/use-cases/estoque-use-cases';
import { PrismaEstoqueRepository } from '@/modules/estoque/infra/prisma-estoque-repository';
import { StatusPedido } from '@/modules/pedidos/domain/pedido';
import { PedidoMapper } from '@/modules/pedidos/infra/mappers/pedido-mapper';
import { PrismaPedidoRepository } from '@/modules/pedidos/infra/prisma-pedido-repository';
import { SystemClock } from '@/shared/infra/clock';
import { prisma } from '@/shared/infra/prisma';

const entradaSchema = z.object({
  status: z.enum(['EM_SEPARACAO', 'ENVIADO', 'ENTREGUE', 'CANCELADO']),
});

class ErroCancelamentoEstoque extends Error {
  constructor(
    readonly codigo: string,
    readonly mensagem: string
  ) {
    super(mensagem);
    this.name = 'ErroCancelamentoEstoque';
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ pedidoId: string }> }
): Promise<Response> {
  const { pedidoId } = await context.params;
  try {
    const pedido = await new PrismaPedidoRepository(prisma).buscarPorId(pedidoId);
    if (!pedido) {
      return Response.json(
        { erro: 'PEDIDO_NAO_ENCONTRADO', mensagem: 'Pedido não encontrado.' },
        { status: 404 }
      );
    }

    return Response.json(
      {
        id: pedido.id,
        codigoRastreavel: pedido.codigoRastreavel,
        status: pedido.status,
        formaPagamento: pedido.formaPagamento,
        cliente: pedido.cliente,
        enderecoEntrega: pedido.enderecoEntrega,
        itens: pedido.itens.map((item) => ({
          variacaoId: item.variacaoId,
          sku: item.sku,
          nomeProduto: item.nomeProduto,
          volumeMl: item.volumeMl,
          quantidade: item.quantidade,
          precoUnitarioCentavos: item.precoUnitario.centavos,
          subtotalCentavos: item.precoUnitario.centavos * item.quantidade,
        })),
        subtotalProdutosCentavos: pedido.subtotalProdutos.centavos,
        descontoCupomCentavos: pedido.descontoCupom.centavos,
        descontoPixCentavos: pedido.descontoPix.centavos,
        frete: {
          modalidade: pedido.frete.modalidade,
          prazoDias: pedido.frete.prazoDias,
          valorCentavos: pedido.frete.valor.centavos,
        },
        totalEmCentavos: pedido.totalEmCentavos,
        criadoEm: pedido.criadoEm.toISOString(),
        atualizadoEm: pedido.atualizadoEm.toISOString(),
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (erro) {
    console.error(`Falha ao consultar pedido ${pedidoId}.`, erro);
    return Response.json(
      { erro: 'PEDIDO_INDISPONIVEL', mensagem: 'Não foi possível carregar o pedido.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ pedidoId: string }> }
): Promise<Response> {
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return Response.json(
      { erro: 'ENTRADA_INVALIDA', mensagem: 'Informe o status em JSON válido.' },
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

  const { pedidoId } = await context.params;
  const agora = new SystemClock().agora();

  if (entrada.data.status === StatusPedido.CANCELADO) {
    try {
      const resposta = await prisma.$transaction(async (transacao) => {
        await transacao.$queryRaw`
          SELECT "id" FROM "pedidos" WHERE "id" = ${pedidoId} FOR UPDATE
        `;
        const registro = await transacao.pedido.findUnique({
          where: { id: pedidoId },
          include: { itens: true },
        });
        if (!registro) {
          return {
            status: 404,
            body: { erro: 'PEDIDO_NAO_ENCONTRADO', mensagem: 'Pedido não encontrado.' },
          };
        }

        const pedido = PedidoMapper.toDomain(registro);
        const resultado = pedido.cancelar(agora);
        if (resultado.kind === 'failure') {
          return {
            status: 409,
            body: { erro: resultado.error.codigo, mensagem: resultado.error.mensagem },
          };
        }

        const liberarEstoque = new LiberarReservaEstoque(
          new PrismaEstoqueRepository(transacao)
        );
        const itensOrdenados = [...pedido.itens].sort((a, b) =>
          a.variacaoId.localeCompare(b.variacaoId)
        );
        for (const item of itensOrdenados) {
          const liberacao = await liberarEstoque.executar(
            item.variacaoId,
            item.quantidade
          );
          if (liberacao.kind === 'failure') {
            throw new ErroCancelamentoEstoque(
              liberacao.error.codigo,
              liberacao.error.mensagem
            );
          }
        }

        await transacao.pedido.update({
          where: { id: pedido.id },
          data: {
            status: pedido.status,
            atualizadoEm: pedido.atualizadoEm,
          },
        });

        return {
          status: 200,
          body: { pedidoId: pedido.id, status: pedido.status },
        };
      });

      return Response.json(resposta.body, {
        status: resposta.status,
        headers: { 'Cache-Control': 'no-store' },
      });
    } catch (erro) {
      if (erro instanceof ErroCancelamentoEstoque) {
        return Response.json(
          { erro: erro.codigo, mensagem: erro.mensagem },
          { status: 409, headers: { 'Cache-Control': 'no-store' } }
        );
      }
      console.error(`Falha ao cancelar pedido ${pedidoId}.`, erro);
      return Response.json(
        { erro: 'ATUALIZACAO_INDISPONIVEL', mensagem: 'Não foi possível cancelar o pedido.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }
  }

  const repository = new PrismaPedidoRepository(prisma);
  try {
    const pedido = await repository.buscarPorId(pedidoId);
    if (!pedido) {
      return Response.json(
        { erro: 'PEDIDO_NAO_ENCONTRADO', mensagem: 'Pedido não encontrado.' },
        { status: 404 }
      );
    }

    const resultado =
      entrada.data.status === StatusPedido.EM_SEPARACAO
        ? pedido.iniciarSeparacao(agora)
        : entrada.data.status === StatusPedido.ENVIADO
          ? pedido.marcarEnviado(agora)
          : pedido.marcarEntregue(agora);

    if (resultado.kind === 'failure') {
      return Response.json(
        { erro: resultado.error.codigo, mensagem: resultado.error.mensagem },
        { status: 409 }
      );
    }

    await repository.salvar(pedido);
    return Response.json(
      { pedidoId: pedido.id, status: pedido.status },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (erro) {
    console.error(`Falha ao atualizar status do pedido ${pedidoId}.`, erro);
    return Response.json(
      { erro: 'ATUALIZACAO_INDISPONIVEL', mensagem: 'Não foi possível atualizar o pedido.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}