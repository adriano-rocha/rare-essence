import { DomainError } from './errors/domain-error';
import { Result } from './result';

export class MoneyError extends DomainError {
  constructor(mensagem: string, codigo: string) {
    super(mensagem, codigo);
  }
}

/**
 * Value Object imutável para operações monetárias em centavos inteiros.
 * RNF-001: Todos os cálculos financeiros são processados em centavos inteiros.
 */
export class Money {
  private constructor(
    private readonly _centavos: number,
    private readonly _moeda: string
  ) {
    Object.freeze(this);
  }

  public static fromCentavos(
    centavos: number,
    moeda = 'BRL'
  ): Result<Money, MoneyError> {
    if (!Number.isSafeInteger(centavos)) {
      return Money.falha(
        'A quantia em centavos deve ser um número inteiro seguro.',
        'QUANTIA_INVALIDA'
      );
    }

    if (centavos < 0) {
      return Money.falha(
        'A quantia em centavos não pode ser negativa.',
        'QUANTIA_NEGATIVA'
      );
    }

    if (!/^[A-Za-z]{3}$/.test(moeda)) {
      return Money.falha(
        'O código da moeda deve conter três letras.',
        'MOEDA_INVALIDA'
      );
    }

    return Result.ok(new Money(centavos, moeda.toUpperCase()));
  }

  public static fromReais(
    valor: string,
    moeda = 'BRL'
  ): Result<Money, MoneyError> {
    const correspondencia = /^(\d+)(?:,(\d{1,2}))?$/.exec(valor);
    if (!correspondencia) {
      return Money.falha(
        'O valor em reais deve usar vírgula e no máximo duas casas decimais.',
        'VALOR_EM_REAIS_INVALIDO'
      );
    }

    const reais = Number(correspondencia[1]);
    const centavos = Number((correspondencia[2] ?? '').padEnd(2, '0') || '0');
    const totalCentavos = reais * 100 + centavos;

    if (!Number.isSafeInteger(totalCentavos)) {
      return Money.falha(
        'A quantia excede o limite seguro de centavos.',
        'QUANTIA_FORA_DO_LIMITE'
      );
    }

    return this.fromCentavos(totalCentavos, moeda);
  }

  public get centavos(): number {
    return this._centavos;
  }

  public get moeda(): string {
    return this._moeda;
  }

  public somar(outro: Money): Result<Money, MoneyError> {
    const erro = this.validarMesmaMoeda(outro);
    if (erro) return Result.fail(erro);

    const total = this._centavos + outro.centavos;
    if (!Number.isSafeInteger(total)) {
      return Money.falha(
        'A soma excede o limite seguro de centavos.',
        'QUANTIA_FORA_DO_LIMITE'
      );
    }

    return Result.ok(new Money(total, this._moeda));
  }

  public subtrair(outro: Money): Result<Money, MoneyError> {
    const erro = this.validarMesmaMoeda(outro);
    if (erro) return Result.fail(erro);

    const diferenca = this._centavos - outro.centavos;
    if (diferenca < 0) {
      return Money.falha(
        'Resultado monetário não pode ser negativo.',
        'SALDO_NEGATIVO'
      );
    }

    return Result.ok(new Money(diferenca, this._moeda));
  }

  public aplicarDesconto(desconto: Money): Result<Money, MoneyError> {
    return this.subtrair(desconto);
  }

  public aplicarDescontoPercentual(
    percentual: number
  ): Result<Money, MoneyError> {
    const desconto = this.calcularDescontoPercentual(percentual);
    if (desconto.kind === 'failure') return desconto;
    return this.subtrair(desconto.value);
  }

  public calcularDescontoPercentual(
    percentual: number
  ): Result<Money, MoneyError> {
    if (!Number.isFinite(percentual) || percentual < 0 || percentual > 100) {
      return Money.falha(
        'O percentual de desconto deve estar entre 0 e 100.',
        'PERCENTUAL_INVALIDO'
      );
    }

    const [numerador, denominador] = this.converterDecimalEmFracao(percentual);
    const numeradorDesconto = BigInt(this._centavos) * numerador;
    const denominadorDesconto = denominador * 100n;
    const descontoArredondado =
      (numeradorDesconto * 2n + denominadorDesconto) /
      (denominadorDesconto * 2n);

    return Result.ok(new Money(Number(descontoArredondado), this._moeda));
  }

  public formatarBRL(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: this._moeda,
    }).format(this._centavos / 100);
  }

  private validarMesmaMoeda(outro: Money): MoneyError | null {
    if (this._moeda !== outro.moeda) {
      return new MoneyError(
        `Não é possível operar moedas distintas: ${this._moeda} e ${outro.moeda}`,
        'MOEDAS_DIFERENTES'
      );
    }

    return null;
  }

  private converterDecimalEmFracao(valor: number): [bigint, bigint] {
    const texto = valor.toString().toLowerCase();
    const [mantissa, expoenteTexto] = texto.split('e');
    const [inteiro, fracao = ''] = mantissa.split('.');
    const expoente = Number(expoenteTexto ?? 0);
    let numerador = BigInt(`${inteiro}${fracao}`);
    const escala = fracao.length - expoente;

    if (escala > 0) {
      return [numerador, 10n ** BigInt(escala)];
    }

    numerador *= 10n ** BigInt(-escala);
    return [numerador, 1n];
  }

  private static falha(
    mensagem: string,
    codigo: string
  ): Result<Money, MoneyError> {
    return Result.fail(new MoneyError(mensagem, codigo));
  }
}
