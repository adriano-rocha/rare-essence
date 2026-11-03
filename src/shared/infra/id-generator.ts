import crypto from "crypto";
import { IdGenerator } from "@/shared/application/ports/id-generator.port";

export class CryptoIdGenerator implements IdGenerator {
  public gerar(): string {
    return crypto.randomUUID();
  }
}

export class FakeIdGenerator implements IdGenerator {
  private proximoId: string | null = null;
  private contador: number = 0;

  public definirProximoId(id: string): void {
    this.proximoId = id;
  }

  public gerar(): string {
    if (this.proximoId) {
      const id = this.proximoId;
      this.proximoId = null;
      return id;
    }

    this.contador += 1;
    return `fake-id-${this.contador}`;
  }
}