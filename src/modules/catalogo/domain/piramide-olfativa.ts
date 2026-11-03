import { Result } from '@/shared/core/result';
import { PiramideInvalidaError } from './errors';

export interface PiramideOlfativaProps {
  topo: string[];
  coracao: string[];
  base: string[];
}

export class PiramideOlfativa {
  readonly topo: readonly string[];
  readonly coracao: readonly string[];
  readonly base: readonly string[];

  private constructor(props: PiramideOlfativaProps) {
    this.topo = Object.freeze([...props.topo]);
    this.coracao = Object.freeze([...props.coracao]);
    this.base = Object.freeze([...props.base]);
    Object.freeze(this);
  }

  static criar(props: PiramideOlfativaProps): Result<PiramideOlfativa, PiramideInvalidaError> {
    if (
      !props ||
      !Array.isArray(props.topo) || props.topo.length === 0 ||
      !Array.isArray(props.coracao) || props.coracao.length === 0 ||
      !Array.isArray(props.base) || props.base.length === 0
    ) {
      return Result.fail(new PiramideInvalidaError());
    }

    return Result.ok(new PiramideOlfativa(props));
  }
}