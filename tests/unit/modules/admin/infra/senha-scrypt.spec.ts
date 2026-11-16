import { describe, expect, it } from 'vitest';
import {
  criarHashSenhaAdmin,
  hashSenhaAdminValido,
  VerificadorSenhaScrypt,
} from '@/modules/admin/infra/senha-scrypt';

describe('SenhaScrypt', () => {
  it('gera hash scrypt validável sem armazenar a senha em texto claro', async () => {
    const senha = 'uma-senha-forte-com-mais-de-12';
    const hash = await criarHashSenhaAdmin(
      senha,
      Buffer.from('00112233445566778899aabbccddeeff', 'hex')
    );
    const verificador = new VerificadorSenhaScrypt();

    expect(hashSenhaAdminValido(hash)).toBe(true);
    expect(hash).not.toContain(senha);
    await expect(verificador.verificar(senha, hash)).resolves.toBe(true);
    await expect(verificador.verificar('outra-senha-forte', hash)).resolves.toBe(
      false
    );
  });

  it('rejeita formatos de hash inválidos e senhas fracas ao gerar o hash', async () => {
    const verificador = new VerificadorSenhaScrypt();

    expect(hashSenhaAdminValido('bcrypt:hash')).toBe(false);
    await expect(verificador.verificar('senha', 'hash-inválido')).resolves.toBe(
      false
    );
    await expect(criarHashSenhaAdmin('curta')).rejects.toThrow(
      'A senha deve ter ao menos 12 caracteres'
    );
  });
});
