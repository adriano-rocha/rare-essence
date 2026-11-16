export interface ItemCotacaoCheckout {
  variacaoId: string;
  nomeProduto: string;
  slug: string;
  sku: string;
  volumeMl: number;
  quantidade: number;
  precoUnitarioCentavos: number;
  estoqueDisponivel: number;
}

export interface OpcaoCotacaoCheckout {
  codigoServico: number;
  modalidade: 'PAC' | 'SEDEX';
  valorCentavos: number;
  prazoDias: number;
  freteGratis: boolean;
  descontoPixCentavos: number;
  totalPixCentavos: number;
  totalCartaoCentavos: number;
  planosParcelamento: readonly {
    quantidade: number;
    valoresCentavos: readonly number[];
  }[];
}

export interface CotacaoCheckout {
  cepDestino: string;
  subtotalProdutosCentavos: number;
  itens: readonly ItemCotacaoCheckout[];
  opcoesFrete: readonly OpcaoCotacaoCheckout[];
}
