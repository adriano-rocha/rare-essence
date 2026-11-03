import { Slug } from './slug';

export interface CategoriaProps {
  id: string;
  nome: string;
  slug: Slug;
}

export class Categoria {
  constructor(readonly props: CategoriaProps) {
    Object.freeze(this);
  }

  get id(): string { return this.props.id; }
  get nome(): string { return this.props.nome; }
  get slug(): Slug { return this.props.slug; }
}