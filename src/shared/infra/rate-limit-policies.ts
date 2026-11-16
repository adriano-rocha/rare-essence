import { RateLimitPolicy } from '../core/ports/rate-limiter';

export const LIMITE_LOGIN_ADMIN: RateLimitPolicy = Object.freeze({
  id: 'admin-login',
  limite: 5,
  janelaMs: 15 * 60 * 1000,
});

export const LIMITE_CRIACAO_PAGAMENTO: RateLimitPolicy = Object.freeze({
  id: 'payment-create',
  limite: 10,
  janelaMs: 60 * 1000,
});

export const LIMITE_CRIACAO_CHECKOUT: RateLimitPolicy = Object.freeze({
  id: 'checkout-create',
  limite: 5,
  janelaMs: 60 * 1000,
});

export const LIMITE_COTACAO_CHECKOUT: RateLimitPolicy = Object.freeze({
  id: 'checkout-quote',
  limite: 30,
  janelaMs: 60 * 1000,
});
