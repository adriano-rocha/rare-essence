import { z } from 'zod';
import { ItemCarrinho } from '@/modules/carrinho/domain/item-carrinho';
import { CalcularPrecificacao } from '@/modules/carrinho/application/calcular-precificacao';
import { CotacaoCheckout } from '@/modules/carrinho/application/checkout-dto';
import { CotarFretes } from '@/modules/frete/application/use-cases/cotar-fretes';
import { CotacaoInput } from '@/modules/frete/application/ports/frete-gateway';
import { FakeFreteGateway } from '@/modules/frete/infra/fake-frete-gateway';
import { Money } from '@/shared/core/money';
import { Result } from '@/shared/core/result';
import { prisma } from '@/shared/infra/prisma';

export const itensCheckoutSchema = z
  .array(
    z.object({
      variacaoId: z.string().trim().min(1).max(100),
      quantidade: z.number().int().min(1).max(10),
    })
  )
  .min(1)
  .max(10)
  .superRefine((itens, contexto) => {
    const ids = itens.map((item) => item.variacaoId);
    if (new Set(ids).size !== ids.length) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cada variação deve aparecer uma única vez.',
      });
    }
  });

export const cepCheckoutSchema = z
  .string()
  .trim()
  .transform((cep) => cep.replace(/\D/g, ''))
  .refine((cep) => /^\d{8}$/.test(cep), 'Informe um CEP válido.');

export interface FalhaCheckout {
  readonly codigo: string;
  readonly mensagem: string;
  readonly status: number;
}

interface EntradaCotacao {
  itens: z.infer<typeof itensCheckoutSchema>;
  cepDestino: string;
}

export async function calcularCotacaoCheckout(
  entrada: EntradaCotacao
): Promise<Result<CotacaoCheckout, FalhaCheckout>> {
  const registros = await prisma.variacao.findMany({
    where: {
      id: { in: entrada.itens.map((item) => item.variacaoId) },
      ativo: true,
      produto: { ativo: true },
    },
    include: { produto: true, estoque: true },
  });

  if (registros.length !== entrada.itens.length) {
    return Result.fail({
      codigo: 'ITEM_INDISPONIVEL',
      mensagem: 'Um ou mais itens não estão disponíveis.',
      status: 409,
    });
  }

  const porId = new Map(registros.map((registro) => [registro.id, registro]));
  const itensCarrinho: ItemCarrinho[] = [];
  const itensCotacao: CotacaoCheckout['itens'][number][] = [];
  const produtosFrete: CotacaoInput['produtos'][number][] = [];

  for (const item of entrada.itens) {
    const registro = porId.get(item.variacaoId);
    if (!registro) {
      return Result.fail({
        codigo: 'ITEM_INDISPONIVEL',
        mensagem: 'Um ou mais itens não estão disponíveis.',
        status: 409,
      });
    }

    const estoqueDisponivel = registro.estoque
      ? registro.estoque.quantidadeFisica - registro.estoque.quantidadeReservada
      : 0;
    if (estoqueDisponivel < item.quantidade) {
      return Result.fail({
        codigo: 'ESTOQUE_INSUFICIENTE',
        mensagem: `Estoque insuficiente para ${registro.produto.nome} ${registro.volumeMl}ml.`,
        status: 409,
      });
    }

    const preco = Money.fromCentavos(registro.precoCentavos);
    if (preco.kind === 'failure') {
      return Result.fail({
        codigo: 'PRECO_INVALIDO',
        mensagem: 'Um item possui preço inválido no catálogo.',
        status: 500,
      });
    }

    const itemCarrinho = ItemCarrinho.criar({
      variacaoId: registro.id,
      sku: registro.sku,
      precoUnitario: preco.value,
      quantidade: item.quantidade,
    });
    if (itemCarrinho.kind === 'failure') {
      return Result.fail({
        codigo: 'ITEM_INVALIDO',
        mensagem: 'Não foi possível validar os itens do carrinho.',
        status: 422,
      });
    }
    itensCarrinho.push(itemCarrinho.value);
    itensCotacao.push({
      variacaoId: registro.id,
      nomeProduto: registro.produto.nome,
      slug: registro.produto.slug,
      sku: registro.sku,
      volumeMl: registro.volumeMl,
      quantidade: item.quantidade,
      precoUnitarioCentavos: preco.value.centavos,
      estoqueDisponivel,
    });
    produtosFrete.push({
      id: registro.id,
      larguraCm: 15,
      alturaCm: 8,
      comprimentoCm: 20,
      pesoGramas: registro.pesoGramas,
      valorSeguro: preco.value,
      quantidade: item.quantidade,
    });
  }

  const origem = process.env.CEP_ORIGEM ?? '01001000';
  const cotacoes = await new CotarFretes(new FakeFreteGateway()).executar({
    cepOrigem: origem,
    cepDestino: entrada.cepDestino,
    produtos: produtosFrete,
  });
  if (cotacoes.kind === 'failure') {
    return Result.fail({
      codigo: 'FRETE_INDISPONIVEL',
      mensagem: 'Não foi possível cotar o frete agora.',
      status: 503,
    });
  }

  const opcoesFrete: CotacaoCheckout['opcoesFrete'][number][] = [];
  for (const opcao of cotacoes.value) {
    const resumo = CalcularPrecificacao.executar(
      itensCarrinho,
      { modalidade: opcao.modalidade, valor: opcao.valor },
      new Date()
    );
    if (resumo.kind === 'failure') {
      return Result.fail({
        codigo: 'PRECIFICACAO_INDISPONIVEL',
        mensagem: 'Não foi possível calcular os valores do carrinho.',
        status: 422,
      });
    }

    opcoesFrete.push({
      codigoServico: opcao.codigoServico,
      modalidade: opcao.modalidade,
      valorCentavos: resumo.value.frete.centavos,
      prazoDias: opcao.prazoDias,
      freteGratis: resumo.value.freteGratis,
      descontoPixCentavos: resumo.value.descontoPix.centavos,
      totalPixCentavos: resumo.value.totalPix.centavos,
      totalCartaoCentavos: resumo.value.totalCartao.centavos,
      planosParcelamento: resumo.value.planosParcelamento,
    });
  }

  const subtotalInicial = Money.fromCentavos(0);
  if (subtotalInicial.kind === 'failure') {
    return Result.fail({
      codigo: 'PRECIFICACAO_INDISPONIVEL',
      mensagem: 'Não foi possível calcular os valores do carrinho.',
      status: 500,
    });
  }

  let subtotal = subtotalInicial.value;
  for (const item of itensCarrinho) {
    const itemSubtotal = item.calcularSubtotal();
    if (itemSubtotal.kind === 'failure') {
      return Result.fail({
        codigo: 'PRECIFICACAO_INDISPONIVEL',
        mensagem: 'Não foi possível calcular os valores do carrinho.',
        status: 422,
      });
    }

    const proximoSubtotal = subtotal.somar(itemSubtotal.value);
    if (proximoSubtotal.kind === 'failure') {
      return Result.fail({
        codigo: 'PRECIFICACAO_INDISPONIVEL',
        mensagem: 'O total do carrinho excede o limite permitido.',
        status: 422,
      });
    }
    subtotal = proximoSubtotal.value;
  }

  return Result.ok({
    cepDestino: entrada.cepDestino,
    subtotalProdutosCentavos: subtotal.centavos,
    itens: itensCotacao,
    opcoesFrete,
  });
}
