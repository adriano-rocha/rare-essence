import { isIP } from 'node:net';

export function obterIdentificadorCliente(request: Request): string {
  const ipReal = request.headers.get('x-real-ip')?.trim();
  if (ipReal && isIP(ipReal)) return ipReal;

  const encaminhados = request.headers
    .get('x-forwarded-for')
    ?.split(',')
    .map((ip) => ip.trim())
    .filter((ip) => isIP(ip));
  const ipDoProxyConfiavel = encaminhados?.at(-1);
  return ipDoProxyConfiavel ?? 'ip-indisponivel';
}
