import { Result } from '@/shared/core/result';
import { Money } from '@/shared/core/money';
import { Sku } from './sku';
import { Volume } from './volume';
import { PrecoInvalidoError } from './errors';

export interface VariacaoProps {
  id: string;
  produtoId: string;
  sku: Sku;
  volume: Volume;
  preco: Money;
  pesoGramas: number;
  ativo: boolean;
}

export class Variacao {
  private constructor(private props: VariacaoProps) {
    Object.freeze(this);
  }

  static criar(props: VariacaoProps): Result<Variacao, PrecoInvalidoError> {
    if (props.preco.centavos <= 0) {
      return Result.fail(new PrecoInvalidoError());
    }

    return Result.ok(new Variacao(props));
  }

  get id(): string { return this.props.id; }
  get produtoId(): string { return this.props.produtoId; }
  get sku(): Sku { return this.props.sku; }
  get volume(): Volume { return this.props.volume; }
  get preco(): Money { return this.props.preco; }
  get pesoGramas(): number { return this.props.pesoGramas; }
  get ativo(): boolean { return this.props.ativo; }
}