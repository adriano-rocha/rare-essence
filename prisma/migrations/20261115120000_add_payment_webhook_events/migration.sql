CREATE TABLE "eventos_webhook_pagamento" (
    "id" TEXT NOT NULL,
    "id_evento_externo" TEXT NOT NULL,
    "id_pagamento_externo" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "status_pagamento" TEXT NOT NULL,
    "resultado" TEXT NOT NULL,
    "recebido_em" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "eventos_webhook_pagamento_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "eventos_webhook_pagamento_resultado_valido"
      CHECK ("resultado" IN ('APLICADO', 'NAO_APROVADO', 'PEDIDO_NAO_PAGAVEL')),
    CONSTRAINT "eventos_webhook_pagamento_pedido_id_fkey"
      FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "eventos_webhook_pagamento_id_evento_externo_key"
  ON "eventos_webhook_pagamento"("id_evento_externo");
CREATE INDEX "eventos_webhook_pagamento_pedido_id_idx"
  ON "eventos_webhook_pagamento"("pedido_id");
