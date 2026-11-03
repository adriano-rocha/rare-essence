/**
 * Value Object imutável para operações monetárias.
 * RNF-001: Todos os cálculos financeiros são processados em centavos inteiros.
 */
export class Money {
  private readonly _centavos: number;
  private readonly _moeda: string;

  private constructor(centavos: number, moeda: string = "BRL") {
    if (!Number.isInteger(centavos)) {
      throw new Error("A quantia em centavos deve ser um número inteiro.");
    }

    if (centavos < 0) {
      throw new Error("A quantia em centavos não pode ser negativa.");
    }

    this._centavos = centavos;
    this._moeda = moeda;
    Object.freeze(this);
  }

  public static fromCentavos(centavos: number, moeda: string = "BRL"): Money {
    return new Money(centavos, moeda);
  }

  public get centavos(): number {
    return this._centavos;
  }

  public get moeda(): string {
    return this._moeda;
  }

  public somar(outro: Money): Money {
    this.validarMesmaMoeda(outro);
    return new Money(this._centavos + outro.centavos, this._moeda);
  }

  public subtrair(outro: Money): Money {
    this.validarMesmaMoeda(outro);
    const novoValor = this._centavos - outro.centavos;

    if (novoValor < 0) {
      throw new Error("Resultado monetário não pode ser negativo.");
    }

    return new Money(novoValor, this._moeda);
  }

  public aplicarDescontoPercentual(percentual: number): Money {
    if (percentual < 0 || percentual > 100) {
      throw new Error("O percentual de desconto deve estar entre 0 e 100.");
    }

    // Arredondamento bancário determinístico (half-up)
    const valorDesconto = Math.round(this._centavos * (percentual / 100));
    return this.subtrair(new Money(valorDesconto, this._moeda));
  }

  public formatarBRL(): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(this._centavos / 100);
  }

  private validarMesmaMoeda(outro: Money): void {
    if (this._moeda !== outro.moeda) {
      throw new Error(
        `Não é possível operar moedas distintas: ${this._moeda} e ${outro.moeda}`
      );
    }
  }
}