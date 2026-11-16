import { describe, it, expect } from 'vitest';
import { Result } from '../../../src/shared/core/result';

describe('Kernel: Result Pattern', () => {
  it('deve criar um resultado de sucesso discriminado e imutável', () => {
    const result = Result.ok<string, Error>('Rare Essence Parfum');

    expect(result.kind).toBe('success');
    expect(result.isSuccess()).toBe(true);
    expect(result.isFailure()).toBe(false);
    expect(result.value).toBe('Rare Essence Parfum');
    expect(result.error).toBeUndefined();
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('deve criar um resultado de falha com erro anexado', () => {
    const erro = new Error('Cupom expirado');
    const result = Result.fail<string, Error>(erro);

    expect(result.kind).toBe('failure');
    expect(result.isSuccess()).toBe(false);
    expect(result.isFailure()).toBe(true);
    expect(result.error).toBe(erro);
    expect(result.value).toBeUndefined();
  });

  it('deve permitir sucesso com valor undefined sem confundir os casos', () => {
    const result = Result.ok<void, Error>(undefined);

    expect(result.kind).toBe('success');
    expect(result.value).toBeUndefined();
    expect(result.error).toBeUndefined();
  });

  it('deve permitir narrowing seguro pelo discriminante', () => {
    const sucesso = Result.ok<number, string>(42);
    const falha = Result.fail<number, string>('Erro desconhecido');

    if (sucesso.kind === 'success') {
      expect(sucesso.value.toFixed(0)).toBe('42');
    }

    if (falha.kind === 'failure') {
      expect(falha.error.toUpperCase()).toBe('ERRO DESCONHECIDO');
    }
  });
});
