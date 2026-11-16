import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { VerificadorSenha } from '../application/use-cases/autenticar-admin';

const TAMANHO_SALT = 16;
const TAMANHO_HASH = 64;
const PARAMETROS_SCRYPT = {
  N: 32_768,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
};

interface HashSenha {
  salt: Buffer;
  valor: Buffer;
}

function decodificarHash(hash: string): HashSenha | null {
  const partes = hash.split(':');
  if (
    partes.length !== 3 ||
    partes[0] !== 'scrypt' ||
    !/^[0-9a-f]{32}$/i.test(partes[1]) ||
    !/^[0-9a-f]{128}$/i.test(partes[2])
  ) {
    return null;
  }

  return {
    salt: Buffer.from(partes[1], 'hex'),
    valor: Buffer.from(partes[2], 'hex'),
  };
}

function derivarChave(senha: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(senha, salt, TAMANHO_HASH, PARAMETROS_SCRYPT, (erro, chave) => {
      if (erro) {
        reject(erro);
        return;
      }

      resolve(chave);
    });
  });
}

export async function criarHashSenhaAdmin(
  senha: string,
  salt = randomBytes(TAMANHO_SALT)
): Promise<string> {
  if (senha.length < 12 || salt.length !== TAMANHO_SALT) {
    throw new Error('A senha deve ter ao menos 12 caracteres e o salt deve ser válido.');
  }

  const chave = await derivarChave(senha, salt);
  return `scrypt:${salt.toString('hex')}:${chave.toString('hex')}`;
}

export function hashSenhaAdminValido(hash: string): boolean {
  return decodificarHash(hash) !== null;
}

export class VerificadorSenhaScrypt implements VerificadorSenha {
  async verificar(senha: string, hash: string): Promise<boolean> {
    const decodificado = decodificarHash(hash);
    if (!decodificado) return false;

    const derivado = await derivarChave(senha, decodificado.salt);
    return timingSafeEqual(derivado, decodificado.valor);
  }
}
