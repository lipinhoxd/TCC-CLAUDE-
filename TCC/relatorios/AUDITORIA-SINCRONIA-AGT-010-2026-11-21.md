# Auditoria de sincronia dos trechos tocados pela AGT-010 (21/11/2026)

Escopo: só os trechos do TCC que a transcrição da AGT-010 altera ou cria (prompt `TCC/relatorios/PROMPT-DOCS-AGT-010-2026-11-21.md`), comparados com o registro `AGT-010.md`, `METRICAS.csv`, `git log`, a ficha do repositório, as migrações e o código. O Docs foi lido por último em 21/11/2026 (890 linhas extraídas, após a conferência da AGT-009). A auditoria só relata; as correções do Docs dependem de aprovação.

## Âncoras no Docs

As 19 trocas de texto foram conferidas por script contra o texto extraído do Docs: cada "texto atual" aparece exatamente 1 vez. As 3 inserções têm posição descrita pelo vizinho ("AGT-009 — Pagamento integral.", linha "Principal, AGT-009", título "Ficha — Piloto (Codex), AGT-001").

## Dados do texto novo contra o repositório

| ID | Trecho do Docs | O que passará a dizer | O que o repositório diz | Status |
| --- | --- | --- | --- | --- |
| V1 | Resumo, Abstract, 5.1, 6.1, 6.4, Cap. 7 | n = 10 no principal (10 das 18) e n = 5 no piloto, sem somar | `METRICAS.csv`: 10 linhas do principal; `docs/quadro-resultados.md`: n = 10 de 18 | OK |
| V2 | 5.1 e 5.4 | AGT-011 a AGT-018 "ainda não foram iniciadas"; 5.4 "a partir da AGT-011" | `AGT-011.md` não existe; plano `07-PLANO-DE-ATIVIDADES.md` | OK |
| V3 | 5.3, ficha | Instrução aprovada em 21/11/2026 às 11:27; decisões às 11:30 | `AGT-010.md`: 2026-11-21T11:27:15-03:00 e 11:30:16-03:00 | OK |
| V4 | 5.3, ficha, 6.2, 6.4 | ≈ 396,5 min em relógio (11:30 a 18:06), com pausas e interrupção; tempo ativo [DADO NÃO REGISTRADO]; não comparável | `METRICAS.csv`: 396.47; `AGT-010.md` Seções 6 e 16 | OK |
| V5 | 5.3, ficha, 6.2, Quadro 2, Apêndice D | 463 testes (43 a mais que ao final da AGT-009) | `npm run check` (18:06): 463 em 26 arquivos; `METRICAS.csv`: 463/463/0 | OK |
| V6 | 5.3, 6.1, 6.3, Quadro 2 | Intervenção: decisão sobre pagamentos, vagas e inadimplência (3 decisões) | `AGT-010.md` Seções 5, 6 e 12 | OK |
| V7 | 5.3, Quadro 2, Apêndice D | Commit f983b15 | `git log`: f983b15 (atividade) e ac63597 (hash) | OK |
| V8 | 5.3 | Decisões: reserva aguardando com vaga ocupada; segunda até 23:59:59 de Brasília sem retenção; vencimento na leitura e na gravação, motivo inadimplência, vaga liberada uma vez, primeira parcela não reembolsável; confirmação tardia sinalizada | `AGT-010.md` Seção 6; `server/vagas/vencimento.ts`, `server/pagamentos/confirmacao.ts` | OK |
| V9 | 5.3 | Alterou código de atividades anteriores (reservas, disponibilidade, vagas públicas, pagamento integral) | `AGT-010.md` Seção 7; `git diff` do commit f983b15 | OK |
| V10 | 5.3 | Percurso em navegador real, com a execução interrompida e refeita; prazo alterado direto no banco; confirmação tardia só em teste | `AGT-010.md` Seções 8 e 9 | OK |
| V11 | 4.8 | "as AGT-009 e AGT-010 criaram migrações (versões 2 e 3)" | `server/db/migrations.ts`: migrações 1, 2 e 3 | OK |
| V12 | 6.4 e 5.3 | Limitações: liberação gravada só em gravação (AGT-014), devolução da primeira parcela (AGT-013), aviso só na tela, casos só em teste, prazo alterado no banco, tempo ativo não registrado | `AGT-010.md` Seção 10 (item 7) e Seção 16 | OK |
| V13 | Apêndice D | RF-024 e RF-027 com evidência; RF-028 e RF-025 em parte; RN-012, RN-013, RN-017 a RN-020 com evidência; RN-024 e RN-032 em parte | `docs/matriz-rastreabilidade.md` (mesmos estados) | OK |
| V14 | Apêndice E, ficha AGT-010 | 20 campos; AP-3; 1 tentativa; versão da extensão e qual executou [DADO NÃO REGISTRADO]; segundo avaliador [DADO NÃO REGISTRADO] | `docs/fichas-agt/principal/AGT-010.md` | OK |
| V15 | 5.1 e Quadro 2 (fonte) | Datas "21/11/2026" no lugar de "20/11/2026" | Atividade executada e classificada em 21/11/2026 | OK |

## Observações

- A contagem "43 a mais" é a diferença líquida (463 menos 420): inclui os testes novos e a substituição de um teste antigo da interface; não é contagem de testes escritos.
- O valor "396,5 min" é tempo de relógio, não tempo ativo; o prompt o declara assim para não se compararem as durações. Os pesquisadores podem preferir registrar outra medida.
- A Seção 6.2 do Docs continua sem inferir produtividade, conforme `CLAUDE.md`.

## Pendências

- Conferência pós-aplicação no Docs: pendente até o assistente do Docs aplicar o prompt.
- Pendências humanas já conhecidas e adiadas pelos pesquisadores: DOIs das referências 1 e 8; corte de 24/11/2026 (10 das 18 concluídas, 8 restantes); verificação de telefone e token; segundo avaliador; versão da ferramenta nas AGT-001 a AGT-008 e na AGT-010; campos [INFORMAR].
- Fora do alcance: o piloto (nada tocado).
