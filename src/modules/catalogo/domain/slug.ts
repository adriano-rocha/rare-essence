import { Result } from '@/shared/core/result';
import { SlugInvalidoError } from './errors';

export class Slug {
  private constructor(readonly valor: string) {
    Object.freeze(this);
  }

  static criar(valor: string): Result<Slug, SlugInvalidoError> {
    if (!valor || typeof valor !== 'string') {
      return Result.fail(new SlugInvalidoError());
    }

    const trimmed = valor.trim();
    const kebabCaseRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    if (!kebabCaseRegex.test(trimmed)) {
      return Result.fail(new SlugInvalidoError());
    }

    return Result.ok(new Slug(trimmed));
  }

  static criarAPartirDoNome(nome: string): Result<Slug, SlugInvalidoError> {
    if (!nome || typeof nome !== 'string') {
      return Result.fail(new SlugInvalidoError());
    }

    const normalizado = nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    return Slug.criar(normalizado);
  }
}