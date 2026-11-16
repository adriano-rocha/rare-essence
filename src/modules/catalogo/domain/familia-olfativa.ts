import { Result } from '@/shared/core/result';
import { FamiliaOlfativaInvalidaError } from '../errors';

export const FAMILIAS_OLFATIVAS = [
  'CITRICO',
  'AMADEIRADO',
  'ESPECIADO',
  'ORIENTAL',
] as const;

export type CodigoFamiliaOlfativa = (typeof FAMILIAS_OLFATIVAS)[number];

export const FAMILIA_OLFATIVA_LABELS: Record<CodigoFamiliaOlfativa, string> = {
  CITRICO: 'Cítrico',
  AMADEIRADO: 'Amadeirado',
  ESPECIADO: 'Especiado',
  ORIENTAL: 'Oriental',
};

export class FamiliaOlfativa {
  private constructor(readonly codigo: CodigoFamiliaOlfativa) {
    Object.freeze(this);
  }

  get nome(): string {
    return FAMILIA_OLFATIVA_LABELS[this.codigo];
  }

  static criar(codigo: string): Result<FamiliaOlfativa, FamiliaOlfativaInvalidaError> {
    if (!FAMILIAS_OLFATIVAS.includes(codigo as CodigoFamiliaOlfativa)) {
      return Result.fail(new FamiliaOlfativaInvalidaError());
    }

    return Result.ok(new FamiliaOlfativa(codigo as CodigoFamiliaOlfativa));
  }
}
