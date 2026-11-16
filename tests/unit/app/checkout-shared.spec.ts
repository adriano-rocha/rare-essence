import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    variacao: { findMany: vi.fn() },
  },
}));

vi.mock('@/shared/infra/prisma', () => ({ prisma: prismaMock }));

import {
  calcularCotacaoCheckout,
  itensCheckoutSchema,
} from '@/app/api/checkout/_shared';

describe('checkout quote preparation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects duplicate variations at the request boundary', () => {
    const resultado = itensCheckoutSchema.safeParse([
      { variacaoId: 'variation-1', quantidade: 1 },
      { variacaoId: 'variation-1', quantidade: 2 },
    ]);

    expect(resultado.success).toBe(false);
  });

  it('returns an unavailable result when stock is insufficient', async () => {
    prismaMock.variacao.findMany.mockResolvedValue([
      {
        id: 'variation-1',
        sku: 'RARE-50',
        volumeMl: 50,
        precoCentavos: 10000,
        pesoGramas: 250,
        produto: { nome: 'Noir', slug: 'noir' },
        estoque: { quantidadeFisica: 2, quantidadeReservada: 1 },
      },
    ]);

    const resultado = await calcularCotacaoCheckout({
      itens: [{ variacaoId: 'variation-1', quantidade: 2 }],
      cepDestino: '01001000',
    });

    expect(resultado.kind).toBe('failure');
    if (resultado.kind === 'failure') {
      expect(resultado.error.codigo).toBe('ESTOQUE_INSUFICIENTE');
      expect(resultado.error.status).toBe(409);
    }
  });

  it('returns authoritative prices and totals from the server quote', async () => {
    prismaMock.variacao.findMany.mockResolvedValue([
      {
        id: 'variation-1',
        sku: 'RARE-50',
        volumeMl: 50,
        precoCentavos: 10000,
        pesoGramas: 250,
        produto: { nome: 'Noir', slug: 'noir' },
        estoque: { quantidadeFisica: 5, quantidadeReservada: 1 },
      },
    ]);

    const resultado = await calcularCotacaoCheckout({
      itens: [{ variacaoId: 'variation-1', quantidade: 2 }],
      cepDestino: '01001000',
    });

    expect(resultado.kind).toBe('success');
    if (resultado.kind === 'success') {
      expect(resultado.value.subtotalProdutosCentavos).toBe(20000);
      expect(resultado.value.itens[0].estoqueDisponivel).toBe(4);
      expect(resultado.value.opcoesFrete).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            modalidade: 'PAC',
            totalPixCentavos: 21000,
            totalCartaoCentavos: 22000,
          }),
        ])
      );
    }
  });
});
