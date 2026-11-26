# Auditoria de sincronia dos dados da AGT-012 (26/11/2026)

Escopo: os dados que o dossiê `TCC/relatorios/DOSSIE-GEMINI-AGT-012-2026-11-26.md` entrega ao Gemini, comparados com o registro `AGT-012.md`, `METRICAS.csv`, `git log`, a ficha, a matriz, o quadro, as migrações e o código. O Docs não foi lido nem alterado nesta etapa (última leitura: 24/11/2026, 1.015 elementos, depois da AGT-011, com divergências abertas). A auditoria só relata; as correções do Docs dependem de aprovação.

## Dados do dossiê contra o repositório

| ID | Dado | O que o dossiê diz | O que o repositório diz | Status |
| --- | --- | --- | --- | --- |
| Y1 | Contagem do experimento principal | n = 12 de 18, todas AP-3; AGT-013 a AGT-018 não iniciadas | `METRICAS.csv`: 12 linhas do principal; quadro: n = 12; `AGT-013.md` não existe | OK |
| Y2 | Piloto | n = 5, separado | `docs/quadro-resultados.md`, seção 1 | OK |
| Y3 | Aprovação e decisões | 24/11/2026, 21:47:37 e 21:49:20 | `AGT-012.md` | OK |
| Y4 | Classificação | AP-3, 26/11/2026, "ap 3 sim" | `AGT-012.md` Seção 13; `METRICAS.csv` | OK |
| Y5 | Duração | 15,53 min (21:49:20 a 22:04:52) | `METRICAS.csv`: 15.53; Seção 6 | OK |
| Y6 | Testes | 557 em 30 arquivos; 55 novos (34 + 21) | `npm run check` (26/11): 557 em 30; `METRICAS.csv`: 557/557/0 | OK |
| Y7 | Mutações | 5 detectadas (3, 1, 1, 1 e 2) | Seção 8 | OK |
| Y8 | Migração | Nenhuma; versões 1, 2 e 3 | `server/db/migrations.ts` | OK |
| Y9 | Commits | 482f981 (atividade) e a797a32 (hash) | `git log` | OK |
| Y10 | Matriz | RF-037 a RF-039, RN-034 e RN-035 com evidência; RF-026 em parte | `docs/matriz-rastreabilidade.md` | OK |
| Y11 | Ficha | 20 campos; versão que executou e segundo avaliador [DADO NÃO REGISTRADO] | `docs/fichas-agt/principal/AGT-012.md` | OK |
| Y12 | Ressalvas | Pendência e datas inseridas no banco para a demonstração; conclusão manual por chamada direta | Seção 8 | OK (declaradas) |

## Observações

- A Entrada 96 do diário informou 24 critérios para a AGT-012; o registro tem 25. A correção está na Entrada 100; a entrada antiga foi mantida por ser histórico.
- Alterações externas à sessão (ramo `master` renomeado para `main`, remoto adicionado e trecho em UTF-16 no `README.md`) foram encontradas em 26/11/2026; o trecho foi retirado com autorização; ramo e remoto mantidos; nada foi enviado pelo agente. Os estudos anteriores citam o ramo `master`; o TCC não depende do nome do ramo.
- O dossiê traz uma lista explícita do que o Gemini não deve inventar, criada depois das divergências da AGT-011.

## Pendências

- Conferência pós-aplicação no Docs: feita (ver a seção final); há divergências abertas.
- **Correções da AGT-011 no Docs ainda não aprovadas** (`PEDIDO-CORRECAO-GEMINI-AGT-011-2026-11-24.md`), inclusive as decisões sobre o Quadro 3 e a Seção 5.4.
- Pendências humanas adiadas: DOIs das referências 1 e 8; data de corte (24/11/2026 já passou, com 12 das 18 concluídas e 6 restantes); verificação de telefone e token; segundo avaliador; versão da ferramenta; campos [INFORMAR].
- Fora do alcance: o piloto (nada tocado).

## Conferência pós-aplicação (2026-11-26T13:21:23-03:00)

Releitura do Docs (revisão AHj4eMTjYFHQMHb9OQr24qA0mTDF5ZlE87AuMWVlGJaLA7CKYP2vbne14NooknoHlDjFNlM5l6os9Nwsm-lg8jqp91GtopFkVkWdKNme03E; 1.018 elementos extraídos, contra 1.015 em 24/11/2026). O agente não alterou o Docs.

| ID | Trecho | Resultado | Status |
| --- | --- | --- | --- |
| Z1 | Resumo, Abstract, 5.1, 6.1, 6.4, Capítulo 7 | n = 12; não restou "n = 10" nem "n = 11" | OK |
| Z2 | Seção 5.3, AGT-012 | Parágrafo fiel ao dossiê (decisões, implementação, verificações e ressalvas) | OK |
| Z3 | Quadro 2 (linha e data da fonte), Apêndice D, Seção 4.8, Seção 5.4 (a partir da AGT-013) | Conforme o dossiê | OK |
| Z4 | Seção 5.3, AGT-003 | A duplicação apontada em 24/11 foi removida | OK |
| Z5 | Apêndice E, ficha AGT-012 | **Não foi inserida** | DIVERGE |
| Z6 | Apêndice E, ficha AGT-011 | A última linha perdeu o rótulo "Limitações"; continuam "22 critérios", "aba de histórico" e "93 a 96" | DIVERGE |
| Z7 | Classe "AP-4" e redefinição do AP-3 | Continuam (13 ocorrências), inclusive na metodologia ("cinco classificações") e no Apêndice F | DIVERGE (Pergunta ao autor: foi decisão dos pesquisadores?) |
| Z8 | Quadro 3 e análise "Sob uma perspectiva analítica" | Atualizados para n = 12, com "34 decisões" (não consta do dossiê nem das métricas), percentuais, dados do piloto não conferidos, causalidade e as palavras "controlled" e "established" | DIVERGE (Pergunta ao autor) |
| Z9 | Correções da AGT-011 (5.3, Quadro 2, 6.1, 4.8) | Não aplicadas | DIVERGE |
| Z10 | Seção 5.4, data de corte | Texto sem data permanece | Pergunta ao autor |

Pedido de correção consolidado: `TCC/relatorios/PEDIDO-CORRECAO-GEMINI-2026-11-26.md` (substitui o de 24/11/2026), com os textos exatos extraídos da leitura anterior à AGT-011.
