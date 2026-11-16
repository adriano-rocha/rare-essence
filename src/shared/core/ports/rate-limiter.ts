export interface RateLimitPolicy {
  readonly id: string;
  readonly limite: number;
  readonly janelaMs: number;
}

export interface RateLimitDecision {
  readonly permitido: boolean;
  readonly tentativasRestantes: number;
  readonly tentarNovamenteEmSegundos: number;
}

export interface RateLimiter {
  consumir(
    identificador: string,
    politica: RateLimitPolicy
  ): Promise<RateLimitDecision>;
}
