import { describe, expect, it } from 'vitest';
import {
  FAMILIAS_OLFATIVAS,
  FamiliaOlfativa,
} from '@/modules/catalogo/domain/familia-olfativa';

describe('FamiliaOlfativa', () => {
  it.each(FAMILIAS_OLFATIVAS)('aceita a família %s', (codigo) => {
    const resultado = FamiliaOlfativa.criar(codigo);

    expect(resultado.kind).toBe('success');
    if (resultado.kind === 'success') {
      expect(resultado.value.codigo).toBe(codigo);
      expect(Object.isFrozen(resultado.value)).toBe(true);
    }
  });

  it('rejeita códigos que não pertencem ao catálogo', () => {
    const resultado = FamiliaOlfativa.criar('FLORAL');

    expect(resultado.kind).toBe('failure');
    if (resultado.kind === 'failure') {
      expect(resultado.error.codigo).toBe('FAMILIA_OLFATIVA_INVALIDA');
    }
  });
});
