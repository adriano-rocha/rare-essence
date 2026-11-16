import { COOKIE_SESSAO_ADMIN } from '@/modules/admin/infra/sessao-admin';

export async function POST(): Promise<Response> {
  const cookie = [
    `${COOKIE_SESSAO_ADMIN}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Strict',
    ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
  ].join('; ');

  return Response.json(
    { autenticado: false },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Set-Cookie': cookie,
      },
    }
  );
}
