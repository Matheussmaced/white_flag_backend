# White Flag Back

API do White Flag, um aplicativo para casais. A proposta e aproximar duas pessoas por meio de interacoes entre elas, jogos e diversas outras funcionalidades pensadas para o dia a dia do relacionamento.

Este repositorio contem o backend. Atualmente existe apenas a base da aplicacao (estrutura, configuracao e um modulo de exemplo); as funcionalidades do app serao adicionadas como novos modulos.

## Tecnologias

- Node.js 22 ou superior
- Fastify 5
- TypeScript (ESM)
- Prisma 6 como ORM
- MySQL
- Zod para validacao
- Vitest para testes
- ESLint e Prettier

## Pre-requisitos

- Node.js 22 ou superior
- npm
- MySQL 8 em execucao e acessivel

## Como iniciar

1. Instale as dependencias:

   ```
   npm install
   ```

2. Crie o arquivo de ambiente a partir do exemplo:

   ```
   cp .env.example .env
   ```

   No PowerShell, use `Copy-Item .env.example .env`.

3. Defina um `JWT_ACCESS_SECRET` com pelo menos 32 caracteres aleatorios e ajuste o `DATABASE_URL` no `.env` com as credenciais do seu MySQL. O banco informado na URL sera criado pela migration caso o usuario tenha permissao.

4. Gere o client do Prisma:

   ```
   npm run prisma:generate
   ```

5. Aplique as migrations no banco e popule o catalogo de sentimentos:

   ```
   npm run prisma:deploy
   npm run prisma:seed
   ```

6. Inicie o servidor em modo desenvolvimento:

   ```
   npm run dev
   ```

A API fica disponivel em `http://localhost:3333`. Para verificar, acesse `GET /health`.

## Endpoints disponiveis

| Metodo | Rota                   | Descricao                                             | Auth   |
| ------ | ---------------------- | ----------------------------------------------------- | ------ |
| POST   | /auth/register         | Cria a conta e retorna a sessao                       | Nao    |
| POST   | /auth/login            | Login com email e senha                               | Nao    |
| POST   | /auth/refresh          | Rotaciona o refresh token                             | Nao    |
| POST   | /auth/logout           | Revoga o refresh token                                | Nao    |
| POST   | /auth/forgot-password  | Solicita recuperacao de senha                         | Nao    |
| POST   | /auth/reset-password   | Define nova senha com o token                         | Nao    |
| POST   | /couple/join           | Cria o casal com o `pairCode` do par                  | Bearer |
| GET    | /couple                | Casal ativo e dados do par                            | Bearer |
| POST   | /couple/disconnect     | Desfaz o vinculo                                      | Bearer |
| GET    | /feelings              | Catalogo de sentimentos (filtro `mode`)               | Bearer |
| POST   | /flags                 | Envia bandeira ao par (`Idempotency-Key`)             | Bearer |
| GET    | /flags                 | Lista bandeiras do casal, paginada                    | Bearer |
| POST   | /flags/:id/seen        | Marca bandeira recebida como vista                    | Bearer |
| PUT    | /devices               | Registra o token de push do aparelho                  | Bearer |
| POST   | /flags/:id/reply       | Responde a bandeira hot (topo ou hoje nao)            | Bearer |
| GET    | /flags/decline-reasons | Motivos de recusa (filtro `mode`)                     | Bearer |
| GET    | /flags/accept-notes    | Frases de aceite (filtro `mode`)                      | Bearer |
| GET    | /games/dice/challenges | Desafios do dado (filtro `mode`)                      | Bearer |
| GET    | /diary?year=           | Registros do diario do ano (privado)                  | Bearer |
| PUT    | /diary/:date           | Cria ou atualiza o registro de um dia                 | Bearer |
| DELETE | /diary/:date           | Apaga o registro de um dia                            | Bearer |
| GET    | /peace/path            | Regras e passos do caminho das pazes                  | Bearer |
| POST   | /peace/made            | Registra que fizeram as pazes (aviso opcional ao par) | Bearer |
| GET    | /settings              | Preferencias do usuario                               | Bearer |
| PATCH  | /settings              | Atualiza preferencias (esconder texto, modo hot)      | Bearer |
| POST   | /presence/ping         | Sinaliza atividade do usuario (presenca)              | Bearer |
| DELETE | /account               | Exclui a conta e os dados (LGPD), exige a senha       | Bearer |
| GET    | /me                    | Perfil do usuario autenticado e `pairCode`            | Bearer |
| GET    | /health                | Status do servico                                     | Nao    |

A autenticacao usa JWT de acesso curto (`Authorization: Bearer <accessToken>`) e refresh token opaco rotativo. Reutilizar um refresh token ja usado revoga todas as sessoes do usuario. Os endpoints de auth tem rate limit de 10 requisicoes por minuto por IP.

Bandeiras do modo hot podem ser respondidas uma unica vez pelo destinatario (`topo` com frase opcional, ou `hoje nao` com motivo obrigatorio); o remetente recebe push e a resposta aparece no campo `reply` da bandeira.

O diario e privado por usuario (nem o par acessa), tem um registro por dia, nao aceita datas futuras (considerando `APP_TIMEZONE`) e a anotacao tem ate 500 caracteres. Bandeiras do modo hot so podem ser enviadas por quem ativou o modo hot em `PATCH /settings`.

As bandeiras sao idempotentes: o app envia um `Idempotency-Key` por bandeira e pode reenviar apos timeout sem duplicar (a resposta repetida volta com 200 em vez de 201). O push e disparado em segundo plano e uma falha no envio nunca derruba o envio da bandeira. Com `PUSH_ENABLED=false` (padrao) a notificacao apenas e registrada em log.

Em desenvolvimento, o token de recuperacao de senha e escrito no log do servidor. O envio real de email ainda nao esta integrado (interface `Mailer` em `src/lib/mailer.ts`).

## Deploy na Vercel

A API roda como funcao serverless: `api/index.js` carrega a aplicacao compilada em `dist` e `vercel.json` encaminha todas as rotas para ela. O build (`npm run vercel-build`) gera o client do Prisma (inclusive o engine Linux) e compila o TypeScript. A pasta `public` existe so para satisfazer o build; a rota `/` mostra uma pagina simples.

Variaveis de ambiente obrigatorias no painel da Vercel (ela nao le o `.env` local):

| Variavel          | Valor                                                                             |
| ----------------- | --------------------------------------------------------------------------------- |
| NODE_ENV          | production                                                                        |
| DATABASE_URL      | URL do MySQL com a senha codificada; sugestao: terminar com `?connection_limit=5` |
| JWT_ACCESS_SECRET | segredo aleatorio (nao use valores de exemplo)                                    |
| CORS_ORIGIN       | origens do app, separadas por virgula (nunca `*`)                                 |
| TRUST_PROXY       | true                                                                              |
| DOCS_ENABLED      | false, ou true com `DOCS_PASSWORD` de ao menos 12 caracteres                      |
| APP_TIMEZONE      | America/Sao_Paulo                                                                 |
| PUSH_ENABLED      | true quando o app tiver tokens de push reais                                      |

Limitacoes do serverless: o rate limit fica em memoria por instancia (use Redis para protecao real), a Vercel nao tem IP fixo (o MySQL precisa aceitar conexoes de qualquer host) e o envio de push roda em segundo plano com `waitUntil` para nao ser interrompido apos a resposta.

## Seguranca

O resumo das protecoes, a configuracao obrigatoria em producao e os riscos conhecidos estao em `docs/SECURITY.md`. Em especial: a documentacao (`/docs`) pode ser protegida por senha com `DOCS_USERNAME` e `DOCS_PASSWORD`, e em producao a aplicacao so inicia com `CORS_ORIGIN` restrito, segredo JWT forte e (se o Swagger estiver ligado) `DOCS_PASSWORD` de ao menos 12 caracteres.

## Presenca, exclusao de conta e seguranca

- Presenca: o app chama `POST /presence/ping` ao abrir e periodicamente. O par enxerga `online` e `lastSeenAt` em `GET /couple`; os textos ("online agora", "visto ha X min") sao montados no app.
- Exclusao de conta (`DELETE /account`): remove perfil, sessoes, aparelhos, diario, bandeiras (inclusive as trocadas com o par, e suas respostas) e pazes. O vinculo do casal e desfeito e o par fica livre para formar outro. Exige a senha (403 `INVALID_PASSWORD` se incorreta). O access token ja emitido deixa de funcionar na pratica (as rotas passam a responder 404), pois o usuario nao existe mais.
- Rate limit: 300 requisicoes por minuto por IP em todas as rotas, 10 por minuto nas rotas de autenticacao, e limites por usuario em envio de bandeira (60/min), ping de presenca (30/min), tentativas de pareamento (10 por 10 min) e exclusao de conta (5 por 10 min).
- Producao: `CORS_ORIGIN` precisa listar as origens (a aplicacao nao inicia com `*`), use `TRUST_PROXY=true` atras de proxy, defina um `JWT_ACCESS_SECRET` forte e considere `DOCS_ENABLED=false` (ou defina `DOCS_PASSWORD`). O corpo das requisicoes e limitado a 100 KB e o cabecalho `Authorization` e removido dos logs.
- Paginacao: `GET /flags` e paginado; as demais listagens sao limitadas por natureza (catalogos fixos e diario de um ano, no maximo 366 registros).

## Documentacao da API (Swagger)

A documentacao interativa fica em `http://localhost:3333/docs` e a especificacao OpenAPI em `http://localhost:3333/docs/json`. Ela e gerada automaticamente a partir dos schemas Zod das rotas e lista, para cada endpoint, os payloads de entrada, as respostas de sucesso com exemplos e todos os erros possiveis.

Todas as descricoes dos endpoints e as mensagens de erro retornadas pela API estao em portugues. O formato de erro e sempre `{ statusCode, code, message, details? }`: o front deve exibir `message` ao usuario e usar `code` (estavel, em ingles) para decisoes de logica.

A especificacao completa tambem esta versionada em `docs/openapi.json` (regenere com `npm run docs:export`). Um teste automatizado (`tests/app/openapi.test.ts`) falha se alguma rota ficar sem tag, resumo, descricao, erro 500 documentado ou, quando protegida, sem seguranca e erro 401.

Para desativar em um ambiente, use `DOCS_ENABLED=false`.

## Variaveis de ambiente

| Variavel                       | Descricao                                                                     | Padrao            |
| ------------------------------ | ----------------------------------------------------------------------------- | ----------------- |
| NODE_ENV                       | Ambiente (development, test, production)                                      | development       |
| HOST                           | Host em que o servidor escuta                                                 | 0.0.0.0           |
| PORT                           | Porta do servidor                                                             | 3333              |
| LOG_LEVEL                      | Nivel de log                                                                  | info              |
| CORS_ORIGIN                    | Origens permitidas, separadas por virgula, ou `*`                             | *                 |
| JWT_ACCESS_SECRET              | Segredo do JWT, minimo 32 caracteres (obrigatoria)                            | -                 |
| ACCESS_TOKEN_TTL_SECONDS       | Validade do access token                                                      | 900               |
| REFRESH_TOKEN_TTL_DAYS         | Validade do refresh token                                                     | 30                |
| PASSWORD_RESET_TTL_MINUTES     | Validade do token de recuperacao                                              | 30                |
| PUSH_ENABLED                   | Envia push real via Expo; se `false`, apenas registra em log                  | false             |
| EXPO_ACCESS_TOKEN              | Token de acesso do Expo (opcional)                                            | -                 |
| APP_TIMEZONE                   | Fuso usado para validar datas do diario                                       | America/Sao_Paulo |
| TRUST_PROXY                    | Confia no cabecalho X-Forwarded-For (use `true` atras de proxy/load balancer) | false             |
| PRESENCE_ONLINE_WINDOW_SECONDS | Janela para considerar o par online                                           | 120               |
| DOCS_ENABLED                   | Habilita o Swagger em `/docs`                                                 | true              |
| DATABASE_URL                   | String de conexao MySQL (obrigatoria)                                         | -                 |

As variaveis sao validadas na inicializacao em `src/config/env.ts`. Se alguma for invalida ou estiver ausente, a aplicacao nao inicia. Novas variaveis devem ser registradas nesse arquivo e em `.env.example`.

## Scripts

| Script                    | Funcao                                                                 |
| ------------------------- | ---------------------------------------------------------------------- |
| `npm run dev`             | Servidor com recarregamento automatico                                 |
| `npm run build`           | Compila o projeto para `dist`                                          |
| `npm start`               | Executa a versao compilada                                             |
| `npm run typecheck`       | Verificacao de tipos                                                   |
| `npm run lint`            | Analise estatica com ESLint                                            |
| `npm run format`          | Formata o codigo com Prettier                                          |
| `npm test`                | Executa os testes                                                      |
| `npm run prisma:generate` | Gera o client do Prisma                                                |
| `npm run prisma:migrate`  | Cria e aplica migrations em desenvolvimento                            |
| `npm run prisma:deploy`   | Aplica migrations em producao                                          |
| `npm run prisma:seed`     | Popula/atualiza os catalogos (sentimentos, motivos, frases e desafios) |
| `npm run docs:export`     | Gera `docs/openapi.json` com a especificacao completa                  |
| `npm run prisma:studio`   | Abre o Prisma Studio                                                   |

## Arquitetura

O projeto segue arquitetura em camadas com service layer. Cada funcionalidade e um modulo independente em `src/modules`.

```
prisma/schema.prisma        modelos do banco
src/
  server.ts                 bootstrap e encerramento gracioso
  app.ts                    composicao do Fastify e registro dos modulos
  config/env.ts             leitura e validacao do .env
  lib/                      infraestrutura compartilhada (Prisma)
  plugins/                  handlers globais (tratamento de erros)
  shared/                   codigo transversal (erros, paginacao)
  modules/<feature>/
    <feature>.routes.ts       rotas, schemas e composicao das dependencias
    <feature>.controller.ts   camada HTTP
    <feature>.service.ts      regras de negocio
    <feature>.repository.ts   acesso a dados via Prisma
    <feature>.schema.ts       schemas Zod e tipos
    <feature>.mapper.ts       entidade para resposta
tests/                      espelha a estrutura de src
```

Fluxo de uma requisicao: `routes -> controller -> service -> repository -> Prisma`. Cada camada conhece apenas a imediatamente inferior, e as regras de negocio ficam exclusivamente nos services.

O modulo `auth` e a referencia de implementacao e deve ser usado como modelo para novos modulos.

## Desenvolvimento com Claude Code

O projeto possui o agente `backend-architect` em `.claude/agents/backend-architect.md`, que concentra as convencoes de arquitetura e codigo. Novas tarefas devem ser executadas por ele para manter o padrao. As diretrizes gerais ficam em `CLAUDE.md`.

## Padroes do projeto

- Sem comentarios desnecessarios; apenas o porque de decisoes nao obvias
- Sem emojis em codigo, logs ou documentacao
- TypeScript estrito, sem `any`
- Validacao de toda entrada com Zod
- Erros de dominio via `AppError` e derivados, tratados pelo handler global
- Antes de concluir qualquer tarefa: `npm run typecheck`, `npm run lint` e `npm test` devem passar
