# Autenticação e controle de acesso (AGT-003)

Implementação no servidor (`server/auth/`) sobre as tabelas `usuario`, `sessao`, `token_acesso` e
`auditoria` da AGT-002. Não há telas (AGT-004) nem envio real de e-mail ou SMS.

## Decisões do pesquisador (13/11/2026)

| Ponto | Decisão |
| --- | --- |
| Hash de senha | `scrypt` do `node:crypto`, N=2^16, r=8, p=2, sal aleatório de 16 bytes, formato `scrypt$N$r$p$sal$hash` (parâmetros dentro do hash, o que permite aumentá-los depois). |
| Sessão | Token opaco de 256 bits em cookie `sid` (HttpOnly, SameSite=Strict, Secure em produção); só o SHA-256 vai à tabela `sessao`. Expira em 8 h (`SESSION_TTL_HOURS`) e é revogável. |
| Telefone (RN-005) | Só formato e normalização para E.164 (`+55DDNNNNNNNNN`, DDD existente). Não comprova a posse do número. |
| Recuperação (RN-007) | Token de uso único, 30 min (`RECOVERY_TOKEN_TTL_MINUTES`), só o hash em `token_acesso`. Entrega: arquivo local `data/outbox/recuperacao.jsonl` (JSON por linha), apenas fora de produção; o token nunca aparece na API. |

## Rotas

| Método e caminho | Acesso | Resultado |
| --- | --- | --- |
| `POST /api/auth/register` | público | 201 com o usuário (CPF mascarado); 400 `validacao` com `fields`; 409 `cadastro_duplicado`. Sempre cria `passageiro`. |
| `POST /api/auth/login` | público | 200 com cookie de sessão; 401 `credenciais_invalidas` (mensagem única); 429 `muitas_tentativas` com `Retry-After`. |
| `POST /api/auth/logout` | autenticado | 204; revoga a sessão e limpa o cookie. |
| `POST /api/auth/recovery/request` | público | 202 sempre que o e-mail tiver formato válido, exista a conta ou não. |
| `POST /api/auth/recovery/confirm` | público | 204 troca a senha e revoga todas as sessões; 400 `token_invalido` (inexistente, expirado, usado); 400 `validacao`. |
| `GET /api/me` | passageiro, administrador | 200 com o próprio usuário. |
| `PATCH /api/me` | passageiro, administrador | Só `nome_completo` e `telefone`; qualquer outro campo gera 400 `campo_nao_permitido`. |
| `GET /api/admin/ping` | administrador | Rota mínima que existe para exercitar o controle por perfil. |

Erros: `{ "error": "<codigo>" }`, com `fields` nos erros de validação. 401 = sem sessão válida; 403 = perfil
sem permissão. O corpo deve ser JSON (`Content-Type: application/json`, até 16 KB).

O perfil é lido do banco a cada requisição, junto com a sessão; rebaixar ou remover um usuário vale
na hora.

## Regras implementadas

- Cadastro: todos os campos (RN-004); maioridade de 18 anos pela data de nascimento, contada no dia de Brasília (RN-001, RN-039; AGT-017); CPF com
  dígitos verificadores e único (RN-002); e-mail em minúsculas e único (RN-003). O perfil enviado no
  cadastro é ignorado.
- Senha: 10 a 128 caracteres, com letra e número, fora de uma lista curta de senhas comuns, e diferente
  do e-mail. Comparada em tempo constante; e-mail inexistente também executa uma comparação, para não
  diferenciar pelo tempo.
- Limite de tentativas: 5 falhas por e-mail+endereço (e 20 por endereço) em 15 min (`LOGIN_MAX_ATTEMPTS`,
  `LOGIN_WINDOW_MINUTES`). Pedidos de recuperação seguem o mesmo limite, sem revelá-lo. Desde a AGT-018 a tentativa é contada antes da
  verificação da senha (pedidos simultâneos não passam do limite) e descontada quando a entrada dá certo; o token de recuperação é conferido
  antes do cálculo do hash da senha nova.
- Auditoria: `usuario.cadastro`, `usuario.administrador_criado`, `auth.login`, `auth.login_falha`,
  `auth.logout`, `usuario.perfil_alterado` (só os nomes dos campos), `auth.recuperacao_solicitada` e
  `auth.recuperacao_concluida`, sem senha, token, CPF, e-mail ou telefone.

## Administrador

Nenhuma rota cria administrador. O operador executa, no servidor:

```
ADMIN_NOME="..." ADMIN_CPF=... ADMIN_EMAIL=... ADMIN_NASCIMENTO=AAAA-MM-DD ADMIN_TELEFONE=... ADMIN_SENHA=... npm run admin:create
```

As mesmas validações do cadastro valem. Nada fica no repositório.

## Limitações conhecidas

1. **Posse do telefone não é verificada** (RN-005 atendida só em formato). Código de confirmação exige provedor externo.
2. **Sem entrega real do token de recuperação.** Em produção não há canal: o fluxo só funciona de ponta a ponta com um provedor de e-mail, ainda inexistente. O arquivo local contém o token em claro e deve ficar fora do versionamento (`data/` já está no `.gitignore`).
3. **Limitador em memória:** reinicia com o processo e não é compartilhado entre instâncias. O endereço vem de `req.socket.remoteAddress`; atrás de proxy será necessário configurar o cabeçalho confiável.
4. **Enumeração pelo cadastro:** o 409 `cadastro_duplicado` revela que o CPF ou o e-mail já existe (inevitável com unicidade, RN-002 e RN-003); não revela qual dos dois.
5. **CSRF:** a defesa é SameSite=Strict mais a exigência de `application/json`; não há token CSRF. Revisar quando houver front-end em outra origem.
6. **HTTPS e cabeçalhos:** a API não termina TLS; `Secure` no cookie depende de `NODE_ENV=production` ou `COOKIE_SECURE=true`. Não há `Content-Security-Policy` (API sem HTML).
7. **Sessões expiradas não são removidas** do banco; não há rotina de limpeza nem limite de sessões por usuário. A auditoria cresce a cada falha de login.
8. **Troca de e-mail e de data de nascimento** não existem (fora de RF-005 nesta atividade).
9. **Data de nascimento:** a comparação em UTC, registrada aqui antes, foi corrigida na AGT-017 (dia de Brasília).
10. **Lista de senhas comuns é curta** (10 itens); não há verificação contra vazamentos.
11. **Timing da recuperação:** para conta existente há gravação no banco e entrega, o que pode diferir em milissegundos de uma conta inexistente.
12. **Pontos de revisão humana (RN-044):** `server/auth/password.ts`, `service.ts` (login, recuperação), `routes.ts` (cookie e autorização) e `support.ts` (limitador).
