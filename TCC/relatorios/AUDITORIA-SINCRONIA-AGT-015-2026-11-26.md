# Auditoria de sincronia dos dados da AGT-015 (26/11/2026)

Gerada em 2026-11-26T16:56:17-03:00. Escopo: os dados que o dossiê `TCC/relatorios/DOSSIE-GEMINI-AGT-015-2026-11-26.md` entrega ao Gemini, comparados com o registro `AGT-015.md`, `METRICAS.csv`, o diário, `git log`, a ficha, a matriz, o quadro, `package.json`, as migrações, o código e `docs/especificacao/`. O Docs não foi lido nem alterado nesta etapa (última leitura: 26/11/2026, 1.018 elementos, depois da AGT-012, com divergências abertas). A auditoria só relata; as correções do Docs dependem de aprovação.

## Dados do dossiê contra o repositório

| ID | Dado | O que o dossiê diz | O que o repositório diz | Status |
| --- | --- | --- | --- | --- |
| C1 | Contagem do experimento principal | n = 15 de 18, todas AP-3; AGT-016 a AGT-018 não iniciadas | `METRICAS.csv`: 15 linhas, 15 AP-3; quadro: n = 15; `AGT-016.md` não existe | OK |
| C2 | Piloto | n = 5, separado | `docs/quadro-resultados.md`, seção 1 | OK |
| C3 | Aprovação, decisões e classificação | 16:36:06, 16:37:52 e "ap 3" às 16:54:33 | `AGT-015.md`; diário (entradas 114, 115 e 117) | OK |
| C4 | Duração | 14,40 min (16:37:52 a 16:52:16) | `METRICAS.csv`: 14.40; Seção 6 | OK |
| C5 | Testes | 685 em 36 arquivos; 38 novos (32 + 6) | `npm run check` no fechamento: 685 em 36 | OK |
| C6 | Mutações | 11 detectadas | Seção 8 | OK |
| C7 | Migração e dependências | Migração 5; nenhuma dependência | `server/db/migrations.ts`: versões 1 a 5; `package.json` sem mudança | OK |
| C8 | Commits | 8e486ff (atividade) e dfafd89 (hash) | `git log` | OK |
| C9 | Matriz | RF-040 com evidência | `docs/matriz-rastreabilidade.md` | OK |
| C10 | Ficha | 20 campos; versão que executou e segundo avaliador [DADO NÃO REGISTRADO] | `docs/fichas-agt/principal/AGT-015.md` | OK |
| C11 | Quadro 3 (seção J) | n = 15; tentativas 14 e 1; testes 15 e 685; intervenção 15 | Calculado de `METRICAS.csv`; piloto de `docs/quadro-resultados.md` | OK |
| C12 | Envio real | Nenhum; e-mail simulado; sem WhatsApp | `server/comunicacao/provedor.ts`; `01-VISAO-GERAL.md` prevê só simulação | OK |
| C13 | Telefone ou WhatsApp validado | Posse não comprovada | `06-MODELO-DE-DADOS.md` diz "(validado)"; o código só valida o formato (AGT-003) | Pergunta ao autor (já pendente) |
| C14 | Revisão do código e dos textos | Registrada como aprovada pela autorização permanente | Seção 11; o pesquisador respondeu apenas "ap 3" | OK (declarada) |

## Pendências

- Conferência pós-aplicação no Docs: pendente até os pesquisadores informarem que o Gemini aplicou.
- Divergências abertas no Docs desde a AGT-012 (ficha da AGT-012 ausente, ficha e correções da AGT-011) e envios ainda não confirmados (Parte A e dossiês das AGT-013 e 014).
- Três pontos abertos da AGT-014 sem resposta.
- Pendências humanas adiadas: DOIs das referências 1 e 8; verificação de telefone e token; segundo avaliador; versão da ferramenta; campos [INFORMAR].
- Fora do alcance: o piloto (nada tocado).
