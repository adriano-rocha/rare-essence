import { Slug } from './slug';

export interface MarcaProps {
  id: string;
  nome: string;
  slug: Slug;
}

export class Marca {
  constructor(readonly props: MarcaProps) {
    Object.freeze(this);
  }

  get id(): string { return this.props.id; }
  get nome(): string { return this.props.nome; }
  get slug(): Slug { return this.props.slug; }
}