import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  criarSessaoAdmin,
  MAX_AGE_SESSAO_ADMIN,
  segredoDeSessaoValido,
  verificarSessaoAdmin,
} from '@/modules/admin/infra/sessao-admin';

describe('SessaoAdmin', () => {
  it('valida assinatura, identidade e expiração da sessão', async () => {
    const segredo = randomBytes(32).toString('base64url');
    const agora = Date.now();
    const token = await criarSessaoAdmin(
      'admin@rareessence.com.br',
      segredo,
      agora
    );

    await expect(
      verificarSessaoAdmin(token, segredo, 'admin@rareessence.com.br', agora)
    ).resolves.toBe(true);
    await expect(
      verificarSessaoAdmin(token, segredo, 'outro@example.com', agora)
    ).resolves.toBe(false);
    await expect(
      verificarSessaoAdmin(
        token,
        segredo,
        'admin@rareessence.com.br',
        agora + (MAX_AGE_SESSAO_ADMIN + 1) * 1000
      )
    ).resolves.toBe(false);
    await expect(
      verificarSessaoAdmin(`${token.slice(0, -1)}x`, segredo, 'admin@rareessence.com.br', agora)
    ).resolves.toBe(false);
  });

  it('aceita somente segredo aleatório de 32 bytes em base64url', () => {
    expect(segredoDeSessaoValido(randomBytes(32).toString('base64url'))).toBe(
      true
    );
    expect(segredoDeSessaoValido('rare-essence-secret-super-seguro-min-32-chars')).toBe(
      false
    );
  });
});
