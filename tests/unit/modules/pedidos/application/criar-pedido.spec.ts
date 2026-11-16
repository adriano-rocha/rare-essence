import { describe, expect, it } from 'vitest';
import { FakeClock } from '@/shared/infra/clock';
import { FakeIdGenerator } from '@/shared/infra/id-generator';
import { FakePedidoRepository } from '@/modules/pedidos/infra/fake-pedido-repository';
import { CriarPedido, CriarPedidoInput } from '@/modules/pedidos/application/use-cases/criar-pedido';
import { FormaPagamento } from '@/modules/pedidos/domain/pedido';
import { Money } from '@/shared/core/money';

function dinheiro(centavos: number): Money {
  const resultado = Money.fromCentavos(centavos);
  if (resultado.kind === 'failure') throw new Error(resultado.error.mensagem);
  return resultado.value;
}

function inputValido(): CriarPedidoInput {
  return {
    cliente: {
      nome: 'Ana Cliente',
      email: 'ana@example.com',
      cpf: '123.456.789-09',
      telefone: '(11) 99999-9999',
    },
    enderecoEntrega: {
      cep: '01001-000',
      logradouro: 'Praça da Sé',
      numero: '100',
      bairro: 'Sé',
      cidade: 'São Paulo',
      estado: 'SP',
    },
    itens: [
      {
        variacaoId: 'variacao-1',
        sku: 'RARE-NOIR-100ML',
        nomeProduto: 'Noir Absolu',
        volumeMl: 100,
        quantidade: 1,
        precoUnitario: dinheiro(38000),
      },
    ],
    formaPagamento: FormaPagamento.PIX,
    subtotalProdutos: dinheiro(38000),
    descontoCupom: dinheiro(0),
    descontoPix: dinheiro(1900),
    frete: { modalidade: 'PAC', prazoDias: 5, valor: dinheiro(0) },
    totalCartao: dinheiro(38000),
    totalPix: dinheiro(36100),
    codigoCupom: undefined,
  };
}

describe('CriarPedido', () => {
  it('cria e persiste pedido com ID, código e expiração Pix determinísticos', async () => {
    const repository = new FakePedidoRepository();
    const clock = new FakeClock(new Date('2026-11-15T12:00:00Z'));
    const ids = new FakeIdGenerator();
    const casoDeUso = new CriarPedido(repository, ids, clock);

    const resultado = await casoDeUso.executar(inputValido());

    expect(resultado.kind).toBe('success');
    if (resultado.kind === 'success') {
      expect(resultado.value.id).toBe('fake-id-1');
      expect(resultado.value.codigoRastreavel).toBe('RE-FAKE-ID-2');
      expect(resultado.value.totalEmCentavos).toBe(36100);
      expect(resultado.value.expiraEm?.toISOString()).toBe('2026-11-15T12:30:00.000Z');
      expect(await repository.buscarPorCodigo('RE-FAKE-ID-2')).toBe(resultado.value);
    }
  });

  it('não persiste pedido com dados de cliente inválidos', async () => {
    const repository = new FakePedidoRepository();
    const casoDeUso = new CriarPedido(
      repository,
      new FakeIdGenerator(),
      new FakeClock(new Date('2026-11-15T12:00:00Z'))
    );
    const input = inputValido();
    input.cliente.email = 'email-invalido';

    const resultado = await casoDeUso.executar(input);

    expect(resultado.kind).toBe('failure');
    if (resultado.kind === 'failure') {
      expect(resultado.error.codigo).toBe('CLIENTE_PEDIDO_INVALIDO');
    }
    expect(await repository.buscarPorId('fake-id-1')).toBeNull();
  });
});
