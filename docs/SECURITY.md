# Seguranca da API

Resumo das protecoes implementadas, da configuracao exigida em producao e dos riscos conhecidos.

## Protecoes implementadas

- Autenticacao: JWT HS256 de curta duracao (15 min) com algoritmo fixado e `issuer` validado; tokens com `alg: none`, outro segredo, outro algoritmo, outro emissor ou expirados sao recusados. Refresh token opaco, guardado apenas como hash SHA-256, rotativo, com deteccao de reuso (reuso revoga todas as sessoes).
- Senhas: Argon2id, maximo de 128 caracteres, comparacao com hash falso quando o e-mail nao existe (mensagem e tempo equivalentes).
- Isolamento de dados: toda consulta e filtrada pelo usuario ou casal do token; bandeiras de outro casal respondem 404; diario e privado por usuario.
- Validacao: toda entrada passa por Zod; campos desconhecidos sao descartados; corpo limitado a 100 KB.
- Rate limit: 300 req/min por IP (global); 10/min por IP nas rotas de auth; 10 logins por 15 min e 3 pedidos de recuperacao por hora por e-mail; limites por usuario em bandeiras, pareamento, presenca e exclusao de conta.
- Documentacao: Swagger (`/docs`, `/docs/json`) protegido por Basic Auth (`DOCS_USERNAME` e `DOCS_PASSWORD`), comparacao em tempo constante, bloqueio de 15 min apos 10 tentativas invalidas por IP.
- Cabecalhos: Helmet (HSTS, nosniff, frame options), sem `X-Powered-By`; CORS restrito por lista de origens.
- Erros: respostas 500 genericas, sem stack nem detalhes internos; `Authorization` e `Cookie` removidos dos logs.
- SQL: apenas Prisma com consultas parametrizadas; nenhuma query crua.
- Efeitos colaterais (push) rodam em segundo plano e nunca derrubam a operacao principal.

## Configuracao obrigatoria em producao

A aplicacao nao inicia se alguma destas regras for violada (`src/config/env.ts`):

- `NODE_ENV=production` (e o padrao quando a variavel nao e definida).
- `CORS_ORIGIN` com as origens do app, nunca `*`.
- `JWT_ACCESS_SECRET` aleatorio (nao pode conter valores de exemplo). Gere com:
  `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
- Com `DOCS_ENABLED=true`, `DOCS_PASSWORD` com ao menos 12 caracteres; ou `DOCS_ENABLED=false` (recomendado).
- Atras de proxy ou load balancer, `TRUST_PROXY=true`, para o rate limit enxergar o IP real.
- HTTPS terminado no proxy; a API nao redireciona HTTP para HTTPS por conta propria.

## Riscos conhecidos e recomendacoes

- Access token nao e revogado antes de expirar: apos logout, troca de senha ou exclusao de conta ele vale ate 15 min (rotas de dados passam a responder 404 apos exclusao). Reduzir `ACCESS_TOKEN_TTL_SECONDS` diminui a janela.
- Pareamento imediato: quem conhecer (ou adivinhar) o `pair_code` de alguem sem casal consegue forma-lo sem aceite do dono, passando a ver o nome dele e a poder enviar bandeiras. O espaco do codigo (cerca de 887 milhoes) e as 10 tentativas por 10 min tornam a adivinhacao inviavel, mas um codigo vazado e suficiente. Recomendacao: exigir aceite do dono do codigo.
- Rate limit em memoria: vale por instancia. Com mais de uma instancia, use um store compartilhado (Redis) em `src/plugins/rate-limit.ts`.
- Cadastro revela e-mails ja existentes (409). E inerente ao fluxo; o login e a recuperacao de senha nao revelam.
- Limite por e-mail no login permite que um atacante bloqueie temporariamente o login de uma vitima (10 tentativas por 15 min). E a troca aceita contra adivinhacao distribuida.
- Tokens de refresh e de recuperacao expirados permanecem no banco; considere uma rotina periodica de limpeza.
- `npm audit` aponta `deepmerge-ts` (via CLI do Prisma). Afeta apenas o carregamento de configuracao do CLI, nao recebe dados de requisicoes; a correcao automatica rebaixaria o Prisma, entao fica pendente de uma versao nova.
- Arquivos estaticos genericos do Swagger UI (`/docs/static/*`) sao publicos; a pagina e a especificacao exigem senha.
