# ⚜️ Rare Essence — Haute Parfumerie E-Commerce

[![Produção](https://img.shields.io/badge/Produ%C3%A7%C3%A3o-rare--essence.vercel.app-C5A059?style=flat&logo=vercel&logoColor=white)](https://rare-essence.vercel.app)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15_(App_Router)-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma&logoColor=white)
![Architecture](https://img.shields.io/badge/Architecture-Clean_Architecture-C5A059)
![Tests](https://img.shields.io/badge/Methodology-SDD_%26_TDD-22C55E)

> E-commerce autoral focado em perfumaria fina de nicho, construído sob os princípios de **Clean Architecture**, **Spec-Driven Development (SDD)** e **SOLID**.

O projeto entrega uma experiência de alta conversão inspirada nas melhores práticas do ecossistema Nuvemshop, com identidade visual dark autoral (**Luxo Noturno**), catálogo curado de 12 fragrâncias, sacola lateral com cotação dinâmica de frete (**Melhor Envio**), checkout direto em etapa única para convidados com **máscaras + ViaCEP** e pagamentos via **Mercado Pago**.

🌐 **Ambiente publicado (Sandbox/Demo):** [https://rare-essence.vercel.app](https://rare-essence.vercel.app)

---

## 🏛️ Destaques Arquiteturais & Engenharia

Diferente de e-commerces convencionais que acoplam telas diretamente a ORMs, este sistema foi projetado como um **Monólito Modular** com isolamento estrito de domínio:

- **Clean Architecture:** Camada `domain/` 100% isolada, sem dependência de Prisma, bibliotecas de UI ou Next.js.
- **Spec-Driven Development (SDD):** Requisitos, regras de negócio e critérios *Given/When/Then* documentados no [`PROJECT-CONTEXT.md`](./PROJECT-CONTEXT.md).
- **Test Harness Robusto:**
  - **Unit Tests:** Domínio puro, regras de desconto Pix, frete grátis e máquinas de estado executados em milissegundos.
  - **Contract Tests:** Garantia de equivalência (Princípio de Substituição de Liskov) entre adaptadores reais e fakes em memória.
  - **Integration Tests:** Casos de uso de pedidos, rate limit e estoque testados contra banco PostgreSQL real.
  - **E2E Tests:** Fluxos críticos de ponta a ponta com Playwright.
- **Value Objects Monetários:** `Money` imutável opera exclusivamente em centavos inteiros, converte valores e retorna falhas tipadas para operações inválidas.
- **Result Funcional:** Padrão `Result<S, E>` para tratar erros esperados de negócio sem exceções no domínio.
- **Estoque Concorrente:** Reservas, baixas e liberações são validadas no domínio e serializadas por variação com lock transacional no PostgreSQL.
- **Precificação no Servidor:** Subtotal, frete grátis no PAC (a partir de R$ 350,00), desconto de 5% no Pix e parcelamento em até 6x sem juros são calculados no servidor em centavos.
- **Pedidos Imutáveis:** Itens e preços gravados como snapshots independentes do catálogo, com máquina de estados estrita (`CRIADO → PAGO → EM_SEPARACAO → ENVIADO → ENTREGUE`).
- **Pagamentos & Webhook (Sandbox):** Adapter Mercado Pago restrito a tokens `TEST-` com chave de idempotência, assinatura HMAC validada, consulta direta ao provedor e registro idempotente por evento.
- **Frete em Sandbox:** Port de cotação PAC/SEDEX, adapter Melhor Envio configurado em sandbox e `FakeFreteGateway` determinístico para testes sem rede.
- **Acesso Administrativo:** Autenticação única via hash `scrypt`, sessão HMAC em cookie seguro (`HttpOnly`, `SameSite=Strict`, `Secure`) e rate limit atômico persistido no PostgreSQL.

---

## 🛍️ Storefront, UX & Checkout de Convidado

- **Vitrine & Navegação:** Barra de benefícios rotativa, cabeçalho fixo com rolagem suave (`A coleção`, `Confiança`, `Manifesto`), filtros por família olfativa (`Cítrico`, `Amadeirado`, `Especiado`, `Oriental`), grade de 3 colunas no desktop e carrossel no mobile.
- **Página de Produto (PDP):** Seletor dinâmico de volume (`ml`), recálculo instantâneo de Pix/parcelamento, pirâmide olfativa por grupo de notas (topo, coração e base) e dados estruturados JSON-LD.
- **Identidade Institucional & Concierge:** Seção editorial **O Manifesto**, pilares de confiança, rodapé institucional global (endereço, horário e canais), favicon autoral (`src/app/icon.svg`), otimização de imagens `AVIF`/`WebP` (`next.config.ts`) e botão flutuante de atendimento via **WhatsApp** (ocultado automaticamente quando a sacola está aberta ou no `/admin`).
- **Sacola Lateral & Checkout:**
  - Exibição das fotos reais dos frascos com pedestal `.studio-frame` + `mix-blend-multiply`.
  - Cotação de frete PAC/SEDEX pelo CEP via Melhor Envio Sandbox.
  - **Máscaras de entrada em tempo real** para CEP (`00000-000`), CPF (`000.000.000-00`) e Telefone (`(11) 99999-9999`), com **validação algorítmica imediata de CPF** antes do envio.
  - **Autopreenchimento de endereço via ViaCEP** (rua, bairro, cidade e UF) ao avançar para o checkout.
  - Criação de pedido com reserva temporária de estoque e geração de **QR Code + Pix Copia e Cola** via Mercado Pago.
- **Painel `/admin`:** Acesso protegido para acompanhamento dos pedidos e avanço válido de status.

---

## 💳 Pagamentos em Ambiente de Teste (Mercado Pago)

O fluxo atual utiliza exclusivamente credenciais de teste do Mercado Pago (o adapter rejeita tokens de produção `APP_USR-` e os testes automatizados não fazem chamadas externas).

- Configure `MERCADO_PAGO_ACCESS_TOKEN` (`TEST-...`) e `MERCADO_PAGO_WEBHOOK_SECRET` no `.env` local / Vercel.
- `POST /api/pagamentos/{pedidoId}` recebe `{ "formaPagamento": "PIX" }` (ou payload tokenizado para cartão). Dados brutos de cartão nunca são recebidos nem armazenados pelo servidor.
- `POST /api/webhooks/mercado-pago` valida assinatura HMAC, consulta o pagamento na API do Mercado Pago e aplica a transição de forma idempotente.

---

## 🚚 Cotação de Frete em Ambiente de Teste (Melhor Envio)

- Configure `MELHOR_ENVIO_SANDBOX="true"`, `MELHOR_ENVIO_TOKEN` (obtido em `sandbox.melhorenvio.com.br`), `MELHOR_ENVIO_USER_AGENT` e `CEP_ORIGEM`.
- Para desenvolvimento local sem rede, o `FakeFreteGateway` retorna cotações determinísticas de PAC (R$ 20,00 / 5 dias) e SEDEX (R$ 35,00 / 2 dias).

---

## 🔐 Identidade e Segurança do Administrador

O acesso ao `/admin` pertence a um único administrador configurado por `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` e `ADMIN_SESSION_SECRET`.

- Gere o hash `scrypt` (mínimo 12 caracteres) com `npm run admin:hash`.
- Gere o segredo de sessão com:
  ```bash
  node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
Proteções ativas: sessão HMAC de até 8 horas, rate limit atômico no PostgreSQL (login: 5 tentativas/15 min; cotação: 30 req/min; checkout: 5 req/min; pagamentos: 10 req/min) e falha fechada em caso de indisponibilidade do limitador.
🚀 Produção — Vercel + Neon
A aplicação está publicada na Vercel (https://rare-essence.vercel.app) conectada ao PostgreSQL serverless da Neon (DATABASE_URL pooled + DIRECT_URL), com SEO técnico (robots.txt, sitemap.xml, OpenGraph), logs JSON e endpoint GET /api/health.
Catálogo em Produção: O seed npm run demo:reset possui trava de segurança para rodar apenas localmente (rare_essence_demo). Para popular/atualizar os 12 perfumes em produção de forma idempotente (upsert), utiliza-se scripts/seed-catalogo-producao.ts.
Consulte o runbook de produção para detalhes de ambiente, migrations e rollback.
Pendências conhecidas antes do Go-Live comercial
Validar webhook do Mercado Pago ponta a ponta em sandbox e conectar a baixa definitiva de estoque (ConfirmarBaixaEstoque / RN-017).
Implementar rotina de expiração de Pix (30 min) para liberar reservas vencidas e polling automático na tela do QR Code.
Conectar Cartão de Crédito transparente no CartDrawer (SDK/Bricks do Mercado Pago) e cupons de desconto persistidos.
Implementar página pública /pedido, campo de código de rastreio + e-mail transacional e aba de Estoque/Catálogo no /admin.
Substituir os dados de contato fictícios em CONTATO_LOJA (src/app/store/cart-provider.tsx) e virar credenciais de Sandbox para Produção.
🎨 Design System — Luxo Noturno (Paleta 2)
A interface utiliza tipografia editorial (Cormorant Garamond + Plus Jakarta Sans) e contraste refinado para alta perfumaria:
Fundo Principal (brand-bg): #0F0E0E
Superfície / Cards (brand-surface): #1A1817
Texto Principal (brand-text): #F5F5F4
Texto Secundário (brand-muted): #A8A29E
Acento Principal (brand-accent): #C5A059 (Champagne)
Acento Hover / Destaque (brand-gold): #D4AF37 (Ouro)
Badge Pix / Sucesso (brand-pix): #10B981 (Esmeralda)
Bordas (brand-border): #2B2725
Pedestal dos Frascos (.studio-frame): #F8F7F4 com mix-blend-multiply
🗂️ Estrutura de Módulos (Clean Monolith)
Text
src/
├─ modules/
│  ├─ catalogo/       # Fragrâncias, variações em ml, pirâmide olfativa e famílias
│  ├─ estoque/        # Reservas atômicas e saldo disponível
│  ├─ carrinho/       # Cálculos de frete, descontos e parcelamento
│  ├─ pedidos/        # Máquina de estados e snapshot de compra
│  ├─ pagamentos/     # Port de pagamento, Mercado Pago e idempotência de webhook
│  ├─ frete/          # Port de cotação e Adapter Melhor Envio
│  └─ admin/          # Autenticação única e gestão de pedidos
├─ shared/            # Kernel: Money VO, Result pattern, Clock, Rate Limit e Prisma
└─ app/               # Camada de Interface (Next.js App Router + API Routes)
🛠️ Stack Tecnológica
Front-end & Server: Next.js 15 (App Router), React 19, Tailwind CSS, Lucide Icons
Linguagem & Tipagem: TypeScript 5.7 (modo estrito)
Persistência & ORM: PostgreSQL (Neon em produção / Docker local), Prisma 5.22
Validação de Bordas: Zod
Testes: Vitest (Unit / Contract / Integration), Playwright (E2E)
Integrações: Mercado Pago (Sandbox), Melhor Envio (Sandbox), ViaCEP
📖 Documentação & Especificações
📄 PROJECT-CONTEXT.md — Fonte única da verdade: RFs, RNs, Casos de Uso e Roadmap.
📐 ADR-001: Monólito Modular e Clean Architecture — Decisões arquiteturais e trade-offs.
🚀 Runbook de Produção (Vercel + Neon) — Guia de provisionamento, variáveis e operação.
🚀 Como executar localmente
Copie .env.example para .env e preencha DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_APP_URL, ADMIN_EMAIL, ADMIN_PASSWORD_HASH, ADMIN_SESSION_SECRET e, se for testar integrações externas, as chaves sandbox do Mercado Pago e Melhor Envio.
No Windows, execute npm run demo:reset para aplicar as migrations e popular exclusivamente o banco local rare_essence_demo com os 12 perfumes.
Execute npm run dev:demo e acesse o endereço local exibido pelo Next.js.
📄 Licença
Este projeto está sob a licença MIT.