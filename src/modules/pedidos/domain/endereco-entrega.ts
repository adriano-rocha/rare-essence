import { Result } from '@/shared/core/result';
import { EnderecoEntregaInvalidoError } from './errors';

export interface EnderecoEntregaProps {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export class EnderecoEntrega {
  private constructor(
    readonly cep: string,
    readonly logradouro: string,
    readonly numero: string,
    readonly complemento: string | null,
    readonly bairro: string,
    readonly cidade: string,
    readonly estado: string
  ) {
    Object.freeze(this);
  }

  static criar(
    props: EnderecoEntregaProps
  ): Result<EnderecoEntrega, EnderecoEntregaInvalidoError> {
    const cep = props.cep.replace(/\D/g, '');
    const logradouro = props.logradouro.trim();
    const numero = props.numero.trim();
    const bairro = props.bairro.trim();
    const cidade = props.cidade.trim();
    const estado = props.estado.trim().toUpperCase();
    const complemento = props.complemento?.trim() || null;

    if (
      cep.length !== 8 ||
      !logradouro ||
      !numero ||
      !bairro ||
      !cidade ||
      !/^[A-Z]{2}$/.test(estado)
    ) {
      return Result.fail(new EnderecoEntregaInvalidoError());
    }

    return Result.ok(
      new EnderecoEntrega(
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado
      )
    );
  }
}
