CREATE TABLE "estoque_itens" (
    "id" TEXT NOT NULL,
    "variacao_id" TEXT NOT NULL,
    "quantidade_fisica" INTEGER NOT NULL DEFAULT 0,
    "quantidade_reservada" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estoque_itens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "estoque_itens_quantidades_nao_negativas"
      CHECK ("quantidade_fisica" >= 0 AND "quantidade_reservada" >= 0),
    CONSTRAINT "estoque_itens_reservado_nao_excede_fisico"
      CHECK ("quantidade_reservada" <= "quantidade_fisica")
);

CREATE UNIQUE INDEX "estoque_itens_variacao_id_key"
  ON "estoque_itens"("variacao_id");

ALTER TABLE "estoque_itens"
  ADD CONSTRAINT "estoque_itens_variacao_id_fkey"
  FOREIGN KEY ("variacao_id") REFERENCES "variacoes"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
