# Tasks

Plano de implementacao do backend. Cada etapa deve ser executada pelo agente `backend-architect`, seguindo a estrutura em camadas (`routes -> controller -> service -> repository`), as convencoes do `CLAUDE.md` e o modulo `users` como referencia. Ao concluir cada etapa: `npm run typecheck`, `npm run lint` e `npm test` devem passar, e o `README.md`/`CLAUDE.md` devem ser atualizados se a estrutura mudar.

## Decisoes pendentes

Resolver antes de iniciar a etapa indicada.

- Stack: API propria em Fastify, Prisma e MySQL (ja definida neste repositorio).
- Metodo de login (etapa 1, decidido): email e senha com hash Argon2, JWT de acesso curto e refresh token rotativo com deteccao de reuso.
- Formato do `pair_code` (etapa 1, decidido): `PAZ-` mais 6 caracteres alfanumericos sem ambiguidade (ex.: `PAZ-7K2M9X`), cerca de 887 milhoes de combinacoes.
- Aprovacao do vinculo (etapa 2, decidido): imediato, sem aceite do dono do codigo, com limite de 10 tentativas por 10 minutos por usuario.

## Regras transversais

Valem para todas as etapas.

- Todo dado e filtrado pelo usuario ou casal do token. Nenhuma consulta sem escopo.
- Bandeiras, respostas e Home exigem casal ativo.
- O backend entrega apenas dados; textos de tela sao montados no app.
- Toda rota nova e documentada no Swagger (payloads, exemplos, sucesso e todos os erros), conforme o agente `backend-architect`.
- Erros: 404/422 para codigo invalido no join, 409 para resposta repetida ou par existente, 429 para excesso de tentativas.
- Sorteio do dado e rodadas ficam no app; o backend apenas serve o catalogo.

## Etapa 1: Base e autenticacao (concluida)

- Modulos: `auth`, `users`, `sessions`.
- Models: `User` (com `pairCode` unico e permanente), `RefreshToken`/`Session`.
- Cadastro, login, refresh, logout, forgot/reset-password.
- Plugin de autenticacao que injeta o usuario no request e garante o escopo por token.
- Rate limit nos endpoints de auth.
- Validar e centralizar no `env.ts` as novas variaveis (segredos JWT, expiracoes).
- Substituir o CRUD de exemplo de `users` pelo dominio real: `GET /me`.
- Estrutura de seeds do Prisma pronta para os catalogos.
- Testes dos services de auth.

## Etapa 2: Pareamento (concluida)

- Modulo: `couples`.
- Models: `Couple`, `CoupleMember`.
- `POST /couple/join` (valida codigo proprio, codigo inexistente, par ja existente de qualquer um dos dois, limite de tentativas), `GET /couple`, `POST /couple/disconnect`.
- Criacao do casal em transacao; casal sempre com exatamente duas pessoas.
- Guard reutilizavel "casal ativo" para as proximas etapas.
- Testes cobrindo cada erro de dominio.

## Etapa 3: Bandeiras e push (concluida)

- Modulos: `flags`, `devices`, `notifications`, `feelings`.
- Models: `Flag`, `Device`, `Feeling` (catalogo com seed).
- `POST /flags` idempotente via header `Idempotency-Key` (mesma chave nunca duplica), `GET /flags` paginado, `POST /flags/:id/seen`, `GET /feelings`.
- `PUT /devices` para registrar o token de push.
- Servico de push via Expo Push (`PUSH_ENABLED` liga o envio real; a preferencia `hideNotificationText` ja existe no usuario e sera exposta em `/settings` na etapa 5), desacoplado atras de uma interface; texto da notificacao respeita a preferencia "esconder texto" do destinatario.
- Falha no envio de push nao pode falhar a criacao da bandeira.
- Testes de idempotencia e de privacidade do push.

## Etapa 4: Recado hot (concluida)

- Modulos: `flag-replies`, `catalogs`.
- Models: `FlagReply`, `DeclineReason`, `AcceptNote` (seeds).
- `POST /flags/:id/reply` (topar ou "hoje nao" com motivo; uma resposta por bandeira, 409 em repeticao), notificacao ao remetente.
- `GET /flags/decline-reasons`, `GET /flags/accept-notes`, `GET /games/dice/challenges`, filtrados por modo (normal ou hot).
- Testes de resposta unica e de permissao (apenas o par responde).

## Etapa 5: Diario, pazes e ajustes (concluida)

- Modulos: `diary`, `peace`, `settings`.
- Models: `DiaryEntry` (unica por usuario e data), `PeaceEvent`, `PeaceRule`, `PeaceContent`, preferencias do usuario.
- Diario: `GET /diary?year=`, `PUT /diary/:date` (upsert, nota ate 500 caracteres, estrela, humor, momento a dois, sem datas futuras), `DELETE /diary/:date`; privado por usuario.
- Pazes: `GET /peace/path`, `POST /peace/made` com aviso opcional ao par.
- Ajustes: `GET /settings`, `PATCH /settings` (esconder texto, modo hot).
- Testes de validacao de data e de isolamento entre usuarios.

## Etapa 6: Fechamento (concluida)

- Presenca ("online agora", "visto ha X min") exposta como dados, sem texto.
- `DELETE /account` conforme a LGPD: remocao ou anonimizacao dos dados do usuario, desfazendo o vinculo do casal.
- Revisao de paginacao em todas as listagens e de rate limit nos endpoints sensiveis.
- Revisao de seguranca: escopo em todas as queries, logs sem dados sensiveis, CORS restrito em producao.
- Documentacao final da API (OpenAPI) e atualizacao do `README.md`.
