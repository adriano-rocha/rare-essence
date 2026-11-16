import { createHmac, timingSafeEqual } from 'node:crypto';

export function validarAssinaturaWebhookMercadoPago(
  segredo: string,
  assinatura: string | null,
  identificadorRequisicao: string | null,
  idPagamento: string
): boolean {
  if (!segredo || !assinatura || !identificadorRequisicao || !idPagamento) {
    return false;
  }

  const campos = new Map(
    assinatura.split(',').map((parte) => {
      const [chave, ...valor] = parte.trim().split('=');
      return [chave, valor.join('=')];
    })
  );
  const timestamp = campos.get('ts');
  const assinaturaRecebida = campos.get('v1');
  if (!timestamp || !assinaturaRecebida || !/^[a-f0-9]{64}$/i.test(assinaturaRecebida)) {
    return false;
  }

  const manifesto = `id:${idPagamento};request-id:${identificadorRequisicao};ts:${timestamp};`;
  const assinaturaEsperada = createHmac('sha256', segredo)
    .update(manifesto)
    .digest();
  const assinaturaBuffer = Buffer.from(assinaturaRecebida, 'hex');

  return (
    assinaturaEsperada.length === assinaturaBuffer.length &&
    timingSafeEqual(assinaturaEsperada, assinaturaBuffer)
  );
}
