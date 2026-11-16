import { createHmac, randomBytes } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { POST as login } from '@/app/api/admin/login/route';
import { criarHashSenhaAdmin } from '@/modules/admin/infra/senha-scrypt';
import {
  COOKIE_SESSAO_ADMIN,
  verificarSessaoAdmin,
} from '@/modules/admin/infra/sessao-admin';
import { prisma } from '@/shared/infra/prisma';

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('Contract Test: login administrativo', () => {
  const email = 'admin-contract@rareessence.com.br';
  const senha = 'senha-de-contrato-com-mais-de-12';
  const segredo = randomBytes(32).toString('base64url');
  const ip = '198.51.100.42';
  const idPolitica = 'admin-login';
  const chaveRateLimit = createHmac('sha256', segredo)
    .update(`${idPolitica}:${ip}`)
    .digest('hex');
  const envOriginal = {
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  };

  beforeAll(async () => {
    process.env.ADMIN_EMAIL = email;
    process.env.ADMIN_PASSWORD_HASH = await criarHashSenhaAdmin(senha);
    process.env.ADMIN_SESSION_SECRET = segredo;
  });

  afterAll(async () => {
    await prisma.rateLimitBucket.deleteMany({
      where: { chave: chaveRateLimit },
    });
    for (const [chave, valor] of Object.entries(envOriginal)) {
      if (valor === undefined) {
        delete process.env[chave];
      } else {
        process.env[chave] = valor;
      }
    }
    await prisma.$disconnect();
  });

  it('cria cookie assinado em credenciais válidas e rejeita senha incorreta', async () => {
    const sucesso = await login(
      new Request('http://localhost/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-real-ip': ip,
        },
        body: JSON.stringify({ email, senha }),
      })
    );

    expect(sucesso.status).toBe(200);
    const cookie = sucesso.headers.get('set-cookie');
    expect(cookie).toContain(`${COOKIE_SESSAO_ADMIN}=`);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    const token = cookie?.split(';')[0].split('=').slice(1).join('=');
    expect(
      await verificarSessaoAdmin(token, segredo, email)
    ).toBe(true);

    const falha = await login(
      new Request('http://localhost/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-real-ip': ip,
        },
        body: JSON.stringify({ email, senha: 'senha-incorreta' }),
      })
    );
    expect(falha.status).toBe(401);
    expect(await falha.json()).toMatchObject({
      erro: 'CREDENCIAIS_INVALIDAS',
      mensagem: 'E-mail ou senha inválidos.',
    });
  });
});
