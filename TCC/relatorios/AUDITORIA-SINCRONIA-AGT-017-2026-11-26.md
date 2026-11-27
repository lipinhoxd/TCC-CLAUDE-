# Auditoria de sincronia dos dados da AGT-017 (26/11/2026)

Gerada em 2026-11-26T21:55:09-03:00. Escopo: os dados que o dossiê `TCC/relatorios/DOSSIE-GEMINI-AGT-017-2026-11-26.md` entrega ao Gemini, comparados com o registro `AGT-017.md`, `METRICAS.csv`, o diário, `git log`, a ficha, a matriz, o quadro, `package.json`, as migrações, o código e `docs/especificacao/`. O Docs não foi lido nem alterado nesta etapa (última leitura: 26/11/2026, 1.018 elementos, depois da AGT-012, com divergências abertas). A auditoria só relata; as correções do Docs dependem de aprovação.

## Dados do dossiê contra o repositório

| ID | Dado | O que o dossiê diz | O que o repositório diz | Status |
| --- | --- | --- | --- | --- |
| D1 | Contagem do experimento principal | n = 17 de 18, todas AP-3; AGT-018 não iniciada | `METRICAS.csv`: 17 linhas, 17 AP-3; quadro: n = 17; `AGT-018.md` não existe | OK |
| D2 | Piloto | n = 5, separado | `docs/quadro-resultados.md`, seção 1 | OK |
| D3 | Aprovação, decisões, pergunta e classificação | 19:51:28; 19:53:14; 20:27:56 e 20:34:06; "ap 3" às 21:50:40 | `AGT-017.md`, Seções 6, 12 e 13; diário | OK |
| D4 | Duração | 62,52 min | `METRICAS.csv`: 62.52; Seção 16 | OK |
| D5 | Testes | 796 em 41 arquivos; 76 novos | `npm run check` no fechamento (21:53:16): 796 em 41 | OK |
| D6 | Alterações propositais | 44 de 44 | Saída do roteiro (pasta temporária) e matriz | OK (o arquivo de saída não é versionado) |
| D7 | Repetição e carga | 70 rodadas, 2 falhas; carga 2 de 3 antes, 0 de 13 depois | Seção 8; as saídas das rodadas não são versionadas | OK (declarada) |
| D8 | Migração e dependências | Nenhuma | `server/db/migrations.ts`: versões 1 a 5; `package.json` sem mudança | OK |
| D9 | Commits | e85d169 (atividade) e 9d0dc49 (hash) | `git log` | OK |
| D10 | Regras | 46; textos da RN-045 e RN-046 | `04-REGRAS-DE-NEGOCIO.md`: 46 linhas de regra; `docs/requisitos/RN.md` atualizado | OK |
| D11 | Matriz | RN-005 parcial; RN-043 e RN-044 não verificáveis; demais evidenciadas | `docs/matriz-rastreabilidade.md` | OK |
| D12 | Ficha | 20 campos; versão que executou e segundo avaliador [DADO NÃO REGISTRADO] | `docs/fichas-agt/principal/AGT-017.md` | OK |
| D13 | Quadro 3 (seção J) | n = 17; tentativas 16 e 1; testes 15 e 796; intervenção 17 | Calculado de `METRICAS.csv`; piloto de `docs/quadro-resultados.md` | OK |
| D14 | Instrução preservada | Cópia literal | Seção 5 igual à do commit 7ee35ea (conferido antes do commit) | OK |
| D15 | Divergência de redação | "Três comportamentos" na matriz de validação | Eram dois comportamentos e as marcas "[confirmar]"; frase corrigida depois do commit da atividade, no commit DOCS | Corrigida |
| D16 | Situações da retenção | Especificação: "Convertida", "Expirada/Liberada" | Sistema: confirmada, expirada, cancelada | **Pergunta ao autor** |
| D17 | RN-046 na fronteira | Aplicada no instante exato da partida | Texto da regra: "depois da partida"; sem confirmação expressa | **Pergunta ao autor** |
| D18 | Situações da excursão | Desenho em 05-FLUXOS-E-ESTADOS.md ainda mostra "→ Concluída" | O parágrafo seguinte registra que não foi implementada; o código tem quatro | OK (declarada) |
| D19 | Influência na classificação | Recomendação do agente registrada na Seção 13 da AGT-017 | Rubrica, Seção 5; as Seções 13 anteriores não repetem a anotação (o diário registra o acordo desde 13/11/2026) | Observação para os pesquisadores |

## Pendências

- Conferência pós-aplicação no Docs: pendente até os pesquisadores informarem que o Gemini aplicou.
- Divergências abertas no Docs desde a AGT-012 e envios ainda não confirmados (Parte A e dossiês das AGT-013 a 016).
- Apêndice de regras do Docs com 44 regras: atualizar para 46 (seção G do dossiê).
- Perguntas ao autor D16 e D17.
- Pendências humanas adiadas: DOIs das referências 1 e 8; verificação de telefone e token; segundo avaliador; versão da ferramenta; campos [INFORMAR].
- Fora do alcance: o piloto (nada tocado).
