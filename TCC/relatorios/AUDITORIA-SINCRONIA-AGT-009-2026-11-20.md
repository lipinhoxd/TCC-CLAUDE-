# Auditoria de sincronia dos trechos tocados pela AGT-009 (20/11/2026)

Escopo: só os trechos do TCC que a transcrição da AGT-009 altera ou cria (prompt `TCC/relatorios/PROMPT-DOCS-AGT-009-2026-11-20.md`), comparados com o registro `AGT-009.md`, `METRICAS.csv`, `git log`, a ficha do repositório e o código. O Docs foi lido em 20/11/2026 (866 linhas extraídas, sem mudança desde a conferência da AGT-008). A auditoria só relata; o Docs ainda não foi alterado. Depois que o assistente do Docs aplicar o prompt, o agente relê o Docs e confirma.

## Âncoras no Docs

As 17 trocas de texto foram conferidas por script contra o texto extraído do Docs: cada "texto atual" aparece exatamente 1 vez. As 3 inserções têm posição descrita pelo vizinho ("AGT-008 — Capacidade e retenção temporária de vagas.", linha "Principal, AGT-008", título "Ficha — Piloto (Codex), AGT-001").

## Dados do texto novo contra o repositório

| ID | Trecho do Docs | O que passará a dizer | O que o repositório diz | Status |
| --- | --- | --- | --- | --- |
| U1 | Resumo, Abstract, 5.1, 6.1, 6.4, Cap. 7 | n = 9 no principal (9 das 18) e n = 5 no piloto, sem somar | `METRICAS.csv`: 9 linhas do principal; `docs/quadro-resultados.md`: n = 9 de 18 | OK |
| U2 | 5.1 e 5.4 | AGT-010 a AGT-018 "ainda não foram iniciadas"; 5.4 "a partir da AGT-010" | Não existe `AGT-010.md`; plano `07-PLANO-DE-ATIVIDADES.md` | OK |
| U3 | 5.3, ficha | Instrução aprovada em 20/11/2026 às 23:19 | `AGT-009.md`: 2026-11-20T23:19:55-03:00 | OK |
| U4 | 5.3, ficha, 6.2 | ≈ 14,8 min (23:21 a 23:36); inclui documentação, mutações e navegador | `METRICAS.csv`: 14.77; `AGT-009.md` Seção 6: 23:21:54 a 23:36:40 | OK |
| U5 | 5.3, ficha, 6.2, Quadro 2, Apêndice D | 420 testes (372 anteriores e 48 novos); 2 atualizados de outras atividades | `npm run check`: 420 em 24 arquivos; `METRICAS.csv`: 420/420/0; Seção 7 do registro | OK |
| U6 | 5.3, 6.1, 6.3, Quadro 2 | Intervenção: decisão sobre pagamento e vagas (3 decisões) | `AGT-009.md` Seções 5, 6 e 12 | OK |
| U7 | 5.3, Quadro 2, Apêndice D | Commit c051823 | `git log`: c051823 (atividade) e 8b1b1cf (hash) | OK |
| U8 | 5.3 | Provedor simulado só fora de produção; linha de pagamento ao clicar; exige retenção; recusado reaproveitado; pendente mantido; confirmação atômica e idempotente; confirmação tardia (vaga livre ocupa; sem vaga, sinalizado em coluna nova) | `AGT-009.md` Seção 6; `server/pagamentos/provedor.ts`, `confirmacao.ts`, `service.ts`; `server/db/migrations.ts` (versão 2); `docs/reservas.md` | OK |
| U9 | 5.3 | Alterou a regra de desistência da AGT-007 (bloqueada só por pagamento pendente ou confirmado) | `server/reservas/service.ts`; Seção 7 do registro | OK |
| U10 | 5.3 | Percurso em navegador real: aprovado, recusado com nova tentativa, parcelada recusada, disputa pela última vaga, confirmação tardia com e sem vaga; nenhuma excursão acima da capacidade | `AGT-009.md` Seção 10 | OK |
| U11 | 4.8 | "só a AGT-009 criou migração (versão 2)" | `server/db/migrations.ts`: duas migrações (1 e 2) | OK |
| U12 | 6.4 e 5.3 | Limitações: sem provedor real; pendente só fechado pela AGT-014; confirmação sem vaga sem tela nem reembolso; tardia com vaga livre e sem retenção nova só em teste | `AGT-009.md` Seção 10 (item 11) | OK |
| U13 | Apêndice D | RF-023, RN-011, RN-016 e RN-022 com evidência; RF-025 e RF-026 em parte | `docs/matriz-rastreabilidade.md` (mesmos estados) | OK |
| U14 | Apêndice E, ficha AGT-009 | 20 campos; AP-3; 1 tentativa; versão da extensão 2.1.325; versão nas atividades anteriores e segundo avaliador [DADO NÃO REGISTRADO] | `docs/fichas-agt/principal/AGT-009.md` | OK |
| U15 | 6.2 | Tempo "comparável ao da AGT-008, mas não aos das atividades anteriores" | `AGT-009.md` Seção 16 e `AGT-008.md` Seção 16 (navegador dentro da duração só nessas duas) | OK |

## Pendências

- Conferência pós-aplicação no Docs: pendente até o assistente do Docs aplicar o prompt.
- Itens do repositório citados nas auditorias anteriores (ficha da AGT-003 e demais) já foram corrigidos e continuam coerentes.
- Fora do alcance: o piloto (nada tocado).

## Conferência pós-aplicação (2026-11-21T11:24:55-03:00)

Releitura do Docs (890 linhas extraídas, 866 parágrafos de corpo): as 17 trocas e as 3 inserções estão aplicadas. Cada texto proposto aparece uma vez e nenhum texto atual restou fora do proposto; o parágrafo da Seção 5.3 é idêntico ao do prompt (3404 caracteres); a linha do Quadro 2 está presente (9 linhas do principal); a ficha tem título e 20 campos idênticos ao esperado, entre a ficha da AGT-008 e a do piloto; não há "$1" nem "n = 8"; "n = 9" aparece 6 vezes e "n = 5" 6 vezes. Formatação do novo parágrafo, do título e dos campos da ficha e da nova linha do Quadro 2 igual à dos vizinhos. Todos os itens U1 a U15 passam a OK no Docs.
