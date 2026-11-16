import { Result } from '@/shared/core/result';
import { ClientePedidoInvalidoError } from './errors';

export interface ClientePedidoProps {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
}

export class ClientePedido {
  private constructor(
    readonly nome: string,
    readonly email: string,
    readonly cpf: string,
    readonly telefone: string
  ) {
    Object.freeze(this);
  }

  static criar(props: ClientePedidoProps): Result<ClientePedido, ClientePedidoInvalidoError> {
    const nome = props.nome.trim();
    const email = props.email.trim().toLowerCase();
    const cpf = props.cpf.replace(/\D/g, '');
    const telefone = props.telefone.replace(/\D/g, '');

    if (
      nome.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      cpf.length !== 11 ||
      telefone.length < 10 ||
      telefone.length > 13
    ) {
      return Result.fail(new ClientePedidoInvalidoError());
    }

    return Result.ok(new ClientePedido(nome, email, cpf, telefone));
  }
}
