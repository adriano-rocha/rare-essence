-- AlterTable
ALTER TABLE "pedidos" ALTER COLUMN "desconto_cupom_centavos" DROP DEFAULT,
ALTER COLUMN "desconto_pix_centavos" DROP DEFAULT;

-- CreateTable
CREATE TABLE "rate_limit_buckets" (
    "chave" TEXT NOT NULL,
    "inicio_janela" TIMESTAMP(3) NOT NULL,
    "requisicoes" INTEGER NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("chave")
);

-- CreateIndex
CREATE INDEX "rate_limit_buckets_expira_em_idx" ON "rate_limit_buckets"("expira_em");
