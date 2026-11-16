import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { validarAssinaturaWebhookMercadoPago } from '@/modules/pagamentos/infra/assinatura-webhook';

function assinaturaValida(
  segredo: string,
  pagamentoId: string,
  requestId: string,
  timestamp: string
): string {
  const manifesto = `id:${pagamentoId};request-id:${requestId};ts:${timestamp};`;
  const assinatura = createHmac('sha256', segredo).update(manifesto).digest('hex');
  return `ts=${timestamp},v1=${assinatura}`;
}

describe('validarAssinaturaWebhookMercadoPago', () => {
  it('valida a assinatura HMAC do manifesto e da requisição', () => {
    const assinatura = assinaturaValida('segredo-teste', '12345', 'req-1', '1700000000');

    expect(
      validarAssinaturaWebhookMercadoPago(
        'segredo-teste',
        assinatura,
        'req-1',
        '12345'
      )
    ).toBe(true);
  });

  it('rejeita segredo, payment id ou request id alterados', () => {
    const assinatura = assinaturaValida('segredo-teste', '12345', 'req-1', '1700000000');

    expect(
      validarAssinaturaWebhookMercadoPago('segredo-incorreto', assinatura, 'req-1', '12345')
    ).toBe(false);
    expect(
      validarAssinaturaWebhookMercadoPago('segredo-teste', assinatura, 'req-2', '12345')
    ).toBe(false);
    expect(
      validarAssinaturaWebhookMercadoPago('segredo-teste', assinatura, 'req-1', '54321')
    ).toBe(false);
  });

  it('rejeita cabeçalhos ausentes ou malformados', () => {
    expect(validarAssinaturaWebhookMercadoPago('secret', null, 'req-1', '123')).toBe(false);
    expect(
      validarAssinaturaWebhookMercadoPago('secret', 'ts=1,v1=not-hex', 'req-1', '123')
    ).toBe(false);
  });
});
