# ⚜️ Rare Essence — Haute Parfumerie E-Commerce

[![CI Pipeline](https://github.com/SEU-USUARIO/rare-essence/actions/workflows/ci.yml/badge.svg)](https://github.com/SEU-USUARIO/rare-essence/actions)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15_(App_Router)-000000?logo=nextdotjs&logoColor=white)
![Architecture](https://img.shields.io/badge/Architecture-Clean_Architecture-E0234E)
![Tests](https://img.shields.io/badge/Methodology-SDD_%26_TDD-22C55E)

> E-commerce autoral e focado em perfumaria fina de nicho, construído sob os princípios de **Clean Architecture**, **Spec-Driven Development (SDD)** e **SOLID**. 

O projeto reproduz a experiência e fluidez de navegação inspirada em lojas de alta conversão do ecossistema Nuvemshop, com design dark elegante autoral (**Noir & Ametista**), checkout direto em etapa única para convidados, pagamentos via Mercado Pago e cálculo de frete via Melhor Envio.

---

## 🏛️ Destaques Arquiteturais & Engenharia

Diferente de e-commerces convencionais que acoplam telas diretamente a ORMs, este sistema foi projetado como um **Monólito Modular** com isolamento estrito de domínio:

- **Clean Architecture:** Camada de domínio 100% isolada, sem dependência de banco de dados, bibliotecas de UI ou frameworks.
- **Spec-Driven Development (SDD):** Toda funcionalidade é especificada formalmente no [`PROJECT-CONTEXT.md`](./PROJECT-CONTEXT.md) com critérios *Given/When/Then* antes de qualquer linha de código.
- **Test Harness Robusto:**
  - **Unit Tests:** Domínio puro, regras de desconto Pix, frete grátis e máquinas de estado executadas em milissegundos.
  - **Contract Tests:** Garantia de equivalência (Princípio de Substituição de Liskov) entre adaptadores reais e fakes em memória.
  - **Integration Tests:** Casos de uso de pedidos e estoque testados contra banco PostgreSQL real.
  - **E2E Tests:** Fluxos críticos de ponta a ponta com Playwright.
- **Value Objects Monetários:** `Money` imutável opera em centavos inteiros, converte valores em reais e retorna falhas tipadas para entradas e operações inválidas.
- **Result Funcional:** Resultados discriminados em sucesso ou falha permitem tratar erros esperados sem exceções no domínio.
- **Estoque Concorrente:** Reservas, baixas e liberações são validadas no domínio e serializadas por variação em transação PostgreSQL.
- **Precificação do Carrinho:** Subtotal, cupom, frete grátis PAC, desconto Pix e parcelamento são calculados no servidor em centavos.
- **Pedidos Imutáveis:** Itens e preços são snapshots independentes do catálogo, com transições de estado validadas pelo agregado.
- **Pagamentos em Sandbox:** Adapter Mercado Pago para Pix/cartão aceita somente access tokens `TEST-`, com chave de idempotência por pedido.
- **Webhook Verificado:** Assinatura HMAC validada, pagamento consultado diretamente no provedor e evento externo registrado com chave única antes de atualizar o pedido.
- **Frete em Sandbox:** Port de cotação PAC/SEDEX, adapter Melhor Envio restrito ao sandbox e fake determinístico sem rede.
- **Acesso Administrativo:** Senha scrypt, sessão HMAC em cookie seguro e rate limit persistido no PostgreSQL, sem serviço externo pago.

---

## 💳 Pagamentos gratuitos em ambiente de teste

O fluxo desta fase usa somente as credenciais de teste do Mercado Pago. O adapter rejeita access tokens de produção (`APP_USR-`) e os testes automatizados não fazem chamadas externas nem geram cobranças. Não foi adicionado SDK pago ou serviço externo adicional.

Configure `MERCADO_PAGO_ACCESS_TOKEN` com um token `TEST-...` e `MERCADO_PAGO_WEBHOOK_SECRET` no `.env` local, que não deve ser versionado. A rota `POST /api/pagamentos/{pedidoId}` recebe `{ "formaPagamento": "PIX" }` ou, para cartão, um token gerado pelo SDK do Mercado Pago junto de `metodoCartao` e `parcelas`; dados brutos de cartão não devem ser enviados nem armazenados pela aplicação. O webhook recebe notificações em `POST /api/webhooks/mercado-pago`.

O teste sandbox depende de uma conta de teste e das respectivas credenciais. A validação local cobre a lógica sem chamar o Mercado Pago. Pagamentos reais não são 100% gratuitos: o provedor cobra tarifas sobre transações aprovadas; o código atual bloqueia tokens de produção.

O checkout integrado agora reserva o estoque antes de persistir o pedido e tenta compensar a reserva quando a criação falha. A rotina automatizada de expiração do Pix e liberação das reservas vencidas ainda precisa ser implementada; pedidos expirados não devem ser considerados um fluxo operacional concluído.

---

## 🚚 Cotação de frete em ambiente de teste

O adapter Melhor Envio envia cotações somente para `https://sandbox.melhorenvio.com.br`; a configuração exige `MELHOR_ENVIO_SANDBOX="true"`, token de sandbox e `MELHOR_ENVIO_USER_AGENT` com o nome da aplicação e um e-mail de contato válido. Configure também `CEP_ORIGEM`. Os valores de exemplo em `.env.example` são placeholders e devem ser substituídos por dados da conta de sandbox antes de testar a integração. Não são feitas compras de etiquetas nem chamadas externas pelos testes automatizados.

O `FakeFreteGateway` não usa rede e retorna valores determinísticos de PAC (R$ 20,00, 5 dias) e SEDEX (R$ 35,00, 2 dias), para desenvolvimento e testes. A cotação externa no sandbox depende de credenciais válidas; o teste local cobre a lógica sem chamar o Melhor Envio.

---

## 🛍️ Storefront e checkout de convidado

A loja tem vitrine em grade de três colunas no desktop e carrossel no mobile, filtros por família olfativa, cards com seletor de volume e preços Pix/parcelamento calculados no servidor, barra de benefícios e pilares de confiança em Noir & Ametista. A PDP mantém a seleção de volume e o carrinho lateral; o navegador envia apenas IDs de variação e quantidades. Disponibilidade, preços, frete e totais são consultados/recalculados no servidor.

O fluxo de checkout atualmente oferece Pix. A geração do QR Code exige um access token `TEST-...` do Mercado Pago; sem credenciais, o pedido pode ser criado e a tela permite tentar gerar o Pix novamente. Não informe nem armazene dados brutos de cartão. A UI de cartão aguarda uma integração de tokenização segura e chave pública do provedor.

A cotação exibida pela interface usa o fake determinístico de frete enquanto a integração Melhor Envio não estiver habilitada. Não existe persistência de cupons nem campo de código de rastreio no schema atual; esses recursos não são simulados pela UI. O painel protegido lista pedidos e permite avançar somente pelas transições de status válidas do agregado.

Para popular o ambiente de demonstração no Windows, execute `npm run demo:reset`. O script aplica as migrations e recria **12 produtos fictícios** (três por família olfativa) com 10 unidades por variação, exclusivamente no banco local `rare_essence_demo`. Ele deriva a conexão da URL local do `.env`, sem alterá-lo, e rejeita hosts não locais. **A operação apaga e recria o catálogo demo.** A seed também valida host e nome do banco para impedir execução acidental em `rare_essence`. Depois, inicie com `npm run dev:demo`.

---

## 🔐 Identidade e segurança do administrador

O acesso é de um único administrador configurado por `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` e `ADMIN_SESSION_SECRET`. Gere um hash scrypt de senha (mínimo 12 caracteres) com `npm run admin:hash` e gere o segredo da sessão com `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`. Copie os resultados para o `.env` local; não use os placeholders do `.env.example`. O hash e o segredo não devem ser versionados nem compartilhados.

A sessão tem duração de até 8 horas e usa cookie `HttpOnly`, `SameSite=Strict` e `Secure` em produção. As rotas `/admin/*` e `/api/admin/*` exigem sessão, exceto login e logout. O login é limitado a 5 tentativas por IP em 15 minutos; cotação, criação de checkout e pagamento são limitados, respectivamente, a 30, 5 e 10 requisições por IP por minuto. Os contadores são atômicos no PostgreSQL existente e a aplicação falha fechada se o rate limiter estiver indisponível. O webhook de pagamento continua protegido por HMAC e idempotência e não recebe limite por IP, para permitir retentativas do provedor.

O identificador do cliente é obtido de `x-real-ip` ou do último endereço válido em `x-forwarded-for`; configure o proxy de produção para sobrescrever esses cabeçalhos. O PostgreSQL armazena somente um HMAC do identificador, com expiração dos registros. Não foi adicionado Redis, serviço externo ou dependência paga.

---

## 🚀 Produção — Vercel + Neon

A preparação local inclui metadados SEO, `robots.txt`, sitemap, logs JSON de erros e `GET /api/health`. Para configuração de contas, variáveis por ambiente, migrations, verificação, rollback e limites conhecidos antes do go-live, siga o [runbook de produção](./docs/production-vercel-neon.md). O deploy real depende de configuração manual no Vercel/Neon e das pendências de produção indicadas no runbook.

---

## 🎨 Design System — Noir & Ametista

A interface foi concebida para transmitir elegância, profundidade e exclusividade:
- **Fundo Principal (`bg-primary`):** `#0E1013` (Ônix Profundo)
- **Superfície dos Cards (`bg-surface`):** `#181B20` (Grafite Escuro)
- **Texto Principal (`text-main`):** `#F4F4F6` (Branco Acetinado)
- **Destaque da Marca (`brand-accent`):** `#C084FC` (Roxo Ametista)
- **Badge Pix / Sucesso (`badge-pix`):** `#10B981` (Verde Esmeralda)

---

## 🗂️ Estrutura de Módulos (Clean Monolith)

```text
src/
├─ modules/
│  ├─ catalogo/       # Fragrâncias, variações em ml e taxonomia
│  ├─ estoque/        # Reservas atômicas e saldo disponível
│  ├─ carrinho/       # Cálculos, descontos e cupons
│  ├─ pedidos/        # Máquina de estados e snapshot de compra
│  ├─ pagamentos/     # Port de pagamento e Adapter Mercado Pago
│  ├─ frete/          # Port de cotação e Adapter Melhor Envio
│  └─ admin/          # Gestão restrita de pedidos e inventário
├─ shared/            # Kernel: Money VO, Result pattern, Clock, Erros base
└─ app/               # Camada de Interface (Next.js App Router)
🛠️ Stack Tecnológica
Front-end & Server: Next.js (App Router), React, Tailwind CSS, Lucide Icons
Linguagem & Tipagem: TypeScript em modo estrito
Persistência & ORM: PostgreSQL, Prisma ORM
Validação de Bordas: Zod
Testes: Vitest (Unit/Contract/Integration), Playwright (E2E)
Infraestrutura Local: Docker Compose
Integrações: Mercado Pago (Sandbox), Melhor Envio (Sandbox)
📖 Documentação & Especificações
📄 PROJECT-CONTEXT.md — Fonte única da verdade: RFs, RNs, Casos de Uso e Roadmap de execução.
📐 ADR-001: Monólito Modular e Clean Architecture — Racional de arquitetura e decisões de engenharia.
🚀 Como executar localmente
1. Configure `.env` com `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAIL`, hash de senha e `ADMIN_SESSION_SECRET` (veja as seções acima e `.env.example`).
2. No Windows, execute `npm run demo:reset` para aplicar migrations e popular somente `rare_essence_demo`.
3. Execute `npm run dev:demo` e acesse o endereço local exibido pelo Next.js.

O teste sandbox de pagamento continua dependendo de credenciais `TEST-` do Mercado Pago; os testes automatizados não fazem chamadas externas.
Licença
Este projeto é de código aberto sob a licença MIT.