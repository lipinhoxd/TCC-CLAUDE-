# Auditoria de sincronia dos trechos tocados pela AGT-008 (20/11/2026)

Escopo: só os trechos do TCC que a transcrição da AGT-008 altera ou cria (prompt `TCC/relatorios/PROMPT-DOCS-AGT-008-2026-11-20.md`), comparados com o registro `AGT-008.md`, `METRICAS.csv`, `git log`, a ficha do repositório e o código. O Docs foi lido em 20/11/2026 (842 parágrafos, sem alteração desde a auditoria anterior). A auditoria só relata; o Docs ainda não foi alterado. Depois que o assistente do Docs aplicar o prompt, o agente relê o Docs e confirma, como nas rodadas anteriores.

## Âncoras no Docs

As 19 trocas de texto foram conferidas por script contra o texto extraído do Docs: cada "texto atual" aparece exatamente 1 vez. As 3 inserções (parágrafo da Seção 5.3, linha do Quadro 2, ficha do Apêndice E) têm posição descrita pelo vizinho ("AGT-007 — Reservas.", linha "Principal, AGT-007", título "Ficha — Piloto (Codex), AGT-001").

## Dados do texto novo contra o repositório

| ID | Trecho do Docs | O que passará a dizer | O que o repositório diz | Status |
| --- | --- | --- | --- | --- |
| T1 | Resumo, Abstract, 5.1, 6.1, 6.4, Cap. 7 | n = 8 no principal (8 das 18) e n = 5 no piloto, sem somar | `METRICAS.csv`: 8 linhas do principal; `docs/quadro-resultados.md`: n = 8 de 18 | OK |
| T2 | 5.1 | AGT-009 a AGT-018 "ainda não foram iniciadas"; 5.4 "a partir da AGT-009" | Não existe `AGT-009.md`; plano `07-PLANO-DE-ATIVIDADES.md` | OK |
| T3 | 5.1 | "Na data de 20/11/2026" | Execução e classificação em 20/11/2026 (`AGT-008.md`, Seções 6 e 13) | OK |
| T4 | 5.3, ficha e Quadro 2 | Instrução aprovada em 20/11/2026 às 21:57 | `AGT-008.md`: 2026-11-20T21:57:41-03:00 | OK |
| T5 | 5.3, ficha e 6.2 | ≈ 17,6 min (22:03 a 22:21); inclui documentação, mutações e navegador; espera pelas decisões não contada | `METRICAS.csv`: 17.60; `AGT-008.md` Seção 6: 22:03:54 a 22:21:30 | OK |
| T6 | 5.3, ficha, 6.2 e Quadro 2 | 372 testes (326 anteriores e 46 novos); 1 da AGT-006 reescrito e 3 da AGT-007 ajustados | `npm run check`: 372 em 22 arquivos; `METRICAS.csv`: 372/372/0; Seção 7 do registro | OK |
| T7 | 5.3, 6.1, 6.3 e Quadro 2 | Intervenção humana: decisão sobre vagas e concorrência (3 decisões) | `AGT-008.md` Seções 5, 6 e 12; `METRICAS.csv` | OK |
| T8 | 5.3, Quadro 2 e Apêndice D | Commit 23e87fb | `git log`: 23e87fb (atividade) e c2083f1 (hash) | OK |
| T9 | 5.3 | Decisões: retenção ao abrir o checkout, 15 min configuráveis, retomada; disponibilidade pelas retenções ativas, sem migração; BEGIN IMMEDIATE; 503; expiração na leitura e na gravação; reserva segue aguardando pagamento; desistência cancela a retenção | `AGT-008.md` Seção 6; `server/vagas/disponibilidade.ts`, `server/reservas/service.ts`, `server/reservas/routes.ts`, `server/reservas/config.ts`; `docs/reservas.md` | OK |
| T10 | 5.3 | Alterou a consulta da AGT-006, descontando as retenções | `server/excursoes/publico.ts`; Seção 7 do registro | OK |
| T11 | 5.3 | Percurso em navegador real com três passageiras, expiração real, retomada, desistência e celular; vagas ocupadas inalteradas; nada em pagamento | `AGT-008.md` Seção 10 (item 7 e 8); relatório da atividade | OK |
| T12 | 5.3 | O agente corrigiu o defeito de acessibilidade do contador | `AGT-008.md` Seção 9 (item 7); `src/pages/Reservas.tsx` (`role="timer"`); `tests/web-reservas.test.tsx` | OK |
| T13 | 4.8 | Retenção de 15 minutos, disponibilidade pelas retenções ativas, expiração na leitura e na gravação (AGT-008); sem migração desde a versão 1 | `server/vagas/disponibilidade.ts`; `server/db/migrations.ts` (uma só migração) | OK |
| T14 | Apêndice D, AGT-008 | RF-021 com evidência; RF-017 e RF-019 completados; RF-022 em parte; RN-014 e RN-015 com evidência; RN-021 e RN-040 em parte | `docs/matriz-rastreabilidade.md` (mesmos estados) | OK |
| T15 | Apêndice E, ficha AGT-008 | 20 campos; classe AP-3; 1 tentativa; versão da ferramenta [DADO NÃO REGISTRADO]; segundo avaliador [DADO NÃO REGISTRADO] | `docs/fichas-agt/principal/AGT-008.md` (20 campos) | OK |
| T16 | 6.2 | O tempo da AGT-008 "não é comparável" aos das anteriores | `AGT-008.md` Seção 16: nas AGT-005 a AGT-007 o navegador não entrava na duração | OK |
| T17 | 6.4 | Limitações da AGT-008 e fim das limitações de vaga das AGT-006 e AGT-007 | `AGT-008.md` Seção 10 (item 11); `docs/consulta-publica.md` e `docs/reservas.md` atualizados | OK |

## Divergência encontrada e corrigida no repositório

| ID | Onde | Problema | Correção |
| --- | --- | --- | --- |
| R1 | `AGT-008.md`, Seção 7 | Dizia que os 3 testes ajustados da AGT-007 eram "campos da resposta, rotas e mensagem sem_vagas"; na verdade são campos da resposta, mensagem sem_vagas e aviso do checkout (a rota foi acréscimo, contada entre os novos) | Seção 7 corrigida no commit de registros da AGT-008 |

## Fora do alcance e pendências

- Piloto: nada tocado.
- Versão da ferramenta Claude Code e segundo avaliador: [DADO NÃO REGISTRADO] (sem mudança).
- Conferência pós-aplicação no Docs: pendente até o assistente do Docs aplicar o prompt.
