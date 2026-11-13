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
| `src/` | Front-end (Vite + TypeScript). |
| `server/` | API em Node.js (TypeScript executado diretamente pelo Node). |
| `tests/` | Testes automatizados (Vitest). |
| `docs/especificacao/` | Especificação (requisitos, regras de negócio, fluxos, dados, plano de atividades). |
| `TCC/` | Registros do experimento: atividades, métricas, evidências e documentos metodológicos. |
| `CLAUDE.md` | Regras de trabalho do agente. |

## Requisitos

- Node.js 26 e npm 11 (versões usadas no desenvolvimento e nos testes). O Node.js 22.18 ou superior deve funcionar, pois executa TypeScript diretamente, mas isso não foi testado.

## Executar localmente

```bash
npm install
cp .env.example .env.local   # opcional; ajuste os valores se necessário
npm run dev:api              # API em http://127.0.0.1:3001 (terminal 1)
npm run dev                  # front-end em http://127.0.0.1:5173 (terminal 2)
```

Verificação da API: `GET http://127.0.0.1:3001/api/health` deve responder `{"status":"ok"}`.

## Comandos

| Comando | Função |
| --- | --- |
| `npm run lint` | Análise estática (ESLint, sem avisos permitidos). |
| `npm run typecheck` | Verificação de tipos (TypeScript). |
| `npm test` | Testes automatizados. |
| `npm run build` | Verificação de tipos e build de produção do front-end. |
| `npm run check` | Lint, testes e build em sequência. |

## Variáveis de ambiente

Veja `.env.example`. Valores reais ficam em `.env.local`, que não é versionado.
Somente variáveis iniciadas por `VITE_` chegam ao navegador.
