# Pedido de correção ao Gemini (26/11/2026) — depois da aplicação da AGT-012

**Destino:** Gemini (Google Docs "VERSÃO BASE DO TCC"). Substitui o pedido de 24/11/2026.
**Status (atualizado em 2026-11-26T14:12:26-03:00):** proposta do agente. A **Parte A** pode ser enviada; as **Partes B e C** (atualizadas em 2026-11-26T14:18:06-03:00) vão depois do dossiê da AGT-013. A restauração das quatro classes foi **retirada**: o pesquisador confirmou que a "AP-4" é decisão dele. O pesquisador pediu para refazer o Quadro 3 e a análise e delegou a data de corte.

## Regras para o Gemini

Aplicar somente o que está nesta lista, com os textos exatos. Não criar classes, quadros, métricas, contagens, análises ou citações. Não apagar nem duplicar outros trechos. Manter a formatação do vizinho equivalente. Ao final, informar uma linha por item: aplicado, ou não aplicado com o motivo.

---

## PARTE A — correções de registro (independem de decisão)

### A1. Apêndice E: falta a ficha da AGT-012
Inserir imediatamente antes do título "Ficha — Piloto (Codex), AGT-001" um título "Ficha — Experimento principal, AGT-012" seguido desta tabela, no mesmo formato da ficha da AGT-010:

| Campo | Registro |
| --- | --- |
| ID e título | AGT-012 — Administração de reservas e passageiros |
| Estudo | Principal (Claude Code) |
| Objetivo | Implementar a consulta de reservas e de passageiros pelo administrador e a alteração manual de situação, quando autorizada, sempre registrada na auditoria, com a consulta das pendências administrativas. |
| Requisitos relacionados | RF-037, RF-038 e RF-039; RF-026 (em parte); RNF-002, RNF-007 a RNF-010, RNF-012 a RNF-016, RNF-022 a RNF-024, RNF-027 a RNF-029; RN-034, RN-035, RN-023 a RN-026, RN-009, RN-010, RN-014, RN-015, RN-019 a RN-022, RN-032 e RN-040 a RN-044. |
| Comando inicial | Instrução original na Seção 5 de TCC/registros-agente/AGT-012.md (escrita pelo agente e aprovada pelo pesquisador em 24/11/2026 às 21:47:37; usada sem alterações). |
| Critérios de aceitação | 25 critérios na Seção 4 do registro, todos marcados. A avaliação humana (Seção 11) foi redigida pelo agente a pedido do pesquisador, que decidiu a classificação e aprovou a revisão do código. |
| Testes | 557 testes em 30 arquivos, todos aprovados, 0 reprovados (55 novos: 34 de API e 21 de interface). Cinco mutações de verificação detectadas. Percurso em navegador real (Microsoft Edge sem cabeça) com dados fictícios. |
| Lint, tipos e build | Aprovados. |
| Número de tentativas | 1. |
| Duração | 15,53 min em relógio (decisões respondidas e início da implementação às 21:49:20 e verificação final às 22:04:52, de 24/11/2026), incluindo documentação, mutações e percurso em navegador real. A espera pelas decisões e pela classificação não é contada. Exclui a revisão humana. |
| Pausas ou interrupções | Uma parada obrigatória, prevista na instrução, com três decisões. Sem interrupção da sessão durante a implementação; a classificação foi dada em 26/11/2026. |
| Intervenção humana | Sim: decisão sobre dados pessoais, situação de reserva e pendências financeiras (dados pessoais visíveis ao administrador; alterações manuais autorizadas; pendências administrativas). |
| Decisão técnica | Lista de passageiros com CPF e telefone mascarados e dados completos só no detalhe, com auditoria de cada consulta; alterações manuais só sem efeito financeiro (cancelar reserva aguardando sem pagamento; concluir reserva pronta de excursão terminada), com justificativa obrigatória, transação única, idempotência e auditoria com o administrador; pendências apenas para consulta. Sem migração e sem dependência nova. |
| Versão do agente | Claude Code, modelo Claude Sonnet 5.5 (claude-sonnet-5-5). Versão da extensão do VS Code: 2.1.331 (instalada em 24/11/2026 às 17:12; a 2.1.330 está obsoleta); qual versão executou a atividade [DADO NÃO REGISTRADO]. |
| Ambiente | Windows 11, Node.js v26.13.0, npm 11.20.0, React 19.3.1, Vite 8.3.8, TypeScript 6.0.3, Vitest 5.1.0. |
| Commits | 482f981 (atividade e registro). |
| Evidências | Registro (Seções 6 a 10); diário (Entradas 96 a 100); METRICAS.csv; server/admin/, src/pages/AdminReservas.tsx, src/admin/reservas-admin-api.ts, tests/ e docs/administracao-reservas.md. |
| Classificação final | AP-3 (decisão do pesquisador, 26/11/2026; critério único: decisão exigida pela instrução = AP-3). |
| Segundo avaliador | [DADO NÃO REGISTRADO] (não designado). |
| Limitações | Conclusão manual quase sempre redundante com a conclusão automática; sem tratamento de pendência nem reembolso (AGT-013); sem tarefa agendada (AGT-014); justificativa livre sem filtro de dados pessoais; leituras que gravam (vencimento, conclusão e auditoria da consulta); busca por CPF parcial; pendência e datas ajustadas no banco para a demonstração em navegador; tabela com rolagem dentro do quadro no celular; um navegador, sem leitor de tela; concorrência sem teste de carga. A avaliação humana foi redigida pelo agente a pedido do pesquisador. |

### A2. Apêndice E: ficha da AGT-011 com erros
Substituir a tabela inteira da ficha "Ficha — Experimento principal, AGT-011" por esta (a última linha está sem o rótulo "Limitações"):

| Campo | Registro |
| --- | --- |
| ID e título | AGT-011 — Área do passageiro |
| Estudo | Principal (Claude Code) |
| Objetivo | Implementar a área do passageiro: lista de minhas reservas (Em andamento e Histórico), detalhe e situação da reserva e histórico de reservas concluídas; a reserva pronta passa a Concluída um dia após a data final da excursão, com auditoria e sem alterar vagas nem pagamentos; cada passageiro vê somente as próprias reservas. |
| Requisitos relacionados | RF-029, RF-030 e RF-031; RNF-007 a RNF-010, RNF-012 a RNF-016, RNF-022 a RNF-024, RNF-027 a RNF-029; RN-023, RN-024, RN-025, RN-026, RN-009, RN-010, RN-020, RN-032, RN-038, RN-039, RN-041 a RN-044. |
| Comando inicial | Instrução original na Seção 5 de TCC/registros-agente/AGT-011.md (escrita pelo agente e aprovada pelo pesquisador em 23/11/2026 às 11:14:03; usada sem alterações). |
| Critérios de aceitação | 23 critérios na Seção 4 do registro, todos marcados. A avaliação humana (Seção 11) foi redigida pelo agente a pedido do pesquisador, que decidiu a classificação e aprovou a revisão do código. |
| Testes | 502 testes em 28 arquivos, todos aprovados, 0 reprovados (39 novos: 21 de API e 18 de interface; 1 teste da AGT-007 atualizado). Cinco mutações de verificação detectadas. Percurso em navegador real (Microsoft Edge sem cabeça) com dados fictícios. |
| Lint, tipos e build | Aprovados. |
| Número de tentativas | 1. |
| Duração | 9,37 min em relógio (decisões respondidas e início da implementação às 21:17:19 e verificação final às 21:26:41, de 24/11/2026), incluindo documentação, mutações e percurso em navegador real. A espera pelas decisões não é contada. Exclui a revisão humana. |
| Pausas ou interrupções | Uma parada obrigatória, prevista na instrução, com três decisões. Sem interrupção da sessão durante a implementação. |
| Intervenção humana | Sim: decisão sobre situação da reserva e dados do passageiro (como a reserva vira Concluída; composição da lista e do histórico; conteúdo e ações do detalhe). |
| Decisão técnica | Conclusão avaliada na leitura e na gravação, sem tarefa em segundo plano, gravada com auditoria do sistema (só reserva em Pronto para embarque, a partir de 00:00 de Brasília do dia seguinte à data final; sem efeito em vagas e pagamentos); uma página com os blocos Em andamento e Histórico (concluídas e canceladas); página de detalhe própria com o checkout mantido como página de pagamento; isolamento por passageiro (404 igual para reserva alheia e inexistente). Sem migração e sem dependência nova. |
| Versão do agente | Claude Code, modelo Claude Sonnet 5.5 (claude-sonnet-5-5). Versão da extensão do VS Code: 2.1.331 (instalada em 24/11/2026 às 17:12; a 2.1.330 está obsoleta); qual versão executou a atividade [DADO NÃO REGISTRADO]. |
| Ambiente | Windows 11, Node.js v26.13.0, npm 11.20.0, React 19.3.1, Vite 8.3.8, TypeScript 6.0.3, Vitest 5.1.0. |
| Commits | c8ed387 (atividade e registro). |
| Evidências | Registro (Seções 6 a 10); diário (Entradas 92 e 93); METRICAS.csv; server/vagas/conclusao.ts, server/reservas/, src/pages/MinhasReservas.tsx, tests/ e docs/reservas.md. |
| Classificação final | AP-3 (decisão do pesquisador, 24/11/2026; critério único: decisão exigida pela instrução = AP-3). |
| Segundo avaliador | [DADO NÃO REGISTRADO] (não designado). |
| Limitações | A passagem para Concluída só é gravada quando o passageiro consulta (rotina periódica na AGT-014); reserva em Aguardando pagamento depois do fim da excursão não é concluída nem cancelada; conclusão demonstrada no navegador alterando as datas da excursão no banco; lista com cancelada por inadimplência só em teste automatizado; no celular a tabela da lista rola dentro do quadro; aviso ao passageiro só na tela; sem paginação; concorrência da conclusão sem teste com duas conexões; um navegador, sem leitor de tela. A avaliação humana foi redigida pelo agente a pedido do pesquisador. |

### A3. Seção 5.3: parágrafo da AGT-011
Substituir o parágrafo inteiro que começa com "AGT-011 — Área do passageiro." por:

> AGT-011 — Área do passageiro. A instrução, escrita pelo agente a partir da especificação e aprovada pelo pesquisador em 23/11/2026, às 11:14, está preservada em TCC/registros-agente/AGT-011.md. Por tocar na situação das reservas e em dados do passageiro, a instrução determinou que o agente parasse antes de criar arquivos para apresentar, com vantagens, desvantagens e recomendação, três decisões: como a reserva passa a Concluída antes da rotina automática; a composição da lista e do histórico; e o conteúdo e as ações do detalhe. O pesquisador aceitou, em 24/11/2026, às 21:17, todas as opções recomendadas: a conclusão é avaliada na leitura e na gravação, sem tarefa em segundo plano, que fica para a AGT-014, gravada com auditoria e restrita à reserva Pronta para embarque a partir de 00:00 do dia seguinte à data final da excursão, no horário de Brasília, sem alterar vagas nem pagamentos; uma única página reúne os blocos Em andamento e Histórico, este com as reservas concluídas e canceladas; e o detalhe tem página própria, com o checkout mantido como página de pagamento. O agente criou a rotina de conclusão, a lista e o detalhe das próprias reservas, com isolamento entre passageiros, e o item Minhas reservas no menu do passageiro, sem migração e sem dependência nova. Lint, verificação de tipos e build passaram, e os 502 testes automatizados (463 anteriores e 39 novos) foram aprovados; cinco verificações por mutação do código foram detectadas. Em execução real, com dados fictícios, o agente percorreu no Microsoft Edge a lista, o detalhe, o isolamento entre duas passageiras, o bloqueio do visitante e da administradora e a conclusão, demonstrada com a alteração das datas da excursão diretamente no banco; a lista com reserva cancelada por inadimplência foi verificada apenas em testes automatizados. Após as decisões, a checagem completa passou em cerca de 9,4 min. As limitações conhecidas (conclusão gravada apenas quando há consulta; reserva que aguarda pagamento depois do fim da excursão não é concluída nem cancelada; aviso ao passageiro apenas na tela; tabela com rolagem dentro do quadro no celular; ausência de paginação; um único navegador, sem leitor de tela) estão documentadas. Os pesquisadores classificaram a atividade como AP-3, sem registrar justificativa, a revisão do código foi aprovada no fechamento autorizado por eles, e a atividade consta com uma tentativa e sem nova instrução (commit c8ed387). A avaliação humana foi redigida pelo agente, e a classificação foi decidida pelos pesquisadores.

### A4. Quadro 2: linha "Principal, AGT-011"
Na coluna de intervenção humana, trocar "Sim (decisão sobre área do passageiro e conclusão)" por "Sim (decisão sobre situação da reserva e dados do passageiro)".

### A5. Seção 6.1
No trecho sobre a AGT-011, trocar "decisão sobre área do passageiro e conclusão" por "decisão sobre situação da reserva e dados do passageiro".

### A6. Seção 4.8
No parágrafo que começa com "No experimento principal, a tecnologia de persistência", acrescentar ao final: "Desde o esquema inicial (versão 1) até a AGT-013, apenas as AGT-009, AGT-010 e AGT-013 criaram migrações (versões 2, 3 e 4)."

---

## PARTE B — Quadro 3 e análise (decisão dos pesquisadores em 26/11/2026: refazer)

Enviar **depois** do dossiê da AGT-013 (os números abaixo já incluem a AGT-013).

### B1. Substituir o parágrafo de introdução, o título, a tabela e a fonte do Quadro 3 por:

> A síntese dos registros dos dois conjuntos é apresentada no Quadro 3, que os mantém em colunas separadas e não os soma.

**Quadro 3 — Síntese dos registros por conjunto de atividades**

| Registro | Piloto (Codex, n = 5) | Experimento principal (Claude Code, n = 13) |
| --- | --- | --- |
| Atividades concluídas e classificadas | 5 de 5 executadas | 13 de 18 previstas |
| AP-1 | 4 | 0 |
| AP-2 | 0 | 0 |
| AP-3 | 1 | 13 |
| AP-4 | 0 | 0 |
| RP | 0 | 0 |
| Atividades com 1 tentativa | 3 | 12 |
| Atividades com 2 tentativas | 1 | 1 |
| Atividades com número de tentativas não registrado | 1 | 0 |
| Testes aprovados na primeira e na última atividade avaliada | 6 (AGT-001) e 198 (AGT-005) | 15 (AGT-001) e 610 (AGT-013) |
| Atividades com intervenção humana registrada | 1 | 13 |

Fonte: elaborado pelos autores, a partir dos registros AGT e das planilhas de métricas (26/11/2026). As classificações são as registradas; a distinção entre AP-3 e AP-4 foi adotada em revisão posterior à AGT-010.

### B2. Substituir o parágrafo que começa com "Sob uma perspectiva analítica" por:

> No subconjunto avaliado do experimento principal (n = 13), as 13 atividades foram classificadas como AP-3 e nenhuma como AP-4. As instruções dessas atividades previam paradas para decisão dos pesquisadores, e a classificação AP-3 registra essas intervenções planejadas. A distribuição descreve somente as atividades avaliadas: não permite concluir sobre o desempenho do agente nem estabelecer relação de causa, e não há grupo de controle. A distinção entre AP-3 e AP-4 foi adotada em revisão posterior à AGT-010, o que constitui uma limitação a considerar na leitura desses números. O piloto com o Codex (n = 5) é apresentado em coluna própria e não é somado nem comparado estatisticamente ao experimento principal.

---

## PARTE C — data de corte (definida em 26/11/2026)

### C1. Seção 5.4: substituir o parágrafo que começa com "As próximas atividades do experimento principal incluem" por:

> As próximas atividades do experimento principal incluem, a partir da AGT-014, processos automáticos, comunicação, painel administrativo, testes integrados e revisão técnica. Restam 5 atividades planejadas (AGT-014 a AGT-018) para a conclusão do ciclo experimental. A data de corte da execução experimental é 30/11/2026; as atividades não concluídas até essa data serão tratadas e registradas como trabalhos futuros.
