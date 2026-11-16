import { randomBytes } from 'node:crypto';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { middleware } from '@/middleware';
import {
  criarSessaoAdmin,
  COOKIE_SESSAO_ADMIN,
} from '@/modules/admin/infra/sessao-admin';

describe('MiddlewareAdmin', () => {
  const segredo = randomBytes(32).toString('base64url');
  const envOriginal = {
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  };

  beforeEach(() => {
    process.env.ADMIN_EMAIL = 'admin@rareessence.com.br';
    process.env.ADMIN_SESSION_SECRET = segredo;
  });

  afterEach(() => {
    for (const [chave, valor] of Object.entries(envOriginal)) {
      if (valor === undefined) {
        delete process.env[chave];
      } else {
        process.env[chave] = valor;
      }
    }
  });

  it('redireciona páginas privadas sem sessão e responde 401 para APIs administrativas', async () => {
    const pagina = await middleware(new NextRequest('http://localhost/admin'));
    expect(pagina.status).toBe(307);
    expect(pagina.headers.get('location')).toBe('http://localhost/admin/login');

    const api = await middleware(
      new NextRequest('http://localhost/api/admin/pedidos')
    );
    expect(api.status).toBe(401);
    expect(api.headers.get('cache-control')).toBe('no-store');
  });

  it('libera login público e páginas administrativas com sessão assinada', async () => {
    const login = await middleware(
      new NextRequest('http://localhost/admin/login')
    );
    expect(login.headers.get('x-middleware-next')).toBe('1');

    const token = await criarSessaoAdmin(
      'admin@rareessence.com.br',
      segredo
    );
    const autenticado = await middleware(
      new NextRequest('http://localhost/admin', {
        headers: {
          cookie: `${COOKIE_SESSAO_ADMIN}=${token}`,
        },
      })
    );
    expect(autenticado.headers.get('x-middleware-next')).toBe('1');
    expect(autenticado.headers.get('cache-control')).toBe('private, no-store');
  });
});
