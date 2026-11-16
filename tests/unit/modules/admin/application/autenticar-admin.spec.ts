import { describe, expect, it, vi } from 'vitest';
import { AutenticarAdmin } from '@/modules/admin/application/use-cases/autenticar-admin';

describe('AutenticarAdmin', () => {
  it('autentica o único administrador sem diferenciar erro de e-mail ou senha', async () => {
    const verificador = { verificar: vi.fn().mockResolvedValue(true) };
    const useCase = new AutenticarAdmin(verificador);

    const resultado = await useCase.executar(
      ' ADMIN@RAREESSENCE.COM.BR ',
      'senha-correta',
      {
        email: 'admin@rareessence.com.br',
        hashSenha: 'hash-configurado',
      }
    );

    expect(resultado.kind).toBe('success');
    expect(resultado.value).toEqual({ email: 'admin@rareessence.com.br' });
    expect(verificador.verificar).toHaveBeenCalledWith(
      'senha-correta',
      'hash-configurado'
    );
  });

  it('retorna a mesma falha para e-mail e senha incorretos', async () => {
    const useCase = new AutenticarAdmin({
      verificar: vi.fn().mockResolvedValue(true),
    });

    const resultado = await useCase.executar(
      'outra-pessoa@example.com',
      'senha-incorreta',
      {
        email: 'admin@rareessence.com.br',
        hashSenha: 'hash-configurado',
      }
    );

    expect(resultado.kind).toBe('failure');
    if (resultado.kind === 'failure') {
      expect(resultado.error.message).toBe('E-mail ou senha inválidos.');
    }
  });
});
