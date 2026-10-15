# White Flag Back

API REST em Fastify 5 + TypeScript (ESM), Prisma 6 e MySQL. Validacao com Zod via `fastify-type-provider-zod`.

Toda tarefa neste repositorio deve ser delegada ao agente `backend-architect` (`.claude/agents/backend-architect.md`), que define a arquitetura e as convencoes obrigatorias.

## Comandos

- `npm run dev`: servidor em modo watch
- `npm run build` / `npm start`: compila para `dist` e executa
- `npm run typecheck`, `npm run lint`, `npm test`: devem passar antes de concluir qualquer tarefa
- `npm run prisma:generate`: gera o client apos alterar o schema
- `npm run prisma:migrate`: cria e aplica migration em desenvolvimento
- `npm run docs:export`: regenera `docs/openapi.json` (rode ao alterar rotas)
- `npm run prisma:seed`: popula catalogos (sentimentos, motivos, frases, desafios, conteudo das pazes)

## Estrutura

```
prisma/schema.prisma        modelos do banco
src/
  server.ts                 bootstrap e graceful shutdown
  app.ts                    composicao do Fastify e registro de modulos
  config/env.ts             unica leitura de process.env, validada com Zod
  lib/                      infraestrutura: prisma, password-hasher, tokens, mailer
  plugins/                  handlers globais e Swagger (error-handler, swagger, auth, rate-limit)
  shared/                   codigo transversal (errors, http)
  modules/<feature>/        um diretorio por funcionalidade
    <feature>.routes.ts       composicao (repository -> service -> controller) e schemas das rotas
    <feature>.controller.ts   camada HTTP
    <feature>.service.ts      regras de negocio
    <feature>.repository.ts   acesso a dados (interface + implementacao Prisma)
    <feature>.schema.ts       schemas Zod e tipos inferidos
    <feature>.mapper.ts       entidade -> DTO de resposta
tests/                      espelha a estrutura de src
```

Modulos atuais: `health`, `auth` (register, login, refresh, logout, forgot/reset-password), `users` (`GET /me`) `couples` (join, get, disconnect), `feelings` (catalogo), `flags` (enviar, listar, marcar como vista), `devices` (token de push) `flag-replies` (`POST /flags/:id/reply`), `catalogs` (motivos de recusa, frases de aceite, desafios do dado) `diary` (diario privado por dia), `peace` (caminho das pazes e evento `made`), `settings` (preferencias) `presence` (ping), `account` (exclusao LGPD) e `notifications` (servico interno de push, sem rotas). Modulos que exigem casal ativo devem usar `CouplesService.requireActiveCouple(userId)` (403 `COUPLE_REQUIRED`). O modulo `auth` e a referencia de implementacao com regras de negocio, injecao de dependencias externas (hasher, signer, mailer) e testes.

Rotas protegidas usam `onRequest: [app.authenticate]`, leem o usuario em `request.user.sub` e declaram `security: [{ bearerAuth: [] }]`. Endpoints publicos sensiveis usam `config: { rateLimit }`. Fabricas de teste ficam em `tests/helpers/factories.ts`.

## Documentacao da API

Todos os textos voltados ao cliente (Swagger e mensagens de erro) sao em portugues do Brasil; os `code` de erro ficam em ingles como contrato estavel. OpenAPI gerado dos schemas Zod, disponivel em `/docs` (UI) e `/docs/json`. Toda rota deve ter tags, summary, descricoes e exemplos nos campos, e declarar todos os erros possiveis com `errorResponses(...)`. Detalhes no agente `backend-architect`.

## Seguranca

Veja `docs/SECURITY.md`. Regras para novas tarefas: nunca consultar dados sem filtrar por usuario ou casal do token, nunca expor hashes, validar toda entrada, usar `perUserRateLimit` em rotas sensiveis e nunca logar tokens, senhas ou dados pessoais.

## Variaveis de ambiente

Definidas em `.env` (nao versionado). Todo novo valor deve ser adicionado em `src/config/env.ts` e `.env.example`.
