import { createHmac } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import {
  RateLimitDecision,
  RateLimiter,
  RateLimitPolicy,
} from '../core/ports/rate-limiter';

interface RateLimitRow {
  requisicoes: number;
  expiraEm: Date;
}

export class PrismaRateLimiter implements RateLimiter {
  private static ultimaLimpeza = 0;
  private static limpezaEmAndamento: Promise<void> | undefined;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly segredoIdentificador: string,
    private readonly agora: () => Date = () => new Date()
  ) {}

  async consumir(
    identificador: string,
    politica: RateLimitPolicy
  ): Promise<RateLimitDecision> {
    this.validarPolitica(politica);
    if (this.segredoIdentificador.length < 32) {
      throw new Error('Chave de rate limit ausente ou inválida.');
    }

    const agora = this.agora();
    await this.limparExpirados(agora);

    const chave = createHmac('sha256', this.segredoIdentificador)
      .update(`${politica.id}:${identificador}`)
      .digest('hex');
    const inicioJanelaAnterior = new Date(agora.getTime() - politica.janelaMs);
    const expiraEm = new Date(agora.getTime() + politica.janelaMs);
    const [linha] = await this.prisma.$queryRaw<RateLimitRow[]>`
      INSERT INTO "rate_limit_buckets" ("chave", "inicio_janela", "requisicoes", "expira_em")
      VALUES (${chave}, ${agora}, 1, ${expiraEm})
      ON CONFLICT ("chave") DO UPDATE SET
        "requisicoes" = CASE
          WHEN "rate_limit_buckets"."inicio_janela" <= ${inicioJanelaAnterior} THEN 1
          ELSE LEAST("rate_limit_buckets"."requisicoes" + 1, ${politica.limite + 1})
        END,
        "inicio_janela" = CASE
          WHEN "rate_limit_buckets"."inicio_janela" <= ${inicioJanelaAnterior} THEN ${agora}
          ELSE "rate_limit_buckets"."inicio_janela"
        END,
        "expira_em" = CASE
          WHEN "rate_limit_buckets"."inicio_janela" <= ${inicioJanelaAnterior} THEN ${expiraEm}
          ELSE "rate_limit_buckets"."expira_em"
        END
      RETURNING "requisicoes", "expira_em" AS "expiraEm"
    `;

    const restanteMs = Math.max(0, linha.expiraEm.getTime() - agora.getTime());
    const permitido = linha.requisicoes <= politica.limite;

    return {
      permitido,
      tentativasRestantes: Math.max(0, politica.limite - linha.requisicoes),
      tentarNovamenteEmSegundos: permitido
        ? 0
        : Math.max(1, Math.ceil(restanteMs / 1000)),
    };
  }

  private validarPolitica(politica: RateLimitPolicy): void {
    if (
      !politica.id.trim() ||
      !Number.isSafeInteger(politica.limite) ||
      politica.limite <= 0 ||
      !Number.isSafeInteger(politica.janelaMs) ||
      politica.janelaMs <= 0
    ) {
      throw new Error('Política de rate limit inválida.');
    }
  }

  private async limparExpirados(agora: Date): Promise<void> {
    if (agora.getTime() - PrismaRateLimiter.ultimaLimpeza < 60_000) return;

    if (!PrismaRateLimiter.limpezaEmAndamento) {
      const limpeza = this.prisma.rateLimitBucket
        .deleteMany({ where: { expiraEm: { lte: agora } } })
        .then(() => {
          PrismaRateLimiter.ultimaLimpeza = agora.getTime();
        });
      PrismaRateLimiter.limpezaEmAndamento = limpeza;
    }

    const limpeza = PrismaRateLimiter.limpezaEmAndamento;
    try {
      await limpeza;
    } finally {
      if (PrismaRateLimiter.limpezaEmAndamento === limpeza) {
        PrismaRateLimiter.limpezaEmAndamento = undefined;
      }
    }
  }
}
