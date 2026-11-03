import { describe, it, expect } from "vitest";
import { Money } from "@/shared/core/money";

describe("Kernel: Money Value Object (RNF-001)", () => {
  it("deve criar uma quantia monetária em centavos inteiros", () => {
    const preco = Money.fromCentavos(38000); // R$ 380,00

    expect(preco.centavos).toBe(38000);
    expect(preco.moeda).toBe("BRL");
  });

  it("deve rejeitar valores com casas decimais (não inteiros)", () => {
    expect(() => Money.fromCentavos(38000.5)).toThrow(
      "A quantia em centavos deve ser um número inteiro."
    );
  });

  it("deve rejeitar valores negativos na criação básica", () => {
    expect(() => Money.fromCentavos(-100)).toThrow(
      "A quantia em centavos não pode ser negativa."
    );
  });

  it("deve somar duas quantias monetárias com imutabilidade", () => {
    const item1 = Money.fromCentavos(15000); // R$ 150,00
    const item2 = Money.fromCentavos(20000); // R$ 200,00

    const total = item1.somar(item2);

    expect(total.centavos).toBe(35000); // R$ 350,00
    expect(item1.centavos).toBe(15000); // Original inalterado
    expect(item2.centavos).toBe(20000); // Original inalterado
  });

  it("deve subtrair quantias monetárias e impedir saldo negativo", () => {
    const total = Money.fromCentavos(10000);
    const cupom = Money.fromCentavos(4000);

    const resultado = total.subtrair(cupom);

    expect(resultado.centavos).toBe(6000);
    expect(() => cupom.subtrair(total)).toThrow(
      "Resultado monetário não pode ser negativo."
    );
  });

  it("deve calcular desconto percentual com arredondamento seguro (RN-001: 5% Pix)", () => {
    // R$ 379,90 = 37990 centavos. 5% = 1899.5 centavos -> Deve arredondar para 1900 centavos
    const original = Money.fromCentavos(37990);
    const comDesconto = original.aplicarDescontoPercentual(5);

    expect(comDesconto.centavos).toBe(36090); // 37990 - 1900 = 36090
  });

  it("deve formatar para Real Brasileiro (BRL) corretamente", () => {
    const preco = Money.fromCentavos(38000);
    
    // Normalizamos espaços não separáveis que o Intl pode gerar
    const formatado = preco.formatarBRL().replace(/\u00a0/g, " ");

    expect(formatado).toBe("R$ 380,00");
  });
});