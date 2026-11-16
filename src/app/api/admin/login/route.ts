import { z } from 'zod';
import { AutenticarAdmin } from '@/modules/admin/application/use-cases/autenticar-admin';
import { criarSessaoAdmin, COOKIE_SESSAO_ADMIN, MAX_AGE_SESSAO_ADMIN, segredoDeSessaoValido } from '@/modules/admin/infra/sessao-admin';
import { hashSenhaAdminValido, VerificadorSenhaScrypt } from '@/modules/admin/infra/senha-scrypt';
import { LIMITE_LOGIN_ADMIN } from '@/shared/infra/rate-limit-policies';
import { obterIdentificadorCliente } from '@/shared/infra/client-identifier';
import { prisma } from '@/shared/infra/prisma';
import { PrismaRateLimiter } from '@/shared/infra/prisma-rate-limiter';

const entradaSchema = z.object({
  email: z.string().trim().email().max(254),
  senha: z.string().min(1).max(1024),
});

export async function POST(request: Request): Promise<Response> {
  const emailAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? '';
  const hashSenha = process.env.ADMIN_PASSWORD_HASH ?? '';
  const segredoSessao = process.env.ADMIN_SESSION_SECRET ?? '';
  if (
    !z.string().email().max(254).safeParse(emailAdmin).success ||
    !hashSenhaAdminValido(hashSenha) ||
    !segredoDeSessaoValido(segredoSessao)
  ) {
    return Response.json(
      { erro: 'CONFIGURACAO_INVALIDA', mensagem: 'A autenticação administrativa não está configurada.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  let limite;
  try {
    limite = await new PrismaRateLimiter(prisma, segredoSessao).consumir(
      obterIdentificadorCliente(request),
      LIMITE_LOGIN_ADMIN
    );
  } catch (erro) {
    console.error('Rate limit de login indisponível.', erro);
    return Response.json(
      { erro: 'SERVICO_INDISPONIVEL', mensagem: 'Não foi possível validar o acesso agora.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (!limite.permitido) {
    return Response.json(
      { erro: 'MUITAS_TENTATIVAS', mensagem: 'Tente novamente mais tarde.' },
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
      { erro: 'ENTRADA_INVALIDA', mensagem: 'Informe e-mail e senha válidos.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const entrada = entradaSchema.safeParse(corpo);
  if (!entrada.success) {
    return Response.json(
      { erro: 'ENTRADA_INVALIDA', mensagem: 'Informe e-mail e senha válidos.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const resultado = await new AutenticarAdmin(new VerificadorSenhaScrypt()).executar(
    entrada.data.email,
    entrada.data.senha,
    { email: emailAdmin, hashSenha }
  );
  if (resultado.kind === 'failure') {
    return Response.json(
      { erro: 'CREDENCIAIS_INVALIDAS', mensagem: resultado.error.message },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const token = await criarSessaoAdmin(resultado.value.email, segredoSessao);
  const cookie = [
    `${COOKIE_SESSAO_ADMIN}=${token}`,
    'Path=/',
    `Max-Age=${MAX_AGE_SESSAO_ADMIN}`,
    'HttpOnly',
    'SameSite=Strict',
    ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
  ].join('; ');

  return Response.json(
    { autenticado: true },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Set-Cookie': cookie,
      },
    }
  );
}
