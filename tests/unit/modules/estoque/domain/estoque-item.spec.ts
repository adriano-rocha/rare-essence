import { describe, expect, it } from 'vitest';
import { EstoqueItem } from '@/modules/estoque/domain/estoque-item';

function criarEstoque(
  quantidadeFisica = 5,
  quantidadeReservada = 0
): EstoqueItem {
  const resultado = EstoqueItem.criar({
    id: 'estoque-1',
    variacaoId: 'variacao-1',
    quantidadeFisica,
    quantidadeReservada,
  });
  if (resultado.kind === 'failure') {
    throw new Error(resultado.error.mensagem);
  }
  return resultado.value;
}

describe('EstoqueItem', () => {
  it('calcula saldo disponível e rejeita estados inválidos', () => {
    expect(criarEstoque(5, 2).quantidadeDisponivel).toBe(3);

    expect(EstoqueItem.criar({
      id: 'estoque',
      variacaoId: 'variacao',
      quantidadeFisica: 1.5,
      quantidadeReservada: 0,
    }).kind).toBe('failure');
    expect(EstoqueItem.criar({
      id: 'estoque',
      variacaoId: 'variacao',
      quantidadeFisica: 2_147_483_648,
      quantidadeReservada: 0,
    }).kind).toBe('failure');
    expect(EstoqueItem.criar({
      id: 'estoque',
      variacaoId: 'variacao',
      quantidadeFisica: 1,
      quantidadeReservada: 2,
    }).kind).toBe('failure');
  });

  it('reserva somente a quantidade disponível', () => {
    const estoque = criarEstoque();

    expect(estoque.reservar(2).kind).toBe('success');
    expect(estoque.quantidadeFisica).toBe(5);
    expect(estoque.quantidadeReservada).toBe(2);
    expect(estoque.quantidadeDisponivel).toBe(3);

    expect(estoque.reservar(4).kind).toBe('failure');
    expect(estoque.quantidadeReservada).toBe(2);
  });

  it('confirma baixa somente quando existe reserva compatível', () => {
    const estoque = criarEstoque(5, 2);

    expect(estoque.confirmarBaixa(3).kind).toBe('failure');
    expect(estoque.quantidadeFisica).toBe(5);
    expect(estoque.quantidadeReservada).toBe(2);

    expect(estoque.confirmarBaixa(2).kind).toBe('success');
    expect(estoque.quantidadeFisica).toBe(3);
    expect(estoque.quantidadeReservada).toBe(0);
    expect(estoque.quantidadeDisponivel).toBe(3);
  });

  it('libera reserva sem alterar estoque físico', () => {
    const estoque = criarEstoque(5, 2);

    expect(estoque.liberarReserva(1).kind).toBe('success');
    expect(estoque.quantidadeFisica).toBe(5);
    expect(estoque.quantidadeReservada).toBe(1);
    expect(estoque.quantidadeDisponivel).toBe(4);
    expect(estoque.liberarReserva(2).kind).toBe('failure');
    expect(estoque.liberarReserva(0).kind).toBe('failure');
  });
});
