# TCC-IA-EXCURSOES-CLAUDE

Plataforma web de gerenciamento de excursões, desenvolvida como objeto prático do TCC
"Agentes de Inteligência Artificial Generativa no desenvolvimento de software: aplicação
supervisionada no desenvolvimento de uma plataforma web para gerenciamento de excursões"
(UNIESI, 2026).

Este é o **experimento principal**, com o Claude Code como agente. O estudo piloto anterior,
com o Codex, está no repositório `TCC-IA-EXCURSOES` (tag `piloto-codex`).

## Estrutura

| Pasta | Conteúdo |
| --- | --- |
| `src/` | Front-end (React + Vite + TypeScript). |
| `server/` | API em Node.js (TypeScript executado diretamente pelo Node, sem framework). |
| `shared/` | Funções puras usadas pelo servidor e pela interface (fuso de Brasília, reais e centavos). |
| `tests/` | Testes automatizados (Vitest). |
| `docs/especificacao/` | Especificação (requisitos, regras de negócio, fluxos, dados, plano de atividades). |
| `TCC/` | Registros do experimento: atividades, métricas, evidências e documentos metodológicos. |
| `CLAUDE.md` | Regras de trabalho do agente. |

## Requisitos

- Node.js 26 e npm 11 (versões usadas no desenvolvimento e nos testes). Outras versões não foram
  testadas.

## Executar localmente

```bash
npm install
cp .env.example .env.local   # opcional; ajuste os valores se necessário
npm run dev:api              # API em http://127.0.0.1:3001 (terminal 1)
npm run dev                  # front-end em http://127.0.0.1:5173 (terminal 2)
```

Verificação da API: `GET http://127.0.0.1:3001/api/health` deve responder `{"status":"ok"}`.
Em desenvolvimento, o front-end encaminha as chamadas a `/api` para a API (mesma origem, necessária para o cookie de sessão).

## Comandos

| Comando | Função |
| --- | --- |
| `npm run lint` | Análise estática (ESLint, sem avisos permitidos). |
| `npm run typecheck` | Verificação de tipos (TypeScript). |
| `npm test` | Testes automatizados. |
| `npm run build` | Verificação de tipos e build de produção do front-end. |
| `npm run check` | Lint, testes e build em sequência. |
| `npm run db:migrate` | Cria o banco local (se não existir) e aplica as migrações pendentes. |
| `npm run db:reset` | Apaga o banco local e o recria do zero pelas migrações. |
| `npm run admin:create` | Cria o administrador a partir das variáveis `ADMIN_*` (ver `.env.example`). |
| `npm run seed:demo` | Cria excursões fictícias de demonstração (só desenvolvimento; exige o administrador). |

## Banco de dados

SQLite via `node:sqlite` (módulo do Node.js), SQL direto e migrações versionadas em
`server/db/migrations.ts`. O arquivo fica em `data/excursoes.sqlite` (não versionado; mude com
`DATABASE_PATH`). Para recriar o banco local: `npm run db:reset`. Detalhes, esquema e a estratégia
de concorrência em [docs/banco-de-dados.md](docs/banco-de-dados.md).

## Interface pública

Páginas Home, Excursões, Sobre, Como funciona e Contato, cabeçalho e rodapé, cadastro, login e saída, em React com roteador próprio e CSS puro. Textos provisórios. Detalhes, rotas e limitações em [docs/interface-publica.md](docs/interface-publica.md).

## Reservas

O passageiro reserva uma vaga no detalhe da excursão e chega ao checkout (`/reservas/:id/checkout`); pode desistir enquanto não houver pagamento. Abrir o checkout retém a vaga por 15 minutos (`RETENCAO_MINUTOS`); a retenção expirada libera a vaga. O pagamento integral usa um provedor **simulado** fora de produção (`PAGAMENTO_SIMULADO`); em produção não há provedor. O parcelado (duas parcelas de 50%) segue o mesmo provedor: a primeira ocupa a vaga, a segunda quita até a data limite da excursão e, vencido o prazo, a reserva é cancelada por inadimplência e a vaga é liberada. A página **Minhas reservas** (`/reservas`) lista as reservas do passageiro em andamento e no histórico, com o detalhe de cada uma (`/reservas/:id`); um dia após a data final da excursão, a reserva pronta para embarque passa a **Concluída** e permanece no histórico. Regras, rotas e limitações em [docs/reservas.md](docs/reservas.md).

## Consulta pública de excursões

Lista e detalhe das excursões publicadas (`/excursoes`, `/excursoes/:id`) e API pública de leitura (`GET /api/excursoes`). Para ver com dados fictícios: `npm run admin:create` e `npm run seed:demo`. Imagens em `public/imagens/`. Detalhes e limitações em [docs/consulta-publica.md](docs/consulta-publica.md).

## Administração de excursões

Área só para o administrador (`/admin/excursoes`) e API `/api/admin/excursoes`: cadastro em Rascunho, edição com bloqueio por reserva ou retenção ativa, publicação, mudança de situação, histórico. Detalhes, regras e limitações em [docs/excursoes-admin.md](docs/excursoes-admin.md).

## Autenticação

Cadastro, login por e-mail e senha (scrypt), sessão em cookie HttpOnly com token opaco (só o hash fica
no banco), controle de acesso por perfil e recuperação de acesso. O administrador só é criado por
`npm run admin:create`. Rotas, decisões e limitações em [docs/autenticacao.md](docs/autenticacao.md).

## Variáveis de ambiente

Veja `.env.example`. Valores reais ficam em `.env.local`, que não é versionado.
Somente variáveis iniciadas por `VITE_` chegam ao navegador.
