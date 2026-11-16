import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { prisma } from '@/shared/infra/prisma';
import { PrismaRateLimiter } from '@/shared/infra/prisma-rate-limiter';
import { RateLimitPolicy } from '@/shared/core/ports/rate-limiter';

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('Contract Test: PrismaRateLimiter', () => {
  const identificador = randomUUID();
  const politica: RateLimitPolicy = {
    id: `teste-${randomUUID()}`,
    limite: 3,
    janelaMs: 60_000,
  };
  const segredo = randomBytes(32).toString('base64url');
  let agora = new Date();
  const rateLimiter = new PrismaRateLimiter(prisma, segredo, () => agora);
  const chave = createHmac('sha256', segredo)
    .update(`${politica.id}:${identificador}`)
    .digest('hex');

  afterEach(async () => {
    await prisma.rateLimitBucket.deleteMany({ where: { chave } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('aplica o limite atomicamente em requisições concorrentes e libera após a janela', async () => {
    const resultados = await Promise.all(
      Array.from({ length: 10 }, () =>
        rateLimiter.consumir(identificador, politica)
      )
    );

    expect(resultados.filter((resultado) => resultado.permitido)).toHaveLength(3);
    expect(resultados.filter((resultado) => !resultado.permitido)).toHaveLength(7);
    expect(resultados.find((resultado) => !resultado.permitido)?.tentarNovamenteEmSegundos).toBeGreaterThan(0);

    agora = new Date(agora.getTime() + politica.janelaMs + 1);
    const liberado = await rateLimiter.consumir(identificador, politica);
    expect(liberado.permitido).toBe(true);
    expect(liberado.tentativasRestantes).toBe(2);
  });
});
