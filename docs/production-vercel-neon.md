# Runbook de produção — Vercel + Neon

## Status e limites do go-live

Este runbook prepara o deploy, mas **não significa que a loja esteja pronta para receber pedidos reais**. A Fase 9 permanece incompleta: o roadmap lista expiração/liberação de reservas, tokenização de cartão, cupons persistidos e rastreio como pendências. Os adapters de pagamento e frete também estão restritos a sandbox, e a seed atual só aceita bancos locais. Não use credenciais reais nem publique vendas até esses limites serem resolvidos e testados.

## Recursos preparados no repositório

- Prisma usa `DATABASE_URL` para a aplicação e `DIRECT_URL` para migrations sem pool.
- A instalação executa `prisma generate` via `postinstall`; `allowScripts` autoriza somente scripts das versões revisadas de Prisma, esbuild e sharp para builds com npm 11.
- `npm run db:migrate:deploy` aplica somente migrations versionadas.
- `/api/health` verifica a conexão com PostgreSQL sem revelar detalhes internos.
- Erros de requisição são registrados em JSON no log do servidor, sem payloads nem cabeçalhos de autenticação.
- Metadados Open Graph/Twitter, canonical, `robots.txt` e `sitemap.xml` estão preparados.

## Configuração manual — Neon

1. Crie um projeto Neon na mesma região da aplicação Vercel e mantenha branches separados para produção e preview.
2. Copie a conexão **pooled** do Neon para `DATABASE_URL` e a conexão **direct/unpooled** para `DIRECT_URL`. Mantenha os parâmetros SSL fornecidos pelo Neon.
3. Configure ambos como variáveis de ambiente no Vercel. Use o branch de preview do Neon para Preview/Development; nunca aponte previews para o banco de produção.
4. Configure `NEXT_PUBLIC_APP_URL` com a URL HTTPS pública da loja no ambiente Production. Em previews, use a URL de preview correspondente se precisar testar canonical/sitemap.
5. Configure os segredos administrativos e de integração no painel do Vercel; gere valores próprios, não use placeholders do `.env.example`, e não os inclua no Git ou em tickets.

## Configuração manual — Vercel

1. Importe o repositório GitHub e confirme Next.js como framework, `npm ci` como instalação e `npm run build` como build. Não é necessário `vercel.json` para o comportamento padrão do Next.js.
2. Cadastre as variáveis por ambiente (Production e Preview) antes do primeiro deploy.
3. A partir de um ambiente confiável com `DIRECT_URL` e `DATABASE_URL` do projeto de produção carregados, aplique migrations antes de direcionar tráfego:

   ```powershell
   npm run db:migrate:deploy
   ```

4. A seed de demonstração é destrutiva e rejeita bancos remotos. Não a execute em produção. O catálogo de produção precisa de um processo de cadastro/importação revisado antes do go-live; o painel atual não cadastra produtos.
5. Adicione e valide o domínio customizado no Vercel, configure DNS conforme instruído pelo painel e atualize `NEXT_PUBLIC_APP_URL`.
6. Configure alertas/monitoramento no painel Vercel e no Neon. Crie um monitor externo para `https://<dominio>/api/health` e defina responsáveis e limites de alerta.

## Verificação após deploy

- `GET /api/health` deve responder `200` com `{"status":"ok"}`. `503` indica indisponibilidade do banco; procure o evento `database_readiness_failed` nos logs pelo horário. Erros de requisição não tratados incluem `requestId` para correlação.
- `GET /robots.txt` deve permitir indexação somente em Production, bloquear `/admin` e `/api/` e apontar para o sitemap.
- `GET /sitemap.xml` deve conter a raiz e somente produtos ativos.
- Confira a home, uma PDP, carrinho, login administrativo e os metadados Open Graph/Twitter.
- Antes de qualquer teste de pedido, confirme que as credenciais e endpoints continuam em sandbox. Nunca use dados de cartão reais.
- Revise os logs JSON de erro e os gráficos de conexão/uso do Neon; não registre nem compartilhe segredos para depurar.

## Rollback e recuperação

1. Se o deploy da aplicação falhar, volte para a implantação anterior pelo painel Vercel.
2. Não reverta migrations destrutivamente e não rode `prisma migrate reset` em produção. Faça apenas correções compatíveis e migrations forward.
3. Em suspeita de corrupção/perda de dados, preserve o estado atual, use os recursos de restore/branch do Neon e valide a restauração antes de reconectar o tráfego.
4. Após recuperação, valide `/api/health`, catálogo, login administrativo e os logs antes de reabrir operações.

## Critérios para concluir a Fase 10

- Deploy Production validado com domínio HTTPS e banco Neon corretos.
- Migrations aplicadas e catálogo de produção cadastrado por processo seguro.
- Alertas de disponibilidade/erro configurados e responsáveis definidos.
- SEO validado em Production (canonical, Open Graph, robots e sitemap).
- Runbook testado e pendências da Fase 9 que bloqueiam vendas resolvidas ou formalmente adiadas com decisão do responsável.
