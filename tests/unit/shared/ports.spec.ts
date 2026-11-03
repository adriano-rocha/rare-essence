import { describe, it, expect } from "vitest";
import { SystemClock, FakeClock } from "@/shared/infra/clock";
import { CryptoIdGenerator, FakeIdGenerator } from "@/shared/infra/id-generator";
import { DomainError } from "@/shared/core/errors/domain-error";

describe("Kernel: Ports & Adapters Utilitários", () => {
  describe("Clock Port (RN-008: Controle Temporal)", () => {
    it("deve retornar a data atual no SystemClock", () => {
      const clock = new SystemClock();
      const agora = clock.agora();

      expect(agora).toBeInstanceOf(Date);
      expect(Math.abs(agora.getTime() - Date.now())).toBeLessThan(100);
    });

    it("deve permitir avançar o tempo deterministicamente no FakeClock", () => {
      const dataBase = new Date("2025-05-10T12:00:00Z");
      const fakeClock = new FakeClock(dataBase);

      expect(fakeClock.agora().toISOString()).toBe("2025-05-10T12:00:00.000Z");

      // Avança 30 minutos (tempo de expiração do Pix na RN-008)
      fakeClock.avancarMinutos(30);

      expect(fakeClock.agora().toISOString()).toBe("2025-05-10T12:30:00.000Z");
    });
  });

  describe("IdGenerator Port", () => {
    it("deve gerar UUID válido no CryptoIdGenerator", () => {
      const generator = new CryptoIdGenerator();
      const id = generator.gerar();

      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it("deve permitir retornar IDs determinísticos no FakeIdGenerator", () => {
      const fakeGen = new FakeIdGenerator();
      fakeGen.definirProximoId("pedido-123");

      expect(fakeGen.gerar()).toBe("pedido-123");
      expect(fakeGen.gerar()).toBe("fake-id-1"); // Fallback sequencial
    });
  });

  describe("DomainError", () => {
    it("deve instanciar erro de domínio com mensagem e código de erro legível", () => {
      class ProdutoEsgotadoError extends DomainError {
        constructor() {
          super("O perfume selecionado está esgotado.", "PRODUTO_ESGOTADO");
        }
      }

      const erro = new ProdutoEsgotadoError();
      expect(erro.mensagem).toBe("O perfume selecionado está esgotado.");
      expect(erro.codigo).toBe("PRODUTO_ESGOTADO");
    });
  });
});