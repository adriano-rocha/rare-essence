import { Result } from '@/shared/core/result';
import { VolumeInvalidoError } from './errors';

export class Volume {
  private constructor(readonly valor: number, readonly unidade: string = 'ml') {
    Object.freeze(this);
  }

  static criar(valor: number, unidade = 'ml'): Result<Volume, VolumeInvalidoError> {
    if (!Number.isInteger(valor) || valor <= 0) {
      return Result.fail(new VolumeInvalidoError());
    }

    return Result.ok(new Volume(valor, unidade));
  }

  get formatado(): string {
    return `${this.valor}${this.unidade}`;
  }
}