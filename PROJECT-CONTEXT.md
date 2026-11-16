# Rare Essence — Project Context & Specification
> **Versão:** 0.5.0
> **Status:** Preparação local da Fase 10 implementada parcialmente — Fase 9 e deploy de produção permanecem incompletos
> **Fonte Única de Verdade (Single Source of Truth)**

---

## 1. Visão e Objetivos
A **Rare Essence** é um e-commerce de perfumaria fina e de nicho com experiência de compra de alta conversão, inspirada nas melhores práticas de UX da plataforma Nuvemshop (referência estrutural: *The King of Parfums*), implementada com código 100% autoral, arquitetura limpa (Clean Architecture), abordagem orientada por especificações (Spec-Driven Development) e testes rigorosos (Harness).

O objetivo é entregar uma réplica refinada e enxuta: vitrine imersiva com dark mode sofisticado (Noir & Ametista), catálogo com até 12 fragrâncias selecionadas com variação por volume (`ml`), cálculo de frete dinâmico no carrinho lateral, comparativo de preço Pix vs. parcelado e checkout rápido como convidado.

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
- Catálogo contendo no máximo 12 perfumes no seed oficial.

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
- `RF-001`: O sistema deve listar o catálogo com até 12 fragrâncias na vitrine pública.
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
- `RF-015`: O sistema deve consultar o saldo disponível (`fisico - reservado`) de qualquer SKU em tempo real.
- `RF-016`: O sistema deve permitir a reposição ou ajuste manual do saldo físico de um SKU pelo painel administrativo.

---

## 5. Requisitos Não Funcionais (RNF)
- `RNF-001`: **Moeda e Precisão:** Valores monetários devem ser manipulados exclusivamente em centavos (inteiros) via Value Object `Money`.
- `RNF-002`: **Identidade Visual:** A UI deve respeitar estritamente a **Paleta 2 (Noir & Ametista)** com suporte a alta acessibilidade de contraste (WCAG AA).
- `RNF-003`: **Performance:** First Contentful Paint (FCP) < 1.2s e Largest Contentful Paint (LCP) < 2.0s em conexões 4G simuladas.
- `RNF-004`: **Segurança de Entrada:** 100% dos dados nas bordas HTTP/Server Actions validados com Zod; injeção de parâmetros crus no domínio é proibida.
- `RNF-005`: **Isolamento de Domínio:** O módulo de domínio não pode importar Prisma, React, Next.js ou bibliotecas de terceiros além de utilitários puros.
- `RNF-006`: **Idempotência:** Endpoints de webhook devem suportar requisições duplicadas com chave única baseada no ID do evento externo.
- `RNF-007`: **SEO Técnico:** Metatags dinâmicas OpenGraph, JSON-LD de `Product` para cada perfume e geração automatizada de `sitemap.xml`.
- `RNF-008`: **Tolerância a Concorrência:** O módulo de estoque deve garantir zero *over-selling* (venda sem saldo físico) mesmo sob requisições paralelas concorrentes contra o mesmo SKU, utilizando bloqueio a nível de linha (*pessimistic lock*) ou controle transacional estrito.
- `RNF-009`: **Autenticação Administrativa:** Deve existir uma única identidade administrativa, validada por senha armazenada como hash scrypt e sessão HMAC de até 8 horas em cookie `HttpOnly`, `SameSite=Strict` e `Secure` em produção.
- `RNF-010`: **Rate Limit:** Login administrativo deve aceitar até 5 tentativas por IP a cada 15 minutos e criação de pagamentos até 10 requisições por IP por minuto. Os contadores são atômicos e compartilhados via PostgreSQL; indisponibilidade do limitador falha fechada. O webhook permanece protegido por HMAC e idempotência, sem limite por IP para não bloquear retentativas legítimas.

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
- `RN-010`: Cada fragrância deve possuir um `Slug` único derivado de seu nome em formato kebab-case (ex.: `oud-royal`).
- `RN-011`: O `SKU` de cada variação deve ser globalmente único, padronizado em caixa alta e hifens (ex.: `RARE-OUD-100ML`).
- `RN-012`: O preço de uma variação deve ser estritamente positivo ($> 0$ centavos) e o volume em ml deve ser maior que zero.
- `RN-013`: Uma fragrância só pode ser marcada como ativa se possuir ao menos uma variação cadastrada.
- `RN-014`: A pirâmide olfativa de cada fragrância é composta obrigatoriamente por três grupos de notas: notas de topo (saída), notas de coração (corpo) e notas de base (fundo).
- `RN-015`: O **Saldo Disponível** é uma propriedade calculada imutável: $\text{Disponível} = \text{Físico} - \text{Reservado}$. O saldo disponível jamais pode ser negativo.
- `RN-016`: Uma reserva de estoque só é aceita se $\text{Disponível} \ge \text{Quantidade Solicitada}$. Caso contrário, a operação é rejeitada com `EstoqueInsuficienteError`.
- `RN-017`: A confirmação de baixa definitiva liquida a reserva e subtrai o estoque físico: $\text{Físico} \leftarrow \text{Físico} - Q$ e $\text{Reservado} \leftarrow \text{Reservado} - Q$. É proibido baixar sem reserva prévia compatível.
- `RN-018`: O cancelamento ou expiração de uma reserva reverte apenas o saldo reservado: $\text{Reservado} \leftarrow \text{Reservado} - Q$, sem alterar o saldo físico.

---

## 7. Casos de Uso Principais (UC)

### `UC-001`: Calcular Totais do Carrinho com Frete e Desconto
- **Given:** Um carrinho com 1 unidade de perfume "Oud Royal 100ml" (R$ 380,00) e CEP "01001-000".
- **When:** O cliente solicita o cálculo informando o CEP.
- **Then:** O frete PAC deve ser retornado como R$ 0,00 (por atingir `RN-006`), o total no Pix deve exibir R$ 361,00 (5% de desconto via `RN-001`), e o total parcelado deve exibir R$ 380,00 em até 6x de R$ 63,33 sem juros, ajustando centavos residuais na última parcela.
- **Cupom + Pix:** Se ambos forem aplicados, o cupom reduz primeiro o subtotal e os 5% do Pix incidem sobre o valor restante. O limite de frete grátis considera o subtotal dos produtos antes dos descontos.

### `UC-002`: Criar Pedido com Checkout Convidado
- **Given:** Um carrinho válido e os dados pessoais/entrega do cliente sem autenticação prévia.
- **When:** O cliente submete a finalização com opção de pagamento Pix.
- **Then:** O sistema cria o pedido no estado `CRIADO`, faz a reserva do estoque do SKU, gera a chave Pix via port do Mercado Pago e retorna o payload com validade de 30 minutos.
- **Fronteira aprovada para a Fase 6:** o endpoint de pagamento recebe um pedido já criado; a criação coordenada do pedido com reserva de estoque permanece pendente para a orquestração de checkout.

### `UC-003`: Processar Confirmação de Webhook de Pagamento
- **Given:** Um pedido existente com status `CRIADO` e reserva pendente.
- **When:** O webhook do Mercado Pago notifica `payment.approved` com o `payment_id` correspondente.
- **Then:** O sistema valida o pagamento no provedor, transiciona o pedido para `PAGO` e registra o evento de forma idempotente.
- **Fronteira aprovada para a Fase 6:** o módulo de pagamentos valida o pagamento e atualiza o pedido/evento de forma idempotente. A reserva inicial e a liquidação/liberação do estoque ficam para a futura orquestração de checkout.

### `UC-004`: Obter Detalhes da Fragrância por Slug (PDP)
- **Given:** Um slug existente no catálogo (ex.: `"oud-royal"`).
- **When:** A consulta de produto for solicitada pela PDP pública.
- **Then:** O sistema deve retornar a fragrância com suas variações ativas ordenadas por volume, marca, categoria e pirâmide olfativa. Se o slug não existir ou estiver inativo, deve retornar `ProdutoNaoEncontradoError`.

### `UC-005`: Listar Fragrâncias do Catálogo (Vitrine)
- **Given:** Fragrâncias cadastradas no banco de dados.
- **When:** A vitrine for requisitada com filtros opcionais (categoria, marca, apenas ativas).
- **Then:** O sistema deve retornar uma lista paginada de produtos agregados com suas variações e totalizador de registros.
### `UC-006`: Reservar Estoque para Checkout
- **Given:** Um SKU com 5 unidades físicas e 0 reservadas (disponível: 5).
- **When:** O caso de uso `ReservarEstoque` for executado com quantidade 2.
- **Then:** O saldo físico permanece 5, o saldo reservado torna-se 2 e o saldo disponível torna-se 3.
- **Critério de Falha:** Se solicitado quantidade 6, a operação falha com `EstoqueInsuficienteError` e o estado permanece inalterado.

### `UC-007`: Confirmar Baixa Definitiva de Estoque
- **Given:** Um SKU com 5 unidades físicas e 2 unidades reservadas.
- **When:** O caso de uso `ConfirmarBaixaEstoque` for executado com quantidade 2.
- **Then:** O saldo físico passa a ser 3, o saldo reservado passa a ser 0 e o saldo disponível permanece 3.

### `UC-008`: Liberar Reserva de Estoque Expirada/Cancelada
- **Given:** Um SKU com 5 unidades físicas e 2 unidades reservadas.
- **When:** O caso de uso `LiberarReservaEstoque` for executado com quantidade 2.
- **Then:** O saldo físico permanece 5, o saldo reservado passa a ser 0 e o saldo disponível volta a ser 5.

### `UC-009`: Autenticar o Administrador Único
- **Given:** E-mail, hash scrypt e segredo de sessão configurados no ambiente.
- **When:** O administrador informa as credenciais corretas em `/admin/login`.
- **Then:** A aplicação cria uma sessão assinada com validade de até 8 horas; rotas `/admin/*` e `/api/admin/*` exigem uma sessão válida, exceto login/logout.
- **Critério de Falha:** Credenciais inválidas recebem a mesma mensagem; após 5 tentativas em 15 minutos, o login retorna HTTP 429.

---

## 8. Modelo de Domínio

### Entidades e Agregados:
- **`Produto` (Agregado Raiz):** Identificador, nome, slug (`Slug`), descrição, marca (`Marca`), categoria (`Categoria`), pirâmide olfativa (`PiramideOlfativa`), ativo, variações (`Variacao[]`), criadoEm, atualizadoEm.
- **`Variacao` (Entidade interna):** Identificador, produtoId, volume (`Volume`), sku (`Sku`), preco (`Money`), pesoGramas, ativo.
- **`Marca` (Entidade de apoio):** Identificador, nome, slug.
- **`Categoria` (Entidade de apoio):** Identificador, nome, slug.
- **`Pedido` (Agregado Raiz):** Identificador, codigoRastreavel, cliente (VO: nome, email, cpf, telefone), enderecoEntrega (VO), itens (VO: snapshot do SKU e preço), frete (VO: modalidade, prazo, valor), status, formaPagamento, totalEmCentavos, criadoEm, atualizadoEm.
- **`Cupom` (Entidade):** Código, tipo (percentual/fixo), valor, valorMinimo, ativo, expiraEm.
- **`EstoqueItem` (Agregado Raiz do Bounded Context de Estoque):** Identificador (`id`), referência da variação (`variacaoId`), quantidade física (`quantidadeFisica`), quantidade reservada (`quantidadeReservada`), criadoEm, atualizadoEm.

### Value Objects (VO):
- `Money`: Montante em centavos e código da moeda (`BRL`).
- `Volume`: Quantidade numérica inteira e unidade padronizada (`ml`).
- `Sku`: String formatada e normalizada em caixa alta (ex.: `RARE-NOIR-50ML`).
- `Slug`: String normalizada para URL amigável e segura (kebab-case).
- `PiramideOlfativa`: Objeto com listas de notas olfativas: `topo: string[]`, `coracao: string[]`, `base: string[]`.
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
// Kernel Compartilhado: Padrão Result
export type Result<S, E> = Success<S, E> | Failure<S, E>;

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

// Catálogo: Repositório e Filtros
export interface FiltrosCatalogo {
  categoriaSlug?: string;
  marcaSlug?: string;
  apenasAtivos?: boolean;
  pagina?: number;
  itensPorPagina?: number;
}

export interface ProdutoRepository {
  salvar(produto: Produto): Promise<void>;
  buscarPorId(id: string): Promise<Produto | null>;
  buscarPorSlug(slug: string): Promise<Produto | null>;
  buscarPorSku(sku: string): Promise<Produto | null>;
  listar(filtros?: FiltrosCatalogo): Promise<{ produtos: Produto[]; total: number }>;
  existeComSlug(slug: string): Promise<boolean>;
}

export interface EstoqueRepository {
  salvar(item: EstoqueItem): Promise<void>;
  buscarPorVariacaoId(variacaoId: string): Promise<EstoqueItem | null>;
  executarComLock<T>(
    variacaoId: string,
    operacao: (
      item: EstoqueItem | null,
      salvar: (item: EstoqueItem) => Promise<void>
    ) => Promise<T>
  ): Promise<T>;
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

- [x] **Fase 0 — Fundação:** Setup, tooling, CI, Docker Compose, PROJECT-CONTEXT v0.1, ADR-001 e teste de fumaça (dummy).

- [x] **Fase 1 — Kernel Compartilhado: Money, Result/Either, erros, Clock e IdGenerator.

- [x] **Fase 2 — Catálogo: Entidades de Perfume, Variação (ml), seed de 10 fragrâncias e ProdutoRepository (Fake + Prisma).

- [x] **Fase 3 — Estoque: Saldos, reservas atômicas e proteção contra over-selling.

- [x] **Fase 4 — Carrinho e Precificação: Cálculo de subtotal, cupom, frete grátis e cálculo Pix/parcelamento.

- [x] **Fase 5 — Pedidos: Snapshot de preços, agregação e máquina de estados estrita.

- [x] **Fase 6 — Pagamentos: Port de pagamento, adapter Mercado Pago (Pix/Cartão) e webhook com idempotência. Integração validada localmente; teste sandbox externo aguarda credenciais `TEST-`.

- [x] **Fase 7 — Frete:** Port de cotação, adapter Melhor Envio restrito ao sandbox (PAC/SEDEX) e fake determinístico. Validação externa aguarda token de sandbox, CEP de origem e User-Agent válidos.

- [x] **Fase 8 — Identidade e Segurança:** Administrador único por credenciais configuradas, sessão HMAC em cookie seguro, proteção de `/admin/*` e `/api/admin/*`, rate limit PostgreSQL para login, cotação/checkout e criação de pagamentos.

- [ ] **Fase 9 — Interfaces (Storefront & Admin):** Vitrine, PDP com seletor de volume, carrinho lateral, checkout convidado Pix e painel de pedidos iniciados. Permanecem pendentes: cupom persistido, tokenização de cartão, rastreio (campo ausente no schema) e rotina de expiração/liberação de reservas.

- [ ] **Fase 10 — Produção (Vercel + Neon):** Preparação local de SEO, health check, logs JSON e runbook implementada. Pendentes: provisionamento e deploy manual, ambiente/secrets/domínio, alertas, cadastro seguro do catálogo e validação em Production; go-live também depende dos bloqueios da Fase 9.

- [ ] **Fase 11 — Evoluções: Melhorias planejadas sob demanda via novos ADRs.

13. Convenções
Idioma de Negócio: Código e testes em português brasileiro contextualizado (ex.: calcularTotal(), PedidoNaoEncontradoError).
Commits: Conventional Commits em português (ex.: feat(catalogo): adiciona entidade de produto e variacao).
Design Tokens (Paleta 2 - Noir & Ametista):
--bg-primary: #0E1013
--bg-surface: #181B20
--text-main: #F4F4F6
--text-muted: #9CA3AF
--brand-accent: #C084FC
--badge-pix: #10B981
--border-subtle: #282D37

## 14. Changelog de Decisões
- 2026-11-02: Definição do escopo oficial como e-commerce autoral de perfumaria fina (Rare Essence).
- 2026-11-02: Adoção da Paleta 2 (Noir & Âmbar) como design system primário.
- 2026-11-02: Simplificação do MVP para checkout de convidado e autenticação restrita apenas para admin único (YAGNI em contas completas de compradores).
- 2026-11-02: Conclusão da Fase 0 (Fundação) e Fase 1 (Kernel Compartilhado com 17 testes verdes e CI).
- 2026-11-03: Especificação formal da Fase 2 (Catálogo): modelagem do agregado `Produto` com pirâmide olfativa (`PiramideOlfativa`), VOs `Sku`, `Slug`, `Volume` e contrato `ProdutoRepository`.
- 2026-11-03: Conclusão da Fase 2 (Catálogo) com 48 testes automatizados no CI/Local.
- 2026-11-03: Especificação formal da Fase 3 (Estoque): definição das regras `RN-015` a `RN-018`, casos de uso `UC-006` a `UC-008`, e isolamento do agregado `EstoqueItem` desacoplado do catálogo.
- 2026-11-15: Conclusão da Fase 3 (Estoque), migration PostgreSQL aplicada, reservas concorrentes verificadas e suíte completa aprovada (63 testes).
- 2026-11-15: Conclusão da Fase 4 (Carrinho e Precificação), com cupom antes do desconto Pix, limite do frete grátis baseado no subtotal bruto, parcelamento sem perda de centavos e 74 testes aprovados.
- 2026-11-15: Conclusão da Fase 5 (Pedidos), com snapshots validados, máquina de estados e expiração Pix, persistência PostgreSQL e 82 testes aprovados; integração com gateways e liquidação/liberação de estoque permanecem nas fases seguintes.
- 2026-11-15: Implementação local da Fase 6 (Pagamentos): port Pix/cartão, adapter Mercado Pago restrito a token `TEST-`, assinatura HMAC do webhook, consulta independente do pagamento e idempotência persistida por evento; migration aplicada e suíte completa com 100 testes aprovada. Validação externa aguarda credenciais sandbox; reserva/liquidação de estoque foi explicitamente adiada para a orquestração de checkout.
- 2026-11-15: Implementação local da Fase 7 (Frete): port e caso de uso de cotação, fake determinístico PAC/SEDEX e adapter Melhor Envio fixado no sandbox; 8 testes focados e type-check aprovados. Validação externa aguarda credenciais de sandbox.
- 2026-11-15: Implementação local da Fase 8 (Identidade e Segurança): autenticação do administrador único com hash scrypt, sessão HMAC em cookie protegido, rate limit PostgreSQL atômico para login/pagamentos e middleware de proteção; contrato concorrente e testes unitários aprovados.
- 2026-11-15: Início da Fase 9: vitrine Noir & Âmbar, PDP com preços calculados no servidor, carrinho lateral, cotação de frete, checkout convidado com reserva de estoque compensável e painel administrativo de pedidos. Validação de sandbox depende de credenciais; cupom persistido, tokenização de cartão, rastreio e liberação automatizada após expiração seguem pendentes.
- 2026-11-16: Início da Fase 10 (Vercel + Neon): metadados SEO, robots/sitemap, endpoint de prontidão, logs estruturados, conexão Prisma pooled/direct e runbook preparados no repositório. Deploy, secrets, domínio, alertas, catálogo e blockers de produção seguem pendentes.
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