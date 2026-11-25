# Auditoria de sincronia dos dados da AGT-011 (24/11/2026)

Escopo: os dados que o dossiê `TCC/relatorios/DOSSIE-GEMINI-AGT-011-2026-11-24.md` entrega ao Gemini, comparados com o registro `AGT-011.md`, `METRICAS.csv`, `git log`, a ficha do repositório, a matriz, o quadro, as migrações e o código. A partir de 24/11/2026 o Docs é atualizado pelo Gemini, que decide onde cada dado entra; por isso esta auditoria não traz trocas de texto, e sim a conferência dos dados de origem. O Docs não foi lido nem alterado nesta etapa (última leitura: 21/11/2026, 914 elementos, após a AGT-010). A auditoria só relata; as correções do Docs dependem de aprovação.

## Dados do dossiê contra o repositório

| ID | Dado | O que o dossiê diz | O que o repositório diz | Status |
| --- | --- | --- | --- | --- |
| W1 | Contagem do experimento principal | n = 11 de 18, todas AP-3; AGT-012 a AGT-018 não iniciadas | `METRICAS.csv`: 11 linhas do principal; `docs/quadro-resultados.md`: n = 11 de 18; `AGT-012.md` não existe | OK |
| W2 | Piloto | n = 5 (4 AP-1 e 1 AP-3), separado | `docs/quadro-resultados.md`, seção 1 | OK |
| W3 | Aprovação da instrução | 23/11/2026, 11:14:03 | `AGT-011.md`: 2026-11-23T11:14:03-03:00 | OK (o primeiro texto da ficha trazia 11:13:36, corrigido antes do commit) |
| W4 | Decisões | 24/11/2026, 21:17:19, "recomendadas" | `AGT-011.md` Seção 6 | OK |
| W5 | Duração | 9,37 min (21:17:19 a 21:26:41) | `METRICAS.csv`: 9.37; `AGT-011.md` Seção 6 | OK |
| W6 | Testes | 502 em 28 arquivos; 463 + 39 novos (21 + 18) | `npm run check` (21:26): 502 em 28; `METRICAS.csv`: 502/502/0; arquivos `tests/area-passageiro-api.test.ts` e `tests/web-area-passageiro.test.tsx` | OK |
| W7 | Mutações | 5 detectadas (1, 3, 2, 2 e 1 testes) | `AGT-011.md` Seção 8 | OK |
| W8 | Migração | Nenhuma; continuam as versões 1, 2 e 3 | `server/db/migrations.ts`: versões 1, 2 e 3 | OK |
| W9 | Commits | c8ed387 (atividade) e ee1aca0 (hash) | `git log` | OK |
| W10 | Classificação | AP-3, decisão dos pesquisadores | `AGT-011.md` Seção 13; `METRICAS.csv` | OK |
| W11 | Matriz | RF-029 a RF-031, RN-023 e RN-026 com evidência; RN-025 em parte; RN-024 com evidência nas AGT-009 a AGT-011 | `docs/matriz-rastreabilidade.md` (mesmos estados) | OK |
| W12 | Ficha | 20 campos; versão da ferramenta e segundo avaliador [DADO NÃO REGISTRADO] | `docs/fichas-agt/principal/AGT-011.md` | OK |
| W13 | Rotas e privacidade | `GET /api/reservas` e `GET /api/reservas/:id` só do passageiro (401 e 403); 404 igual para alheia e inexistente | `server/reservas/routes.ts`; `tests/area-passageiro-api.test.ts` | OK |
| W14 | Conclusão | Só Pronto para embarque; 00:00 de Brasília do dia seguinte à data final; sem efeito em vagas e pagamentos; auditoria de ator nulo | `server/vagas/conclusao.ts`; testes da fronteira de 1 segundo | OK |
| W15 | Navegador | Conclusão demonstrada alterando as datas no banco; confirmação tardia e lista com inadimplência só em teste | `AGT-011.md` Seção 8 | OK (ressalvas declaradas) |

## Observações

- A contagem "39 novos" é a diferença entre 502 e 463 menos o teste da AGT-007 atualizado (não é contado como novo); os 39 testes novos são 21 de API e 18 de interface.
- O erro de horário (11:13:36 em vez de 11:14:03) foi do próprio agente ao redigir o fechamento, detectado quando o script de fechamento falhou na conferência do texto do registro; um commit parcial local foi desfeito antes de qualquer envio.
- O dossiê é bruto: a redação final, a numeração e a posição de cada trecho no TCC cabem ao Gemini e aos pesquisadores.

## Pendências

- Conferência pós-aplicação no Docs: feita (ver a seção final); há divergências abertas.
- Pendências humanas já conhecidas e adiadas pelos pesquisadores: DOIs das referências 1 e 8; corte de 24/11/2026 (11 das 18 concluídas, 7 restantes); verificação de telefone e token; segundo avaliador; versão da ferramenta nas AGT-001 a AGT-008, AGT-010 e AGT-011; campos [INFORMAR].
- Fora do alcance: o piloto (nada tocado).

## Conferência pós-aplicação (2026-11-24T21:46:53-03:00)

Releitura do Docs (revisão AHj4eMRk_jkg9-J78qv0GsrzrAYBE2AnVQccfbJ_fYQsR67iLDdIq94K_xJQ9MxW9X7Ck9_sHvjgel4ICzKPt01xdkCk4djG-9I2JUvLa2g; 1.015 elementos extraídos, contra 914 em 21/11/2026). O Gemini aplicou a AGT-011 e também alterou outros trechos. **Há divergências com o repositório; o agente não corrigiu o Docs** (as correções dependem de aprovação). Resultado: a linha do Quadro 2, o parágrafo da Seção 5.3, a ficha de 20 campos, o Apêndice D e a Seção 5.1 (n = 11; AGT-012 a AGT-018 não iniciadas) estão presentes, mas com os problemas abaixo.

| ID | Trecho | Divergência | Status |
| --- | --- | --- | --- |
| X1 | Resumo e Abstract | Dizem n = 10 ("dez", "ten"); o repositório diz n = 11 | DIVERGE |
| X2 | Resumo, Abstract, classes, 6.1, Quadro 3, 6.3, Apêndice F | Criam a classe "AP-4" (13 ocorrências) e redefinem AP-3; a rubrica tem AP-1, AP-2, AP-3 e RP | DIVERGE |
| X3 | Seção 5.3, AGT-011 | Decisões descritas diferentes das registradas ("guias", "cartão de resumo", "resumo financeiro", contagem das 3 pendentes, "comprovante") | DIVERGE |
| X4 | Quadro 3 e análise nova | Percentuais, "31 decisões", dados do piloto não verificáveis, "até a AGT-010" com n = 11, afirmações de causalidade e a palavra "controlled" | DIVERGE (Pergunta ao autor) |
| X5 | Quadro 2, linha AGT-011 | Tipo de intervenção diferente do registro e das métricas | DIVERGE |
| X6 | Ficha AGT-011 | 22 critérios (são 23), "aba de histórico", decisões e requisitos fora do registro, diário "93 a 96" (são 92 a 94), versão da extensão [DADO NÃO REGISTRADO] | DIVERGE |
| X7 | Seção 4.8 | Frase sobre as migrações das AGT-009 e AGT-010 removida | DIVERGE |
| X8 | Seção 5.3, AGT-003 | Parágrafo duplicado em linhas contíguas | DIVERGE |
| X9 | Seção 5.4 | Data de corte trocada por texto sem data (decisão dos pesquisadores) | Pergunta ao autor |
| X10 | Seção 5.1, Quadro 2 (fonte), contagens do Capítulo 7, 6.1 e 6.4 | n = 11 e data 24/11/2026 | OK |

O pedido de correção proposto está em `TCC/relatorios/PEDIDO-CORRECAO-GEMINI-AGT-011-2026-11-24.md`. Causa provável e medida: o dossiê era bruto e não proibia expressamente criar classes e análises; os próximos dossiês trazem uma lista do que não inventar.
