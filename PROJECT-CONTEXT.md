# Rare Essence — Project Context & Specification
> **Versão:** 0.1.0  
> **Status:** Fase 0 — Em Definição Inicial  
> **Fonte Única de Verdade (Single Source of Truth)**

---

## 1. Visão e Objetivos
A **Rare Essence** é um e-commerce de perfumaria fina e de nicho com experiência de compra de alta conversão, inspirada nas melhores práticas de UX da plataforma Nuvemshop (referência estrutural: *The King of Parfums*), implementada com código 100% autoral, arquitetura limpa (Clean Architecture), abordagem orientada por especificações (Spec-Driven Development) e testes rigorosos (Harness).

O objetivo é entregar uma réplica refinada e enxuta: vitrine imersiva com dark mode sofisticado (Noir & Âmbar), catálogo com até 10 fragrâncias selecionadas com variação por volume (`ml`), cálculo de frete dinâmico no carrinho lateral, comparativo de preço Pix vs. parcelado e checkout rápido como convidado.

---

## 2. Escopo e Não-Escopo

### No Escopo (MVP):
- Vitrine escura elegante com barra de avisos/benefícios, destaques olfativos e rodapé institucional.
- Página de produto (PDP) com seletor de variação em `ml` (ex.: 50ml, 100ml), cálculo de parcelamento sem juros e desconto Pix.
- Gaveta lateral de carrinho (Slide-over Cart) com inserção de cupom e cotação de frete por CEP em tempo real.
- Checkout direto em etapa única para convidados (sem obrigatoriedade de criação prévia de conta).
- Painel administrativo restrito para o administrador da loja gerenciar pedidos, estoque e produtos.
- Integração de pagamentos com **Mercado Pago** (Pix com QR Code/Copia e Cola e Cartão de Crédito transparente).
- Integração de frete com **Melhor Envio** (cotações de PAC e SEDEX dos Correios) com adapter simulado para testes locais.
- Catálogo contendo no máximo 10 perfumes no seed oficial.

### Fora de Escopo (YAGNI — Somente via ADR futuro):
- Contas de clientes com painel logado e histórico complexo.
- Venda de decants (amostras fracionadas) ou kits personalizados.
- Avaliações e comentários de usuários na página de produto.
- Marketplace multi-vendedor e multi-tenant.
- Microserviços, aplicativo móvel nativo ou motor de recomendação por IA.
- Mega-menu hierárquico complexo de categorias.

---

## 3. Glossário (Linguagem Ubíqua)
- **Fragrância / Produto:** O produto pai exibido no catálogo (ex.: "Oud Royal").
- **Variação / SKU:** A opção comprável associada a um volume específico em mililitros (ex.: "Oud Royal - 100ml").
- **Mililitro (`ml`):** Atributo primário de diferenciação e precificação do SKU.
- **Preço Cheio (`Price`):** Preço de tabela do SKU em centavos de Real.
- **Preço Pix:** Valor calculado aplicando o desconto à vista parametrizado.
- **Parcelamento:** Divisão do preço cheio em até $N$ parcelas sem juros.
- **Snapshot de Preço:** Cópia estática e imutável dos valores no momento em que o item entra no pedido.
- **Checkout Convidado:** Fluxo de compra onde a identidade do comprador é atrelada diretamente ao seu e-mail e CPF no pedido, sem exigir senha.
- **Slide-over Cart:** Gaveta que desliza da borda direita da tela contendo o resumo dos itens, cálculo de frete e cupom.
- **Idempotência:** Garantia matemática de que a repetição de uma mesma requisição (ex.: webhook do Mercado Pago) não causará efeitos colaterais duplicados.

---

## 4. Requisitos Funcionais (RF)
- `RF-001`: O sistema deve listar o catálogo com até 10 fragrâncias na vitrine pública.
- `RF-002`: O sistema deve permitir visualizar a PDP com seleção dinâmica de volume (`ml`).
- `RF-003`: O sistema deve recalcular os valores de Pix e parcelas instantaneamente ao alternar o volume.
- `RF-004`: O sistema deve exibir a gaveta de carrinho ao adicionar um item, sem recarregar a página.
- `RF-005`: O sistema deve cotar opções de frete (PAC e SEDEX) via Melhor Envio a partir de um CEP válido.
- `RF-006`: O sistema deve aplicar cupons de desconto válidos sobre o subtotal do carrinho.
- `RF-007`: O sistema deve permitir checkout de convidado coletando Nome, E-mail, CPF, Telefone e Endereço de Entrega.
- `RF-008`: O sistema deve processar pagamentos via Pix gerando o payload e QR Code do Mercado Pago.
- `RF-009`: O sistema deve processar pagamentos com Cartão de Crédito via tokenização transparente do Mercado Pago.
- `RF-010`: O sistema deve receber webhooks de pagamento do Mercado Pago e atualizar o status do pedido de forma idempotente.
- `RF-011`: O sistema deve reservar o estoque temporariamente na criação do pedido e baixá-lo definitivamente na confirmação do pagamento.
- `RF-012`: O sistema deve cancelar o pedido e estornar a reserva caso o Pix expire sem pagamento.
- `RF-013`: O sistema deve permitir autenticação exclusiva de Administrador via credenciais seguras para acesso ao `/admin`.
- `RF-014`: O sistema deve permitir ao Administrador listar pedidos, visualizar detalhes e atualizar status de rastreio de envio.

---

## 5. Requisitos Não Funcionais (RNF)
- `RNF-001`: **Moeda e Precisão:** Valores monetários devem ser manipulados exclusivamente em centavos (inteiros) via Value Object `Money`.
- `RNF-002`: **Identidade Visual:** A UI deve respeitar estritamente a **Paleta 2 (Noir & Âmbar)** com suporte a alta acessibilidade de contraste (WCAG AA).
- `RNF-003`: **Performance:** First Contentful Paint (FCP) < 1.2s e Largest Contentful Paint (LCP) < 2.0s em conexões 4G simuladas.
- `RNF-004`: **Segurança de Entrada:** 100% dos dados nas bordas HTTP/Server Actions validados com Zod; injeção de parâmetros crus no domínio é proibida.
- `RNF-005`: **Isolamento de Domínio:** O módulo de domínio não pode importar Prisma, React, Next.js ou bibliotecas de terceiros além de utilitários puros.
- `RNF-006`: **Idempotência:** Endpoints de webhook devem suportar requisições duplicadas com chave única baseada no ID do evento externo.
- `RNF-007`: **SEO Técnico:** Metatags dinâmicas OpenGraph, JSON-LD de `Product` para cada perfume e geração automatizada de `sitemap.xml`.

---

## 6. Regras de Negócio (RN)
- `RN-001`: O desconto para pagamento via Pix é fixado em 5% sobre o subtotal dos produtos (configurável no sistema).
- `RN-002`: O parcelamento sem juros no cartão de crédito é oferecido em até 6 vezes, com valor mínimo de parcela de R$ 30,00 (3000 centavos).
- `RN-003`: Um perfume só pode ser adicionado ao carrinho se a variação selecionada possuir saldo disponível em estoque ($\text{saldo} - \text{reserva} > 0$).
- `RN-004`: O carrinho não recalcula frete e cupom no cliente; todo o cálculo é de autoridade absoluta do servidor.
- `RN-005`: Cupons podem ser de valor fixo em centavos ou percentuais, podendo ter valor mínimo de pedido e limite de usos.
- `RN-006`: Frete grátis é concedido automaticamente se o subtotal de produtos atingir R$ 350,00 (35000 centavos), aplicando-se à modalidade mais econômica (PAC).
- `RN-007`: A máquina de estados do pedido segue rigorosamente a sequência:  
  `CRIADO` $\rightarrow$ `PAGO` $\rightarrow$ `EM_SEPARACAO` $\rightarrow$ `ENVIADO` $\rightarrow$ `ENTREGUE`.  
  Qualquer estado anterior a `ENVIADO` pode transicionar para `CANCELADO`. Pulos de etapa são expressamente proibidos.
- `RN-008`: Um pedido gerado com pagamento em Pix tem validade de 30 minutos. Expirado o tempo, o pedido transiciona para `CANCELADO` e a reserva de estoque é liberada.
- `RN-009`: O preço dos itens gravados no pedido é imutável via snapshot; alterações cadastrais posteriores nos perfumes não afetam pedidos existentes.

---

## 7. Casos de Uso Principais (UC)

### `UC-001`: Calcular Totais do Carrinho com Frete e Desconto
- **Given:** Um carrinho com 1 unidade de perfume "Oud Royal 100ml" (R$ 380,00) e CEP "01001-000".
- **When:** O cliente solicita o cálculo informando o CEP.
- **Then:** O frete PAC deve ser retornado como R$ 0,00 (por atingir `RN-006`), o total no Pix deve exibir R$ 361,00 (5% de desconto via `RN-001`), e o total parcelado deve exibir R$ 380,00 em até 6x de R$ 63,33 sem juros.

### `UC-002`: Criar Pedido com Checkout Convidado
- **Given:** Um carrinho válido e os dados pessoais/entrega do cliente sem autenticação prévia.
- **When:** O cliente submete a finalização com opção de pagamento Pix.
- **Then:** O sistema cria o pedido no estado `CRIADO`, faz a reserva do estoque do SKU, gera a chave Pix via port do Mercado Pago e retorna o payload com validade de 30 minutos.

### `UC-003`: Processar Confirmação de Webhook de Pagamento
- **Given:** Um pedido existente com status `CRIADO` e reserva pendente.
- **When:** O webhook do Mercado Pago notifica `payment.approved` com o `payment_id` correspondente.
- **Then:** O sistema transiciona o pedido para `PAGO`, converte a reserva do estoque em baixa definitiva de forma atômica e registra o evento de idempotência.

---

## 8. Modelo de Domínio

### Entidades e Agregados:
- **`Produto` (Agregado Raiz):** Identificador, nome, slug, descrição olfativa (notas de topo, corpo, fundo), ativo, variações.
- **`Variacao` (Entidade interna):** Identificador, produtoId, volume (ex.: 50, 100), unidade ("ml"), sku, precoEmCentavos, estoqueDisponivel, estoqueReservado.
- **`Pedido` (Agregado Raiz):** Identificador, codigoRastreavel, cliente (VO: nome, email, cpf, telefone), enderecoEntrega (VO), itens (VO: snapshot do SKU e preço), frete (VO: modalidade, prazo, valor), status, formaPagamento, totalEmCentavos, criadoEm, atualizadoEm.
- **`Cupom` (Entidade):** Código, tipo (percentual/fixo), valor, valorMinimo, ativo, expiraEm.

### Value Objects (VO):
- `Money`: Montante em centavos e código da moeda (`BRL`).
- `Volume`: Quantidade numérica e unidade padronizada (`ml`).
- `CPF`: Validação algorítmica de CPF brasileiro.
- `CEP`: Formato numérico de 8 dígitos validado.
- `Endereco`: Logradouro, número, complemento, bairro, cidade, UF, CEP.

---

## 9. Arquitetura e Registro de ADRs
- Monólito modular baseado em Clean Architecture dentro da estrutura do Next.js (App Router).
- Módulos independentes com acoplamento restrito:
  - `src/modules/catalogo`
  - `src/modules/estoque`
  - `src/modules/carrinho`
  - `src/modules/pedidos`
  - `src/modules/pagamentos`
  - `src/modules/frete`
  - `src/modules/admin`
  - `src/shared` (Kernel compartilhado: `Money`, `Result`, erros base, ports de infraestrutura base).

### Registro de Decisões Arquiteturais:
- **ADR-001:** Adoção de Monólito Modular com Clean Architecture e Design System Customizado.

---

## 10. Contratos: Ports Principais
```typescript
// Pagamento
export interface PagamentoGateway {
  criarCobrancaPix(params: CriarPixInput): Promise<Result<PixOutput, FalhaGateway>>;
  processarCartao(params: CriarCartaoInput): Promise<Result<CartaoOutput, FalhaGateway>>;
}

// Frete
export interface FreteGateway {
  calcularCotacoes(params: CotacaoInput): Promise<Result<OpcaoFrete[], FalhaCotacao>>;
}

// Repositórios Core (Ports)
export interface PedidoRepository {
  salvar(pedido: Pedido): Promise<void>;
  buscarPorId(id: string): Promise<Pedido | null>;
  buscarPorCodigo(codigo: string): Promise<Pedido | null>;
}
11. Estratégia de Testes e Harness
Unit Harness: Testes exaustivos de domínio (Money, regras de transição de status do Pedido, cálculo de cupons, cálculo de frete grátis) sem banco e sem rede.
Contract Harness: Testes aplicados de forma idêntica tanto para os fakes em memória quanto para os adapters reais de infraestrutura (garantindo o Princípio de Substituição de Liskov - LSP).
Integration Harness: Casos de uso de checkout e concorrência de estoque executados contra banco PostgreSQL real em contêiner Docker.
E2E Harness: Fluxo crítico automatizado via Playwright: Visitar home 
→
→
 Escolher perfume e variação 
→
→
 Adicionar ao carrinho 
→
→
 Cotar CEP 
→
→
 Checkout como convidado 
→
→
 Tela de confirmação com Pix.
12. Roadmap e Status por Fase

Fase 0 — Fundação: Setup, tooling, CI, Docker Compose, PROJECT-CONTEXT v0.1, ADR-001 e teste de fumaça (dummy).

Fase 1 — Kernel Compartilhado: Money, Result/Either, erros, Clock e IdGenerator.

Fase 2 — Catálogo: Entidades de Perfume, Variação (ml), seed de 10 fragrâncias e ProdutoRepository (Fake + Prisma).

Fase 3 — Estoque: Saldos, reservas atômicas e proteção contra over-selling.

Fase 4 — Carrinho e Precificação: Cálculo de subtotal, cupom, frete grátis e cálculo Pix/parcelamento.

Fase 5 — Pedidos: Snapshot de preços, agregação e máquina de estados estrita.

Fase 6 — Pagamentos: Port de pagamento, adapter Mercado Pago (Pix/Cartão) e webhook com idempotência.

Fase 7 — Frete: Port de frete, adapter Melhor Envio (PAC/SEDEX) e fake determinístico.

Fase 8 — Identidade e Segurança (Admin Único): Autenticação isolada do lojista e rate limit nas bordas públicas.

Fase 9 — Interfaces (Storefront & Admin): UI em Paleta 2 (Noir & Âmbar), PDP com selector ml, slide-over cart, checkout convidado e admin de pedidos.

Fase 10 — Produção: Deploy (Vercel + Neon/Render), observabilidade, metatags de SEO e runbook operacional.

Fase 11 — Evoluções: Melhorias planejadas sob demanda via novos ADRs.
13. Convenções
Idioma de Negócio: Código e testes em português brasileiro contextualizado (ex.: calcularTotal(), PedidoNaoEncontradoError).
Commits: Conventional Commits em português (ex.: feat(catalogo): adiciona entidade de produto e variacao).
Design Tokens (Paleta 2 - Noir & Âmbar):
--bg-primary: #0E1013
--bg-surface: #181B20
--text-main: #F4F4F6
--text-muted: #9CA3AF
--brand-accent: #D97736
--badge-pix: #10B981
--border-subtle: #282D37
14. Changelog de Decisões
2025-05-10: Definição do escopo oficial como e-commerce autoral de perfumaria fina (Rare Essence).
2025-05-10: Adoção da Paleta 2 (Noir & Âmbar) como design system primário.
2025-05-10: Simplificação do MVP para checkout de convidado e autenticação restrita apenas para admin único (YAGNI em contas completas de compradores).
2025-05-10: Estabelecimento do protocolo de continuidade com renovação de sessão de chat ao final de cada entrega consolidada.
code
Code
---

### Arquivo 2: `docs/adr/001-monolito-modular-e-clean-architecture.md`

`docs/adr/001-monolito-modular-e-clean-architecture.md`
```markdown
# ADR-001: Adoção de Monólito Modular com Clean Architecture

## Status
Aceito

## Contexto
O projeto **Rare Essence** consiste em um e-commerce de perfumaria fina de alta qualidade técnica e visual, com catálogo reduzido (até 10 produtos), checkout como convidado, gateway de pagamento Mercado Pago e cálculo de frete Melhor Envio.
Necessitamos de uma arquitetura que ofereça:
1. Alta manutenibilidade, permitindo testar regras complexas de negócio (desconto Pix, frete grátis, transições de status de pedido e reservas de estoque) sem dependência de banco de dados ou APIs externas.
2. Simplicidade operacional para desenvolvimento ágil e deploy direto em plataformas PaaS/Serverless (Vercel e Neon/Render), sem a complexidade desnecessária de microsserviços (KISS / YAGNI).
3. Capacidade de substituir provedores de infraestrutura (ex.: simular o Melhor Envio localmente com fakes rápidos e plugar a API real em homologação/produção) sem tocar no núcleo do domínio.

## Decisão
Adotamos o padrão de **Monólito Modular** aliado aos princípios da **Clean Architecture**:
1. Todo o código reside em um único repositório e aplicação Next.js (App Router).
2. O sistema é particionado em módulos de contexto delimitado (*bounded contexts*): `catalogo`, `estoque`, `carrinho`, `pedidos`, `pagamentos`, `frete` e `admin`.
3. Cada módulo organiza-se em três camadas com **Regra de Dependência Estrita voltada para dentro**:
   - `domain/`: Regras de negócio puras, entidades, agregados e contratos sem dependências externas.
   - `application/`: Casos de uso orquestradores e definição de ports (interfaces de entrada/saída).
   - `infra/`: Implementações concretas de banco de dados (Prisma/PostgreSQL), clientes HTTP de gateways e adaptadores.
4. A camada de `Interface` (páginas Next.js, Server Actions e Webhooks) consome exclusivamente a camada de `application`.
5. Erros esperados de negócio não lançam exceções; utilizam o padrão funcional `Result<S, E>`.

## Consequências

### Positivas:
- **Testabilidade Superior (Harness):** O domínio e os casos de uso podem ser exaustivamente validados com testes unitários que executam em milissegundos, usando fakes em memória.
- **Respeito a SOLID:** A segregação de interfaces e a inversão de dependência garantem que gateways externos (Mercado Pago, Melhor Envio) fiquem desacoplados da lógica de checkout.
- **Deploy Simplificado:** Todo o sistema pode ser buildado e publicado em uma única esteira de CI/CD sem orquestração distribuída.

### Mitigações / Trade-offs:
- **Curva de Código Inicial:** Exige a escrita de interfaces (ports) e mapeadores (Mappers/DTOs) entre as camadas, gerando mais arquivos iniciais do que uma abordagem tradicional com Prisma acoplado diretamente à UI. Esse custo é aceito e desejado para assegurar qualidade profissional de portfólio e facilidade de refatoração no SDD.