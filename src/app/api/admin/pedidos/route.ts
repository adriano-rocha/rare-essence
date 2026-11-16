import { prisma } from '@/shared/infra/prisma';

export async function GET(): Promise<Response> {
  try {
    const pedidos = await prisma.pedido.findMany({
      orderBy: { criadoEm: 'desc' },
      take: 100,
      select: {
        id: true,
        codigoRastreavel: true,
        status: true,
        formaPagamento: true,
        clienteNome: true,
        clienteEmail: true,
        totalEmCentavos: true,
        criadoEm: true,
        _count: { select: { itens: true } },
      },
    });

    return Response.json(
      { pedidos },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (erro) {
    console.error('Falha ao listar pedidos no painel administrativo.', erro);
    return Response.json(
      { erro: 'PEDIDOS_INDISPONIVEIS', mensagem: 'Não foi possível carregar os pedidos.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
