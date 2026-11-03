import { Result } from '@/shared/core/result';
import { SkuInvalidoError } from './errors';

export class Sku {
  private constructor(readonly valor: string) {
    Object.freeze(this);
  }

  static criar(valor: string): Result<Sku, SkuInvalidoError> {
    if (!valor || typeof valor !== 'string') {
      return Result.fail(new SkuInvalidoError());
    }

    const formatado = valor.trim().toUpperCase();
    const skuRegex = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;

    if (!skuRegex.test(formatado)) {
      return Result.fail(new SkuInvalidoError());
    }

    return Result.ok(new Sku(formatado));
  }
}