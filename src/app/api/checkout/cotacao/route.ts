import { z } from 'zod';
import {
  calcularCotacaoCheckout,
  cepCheckoutSchema,
  itensCheckoutSchema,
} from '../_shared';
import { LIMITE_COTACAO_CHECKOUT } from '@/shared/infra/rate-limit-policies';
import { obterIdentificadorCliente } from '@/shared/infra/client-identifier';
import { PrismaRateLimiter } from '@/shared/infra/prisma-rate-limiter';
import { prisma } from '@/shared/infra/prisma';

const entradaSchema = z.object({
  cepDestino: cepCheckoutSchema,
  itens: itensCheckoutSchema,
});

export async function POST(request: Request): Promise<Response> {
  let limite;
  try {
    limite = await new PrismaRateLimiter(
      prisma,
      process.env.ADMIN_SESSION_SECRET ?? ''
    ).consumir(obterIdentificadorCliente(request), LIMITE_COTACAO_CHECKOUT);
  } catch (erro) {
    console.error('Rate limit de cotação indisponível.', erro);
    return Response.json(
      { erro: 'SERVICO_INDISPONIVEL', mensagem: 'Não foi possível cotar o carrinho agora.' },
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
      { erro: 'ENTRADA_INVALIDA', mensagem: 'Informe os itens e o CEP em JSON válido.' },
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
    cotacao = await calcularCotacaoCheckout(entrada.data);
  } catch (erro) {
    console.error('Falha ao consultar dados para cotação.', erro);
    return Response.json(
      { erro: 'COTACAO_INDISPONIVEL', mensagem: 'Não foi possível cotar o carrinho agora.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  if (cotacao.kind === 'failure') {
    return Response.json(
      { erro: cotacao.error.codigo, mensagem: cotacao.error.mensagem },
      { status: cotacao.error.status }
    );
  }

  return Response.json(cotacao.value, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
