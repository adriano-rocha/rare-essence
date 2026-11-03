import { Clock } from "@/shared/application/ports/clock.port";

export class SystemClock implements Clock {
  public agora(): Date {
    return new Date();
  }
}

export class FakeClock implements Clock {
  private dataAtual: Date;

  constructor(dataInicial: Date = new Date()) {
    this.dataAtual = new Date(dataInicial.getTime());
  }

  public agora(): Date {
    return new Date(this.dataAtual.getTime());
  }

  public avancarMinutos(minutos: number): void {
    this.dataAtual = new Date(this.dataAtual.getTime() + minutos * 60 * 1000);
  }

  public avancarSegundos(segundos: number): void {
    this.dataAtual = new Date(this.dataAtual.getTime() + segundos * 1000);
  }

  public definirData(novaData: Date): void {
    this.dataAtual = new Date(novaData.getTime());
  }
}