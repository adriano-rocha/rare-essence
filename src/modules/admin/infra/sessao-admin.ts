const DURACAO_SESSAO_SEGUNDOS = 8 * 60 * 60;
const encoder = new TextEncoder();

export const COOKIE_SESSAO_ADMIN = 'rare_essence_admin_session';
export const MAX_AGE_SESSAO_ADMIN = DURACAO_SESSAO_SEGUNDOS;

interface ConteudoSessao {
  email: string;
  expiraEm: number;
}

function codificarBase64Url(bytes: Uint8Array): string {
  let binario = '';
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function decodificarBase64Url(valor: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(valor)) return null;

  try {
    const base64 = valor.replace(/-/g, '+').replace(/_/g, '/');
    const binario = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
    return Uint8Array.from(binario, (caractere) => caractere.charCodeAt(0));
  } catch {
    return null;
  }
}

async function importarChave(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export function segredoDeSessaoValido(secret: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(secret);
}

export async function criarSessaoAdmin(
  email: string,
  secret: string,
  agora = Date.now()
): Promise<string> {
  if (!segredoDeSessaoValido(secret)) {
    throw new Error('ADMIN_SESSION_SECRET deve ser uma chave base64url aleatória de 32 bytes.');
  }

  const conteudo: ConteudoSessao = {
    email,
    expiraEm: Math.floor(agora / 1000) + DURACAO_SESSAO_SEGUNDOS,
  };
  const payload = codificarBase64Url(encoder.encode(JSON.stringify(conteudo)));
  const chave = await importarChave(secret);
  const assinatura = await crypto.subtle.sign(
    'HMAC',
    chave,
    encoder.encode(payload)
  );

  return `${payload}.${codificarBase64Url(new Uint8Array(assinatura))}`;
}

export async function verificarSessaoAdmin(
  token: string | undefined,
  secret: string,
  emailEsperado: string,
  agora = Date.now()
): Promise<boolean> {
  if (
    !token ||
    token.length > 2048 ||
    !segredoDeSessaoValido(secret)
  ) {
    return false;
  }

  const partes = token.split('.');
  if (partes.length !== 2) return false;

  const payloadBytes = decodificarBase64Url(partes[0]);
  const assinatura = decodificarBase64Url(partes[1]);
  if (!payloadBytes || !assinatura || assinatura.length !== 32) return false;

  let conteudo: ConteudoSessao;
  try {
    const parseado: unknown = JSON.parse(new TextDecoder().decode(payloadBytes));
    if (!parseado || typeof parseado !== 'object') return false;
    conteudo = parseado as ConteudoSessao;
  } catch {
    return false;
  }

  if (
    typeof conteudo.email !== 'string' ||
    typeof conteudo.expiraEm !== 'number' ||
    !Number.isSafeInteger(conteudo.expiraEm) ||
    conteudo.expiraEm <= Math.floor(agora / 1000) ||
    conteudo.email.toLowerCase() !== emailEsperado.toLowerCase()
  ) {
    return false;
  }

  const chave = await importarChave(secret);
  return crypto.subtle.verify('HMAC', chave, assinatura, encoder.encode(partes[0]));
}
