import { NextRequest, NextResponse } from 'next/server';
import {
  COOKIE_SESSAO_ADMIN,
  segredoDeSessaoValido,
  verificarSessaoAdmin,
} from '@/modules/admin/infra/sessao-admin';

const ROTAS_PUBLICAS_ADMIN = new Set([
  '/admin/login',
  '/api/admin/login',
  '/api/admin/logout',
]);

function proximaRespostaPrivada(): NextResponse {
  return NextResponse.next({
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  if (ROTAS_PUBLICAS_ADMIN.has(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const email = process.env.ADMIN_EMAIL?.trim() ?? '';
  const segredo = process.env.ADMIN_SESSION_SECRET ?? '';
  if (!email || !segredoDeSessaoValido(segredo)) {
    return NextResponse.json(
      { erro: 'CONFIGURACAO_INVALIDA', mensagem: 'A autenticação administrativa não está configurada.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const token = request.cookies.get(COOKIE_SESSAO_ADMIN)?.value;
  if (await verificarSessaoAdmin(token, segredo, email)) {
    return proximaRespostaPrivada();
  }

  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json(
      { erro: 'NAO_AUTENTICADO', mensagem: 'Autenticação administrativa necessária.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const resposta = NextResponse.redirect(new URL('/admin/login', request.url));
  resposta.cookies.set(COOKIE_SESSAO_ADMIN, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return resposta;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
