CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "codigo_rastreavel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CRIADO',
    "forma_pagamento" TEXT NOT NULL,
    "cliente_nome" TEXT NOT NULL,
    "cliente_email" TEXT NOT NULL,
    "cliente_cpf" TEXT NOT NULL,
    "cliente_telefone" TEXT NOT NULL,
    "endereco_cep" TEXT NOT NULL,
    "endereco_logradouro" TEXT NOT NULL,
    "endereco_numero" TEXT NOT NULL,
    "endereco_complemento" TEXT,
    "endereco_bairro" TEXT NOT NULL,
    "endereco_cidade" TEXT NOT NULL,
    "endereco_estado" TEXT NOT NULL,
    "subtotal_produtos_centavos" INTEGER NOT NULL,
    "desconto_cupom_centavos" INTEGER NOT NULL DEFAULT 0,
    "desconto_pix_centavos" INTEGER NOT NULL DEFAULT 0,
    "codigo_cupom" TEXT,
    "frete_modalidade" TEXT NOT NULL,
    "frete_prazo_dias" INTEGER NOT NULL,
    "frete_valor_centavos" INTEGER NOT NULL,
    "total_cartao_centavos" INTEGER NOT NULL,
    "total_pix_centavos" INTEGER NOT NULL,
    "total_em_centavos" INTEGER NOT NULL,
    "expira_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pedidos_status_valido"
      CHECK ("status" IN ('CRIADO', 'PAGO', 'EM_SEPARACAO', 'ENVIADO', 'ENTREGUE', 'CANCELADO')),
    CONSTRAINT "pedidos_forma_pagamento_valida"
      CHECK ("forma_pagamento" IN ('PIX', 'CARTAO')),
    CONSTRAINT "pedidos_valores_nao_negativos"
      CHECK (
        "subtotal_produtos_centavos" >= 0 AND
        "desconto_cupom_centavos" >= 0 AND
        "desconto_pix_centavos" >= 0 AND
        "frete_prazo_dias" >= 0 AND
        "frete_valor_centavos" >= 0 AND
        "total_cartao_centavos" >= 0 AND
        "total_pix_centavos" >= 0 AND
        "total_em_centavos" >= 0
      ),
    CONSTRAINT "pedidos_snapshot_de_preco_valido"
      CHECK (
        "desconto_cupom_centavos" <= "subtotal_produtos_centavos" AND
        "desconto_pix_centavos" <= ("subtotal_produtos_centavos" - "desconto_cupom_centavos") AND
        "total_cartao_centavos" =
          ("subtotal_produtos_centavos" - "desconto_cupom_centavos" + "frete_valor_centavos") AND
        "total_pix_centavos" =
          ("subtotal_produtos_centavos" - "desconto_cupom_centavos" - "desconto_pix_centavos" + "frete_valor_centavos") AND
        (
          ("forma_pagamento" = 'PIX' AND "total_em_centavos" = "total_pix_centavos") OR
          ("forma_pagamento" = 'CARTAO' AND "total_em_centavos" = "total_cartao_centavos")
        )
      )
);

CREATE TABLE "pedido_itens" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "variacao_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "nome_produto" TEXT NOT NULL,
    "volume_ml" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario_centavos" INTEGER NOT NULL,
    "subtotal_centavos" INTEGER NOT NULL,
    CONSTRAINT "pedido_itens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pedido_itens_snapshot_valido"
      CHECK (
        "volume_ml" > 0 AND
        "quantidade" > 0 AND
        "preco_unitario_centavos" > 0 AND
        "subtotal_centavos" =
          ("preco_unitario_centavos"::BIGINT * "quantidade"::BIGINT)
      ),
    CONSTRAINT "pedido_itens_pedido_id_fkey"
      FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "pedidos_codigo_rastreavel_key"
  ON "pedidos"("codigo_rastreavel");
