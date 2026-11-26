# Auditoria de sincronia dos dados da AGT-016 (26/11/2026)

Gerada em 2026-11-26T18:45:38-03:00. Escopo: os dados que o dossiê `TCC/relatorios/DOSSIE-GEMINI-AGT-016-2026-11-26.md` entrega ao Gemini, comparados com o registro `AGT-016.md`, `METRICAS.csv`, o diário, `git log`, a ficha, a matriz, o quadro, `package.json`, as migrações, o código e `docs/especificacao/`. O Docs não foi lido nem alterado nesta etapa (última leitura: 26/11/2026, 1.018 elementos, depois da AGT-012, com divergências abertas). A auditoria só relata; as correções do Docs dependem de aprovação.

## Dados do dossiê contra o repositório

| ID | Dado | O que o dossiê diz | O que o repositório diz | Status |
| --- | --- | --- | --- | --- |
| D1 | Contagem do experimento principal | n = 16 de 18, todas AP-3; AGT-017 e AGT-018 não iniciadas | `METRICAS.csv`: 16 linhas, 16 AP-3; quadro: n = 16; `AGT-017.md` não existe | OK |
| D2 | Piloto | n = 5, separado | `docs/quadro-resultados.md`, seção 1 | OK |
| D3 | Aprovação, decisões e classificação | 17:59:42, 18:27:18 e "ap 3" às 18:43:56 | `AGT-016.md`; diário (entradas 119, 120 e 122) | OK |
| D4 | Duração | 14,47 min (18:27:18 a 18:41:46) | `METRICAS.csv`: 14.47; Seção 6 | OK |
| D5 | Testes | 720 em 38 arquivos; 35 novos (23 + 12) | `npm run check` no fechamento: 720 em 38 | OK |
| D6 | Mutações | 13 no servidor, detectadas | Seção 8 | OK |
| D7 | Migração e dependências | Nenhuma | `server/db/migrations.ts`: versões 1 a 5; `package.json` sem mudança | OK |
| D8 | Commits | 8b4bbef (atividade) e 1c96c0e (hash) | `git log` | OK |
| D9 | Matriz | RF-041 e RF-042 com evidência | `docs/matriz-rastreabilidade.md` | OK |
| D10 | Ficha | 20 campos; versão que executou e segundo avaliador [DADO NÃO REGISTRADO] | `docs/fichas-agt/principal/AGT-016.md` | OK |
| D11 | Quadro 3 (seção J) | n = 16; tentativas 15 e 1; testes 15 e 720; intervenção 16 | Calculado de `METRICAS.csv`; piloto de `docs/quadro-resultados.md` | OK |
| D12 | Definições dos valores | Decisão 1.2 A | A especificação não define "valor arrecadado"; definição em `docs/painel-administrativo.md` e na decisão registrada | Pergunta ao autor (declarada) |
| D13 | Revisão do código | Registrada como aprovada pela autorização permanente | Seção 11; o pesquisador respondeu apenas "ap 3" | OK (declarada) |
| D14 | Matriz: RN-041 | Não citada como evidenciada | A matriz a mantém "Planejada" (validação geral na AGT-017), embora haja evidência parcial em várias atividades | Pendente para a AGT-017 |

## Pendências

- Conferência pós-aplicação no Docs: pendente até os pesquisadores informarem que o Gemini aplicou.
- Divergências abertas no Docs desde a AGT-012 (ficha da AGT-012 ausente, ficha e correções da AGT-011) e envios ainda não confirmados (Parte A e dossiês das AGT-013 a 015).
- Três pontos abertos da AGT-014 sem resposta.
- Pendências humanas adiadas: DOIs das referências 1 e 8; verificação de telefone e token; segundo avaliador; versão da ferramenta; campos [INFORMAR].
- Fora do alcance: o piloto (nada tocado).
