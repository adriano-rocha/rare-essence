export class CredenciaisAdminInvalidasError extends Error {
  constructor() {
    super('E-mail ou senha inválidos.');
    this.name = 'CredenciaisAdminInvalidasError';
  }
}
