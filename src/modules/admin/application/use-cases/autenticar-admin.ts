import { Result } from '@/shared/core/result';
import { CredenciaisAdminInvalidasError } from '../../domain/errors';

export interface ConfiguracaoAdmin {
  readonly email: string;
  readonly hashSenha: string;
}

export interface VerificadorSenha {
  verificar(senha: string, hash: string): Promise<boolean>;
}

export interface IdentidadeAdmin {
  readonly email: string;
}

export class AutenticarAdmin {
  constructor(private readonly verificador: VerificadorSenha) {}

  async executar(
    email: string,
    senha: string,
    configuracao: ConfiguracaoAdmin
  ): Promise<Result<IdentidadeAdmin, CredenciaisAdminInvalidasError>> {
    const senhaValida = await this.verificador.verificar(
      senha,
      configuracao.hashSenha
    );
    if (
      !senhaValida ||
      email.trim().toLowerCase() !== configuracao.email.toLowerCase()
    ) {
      return Result.fail(new CredenciaisAdminInvalidasError());
    }

    return Result.ok({ email: configuracao.email });
  }
}
