import { Prisma, PrismaClient } from '@prisma/client';
import { EstoqueRepository } from '../application/ports/estoque-repository';
import { EstoqueItem } from '../domain/estoque-item';

type PrismaEstoqueClient = Prisma.TransactionClient;
type ClientePrisma = PrismaClient | Prisma.TransactionClient;

export class PrismaEstoqueRepository implements EstoqueRepository {
  constructor(private readonly prisma: ClientePrisma) {}

  async salvar(item: EstoqueItem): Promise<void> {
    await this.executarEmTransacao(async (transacao) => {
      await this.bloquearVariacao(transacao, item.variacaoId);
      await this.salvarNaTransacao(transacao, item);
    });
  }

  async buscarPorVariacaoId(variacaoId: string): Promise<EstoqueItem | null> {
    const registro = await this.prisma.estoqueItem.findUnique({
      where: { variacaoId },
    });
    return registro ? this.paraDominio(registro) : null;
  }

  executarComLock<T>(
    variacaoId: string,
    operacao: (
      item: EstoqueItem | null,
      salvar: (item: EstoqueItem) => Promise<void>
    ) => Promise<T>
  ): Promise<T> {
    return this.executarEmTransacao(async (transacao) => {
      await this.bloquearVariacao(transacao, variacaoId);

      const registro = await transacao.estoqueItem.findUnique({
        where: { variacaoId },
      });
      const item = registro ? this.paraDominio(registro) : null;
      const salvar = (atualizado: EstoqueItem) =>
        this.salvarNaTransacao(transacao, atualizado);

      return operacao(item, salvar);
    });
  }

  private executarEmTransacao<T>(
    operacao: (transacao: PrismaEstoqueClient) => Promise<T>
  ): Promise<T> {
    if ('$transaction' in this.prisma) {
      return this.prisma.$transaction((transacao) => operacao(transacao));
    }
    return operacao(this.prisma);
  }

  private async salvarNaTransacao(
    transacao: PrismaEstoqueClient,
    item: EstoqueItem
  ): Promise<void> {
    await transacao.estoqueItem.upsert({
      where: { variacaoId: item.variacaoId },
      create: this.paraPersistencia(item),
      update: {
        quantidadeFisica: item.quantidadeFisica,
        quantidadeReservada: item.quantidadeReservada,
        atualizadoEm: item.atualizadoEm,
      },
    });
  }

  private async bloquearVariacao(
    transacao: PrismaEstoqueClient,
    variacaoId: string
  ): Promise<void> {
    await transacao.$queryRaw`
      SELECT 1 AS locked
      FROM (SELECT pg_advisory_xact_lock(hashtext(${variacaoId}))) AS lock_acquired
    `;
  }

  private paraDominio(registro: Prisma.EstoqueItemGetPayload<object>): EstoqueItem {
    const resultado = EstoqueItem.criar({
      id: registro.id,
      variacaoId: registro.variacaoId,
      quantidadeFisica: registro.quantidadeFisica,
      quantidadeReservada: registro.quantidadeReservada,
      criadoEm: registro.criadoEm,
      atualizadoEm: registro.atualizadoEm,
    });

    if (resultado.kind === 'failure') {
      throw new Error(
        `Registro de estoque inválido (${registro.variacaoId}): ${resultado.error.mensagem}`
      );
    }

    return resultado.value;
  }

  private paraPersistencia(item: EstoqueItem) {
    return {
      id: item.id,
      variacaoId: item.variacaoId,
      quantidadeFisica: item.quantidadeFisica,
      quantidadeReservada: item.quantidadeReservada,
      criadoEm: item.criadoEm,
      atualizadoEm: item.atualizadoEm,
    };
  }
}