import { describe, expect, it } from 'vitest';
import { EstoqueItem } from '@/modules/estoque/domain/estoque-item';
import { FakeEstoqueRepository } from '@/modules/estoque/infra/fake-estoque-repository';
import {
  ConfirmarBaixaEstoque,
  LiberarReservaEstoque,
  ReservarEstoque,
} from '@/modules/estoque/application/use-cases/estoque-use-cases';

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

describe('Casos de uso de estoque', () => {
  it('reserva estoque e retorna falha sem alterar estado em falta', async () => {
    const repository = new FakeEstoqueRepository();
    await repository.salvar(criarEstoque());
    const reservar = new ReservarEstoque(repository);

    const sucesso = await reservar.executar('variacao-1', 2);
    expect(sucesso.kind).toBe('success');
    if (sucesso.kind === 'success') {
      expect(sucesso.value.quantidadeDisponivel).toBe(3);
      expect(sucesso.value.quantidadeFisica).toBe(5);
      expect(sucesso.value.quantidadeReservada).toBe(2);
    }

    const falha = await reservar.executar('variacao-1', 4);
    expect(falha.kind).toBe('failure');
    const persistido = await repository.buscarPorVariacaoId('variacao-1');
    expect(persistido?.quantidadeReservada).toBe(2);
  });

  it('confirma a baixa e libera reservas pelos respectivos casos de uso', async () => {
    const repository = new FakeEstoqueRepository();
    await repository.salvar(criarEstoque(5, 2));

    const confirmado = await new ConfirmarBaixaEstoque(repository)
      .executar('variacao-1', 2);
    expect(confirmado.kind).toBe('success');
    if (confirmado.kind === 'success') {
      expect(confirmado.value.quantidadeFisica).toBe(3);
      expect(confirmado.value.quantidadeReservada).toBe(0);
    }

    await repository.salvar(criarEstoque(5, 2));
    const liberado = await new LiberarReservaEstoque(repository)
      .executar('variacao-1', 2);
    expect(liberado.kind).toBe('success');
    if (liberado.kind === 'success') {
      expect(liberado.value.quantidadeFisica).toBe(5);
      expect(liberado.value.quantidadeDisponivel).toBe(5);
    }
  });

  it('retorna erro funcional quando não há registro para a variação', async () => {
    const reservar = new ReservarEstoque(new FakeEstoqueRepository());

    const resultado = await reservar.executar('inexistente', 1);
    expect(resultado.kind).toBe('failure');
    if (resultado.kind === 'failure') {
      expect(resultado.error.codigo).toBe('ESTOQUE_NAO_ENCONTRADO');
    }
  });

  it('serializa reservas concorrentes e impede over-selling', async () => {
    const repository = new FakeEstoqueRepository();
    await repository.salvar(criarEstoque());
    const reservar = new ReservarEstoque(repository);

    const resultados = await Promise.all(
      Array.from({ length: 10 }, () => reservar.executar('variacao-1', 1))
    );

    expect(resultados.filter((resultado) => resultado.kind === 'success')).toHaveLength(5);
    expect(resultados.filter((resultado) => resultado.kind === 'failure')).toHaveLength(5);
    const persistido = await repository.buscarPorVariacaoId('variacao-1');
    expect(persistido?.quantidadeFisica).toBe(5);
    expect(persistido?.quantidadeReservada).toBe(5);
    expect(persistido?.quantidadeDisponivel).toBe(0);
  });
});
