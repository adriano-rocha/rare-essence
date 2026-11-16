CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "marcas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "marca_id" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,
    "notas_topo" TEXT[],
    "notas_coracao" TEXT[],
    "notas_base" TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "variacoes" (
    "id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "volume_ml" INTEGER NOT NULL,
    "preco_centavos" INTEGER NOT NULL,
    "peso_gramas" INTEGER NOT NULL DEFAULT 250,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "variacoes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categorias_slug_key" ON "categorias"("slug");
CREATE UNIQUE INDEX "marcas_slug_key" ON "marcas"("slug");
CREATE UNIQUE INDEX "produtos_slug_key" ON "produtos"("slug");
CREATE UNIQUE INDEX "variacoes_sku_key" ON "variacoes"("sku");

ALTER TABLE "produtos"
  ADD CONSTRAINT "produtos_marca_id_fkey"
  FOREIGN KEY ("marca_id") REFERENCES "marcas"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "produtos"
  ADD CONSTRAINT "produtos_categoria_id_fkey"
  FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "variacoes"
  ADD CONSTRAINT "variacoes_produto_id_fkey"
  FOREIGN KEY ("produto_id") REFERENCES "produtos"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
