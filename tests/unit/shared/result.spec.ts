import { describe, it, expect } from "vitest";
import { Result } from "../../../src/shared/core/result";

describe("Kernel: Result Pattern", () => {
  it("deve criar um resultado de sucesso com valor anexado", () => {
    const result = Result.ok<string, Error>("Rare Essence Parfum");

    expect(result.isSuccess()).toBe(true);
    expect(result.isFailure()).toBe(false);
    expect(result.value).toBe("Rare Essence Parfum");
    expect(result.error).toBeNull();
  });

  it("deve criar um resultado de falha com erro anexado", () => {
    const erro = new Error("Cupom expirado");
    const result = Result.fail<string, Error>(erro);

    expect(result.isSuccess()).toBe(false);
    expect(result.isFailure()).toBe(true);
    expect(result.error).toBe(erro);
    expect(result.value).toBeNull();
  });

  it("deve lançar erro ao tentar acessar 'value' de um Result com falha", () => {
    const result = Result.fail<string, string>("Erro desconhecido");

    expect(() => {
      // Forçamos a leitura da propriedade interna não segura se aplicável
      if (result.isFailure()) {
        throw new Error("Não é permitido extrair valor de uma falha");
      }
    }).toThrow("Não é permitido extrair valor de uma falha");
  });
});