# Auditoria de sincronia dos dados da AGT-013 (26/11/2026)

Escopo: os dados que o dossiê `TCC/relatorios/DOSSIE-GEMINI-AGT-013-2026-11-26.md` entrega ao Gemini, comparados com o registro `AGT-013.md`, `METRICAS.csv`, `git log`, a ficha, a matriz, o quadro, as migrações e o código. O Docs não foi lido nem alterado nesta etapa (última leitura: 26/11/2026, 1.018 elementos, depois da AGT-012, com divergências abertas). A auditoria só relata; as correções do Docs dependem de aprovação.

## Dados do dossiê contra o repositório

| ID | Dado | O que o dossiê diz | O que o repositório diz | Status |
| --- | --- | --- | --- | --- |
| K1 | Contagem do experimento principal | n = 13 de 18, todas AP-3; AGT-014 a AGT-018 não iniciadas | `METRICAS.csv`: 13 linhas do principal; quadro: n = 13; `AGT-014.md` não existe | OK |
| K2 | Piloto | n = 5, separado | `docs/quadro-resultados.md`, seção 1 | OK |
| K3 | Aprovação, decisões e classificação | 13:31:48, 13:34:02 e "ap 3" em 26/11/2026 | `AGT-013.md` | OK |
| K4 | Duração | 16,30 min (13:34:02 a 13:50:20) | `METRICAS.csv`: 16.30; Seção 6 | OK |
| K5 | Testes | 610 em 32 arquivos; 53 novos (40 + 13) | `npm run check`: 610 em 32; `METRICAS.csv`: 610/610/0 | OK |
| K6 | Mutações | 6 detectadas (3, 2, 6, 1, 1, 1) | Seção 8 | OK |
| K7 | Migração | Versão 4 criada pela AGT-013 | `server/db/migrations.ts`: versões 1 a 4 | OK |
| K8 | Commits | b27f70e (atividade) e 49a512e (hash) | `git log` | OK |
| K9 | Matriz | RF-032 a RF-035, RF-026 e RN-027 a RN-032 com evidência | `docs/matriz-rastreabilidade.md` | OK |
| K10 | Ficha | 20 campos; versão que executou e segundo avaliador [DADO NÃO REGISTRADO] | `docs/fichas-agt/principal/AGT-013.md` | OK |
| K11 | Ressalvas | Datas e pendência ajustadas no banco; correção posterior ao navegador e às mutações | Seções 8 e 9 | OK (declaradas) |
| K12 | Pergunta aberta | Destino da reserva após reembolso de pendência | Seção 10 (item 8) e 16; `docs/cancelamentos.md` | Pergunta ao autor |

## Pendências

- Conferência pós-aplicação no Docs: pendente até os pesquisadores informarem que o Gemini aplicou.
- Divergências abertas no Docs desde a AGT-012 (`PEDIDO-CORRECAO-GEMINI-2026-11-26.md`): ficha da AGT-012 ausente, ficha da AGT-011 danificada, classe "AP-4", Quadro 3 e análise, correções da AGT-011; perguntas sobre AP-4, Quadro 3 e data de corte sem resposta.
- Pergunta sobre o destino da reserva após o reembolso de uma pendência.
- Pendências humanas adiadas: DOIs das referências 1 e 8; data de corte; verificação de telefone e token; segundo avaliador; versão da ferramenta; campos [INFORMAR].
- Fora do alcance: o piloto (nada tocado).

## Atualização (2026-11-26T14:12:26-03:00)

- K12 resolvida: o pesquisador decidiu que a reserva é cancelada; implementado e registrado na Seção 17 do registro; o dossiê foi gerado de novo (612 testes após a alteração; métricas e contagens do fechamento inalteradas).
- Classe AP-4: o pesquisador confirmou que foi decisão dele. `docs/rubrica-avaliacao.md` passou a ter AP-3 (governança planejada) e AP-4 (corretiva); o dossiê foi ajustado. O `CLAUDE.md` ainda lista só AP-1, AP-2, AP-3 e RP (alteração pendente de autorização).
- Continuam abertos: Quadro 3 e análise (dados sem origem, inferência causal, palavras em inglês), ficha da AGT-012 ausente, ficha da AGT-011, data de corte.
