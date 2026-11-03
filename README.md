# ⚜️ Rare Essence — Haute Parfumerie E-Commerce

[![CI Pipeline](https://github.com/SEU-USUARIO/rare-essence/actions/workflows/ci.yml/badge.svg)](https://github.com/SEU-USUARIO/rare-essence/actions)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15_(App_Router)-000000?logo=nextdotjs&logoColor=white)
![Architecture](https://img.shields.io/badge/Architecture-Clean_Architecture-E0234E)
![Tests](https://img.shields.io/badge/Methodology-SDD_%26_TDD-22C55E)

> E-commerce autoral e focado em perfumaria fina de nicho, construído sob os princípios de **Clean Architecture**, **Spec-Driven Development (SDD)** e **SOLID**. 

O projeto reproduz a experiência e fluidez de navegação inspirada em lojas de alta conversão do ecossistema Nuvemshop, com design dark elegante autoral (**Noir & Âmbar**), checkout direto em etapa única para convidados, pagamentos via Mercado Pago e cálculo de frete via Melhor Envio.

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
- **Value Objects Monetários:** Manipulação financeira estritamente em centavos inteiros via VO `Money`, prevenindo erros de ponto flutuante.
- **Idempotência Garantida:** Webhooks de pagamento imunes a processamento duplicado acidental.

---

## 🎨 Design System — Noir & Âmbar

A interface foi concebida para transmitir elegância, profundidade e exclusividade:
- **Fundo Principal (`bg-primary`):** `#0E1013` (Ônix Profundo)
- **Superfície dos Cards (`bg-surface`):** `#181B20` (Grafite Escuro)
- **Texto Principal (`text-main`):** `#F4F4F6` (Branco Acetinado)
- **Destaque da Marca (`brand-accent`):** `#D97736` (Âmbar Conhaque)
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
🚀 Como Executar Localmente (Em breve - Fase 0)
(Instruções detalhadas de inicialização serão adicionadas ao concluir o harness da Fase 0)
Licença
Este projeto é de código aberto sob a licença MIT.