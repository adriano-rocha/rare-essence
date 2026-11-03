/**
 * Classe base para todos os erros de domínio da aplicação.
 * Erros de negócio herdam desta classe para manter contratos previsíveis.
 */
export abstract class DomainError {
  public readonly mensagem: string;
  public readonly codigo: string;

  protected constructor(mensagem: string, codigo: string) {
    this.mensagem = mensagem;
    this.codigo = codigo;
  }
}