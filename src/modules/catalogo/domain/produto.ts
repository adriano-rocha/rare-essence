import { Result } from '@/shared/core/result';
import { Slug } from './slug';
import { PiramideOlfativa } from './piramide-olfativa';
import { Variacao } from './variacao';
import { ProdutoSemVariacoesError, SkuDuplicadoError } from './errors';

export interface ProdutoProps {
  id: string;
  nome: string;
  slug: Slug;
  descricao: string;
  marcaId: string;
  categoriaId: string;
  piramideOlfativa: PiramideOlfativa;
  ativo: boolean;
  variacoes?: Variacao[];
  criadoEm?: Date;
  atualizadoEm?: Date;
}

export class Produto {
  private _ativo: boolean;
  private _variacoes: Variacao[];
  private _atualizadoEm: Date;

  private constructor(private readonly props: ProdutoProps) {
    this._ativo = props.ativo;
    this._variacoes = props.variacoes ? [...props.variacoes] : [];
    this._atualizadoEm = props.atualizadoEm || new Date();
  }

  static criar(props: ProdutoProps): Result<Produto, Error> {
    return Result.ok(new Produto(props));
  }

  get id(): string { return this.props.id; }
  get nome(): string { return this.props.nome; }
  get slug(): Slug { return this.props.slug; }
  get descricao(): string { return this.props.descricao; }
  get marcaId(): string { return this.props.marcaId; }
  get categoriaId(): string { return this.props.categoriaId; }
  get piramideOlfativa(): PiramideOlfativa { return this.props.piramideOlfativa; }
  get ativo(): boolean { return this._ativo; }
  get variacoes(): readonly Variacao[] { return Object.freeze([...this._variacoes]); }
  get criadoEm(): Date { return this.props.criadoEm || new Date(); }
  get atualizadoEm(): Date { return this._atualizadoEm; }

  ativar(): Result<void, ProdutoSemVariacoesError> {
    if (this._variacoes.length === 0) {
      return Result.fail(new ProdutoSemVariacoesError());
    }
    this._ativo = true;
    this._atualizadoEm = new Date();
    return Result.ok(undefined);
  }

  inativar(): void {
    this._ativo = false;
    this._atualizadoEm = new Date();
  }

  adicionarVariacao(variacao: Variacao): Result<void, SkuDuplicadoError> {
    const jaExiste = this._variacoes.some(
      (v) => v.sku.valor === variacao.sku.valor
    );

    if (jaExiste) {
      return Result.fail(new SkuDuplicadoError(variacao.sku.valor));
    }

    this._variacoes.push(variacao);
    this._atualizadoEm = new Date();
    return Result.ok(undefined);
  }
}