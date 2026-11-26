# Auditoria de sincronia dos dados da AGT-014 (26/11/2026)

Gerada em 2026-11-26T16:06:19-03:00. Escopo: os dados que o dossiê `TCC/relatorios/DOSSIE-GEMINI-AGT-014-2026-11-26.md` entrega ao Gemini, comparados com o registro `AGT-014.md`, `METRICAS.csv`, o diário, `git log`, a ficha, a matriz, o quadro, `package.json`, as migrações, o código e `docs/especificacao/`. O Docs não foi lido nem alterado nesta etapa (última leitura: 26/11/2026, 1.018 elementos, depois da AGT-012, com divergências abertas). A auditoria só relata; as correções do Docs dependem de aprovação.

## Dados do dossiê contra o repositório

| ID | Dado | O que o dossiê diz | O que o repositório diz | Status |
| --- | --- | --- | --- | --- |
| P1 | Contagem do experimento principal | n = 14 de 18, todas AP-3; AGT-015 a AGT-018 não iniciadas | `METRICAS.csv`: 14 linhas, 14 AP-3; quadro: n = 14; `AGT-015.md` não existe | OK |
| P2 | Piloto | n = 5, separado | `docs/quadro-resultados.md`, seção 1 | OK |
| P3 | Aprovação, decisões e classificação | 15:41:05, 15:45:40 e "ap 3" às 16:03:21 | `AGT-014.md`; diário (entradas 109, 110 e 112) | OK |
| P4 | Duração | 11,98 min (15:45:40 a 15:57:39) | `METRICAS.csv`: 11.98; Seção 6 | OK |
| P5 | Testes | 647 em 34 arquivos; 35 novos (29 + 5 + 1) | `npm run check` no fechamento: 647 em 34 | OK |
| P6 | Mutações | 9 detectadas | Seção 8 | OK |
| P7 | Migração e dependências | Nenhuma | `server/db/migrations.ts`: versões 1 a 4; `package.json`: só o script `rotina` | OK |
| P8 | Commits | ce9cf5e (atividade) e d3ae627 (hash) | `git log` | OK |
| P9 | Matriz | RF-022, RF-028, RF-036 e RN-025 com evidência | `docs/matriz-rastreabilidade.md` | OK |
| P10 | Ficha | 20 campos; versão que executou e segundo avaliador [DADO NÃO REGISTRADO] | `docs/fichas-agt/principal/AGT-014.md` | OK |
| P11 | Quadro 3 (seção J) | n = 14; tentativas 13 e 1; testes 15 e 647; intervenção 14 | Calculado de `METRICAS.csv`; piloto de `docs/quadro-resultados.md` | OK |
| P12 | Data de corte | 30/11/2026 | `07-PLANO-DE-ATIVIDADES.md` e `PROXIMOS-PASSOS.md` | OK |
| P13 | Regra do cancelamento automático | Adotada por decisão dos pesquisadores | Código e `docs/processos-automaticos.md`; **não consta** de `04-REGRAS-DE-NEGOCIO.md` | Pergunta ao autor |
| P14 | Situação "Concluída" da excursão | Não criada | `05-FLUXOS-E-ESTADOS.md` a lista como "[confirmar]"; o esquema não a aceita | Pergunta ao autor |
| P15 | Confirmação de pagamento pendente de excursão terminada | Não é recusada (leitura do código) | `server/pagamentos/confirmacao.ts` não verifica a data; não há teste | Pergunta ao autor |
| P16 | Revisão do código | Registrada como aprovada pela autorização permanente | Seção 11; o pesquisador respondeu apenas "ap 3" | OK (declarada) |

## Pendências

- Conferência pós-aplicação no Docs: pendente até os pesquisadores informarem que o Gemini aplicou.
- Divergências abertas no Docs desde a AGT-012 (ficha da AGT-012 ausente, ficha da AGT-011, correções da AGT-011) e envios ainda não confirmados (Parte A e dossiê da AGT-013).
- Pendências humanas adiadas: DOIs das referências 1 e 8; verificação de telefone e token; segundo avaliador; versão da ferramenta; campos [INFORMAR].
- Fora do alcance: o piloto (nada tocado).
